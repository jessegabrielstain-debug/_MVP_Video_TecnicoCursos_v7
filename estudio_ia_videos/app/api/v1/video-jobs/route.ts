export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { logger, getSupabaseForRequest } from '@/lib/services';
import { checkRateLimit, inspectRateLimit } from '@/lib/utils/rate-limit';
import { recordRateLimitHit, recordError } from '~lib/utils/metrics';
import { parseVideoJobInput, isErr } from '~lib/handlers/video-jobs';
import { parseVideoJobsQuery, type VideoJobsQuery } from '~lib/handlers/video-jobs-query';
import { shouldUseMockRenderJobs, getMockUserId, insertMockJob, listMockJobs } from '@/lib/render-jobs/mock-store';

// Removido schema local de erro (não usado diretamente)

type RenderJobRow = {
  id: string;
  status: string;
  project_id?: string | null;
  created_at?: string | null;
  progress?: number | null;
  attempts?: number | null;
  duration_ms?: number | null;
  render_settings?: unknown;
  updated_at?: string | null;
  user_id?: string;
};

interface VideoJobCachePayload {
  jobs: unknown[];
}

interface VideoJobCacheEntry {
  expiresAt: number;
  payload: VideoJobCachePayload;
}

interface GlobalWithCache {
  __vj_cache?: Map<string, VideoJobCacheEntry>;
}

function badRequest(issues: unknown) {
  return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Payload inválido', details: issues }, { status: 400 });
}

const allowMockFallback = () => process.env.ALLOW_RENDER_JOBS_FALLBACK !== 'false';

export async function POST(req: Request) {
  const started = Date.now();
  let supabase: ReturnType<typeof getSupabaseForRequest> | null = null;
  try {
    const json = await req.json();
    const parsed = parseVideoJobInput(json);
    if (isErr(parsed)) {
      return badRequest(parsed.issues);
    }

    const authHeader = (req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '').trim();
    const authToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;
    const hasAuth = authToken.length > 0;
    const mockMode = shouldUseMockRenderJobs() || !hasAuth;

    let userId: string;
    if (mockMode) {
      userId = getMockUserId(req);
    } else {
      supabase = getSupabaseForRequest(req);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 });
      }
      userId = userData.user.id;
    }

    // Rate limiting por usuário (janela fixa 60s)
    const WINDOW_MS = 60_000;
    const MAX_REQ = 30;
    const rl = checkRateLimit(`post:${userId}`, MAX_REQ, WINDOW_MS);
    if (process.env.DEBUG_RATE_LIMIT === 'true') {
      logger.info('video-jobs', 'rate-limit-check', {
        key: `post:${userId}`,
        result: rl,
        bucket: inspectRateLimit(`post:${userId}`),
      });
    }
    if (!rl.allowed) {
      recordRateLimitHit();
      return new NextResponse(JSON.stringify({ code: 'RATE_LIMITED', message: 'Muitas requisições. Tente novamente em breve.' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'Retry-After': String(rl.retryAfterSec) }
      });
    }

    if (mockMode) {
      const job = insertMockJob(userId, parsed.data);
      const durationMs = Date.now() - started;
      return NextResponse.json({ job, metrics: { validation_ms: durationMs } }, { status: 201 });
    }

  const payload = parsed.data;
    // Inserção simplificada (assume tabela render_jobs com colunas mínimas): id (uuid default), user_id, project_id, status, created_at
    if (!supabase) {
      throw new Error('Supabase client não inicializado');
    }

    const { error: insertErr, data } = await supabase.from('render_jobs').insert({
      user_id: userId,
      project_id: payload.project_id,
      status: 'queued',
      progress: 0,
      attempts: 1,
      render_settings: { slides: payload.slides.length, quality: payload.quality, tts_voice: payload.tts_voice },
    }).select('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms').single();

    if (insertErr) {
      recordError('DB_ERROR');
      if (allowMockFallback()) {
        const job = insertMockJob(userId, payload);
        const durationMs = Date.now() - started;
        return NextResponse.json({ job, metadata: { fallback: 'mock' }, metrics: { validation_ms: durationMs } }, { status: 201 });
      }
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao criar job', details: insertErr.message }, { status: 500 });
    }

    const durationMs = Date.now() - started;
  const row = data as unknown as RenderJobRow;
  const job = data ? { id: row.id, status: row.status, project_id: row.project_id, created_at: row.created_at, progress: row.progress, attempts: row.attempts, duration_ms: row.duration_ms ?? null, settings: row.render_settings } : null;
  return NextResponse.json({ job, metrics: { validation_ms: durationMs } }, { status: 201 });
  } catch (err) {
    recordError('UNEXPECTED');
    logger.error('video-jobs', 'unexpected-error', err as Error);
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const fallbackEnabled = allowMockFallback();
  let buildMockResponse: (() => NextResponse) | null = null;
  let userId = '';
  let queryParams: VideoJobsQuery | null = null;
  try {
    const authHeader = (req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '').trim();
    const authToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;
    const hasAuth = authToken.length > 0;
    const mockMode = shouldUseMockRenderJobs() || !hasAuth;

    let supabase: ReturnType<typeof getSupabaseForRequest> | null = null;
    if (mockMode) {
      userId = getMockUserId(req);
    } else {
      supabase = getSupabaseForRequest(req);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 });
      }
      userId = userData.user.id;
    }

    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { params[k] = v; });
    const parsed = parseVideoJobsQuery(params);
    if (!parsed.success) {
      const err = parsed as import('zod').SafeParseError<unknown>;
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: err.error.issues }, { status: 400 });
    }
    queryParams = parsed.data;

    // Cache simples em memória por usuário+query (TTL 15s)
    const CACHE_TTL_MS = 15_000;
    const globalAny = globalThis as unknown as GlobalWithCache;
    if (!globalAny.__vj_cache) globalAny.__vj_cache = new Map();
    const cacheKey = `list:${userId}:${queryParams.limit}:${queryParams.offset}:${queryParams.status || 'all'}:${queryParams.projectId || 'all'}:${queryParams.sortBy}:${queryParams.sortOrder}`;
    const computeMockResponse = (cacheTag: 'MISS' | 'HIT' = 'MISS') => {
      const jobs = listMockJobs(userId, {
        limit: queryParams!.limit,
        offset: queryParams!.offset,
        status: queryParams!.status,
        projectId: queryParams!.projectId,
        sortBy: queryParams!.sortBy,
        sortOrder: queryParams!.sortOrder,
      });
      const payload: VideoJobCachePayload = { jobs };
      globalAny.__vj_cache?.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
      return new NextResponse(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json', 'X-Cache': cacheTag, 'X-Mock-Data': 'render-jobs' }
      });
    };
    buildMockResponse = computeMockResponse;
    const hit = globalAny.__vj_cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      return new NextResponse(JSON.stringify(hit.payload), {
        status: 200,
        headers: { 'content-type': 'application/json', 'X-Cache': 'HIT' }
      });
    }

    if (mockMode) {
      return computeMockResponse();
    }

    if (!supabase) {
      throw new Error('Supabase client não inicializado');
    }

    if (!queryParams) {
      throw new Error('Parâmetros da listagem não foram inicializados');
    }
    const { limit: dbLimit, offset, status: statusFilter, projectId, sortBy, sortOrder } = queryParams;
    const sortColumn = sortBy === 'updated_at' ? 'updated_at' : sortBy === 'status' ? 'status' : 'created_at';
    let query = supabase.from('render_jobs')
      .select('id,status,project_id,created_at,updated_at,progress,render_settings,attempts,duration_ms')
      .eq('user_id', userId)
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + dbLimit - 1);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      recordError('DB_ERROR');
      if (fallbackEnabled && buildMockResponse) {
        return buildMockResponse();
      }
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao listar jobs', details: error.message }, { status: 500 });
    }
    // Normaliza render_settings -> settings
    const jobs = (data ?? []).map((row: unknown) => {
      const r = row as RenderJobRow;
      const { render_settings, ...rest } = r;
      return { ...rest, settings: render_settings };
    });
    const payload: VideoJobCachePayload = { jobs };
    globalAny.__vj_cache?.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    return new NextResponse(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json', 'X-Cache': 'MISS' } });
  } catch (err) {
    recordError('UNEXPECTED');
    logger.error('video-jobs', 'list-unexpected-error', err as Error);
    if (fallbackEnabled && buildMockResponse) {
      return buildMockResponse();
    }
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 });
  }
}

