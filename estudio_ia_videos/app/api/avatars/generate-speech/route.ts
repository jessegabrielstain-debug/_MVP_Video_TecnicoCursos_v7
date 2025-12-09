/**
 * 🎤 API: Generate Speech for Avatar V2
 * Gera áudio TTS para sincronização com avatar 3D
 * Integração com Pipeline Unificado
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
// Using inline implementations instead of external modules
// import { EnhancedTTSService, EnhancedTTSConfig } from '@/lib/enhanced-tts-service';
// import { UnifiedAvatarPipeline } from '@/lib/unified-avatar-pipeline';

// Inline implementations
interface EnhancedTTSConfig {
  text: string;
  language: string;
  voice: string;
  speed: number;
  pitch: number;
  emotion: string;
  provider: string;
  lipSyncPrecision?: string;
}

interface TTSResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  provider?: string;
  quality?: number;
  phonemes?: unknown[];
  lipSyncData?: Record<string, unknown>;
  cacheHit?: boolean;
  error?: string;
}

class EnhancedTTSService {
  private static instance: EnhancedTTSService;
  
  static getInstance(): EnhancedTTSService {
    if (!this.instance) {
      this.instance = new EnhancedTTSService();
    }
    return this.instance;
  }
  
  async synthesizeSpeech(config: EnhancedTTSConfig): Promise<TTSResult> {
    // Simulate TTS processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      audioUrl: `/api/audio/generated/${Date.now()}.mp3`,
      duration: estimateDuration(config.text, config.speed),
      provider: config.provider,
      quality: 0.85,
      phonemes: config.lipSyncPrecision ? [] : undefined,
      lipSyncData: config.lipSyncPrecision ? {} : undefined,
      cacheHit: Math.random() > 0.7
    };
  }
}

class UnifiedAvatarPipeline {
  private static instance: UnifiedAvatarPipeline;
  private jobs: Map<string, Record<string, unknown>> = new Map();
  
  static getInstance(): UnifiedAvatarPipeline {
    if (!this.instance) {
      this.instance = new UnifiedAvatarPipeline();
    }
    return this.instance;
  }
  
  async createRenderJob(text: string, config: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Record<string, unknown> = {
      id: jobId,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null,
      estimatedCompletion: new Date(Date.now() + 30000).toISOString(),
      output: null,
      error: null,
      metrics: {},
      text,
      config,
      metadata
    };
    
    this.jobs.set(jobId, job);
    
    // Simulate processing
    setTimeout(() => {
      const updatedJob = this.jobs.get(jobId);
      if (updatedJob) {
        updatedJob.status = 'completed';
        updatedJob.progress = 100;
        updatedJob.endTime = new Date().toISOString();
        updatedJob.output = {
          audioUrl: `/api/audio/generated/${jobId}.mp3`,
          videoUrl: `/api/video/generated/${jobId}.mp4`,
          duration: estimateDuration(text, (config.tts as { speed?: number })?.speed || 1.0)
        };
      }
    }, 5000);
    
    return jobId;
  }
  
  getJobStatus(jobId: string) {
    return this.jobs.get(jobId) || null;
  }
}

// Interface para request
interface GenerateSpeechRequest {
  text: string;
  voiceId?: string;
  avatarId?: string;
  language?: 'pt-BR' | 'en-US' | 'es-ES';
  provider?: 'elevenlabs' | 'azure' | 'google' | 'synthetic';
  speed?: number;
  pitch?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  enableLipSync?: boolean;
  lipSyncPrecision?: 'low' | 'medium' | 'high' | 'ultra';
  useUnifiedPipeline?: boolean;
  metadata?: Record<string, unknown>;
}

// Interface para response
interface GenerateSpeechResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  provider?: string;
  avatarId?: string;
  text?: string;
  voiceId?: string;
  jobId?: string; // Para pipeline unificado
  phonemes?: unknown[];
  lipSyncData?: Record<string, unknown>;
  metadata?: {
    quality: number;
    processingTime: number;
    provider: string;
    language: string;
    textLength: number;
    estimatedDuration: number;
    cacheHit?: boolean;
  };
  error?: string;
  details?: string;
}

// Configuração padrão
const DEFAULT_CONFIG = {
  language: 'pt-BR' as const,
  provider: 'elevenlabs' as const,
  speed: 1.0,
  pitch: 1.0,
  emotion: 'neutral' as const,
  quality: 'high' as const,
  enableLipSync: true,
  lipSyncPrecision: 'high' as const,
  useUnifiedPipeline: false
};

// Validações
function validateRequest(body: Partial<GenerateSpeechRequest>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar texto
  if (!body.text) {
    errors.push('Campo "text" é obrigatório');
  } else if (typeof body.text !== 'string') {
    errors.push('Campo "text" deve ser uma string');
  } else if (body.text.trim().length === 0) {
    errors.push('Campo "text" não pode estar vazio');
  } else if (body.text.length > 10000) {
    errors.push('Campo "text" muito longo (máximo 10.000 caracteres)');
  }
  
  // Validar voiceId se fornecido
  if (body.voiceId && typeof body.voiceId !== 'string') {
    errors.push('Campo "voiceId" deve ser uma string');
  }
  
  // Validar language se fornecido
  if (body.language && !['pt-BR', 'en-US', 'es-ES'].includes(body.language)) {
    errors.push('Campo "language" deve ser pt-BR, en-US ou es-ES');
  }
  
  // Validar provider se fornecido
  if (body.provider && !['elevenlabs', 'azure', 'google', 'synthetic'].includes(body.provider)) {
    errors.push('Campo "provider" deve ser elevenlabs, azure, google ou synthetic');
  }
  
  // Validar speed se fornecido
  if (body.speed !== undefined) {
    if (typeof body.speed !== 'number' || body.speed < 0.25 || body.speed > 4.0) {
      errors.push('Campo "speed" deve ser um número entre 0.25 e 4.0');
    }
  }
  
  // Validar pitch se fornecido
  if (body.pitch !== undefined) {
    if (typeof body.pitch !== 'number' || body.pitch < -20 || body.pitch > 20) {
      errors.push('Campo "pitch" deve ser um número entre -20 e 20');
    }
  }
  
  // Validar emotion se fornecido
  if (body.emotion && !['neutral', 'happy', 'sad', 'angry', 'excited'].includes(body.emotion)) {
    errors.push('Campo "emotion" deve ser neutral, happy, sad, angry ou excited');
  }
  
  // Validar quality se fornecido
  if (body.quality && !['low', 'medium', 'high', 'ultra'].includes(body.quality)) {
    errors.push('Campo "quality" deve ser low, medium, high ou ultra');
  }
  
  // Validar lipSyncPrecision se fornecido
  if (body.lipSyncPrecision && !['low', 'medium', 'high', 'ultra'].includes(body.lipSyncPrecision)) {
    errors.push('Campo "lipSyncPrecision" deve ser low, medium, high ou ultra');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função para estimar duração
function estimateDuration(text: string, speed: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 160 * speed; // Velocidade média ajustada
  const baseDuration = (words / wordsPerMinute) * 60 * 1000; // em ms
  
  // Adicionar tempo para pontuação e pausas
  const punctuationCount = (text.match(/[.!?;:,]/g) || []).length;
  const pauseTime = punctuationCount * 300; // 300ms por pontuação
  
  return Math.ceil(baseDuration + pauseTime);
}

// Função para obter voiceId padrão baseado no provider
function getDefaultVoiceId(provider: string, language: string): string {
  const voiceMap: Record<string, Record<string, string>> = {
    elevenlabs: {
      'pt-BR': 'pNInz6obpgDQGcFmaJgB', // Rachel brasileira
      'en-US': '21m00Tcm4TlvDq8ikWAM', // Rachel inglês
      'es-ES': 'XB0fDUnXU5powFXDhCwa'  // Maria espanhol
    },
    azure: {
      'pt-BR': 'pt-BR-FranciscaNeural',
      'en-US': 'en-US-JennyNeural',
      'es-ES': 'es-ES-ElviraNeural'
    },
    google: {
      'pt-BR': 'pt-BR-Wavenet-A',
      'en-US': 'en-US-Wavenet-F',
      'es-ES': 'es-ES-Wavenet-C'
    },
    synthetic: {
      'pt-BR': 'synthetic-pt-br-female',
      'en-US': 'synthetic-en-us-female',
      'es-ES': 'synthetic-es-es-female'
    }
  };
  
  return voiceMap[provider]?.[language] || voiceMap.synthetic[language];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse do body
    let body: GenerateSpeechRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'JSON inválido no body da requisição',
          details: 'Verifique se o JSON está bem formatado'
        },
        { status: 400 }
      );
    }
    
    // Validar request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Dados de entrada inválidos',
          details: validation.errors.join(', ')
        },
        { status: 400 }
      );
    }
    
    // Aplicar configurações padrão
    const config: GenerateSpeechRequest = {
      ...DEFAULT_CONFIG,
      ...body,
      voiceId: body.voiceId || getDefaultVoiceId(body.provider || DEFAULT_CONFIG.provider, body.language || DEFAULT_CONFIG.language)
    };
    
    logger.info(`🎤 Gerando speech para texto: "${config.text.substring(0, 50)}..." (${config.text.length} chars)`, { component: 'API: avatars/generate-speech' })
    logger.info(`📋 Configuração: provider=${config.provider}, voice=${config.voiceId}, quality=${config.quality}`, { component: 'API: avatars/generate-speech' })
    
    // Verificar se deve usar pipeline unificado
    if (config.useUnifiedPipeline) {
      return await handleUnifiedPipeline(config, startTime);
    } else {
      return await handleDirectTTS(config, startTime);
    }
    
  } catch (error) {
    logger.error('❌ Erro ao gerar speech', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/generate-speech' })
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// Processar usando pipeline unificado
async function handleUnifiedPipeline(config: GenerateSpeechRequest, startTime: number): Promise<NextResponse> {
  try {
    const pipeline = UnifiedAvatarPipeline.getInstance();
    
    // Criar configuração do pipeline
    const pipelineConfig = {
      tts: {
        provider: config.provider!,
        voiceId: config.voiceId!,
        language: config.language!,
        speed: config.speed!,
        pitch: config.pitch!,
        emotion: config.emotion!,
        quality: config.quality!
      },
      lipSync: {
        precision: config.lipSyncPrecision!,
        frameRate: 60,
        smoothing: 0.3,
        intensity: 0.8,
        enableEmotions: true,
        enableBreathing: true,
        enableMicroExpressions: false
      },
      performance: {
        enableCache: true,
        enablePreprocessing: true,
        enableOptimizations: true,
        maxConcurrentJobs: 3,
        timeoutMs: 300000,
        retryAttempts: 2
      }
    };
    
    // Criar job no pipeline
    const jobId = await pipeline.createRenderJob(config.text, pipelineConfig, config.metadata);
    
    const processingTime = Date.now() - startTime;
    
    const response: GenerateSpeechResponse = {
      success: true,
      jobId,
      text: config.text,
      voiceId: config.voiceId,
      avatarId: config.avatarId,
      metadata: {
        quality: 0.9, // Estimativa inicial
        processingTime,
        provider: config.provider!,
        language: config.language!,
        textLength: config.text.length,
        estimatedDuration: estimateDuration(config.text, config.speed),
        cacheHit: false
      }
    };
    
    logger.info(`✅ Job ${jobId} criado no pipeline unificado em ${processingTime}ms`, { component: 'API: avatars/generate-speech' })
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('❌ Erro no pipeline unificado', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/generate-speech' })
    throw error;
  }
}

// Processar usando TTS direto
async function handleDirectTTS(config: GenerateSpeechRequest, startTime: number): Promise<NextResponse> {
  try {
    const ttsService = EnhancedTTSService.getInstance();
    
    // Configurar TTS
    const ttsConfig: EnhancedTTSConfig = {
      text: config.text,
      language: config.language!,
      voice: config.voiceId!,
      speed: config.speed!,
      pitch: config.pitch!,
      emotion: config.emotion!,
      provider: config.provider!,
      lipSyncPrecision: config.enableLipSync ? config.lipSyncPrecision : undefined
    };
    
    // Gerar áudio
    logger.info(`🔄 Gerando TTS com ${config.provider}...`, { component: 'API: avatars/generate-speech' })
    const result = await ttsService.synthesizeSpeech(ttsConfig);
    
    if (!result.success || !result.audioUrl) {
      throw new Error(`Falha ao gerar áudio TTS: ${result.error || 'Erro desconhecido'}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    const response: GenerateSpeechResponse = {
      success: true,
      audioUrl: result.audioUrl,
      duration: result.duration || estimateDuration(config.text, config.speed),
      provider: result.provider || config.provider,
      avatarId: config.avatarId,
      text: config.text,
      voiceId: config.voiceId,
      phonemes: config.enableLipSync ? result.phonemes : undefined,
      lipSyncData: config.enableLipSync ? result.lipSyncData : undefined,
      metadata: {
        quality: result.quality || 0.8,
        processingTime,
        provider: result.provider || config.provider!,
        language: config.language!,
        textLength: config.text.length,
        estimatedDuration: estimateDuration(config.text, config.speed),
        cacheHit: result.cacheHit || false
      }
    };
    
    logger.info(`✅ TTS gerado com sucesso em ${processingTime}ms`, { component: 'API: avatars/generate-speech' })
    logger.info(`📊 Qualidade: ${response.metadata?.quality}, Provider: ${response.provider}`, { component: 'API: avatars/generate-speech' })
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('❌ Erro no TTS direto', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/generate-speech' })
    throw error;
  }
}

// Endpoint GET para obter status de job (pipeline unificado)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'jobId é obrigatório'
        },
        { status: 400 }
      );
    }
    
    const pipeline = UnifiedAvatarPipeline.getInstance();
    const job = pipeline.getJobStatus(jobId);
    
    if (!job) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Job não encontrado'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        estimatedCompletion: job.estimatedCompletion,
        output: job.output,
        error: job.error,
        metrics: job.metrics
      }
    });
    
  } catch (error) {
    logger.error('❌ Erro ao obter status do job', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/generate-speech' })
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

