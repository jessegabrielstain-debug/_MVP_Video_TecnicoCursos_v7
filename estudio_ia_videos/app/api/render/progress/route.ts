/**
 * 🎬 API de Progress Stream
 * Endpoint para streaming de progresso em tempo real
 */

import { NextRequest } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response('Job ID é obrigatório', { status: 400 });
  }

  const supabase = getSupabaseForRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Authentication required', { status: 401 });
  }

  // Verify access to the job
  const { data: job, error } = await supabase
    .from('render_jobs')
    .select('id')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error || !job) {
    return new Response('Job não encontrado ou acesso negado', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const { data: currentJob, error: jobError } = await supabase
            .from('render_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

          if (jobError || !currentJob) {
            controller.close();
            return;
          }

          const data = {
            id: currentJob.id,
            status: currentJob.status,
            progress: currentJob.progress,
            error: currentJob.error_message,
            outputUrl: currentJob.output_url,
            updatedAt: (currentJob as any).updated_at
          };

          const sseData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));

          if (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'cancelled') {
            controller.close();
            return;
          }

          setTimeout(sendUpdate, 1000);
        } catch (e) {
          logger.error('Error in progress stream', { component: 'API: render/progress', error: e instanceof Error ? e : new Error(String(e)) });
          controller.close();
        }
      };

      sendUpdate();
    },
    cancel() {
      logger.info('Progress stream cancelled by client', { component: 'API: render/progress' });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
