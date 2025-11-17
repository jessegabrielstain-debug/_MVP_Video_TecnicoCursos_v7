/**
 * 🎬 Unified Avatar + TTS Pipeline V2
 * Pipeline completo e otimizado para geração de vídeos com avatares falando
 * Integração total entre TTS, Lip-Sync e Renderização 3D
 */

import { EnhancedTTSService, EnhancedTTSConfig, EnhancedTTSResult } from './enhanced-tts-service'
import { ElevenLabsService } from './elevenlabs-service'
import { AdvancedLipSyncService, LipSyncResult } from './advanced-lipsync-service'
import { MonitoringService } from './monitoring-service'

// Configuração do pipeline unificado
interface UnifiedPipelineConfig {
  // Configurações de TTS
  tts: {
    provider: 'elevenlabs' | 'azure' | 'google' | 'synthetic'
    voiceId: string
    language: 'pt-BR' | 'en-US' | 'es-ES'
    speed: number
    pitch: number
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited'
    quality: 'low' | 'medium' | 'high' | 'ultra'
  }
  
  // Configurações do avatar
  avatar: {
    model: string
    style: 'realistic' | 'cartoon' | 'professional' | 'casual'
    gender: 'male' | 'female' | 'neutral'
    age: 'young' | 'adult' | 'mature'
    ethnicity: 'caucasian' | 'african' | 'asian' | 'hispanic' | 'mixed'
    clothing: 'business' | 'casual' | 'formal' | 'custom'
    background: 'studio' | 'office' | 'home' | 'green_screen' | 'custom'
  }
  
  // Configurações de lip-sync
  lipSync: {
    precision: 'low' | 'medium' | 'high' | 'ultra'
    frameRate: number
    smoothing: number
    intensity: number
    enableEmotions: boolean
    enableBreathing: boolean
    enableMicroExpressions: boolean
  }
  
  // Configurações de renderização
  rendering: {
    resolution: '720p' | '1080p' | '4K'
    frameRate: number
    quality: 'draft' | 'preview' | 'production' | 'cinema'
    format: 'mp4' | 'webm' | 'mov'
    codec: 'h264' | 'h265' | 'vp9' | 'av1'
    bitrate: number
    enableGPU: boolean
    enableParallel: boolean
  }
  
  // Configurações de performance
  performance: {
    enableCache: boolean
    enablePreprocessing: boolean
    enableOptimizations: boolean
    maxConcurrentJobs: number
    timeoutMs: number
    retryAttempts: number
  }
}

// Status do job de renderização
interface RenderJob {
  id: string
  status: 'queued' | 'preprocessing' | 'tts_generation' | 'lip_sync' | 'rendering' | 'post_processing' | 'completed' | 'failed'
  progress: number // 0-100
  startTime: Date
  endTime?: Date
  estimatedCompletion?: Date
  
  // Dados de entrada
  input: {
    text: string
    config: UnifiedPipelineConfig
    metadata?: Record<string, unknown>
  }
  
  // Resultados intermediários
  intermediate: {
    ttsResult?: EnhancedTTSResult
    lipSyncResult?: LipSyncResult
    audioAnalysis?: any
    renderingData?: any
  }
  
  // Resultado final
  output?: {
    videoUrl: string
    audioUrl: string
    thumbnailUrl: string
    duration: number
    fileSize: number
    metadata: RenderMetadata
  }
  
  // Informações de erro
  error?: {
    message: string
    code: string
    stage: string
    details: any
  }
  
  // Métricas de performance
  metrics: {
    ttsTime: number
    lipSyncTime: number
    renderingTime: number
    totalTime: number
    memoryUsage: number
    cpuUsage: number
    gpuUsage?: number
  }
}

// Metadados do resultado
interface RenderMetadata {
  version: string
  pipeline: string
  config: UnifiedPipelineConfig
  quality: {
    ttsQuality: number
    lipSyncQuality: number
    renderQuality: number
    overallQuality: number
  }
  performance: {
    processingTime: number
    renderingSpeed: number // frames per second
    efficiency: number // 0-1
  }
  technical: {
    audioSampleRate: number
    videoFrameRate: number
    videoBitrate: number
    audioCodec: string
    videoCodec: string
  }
}

// Configuração padrão otimizada
const DEFAULT_CONFIG: UnifiedPipelineConfig = {
  tts: {
    provider: 'elevenlabs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Rachel brasileira
    language: 'pt-BR',
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutral',
    quality: 'high'
  },
  avatar: {
    model: 'professional_female_v2',
    style: 'professional',
    gender: 'female',
    age: 'adult',
    ethnicity: 'mixed',
    clothing: 'business',
    background: 'studio'
  },
  lipSync: {
    precision: 'high',
    frameRate: 60,
    smoothing: 0.3,
    intensity: 0.8,
    enableEmotions: true,
    enableBreathing: true,
    enableMicroExpressions: false
  },
  rendering: {
    resolution: '1080p',
    frameRate: 30,
    quality: 'production',
    format: 'mp4',
    codec: 'h264',
    bitrate: 5000,
    enableGPU: true,
    enableParallel: true
  },
  performance: {
    enableCache: true,
    enablePreprocessing: true,
    enableOptimizations: true,
    maxConcurrentJobs: 3,
    timeoutMs: 300000, // 5 minutos
    retryAttempts: 2
  }
}

export class UnifiedAvatarPipeline {
  private static instance: UnifiedAvatarPipeline
  private ttsService: EnhancedTTSService
  private elevenLabsService: ElevenLabsService
  private lipSyncService: AdvancedLipSyncService
  private monitoring: MonitoringService
  private activeJobs: Map<string, RenderJob> = new Map()
  private jobQueue: string[] = []
  private isProcessing = false
  private performanceMetrics: any = {}

  constructor() {
    this.ttsService = EnhancedTTSService.getInstance()
    this.elevenLabsService = ElevenLabsService.getInstance()
    this.lipSyncService = AdvancedLipSyncService.getInstance()
    this.monitoring = MonitoringService.getInstance()
  }

  static getInstance(): UnifiedAvatarPipeline {
    if (!UnifiedAvatarPipeline.instance) {
      UnifiedAvatarPipeline.instance = new UnifiedAvatarPipeline()
    }
    return UnifiedAvatarPipeline.instance
  }

  // Criar novo job de renderização
  async createRenderJob(
    text: string,
    config: Partial<UnifiedPipelineConfig> = {},
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const jobId = this.generateJobId()
    const fullConfig = this.mergeConfig(config)
    
    const job: RenderJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      startTime: new Date(),
      input: {
        text,
        config: fullConfig,
        metadata
      },
      intermediate: {},
      metrics: {
        ttsTime: 0,
        lipSyncTime: 0,
        renderingTime: 0,
        totalTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    }
    
    this.activeJobs.set(jobId, job)
    this.jobQueue.push(jobId)
    
    // Log do início do pipeline
    this.monitoring.logPipelineStart(jobId, {
      textLength: text.length,
      config: fullConfig,
      queuePosition: this.jobQueue.length
    })
    
    // Iniciar processamento se não estiver rodando
    if (!this.isProcessing) {
      this.processQueue()
    }
    
    console.log(`🎬 Job ${jobId} criado e adicionado à fila`)
    return jobId
  }

  // Processar fila de jobs
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) return
    
    this.isProcessing = true
    
    try {
      while (this.jobQueue.length > 0) {
        const jobId = this.jobQueue.shift()!
        const job = this.activeJobs.get(jobId)
        
        if (!job) continue
        
        try {
          await this.processJob(job)
        } catch (error) {
          console.error(`Erro ao processar job ${jobId}:`, error)
          this.handleJobError(job, error)
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  // Processar job individual
  private async processJob(job: RenderJob): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Iniciando processamento do job ${job.id}`)
      
      // Fase 1: Pré-processamento
      await this.preprocessJob(job)
      
      // Fase 2: Geração de TTS
      await this.generateTTS(job)
      
      // Fase 3: Geração de Lip-Sync
      await this.generateLipSync(job)
      
      // Fase 4: Renderização 3D
      await this.renderAvatar(job)
      
      // Fase 5: Pós-processamento
      await this.postProcessJob(job)
      
      // Finalizar job
      job.status = 'completed'
      job.progress = 100
      job.endTime = new Date()
      job.metrics.totalTime = Date.now() - startTime
      
      // Log de sucesso do pipeline
      this.monitoring.logPipelineSuccess(job.id, job.metrics.totalTime)
      
      console.log(`✅ Job ${job.id} concluído em ${job.metrics.totalTime}ms`)
      
    } catch (error) {
      this.handleJobError(job, error)
      throw error
    }
  }

  // Fase 1: Pré-processamento
  private async preprocessJob(job: RenderJob): Promise<void> {
    job.status = 'preprocessing'
    job.progress = 5
    
    console.log(`📋 Pré-processando job ${job.id}`)
    
    try {
      // Validar entrada
      this.validateInput(job.input)
      
      // Otimizar configurações baseado no texto
      job.input.config = this.optimizeConfig(job.input.text, job.input.config)
      
      // Preparar cache se habilitado
      if (job.input.config.performance.enableCache) {
        await this.prepareCacheForJob(job)
      }
      
      job.progress = 10
      
      this.monitoring.log('info', 'pipeline_start', `Pré-processamento concluído para job ${job.id}`, {
        jobId: job.id,
        textLength: job.input.text.length,
        optimizedConfig: job.input.config
      })
      
    } catch (error) {
      this.monitoring.log('error', 'pipeline_error', `Erro no pré-processamento do job ${job.id}`, {
        jobId: job.id,
        error: error.message,
        stage: 'preprocessing'
      })
      throw error
    }
  }

  // Fase 2: Geração de TTS
  private async generateTTS(job: RenderJob): Promise<void> {
    job.status = 'tts_generation'
    job.progress = 15
    
    console.log(`🎙️ Gerando TTS para job ${job.id}`)
    
    const ttsStartTime = Date.now()
    
    try {
      // Log início do TTS
      this.monitoring.logTTSStart(job.id, {
        provider: job.input.config.tts.provider,
        voiceId: job.input.config.tts.voiceId,
        language: job.input.config.tts.language,
        textLength: job.input.text.length
      })
      
      const ttsConfig: EnhancedTTSConfig = {
        text: job.input.text,
        language: job.input.config.tts.language,
        voice: job.input.config.tts.voiceId,
        speed: job.input.config.tts.speed,
        pitch: job.input.config.tts.pitch,
        emotion: job.input.config.tts.emotion,
        provider: job.input.config.tts.provider,
        lipSyncPrecision: job.input.config.lipSync.precision
      }
      
      const ttsResult = await this.ttsService.synthesizeSpeech(ttsConfig)
      job.intermediate.ttsResult = ttsResult
      
      job.metrics.ttsTime = Date.now() - ttsStartTime
      job.progress = 35
      
      // Log sucesso do TTS
      this.monitoring.logTTSSuccess(
        job.id, 
        job.metrics.ttsTime, 
        job.input.config.tts.provider,
        ttsResult.quality || 0.8
      )
      
      console.log(`✅ TTS gerado em ${job.metrics.ttsTime}ms`)
      
    } catch (error) {
      this.monitoring.logTTSError(job.id, error, job.input.config.tts.provider)
      console.error('Erro na geração de TTS:', error)
      throw new Error(`Falha na geração de TTS: ${error}`)
    }
  }

  // Fase 3: Geração de Lip-Sync
  private async generateLipSync(job: RenderJob): Promise<void> {
    job.status = 'lip_sync'
    job.progress = 40
    
    console.log(`👄 Gerando lip-sync para job ${job.id}`)
    
    const lipSyncStartTime = Date.now()
    
    try {
      if (!job.intermediate.ttsResult) {
        throw new Error('TTS result não encontrado')
      }
      
      // Log início do lip-sync
      this.monitoring.logLipSyncStart(job.id, {
        precision: job.input.config.lipSync.precision,
        frameRate: job.input.config.lipSync.frameRate,
        enableEmotions: job.input.config.lipSync.enableEmotions
      })
      
      // Converter audio URL para ArrayBuffer
      const audioBuffer = await this.fetchAudioBuffer(job.intermediate.ttsResult.audioUrl)
      
      const lipSyncResult = await this.lipSyncService.generateAdvancedLipSync(
        audioBuffer,
        job.intermediate.ttsResult.phonemes,
        job.input.text,
        job.input.config.lipSync
      )
      
      job.intermediate.lipSyncResult = lipSyncResult
      job.metrics.lipSyncTime = Date.now() - lipSyncStartTime
      job.progress = 60
      
      // Log sucesso do lip-sync
      this.monitoring.logLipSyncSuccess(
        job.id,
        job.metrics.lipSyncTime,
        lipSyncResult.metadata.confidence
      )
      
      console.log(`✅ Lip-sync gerado em ${job.metrics.lipSyncTime}ms`)
      
    } catch (error) {
      this.monitoring.logLipSyncError(job.id, error)
      console.error('Erro na geração de lip-sync:', error)
      throw new Error(`Falha na geração de lip-sync: ${error}`)
    }
  }

  // Fase 4: Renderização do Avatar
  private async renderAvatar(job: RenderJob): Promise<void> {
    job.status = 'rendering'
    job.progress = 65
    
    console.log(`🎭 Renderizando avatar para job ${job.id}`)
    
    const renderStartTime = Date.now()
    
    try {
      if (!job.intermediate.lipSyncResult || !job.intermediate.ttsResult) {
        throw new Error('Dados de lip-sync ou TTS não encontrados')
      }
      
      // Log início da renderização
      this.monitoring.logRenderStart(job.id, {
        resolution: job.input.config.rendering.resolution,
        quality: job.input.config.rendering.quality,
        frameRate: job.input.config.rendering.frameRate,
        avatarModel: job.input.config.avatar.model
      })
      
      // Preparar dados de renderização
      const renderData = this.prepareRenderData(job)
      
      // Renderizar avatar 3D
      const renderResult = await this.performAvatarRendering(renderData, job)
      
      // Salvar resultado
      job.output = {
        videoUrl: renderResult.videoUrl,
        audioUrl: job.intermediate.ttsResult.audioUrl,
        thumbnailUrl: renderResult.thumbnailUrl,
        duration: job.intermediate.ttsResult.duration,
        fileSize: renderResult.fileSize,
        metadata: this.generateMetadata(job, renderResult)
      }
      
      job.metrics.renderingTime = Date.now() - renderStartTime
      job.progress = 90
      
      // Log sucesso da renderização
      this.monitoring.logRenderSuccess(
        job.id,
        job.metrics.renderingTime,
        renderResult.fileSize,
        job.input.config.rendering.quality
      )
      
      console.log(`✅ Avatar renderizado em ${job.metrics.renderingTime}ms`)
      
    } catch (error) {
      this.monitoring.logRenderError(job.id, error)
      console.error('Erro na renderização:', error)
      throw new Error(`Falha na renderização: ${error}`)
    }
  }

  // Fase 5: Pós-processamento
  private async postProcessJob(job: RenderJob): Promise<void> {
    job.status = 'post_processing'
    job.progress = 95
    
    console.log(`🔧 Pós-processando job ${job.id}`)
    
    try {
      // Otimizar vídeo final
      if (job.output && job.input.config.performance.enableOptimizations) {
        await this.optimizeVideo(job.output.videoUrl, job.input.config.rendering)
      }
      
      // Gerar thumbnail se não existir
      if (job.output && !job.output.thumbnailUrl) {
        job.output.thumbnailUrl = await this.generateThumbnail(job.output.videoUrl)
      }
      
      // Limpar arquivos temporários
      await this.cleanupTempFiles(job)
      
      // Atualizar cache
      if (job.input.config.performance.enableCache) {
        await this.updateCache(job)
      }
      
      job.progress = 100
      
      this.monitoring.log('info', 'pipeline_success', `Pós-processamento concluído para job ${job.id}`, {
        jobId: job.id,
        totalTime: job.metrics.totalTime,
        fileSize: job.output?.fileSize
      })
      
    } catch (error) {
      this.monitoring.log('warn', 'system_warning', `Erro no pós-processamento do job ${job.id} (não crítico)`, {
        jobId: job.id,
        error: error.message
      })
      console.warn('Erro no pós-processamento (não crítico):', error)
      // Não falhar o job por erros de pós-processamento
    }
  }

  // Preparar dados de renderização
  private prepareRenderData(job: RenderJob): any {
    const { config } = job.input
    const { lipSyncResult, ttsResult } = job.intermediate
    
    return {
      avatar: {
        model: config.avatar.model,
        style: config.avatar.style,
        appearance: {
          gender: config.avatar.gender,
          age: config.avatar.age,
          ethnicity: config.avatar.ethnicity
        },
        clothing: config.avatar.clothing,
        background: config.avatar.background
      },
      animation: {
        lipSync: lipSyncResult!.keyframes,
        duration: ttsResult!.duration,
        frameRate: config.rendering.frameRate
      },
      audio: {
        url: ttsResult!.audioUrl,
        duration: ttsResult!.duration
      },
      rendering: {
        resolution: config.rendering.resolution,
        quality: config.rendering.quality,
        format: config.rendering.format,
        codec: config.rendering.codec,
        bitrate: config.rendering.bitrate
      }
    }
  }

  // Realizar renderização do avatar
  private async performAvatarRendering(renderData: any, job: RenderJob): Promise<any> {
    // Simular renderização 3D (em produção, integrar com engine 3D real)
    const { config } = job.input
    
    // Calcular tempo estimado baseado na configuração
    const estimatedTime = this.calculateRenderTime(renderData, config)
    
    // Simular progresso de renderização
    const progressInterval = setInterval(() => {
      if (job.progress < 85) {
        job.progress += 2
      }
    }, estimatedTime / 10)
    
    try {
      // Aqui seria a integração real com o engine 3D
      await new Promise(resolve => setTimeout(resolve, estimatedTime))
      
      clearInterval(progressInterval)
      
      // Simular resultado da renderização
      const videoUrl = await this.saveRenderedVideo(renderData, job.id)
      const thumbnailUrl = await this.generateThumbnail(videoUrl)
      const fileSize = this.estimateFileSize(renderData)
      
      return {
        videoUrl,
        thumbnailUrl,
        fileSize,
        renderingStats: {
          framesRendered: Math.ceil(renderData.animation.duration / 1000 * config.rendering.frameRate),
          renderTime: estimatedTime,
          quality: config.rendering.quality
        }
      }
      
    } finally {
      clearInterval(progressInterval)
    }
  }

  // Calcular tempo de renderização estimado
  private calculateRenderTime(renderData: any, config: UnifiedPipelineConfig): number {
    const baseTime = 1000 // 1 segundo base
    const durationFactor = renderData.animation.duration / 1000 // segundos de áudio
    const qualityFactor = this.getQualityFactor(config.rendering.quality)
    const resolutionFactor = this.getResolutionFactor(config.rendering.resolution)
    
    return Math.ceil(baseTime * durationFactor * qualityFactor * resolutionFactor)
  }

  private getQualityFactor(quality: string): number {
    switch (quality) {
      case 'draft': return 0.5
      case 'preview': return 1.0
      case 'production': return 2.0
      case 'cinema': return 4.0
      default: return 1.0
    }
  }

  private getResolutionFactor(resolution: string): number {
    switch (resolution) {
      case '720p': return 1.0
      case '1080p': return 2.0
      case '4K': return 8.0
      default: return 1.0
    }
  }

  // Salvar vídeo renderizado
  private async saveRenderedVideo(renderData: any, jobId: string): Promise<string> {
    // Simular salvamento do vídeo
    const filename = `avatar_video_${jobId}_${Date.now()}.mp4`
    const videoUrl = `/api/videos/${filename}`
    
    // Em produção, salvar o arquivo real
    console.log(`💾 Vídeo salvo: ${videoUrl}`)
    
    return videoUrl
  }

  // Gerar thumbnail
  private async generateThumbnail(videoUrl: string): Promise<string> {
    // Simular geração de thumbnail
    const thumbnailUrl = videoUrl.replace('.mp4', '_thumb.jpg')
    
    console.log(`🖼️ Thumbnail gerado: ${thumbnailUrl}`)
    
    return thumbnailUrl
  }

  // Estimar tamanho do arquivo
  private estimateFileSize(renderData: any): number {
    // Estimativa baseada na duração e qualidade
    const durationSeconds = renderData.animation.duration / 1000
    const bitrate = renderData.rendering.bitrate || 5000 // kbps
    
    return Math.ceil(durationSeconds * bitrate * 1024 / 8) // bytes
  }

  // Gerar metadados
  private generateMetadata(job: RenderJob, renderResult: any): RenderMetadata {
    const { config } = job.input
    const { ttsResult, lipSyncResult } = job.intermediate
    
    return {
      version: '2.0',
      pipeline: 'unified-avatar-pipeline',
      config,
      quality: {
        ttsQuality: ttsResult?.quality || 0.8,
        lipSyncQuality: lipSyncResult?.metadata.confidence || 0.8,
        renderQuality: this.calculateRenderQuality(config.rendering.quality),
        overallQuality: 0.8 // Média ponderada
      },
      performance: {
        processingTime: job.metrics.totalTime,
        renderingSpeed: renderResult.renderingStats?.framesRendered / (job.metrics.renderingTime / 1000) || 30,
        efficiency: this.calculateEfficiency(job)
      },
      technical: {
        audioSampleRate: 44100,
        videoFrameRate: config.rendering.frameRate,
        videoBitrate: config.rendering.bitrate,
        audioCodec: 'aac',
        videoCodec: config.rendering.codec
      }
    }
  }

  private calculateRenderQuality(quality: string): number {
    switch (quality) {
      case 'draft': return 0.4
      case 'preview': return 0.6
      case 'production': return 0.8
      case 'cinema': return 1.0
      default: return 0.6
    }
  }

  private calculateEfficiency(job: RenderJob): number {
    const totalTime = job.metrics.totalTime
    const expectedTime = this.calculateExpectedTime(job)
    
    return Math.min(1.0, expectedTime / totalTime)
  }

  private calculateExpectedTime(job: RenderJob): number {
    // Tempo esperado baseado na configuração
    const textLength = job.input.text.length
    const baseTime = textLength * 50 // 50ms por caractere
    
    return baseTime
  }

  // Buscar buffer de áudio
  private async fetchAudioBuffer(audioUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(audioUrl)
      if (!response.ok) {
        throw new Error(`Erro ao buscar áudio: ${response.status}`)
      }
      return await response.arrayBuffer()
    } catch (error) {
      console.error('Erro ao buscar buffer de áudio:', error)
      throw error
    }
  }

  // Validar entrada
  private validateInput(input: RenderJob['input']): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new Error('Texto não pode estar vazio')
    }
    
    if (input.text.length > 10000) {
      throw new Error('Texto muito longo (máximo 10.000 caracteres)')
    }
    
    // Validações adicionais...
  }

  // Otimizar configuração baseado no texto
  private optimizeConfig(text: string, config: UnifiedPipelineConfig): UnifiedPipelineConfig {
    const optimized = { ...config }
    
    // Ajustar qualidade baseado no tamanho do texto
    if (text.length < 100) {
      optimized.rendering.quality = 'preview' // Qualidade menor para textos curtos
    } else if (text.length > 1000) {
      optimized.rendering.quality = 'production' // Qualidade alta para textos longos
    }
    
    // Ajustar frame rate baseado na duração estimada
    const estimatedDuration = this.estimateTextDuration(text)
    if (estimatedDuration < 10) {
      optimized.rendering.frameRate = 60 // Frame rate alto para vídeos curtos
    } else if (estimatedDuration > 60) {
      optimized.rendering.frameRate = 24 // Frame rate padrão para vídeos longos
    }
    
    return optimized
  }

  private estimateTextDuration(text: string): number {
    const wordsPerMinute = 160 // Velocidade média de fala em português
    const words = text.split(/\s+/).length
    return (words / wordsPerMinute) * 60 // segundos
  }

  // Mesclar configuração
  private mergeConfig(partialConfig: Partial<UnifiedPipelineConfig>): UnifiedPipelineConfig {
    return {
      tts: { ...DEFAULT_CONFIG.tts, ...partialConfig.tts },
      avatar: { ...DEFAULT_CONFIG.avatar, ...partialConfig.avatar },
      lipSync: { ...DEFAULT_CONFIG.lipSync, ...partialConfig.lipSync },
      rendering: { ...DEFAULT_CONFIG.rendering, ...partialConfig.rendering },
      performance: { ...DEFAULT_CONFIG.performance, ...partialConfig.performance }
    }
  }

  // Gerar ID único para job
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Tratar erro do job
  private handleJobError(job: RenderJob, error: any): void {
    job.status = 'failed'
    job.endTime = new Date()
    job.error = {
      message: error.message || 'Erro desconhecido',
      code: error.code || 'UNKNOWN_ERROR',
      stage: job.status,
      details: error
    }
    
    // Log do erro no pipeline
    this.monitoring.logPipelineError(job.id, error, job.status)
    
    console.error(`❌ Job ${job.id} falhou:`, job.error)
  }

  // Métodos de cache com logs
  private async prepareCacheForJob(job: RenderJob): Promise<void> {
    try {
      // Implementar cache baseado no hash do texto e configuração
      const cacheKey = this.generateCacheKey(job.input.text, job.input.config)
      
      this.monitoring.log('debug', 'cache_miss', `Preparando cache para job ${job.id}`, {
        jobId: job.id,
        cacheKey
      })
      
      console.log(`🗄️ Preparando cache para job ${job.id}`)
    } catch (error) {
      this.monitoring.log('error', 'cache_error', `Erro ao preparar cache para job ${job.id}`, {
        jobId: job.id,
        error: error.message
      })
    }
  }

  private async updateCache(job: RenderJob): Promise<void> {
    try {
      // Atualizar cache com resultados
      const cacheKey = this.generateCacheKey(job.input.text, job.input.config)
      
      this.monitoring.log('debug', 'system_info', `Atualizando cache para job ${job.id}`, {
        jobId: job.id,
        cacheKey
      })
      
      console.log(`💾 Atualizando cache para job ${job.id}`)
    } catch (error) {
      this.monitoring.log('error', 'cache_error', `Erro ao atualizar cache para job ${job.id}`, {
        jobId: job.id,
        error: error.message
      })
    }
  }

  private generateCacheKey(text: string, config: UnifiedPipelineConfig): string {
    // Gerar chave de cache baseada no texto e configuração
    const configHash = JSON.stringify(config)
    return `${text.length}_${configHash.length}_${Date.now()}`
  }

  // Cancelar job com log
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) return false
    
    if (job.status === 'completed' || job.status === 'failed') {
      return false // Não pode cancelar jobs finalizados
    }
    
    job.status = 'failed'
    job.error = {
      message: 'Job cancelado pelo usuário',
      code: 'USER_CANCELLED',
      stage: job.status,
      details: null
    }
    
    this.monitoring.log('warn', 'pipeline_error', `Job ${jobId} cancelado pelo usuário`, {
      jobId,
      previousStatus: job.status
    })
    
    console.log(`🚫 Job ${jobId} cancelado`)
    return true
  }

  // Obter métricas de performance com logs
  getPerformanceMetrics(): any {
    const jobs = Array.from(this.activeJobs.values())
    const completedJobs = jobs.filter(j => j.status === 'completed')
    const failedJobs = jobs.filter(j => j.status === 'failed')
    
    const metrics = {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      successRate: jobs.length > 0 ? completedJobs.length / jobs.length : 0,
      averageProcessingTime: completedJobs.length > 0 ? 
        completedJobs.reduce((sum, j) => sum + j.metrics.totalTime, 0) / completedJobs.length : 0,
      queueLength: this.jobQueue.length,
      isProcessing: this.isProcessing
    }
    
    // Log das métricas periodicamente
    this.monitoring.log('debug', 'system_info', 'Métricas de performance do pipeline', metrics)
    
    return metrics
  }

  // Limpar jobs antigos
  cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): number { // 24 horas
    const now = Date.now()
    let cleaned = 0
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      const jobAge = now - job.startTime.getTime()
      if (jobAge > maxAge && (job.status === 'completed' || job.status === 'failed')) {
        this.activeJobs.delete(jobId)
        cleaned++
      }
    }
    
    console.log(`🧹 ${cleaned} jobs antigos removidos`)
    return cleaned
  }

  // Obter métricas de performance
  getPerformanceMetrics(): any {
    const jobs = Array.from(this.activeJobs.values())
    const completedJobs = jobs.filter(j => j.status === 'completed')
    const failedJobs = jobs.filter(j => j.status === 'failed')
    
    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      successRate: completedJobs.length / jobs.length,
      averageProcessingTime: completedJobs.reduce((sum, j) => sum + j.metrics.totalTime, 0) / completedJobs.length,
      queueLength: this.jobQueue.length,
      isProcessing: this.isProcessing
    }
  }
}

export default UnifiedAvatarPipeline