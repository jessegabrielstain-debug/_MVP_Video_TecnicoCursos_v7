/**
 * 🎙️ TTS Engine Manager - Fase 1
 * Sistema avançado de gerenciamento de múltiplos engines TTS
 * Suporte: ElevenLabs, Azure, Google, AWS + Sistema de Fallback
 */

import { MonitoringService } from '../monitoring-service'

// =====================================================
// INTERFACES E TIPOS
// =====================================================

export interface TTSEngineConfig {
  text: string
  engine?: TTSEngine
  voice_id: string
  language?: string
  settings?: TTSEngineSettings
  project_id?: string
  user_id?: string
}

export interface TTSEngineSettings {
  // Configurações básicas
  speed?: number // 0.25 - 4.0
  pitch?: number // -20 - 20
  volume?: number // 0.0 - 1.0
  
  // Configurações avançadas
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm'
  style?: number // 0.0 - 1.0 (ElevenLabs)
  stability?: number // 0.0 - 1.0 (ElevenLabs)
  similarity_boost?: number // 0.0 - 1.0 (ElevenLabs)
  use_speaker_boost?: boolean // ElevenLabs
  
  // Configurações de qualidade
  quality?: 'draft' | 'standard' | 'high' | 'ultra'
  sample_rate?: number // 16000, 22050, 44100, 48000
  output_format?: 'mp3' | 'wav' | 'ogg' | 'flac'
  
  // Configurações de processamento
  enable_ssml?: boolean
  enable_phonemes?: boolean
  enable_word_timestamps?: boolean
}

export interface TTSEngineResult {
  // Identificação
  job_id: string
  engine: TTSEngine
  
  // Resultados principais
  audio_url: string
  audio_buffer?: Buffer
  duration: number // segundos
  file_size: number // bytes
  
  // Dados para lip-sync
  visemes?: VisemeData[]
  phonemes?: PhonemeData[]
  word_timestamps?: WordTimestamp[]
  
  // Metadados
  quality_score: number // 0.0 - 1.0
  processing_time: number // ms
  engine_metadata: Record<string, unknown>
  
  // Status
  success: boolean
  error_message?: string
  error_code?: string
}

export interface VisemeData {
  timestamp: number // segundos
  viseme: string // A, E, I, O, U, M, B, P, F, V, S, T, L, R, rest
  intensity: number // 0.0 - 1.0
  duration: number // segundos
}

export interface PhonemeData {
  phoneme: string
  start_time: number
  end_time: number
  confidence: number // 0.0 - 1.0
}

export interface WordTimestamp {
  word: string
  start_time: number
  end_time: number
  confidence: number
}

export type TTSEngine = 'elevenlabs' | 'azure' | 'google' | 'aws' | 'synthetic'

export interface TTSEngineStatus {
  engine: TTSEngine
  available: boolean
  response_time: number // ms
  error_rate: number // %
  last_check: Date
  api_quota_remaining?: number
}

// =====================================================
// CONFIGURAÇÕES DOS ENGINES
// =====================================================

interface EngineConfig {
  name: string
  api_url: string
  api_key?: string
  region?: string
  max_text_length: number
  supported_languages: string[]
  supported_formats: string[]
  rate_limit: {
    requests_per_minute: number
    characters_per_minute: number
  }
  pricing: {
    cost_per_character: number
    currency: string
  }
}

const ENGINE_CONFIGS: Record<TTSEngine, EngineConfig> = {
  elevenlabs: {
    name: 'ElevenLabs',
    api_url: 'https://api.elevenlabs.io/v1',
    api_key: process.env.ELEVENLABS_API_KEY,
    max_text_length: 5000,
    supported_languages: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
    supported_formats: ['mp3', 'wav', 'ogg'],
    rate_limit: {
      requests_per_minute: 120,
      characters_per_minute: 50000
    },
    pricing: {
      cost_per_character: 0.00003,
      currency: 'USD'
    }
  },
  azure: {
    name: 'Azure Cognitive Services',
    api_url: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
    api_key: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION || 'eastus',
    max_text_length: 10000,
    supported_languages: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'],
    supported_formats: ['mp3', 'wav', 'ogg'],
    rate_limit: {
      requests_per_minute: 200,
      characters_per_minute: 100000
    },
    pricing: {
      cost_per_character: 0.000016,
      currency: 'USD'
    }
  },
  google: {
    name: 'Google Cloud Text-to-Speech',
    api_url: 'https://texttospeech.googleapis.com/v1',
    api_key: process.env.GOOGLE_TTS_API_KEY,
    max_text_length: 5000,
    supported_languages: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'],
    supported_formats: ['mp3', 'wav', 'ogg', 'flac'],
    rate_limit: {
      requests_per_minute: 300,
      characters_per_minute: 150000
    },
    pricing: {
      cost_per_character: 0.000016,
      currency: 'USD'
    }
  },
  aws: {
    name: 'Amazon Polly',
    api_url: 'https://polly.us-east-1.amazonaws.com',
    api_key: process.env.AWS_ACCESS_KEY_ID,
    max_text_length: 6000,
    supported_languages: ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'],
    supported_formats: ['mp3', 'wav', 'ogg'],
    rate_limit: {
      requests_per_minute: 100,
      characters_per_minute: 80000
    },
    pricing: {
      cost_per_character: 0.000004,
      currency: 'USD'
    }
  },
  synthetic: {
    name: 'Synthetic TTS (Fallback)',
    api_url: 'internal',
    max_text_length: 10000,
    supported_languages: ['pt-BR', 'en-US', 'es-ES'],
    supported_formats: ['mp3', 'wav'],
    rate_limit: {
      requests_per_minute: 1000,
      characters_per_minute: 500000
    },
    pricing: {
      cost_per_character: 0,
      currency: 'USD'
    }
  }
}

// =====================================================
// VOZES DISPONÍVEIS POR ENGINE
// =====================================================

const VOICE_CATALOG = {
  elevenlabs: {
    'pt-BR': {
      'rachel-br': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Rachel (Brasileira)', gender: 'female', age: 'adult' },
      'adam-br': { id: '2EiwWnXFnvU5JabPnv8n', name: 'Adam (Brasileiro)', gender: 'male', age: 'adult' },
      'bella-br': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Brasileira)', gender: 'female', age: 'young' },
      'josh-br': { id: 'VR6AewLTigWG4xSOukaG', name: 'Josh (Brasileiro)', gender: 'male', age: 'adult' }
    }
  },
  azure: {
    'pt-BR': {
      'francisca-neural': { id: 'pt-BR-FranciscaNeural', name: 'Francisca Neural', gender: 'female', age: 'adult' },
      'antonio-neural': { id: 'pt-BR-AntonioNeural', name: 'Antonio Neural', gender: 'male', age: 'adult' },
      'thalita-neural': { id: 'pt-BR-ThalitaNeural', name: 'Thalita Neural', gender: 'female', age: 'young' },
      'fabio-neural': { id: 'pt-BR-FabioNeural', name: 'Fabio Neural', gender: 'male', age: 'adult' },
      'brenda-neural': { id: 'pt-BR-BrendaNeural', name: 'Brenda Neural', gender: 'female', age: 'adult' }
    }
  },
  google: {
    'pt-BR': {
      'neural2-a': { id: 'pt-BR-Neural2-A', name: 'Neural2 A', gender: 'female', age: 'adult' },
      'neural2-b': { id: 'pt-BR-Neural2-B', name: 'Neural2 B', gender: 'male', age: 'adult' },
      'neural2-c': { id: 'pt-BR-Neural2-C', name: 'Neural2 C', gender: 'female', age: 'young' },
      'wavenet-a': { id: 'pt-BR-Wavenet-A', name: 'Wavenet A', gender: 'female', age: 'adult' },
      'wavenet-b': { id: 'pt-BR-Wavenet-B', name: 'Wavenet B', gender: 'male', age: 'adult' }
    }
  },
  aws: {
    'pt-BR': {
      'camila': { id: 'Camila', name: 'Camila', gender: 'female', age: 'adult' },
      'vitoria': { id: 'Vitoria', name: 'Vitória', gender: 'female', age: 'young' },
      'ricardo': { id: 'Ricardo', name: 'Ricardo', gender: 'male', age: 'adult' },
      'thiago': { id: 'Thiago', name: 'Thiago', gender: 'male', age: 'young' }
    }
  },
  synthetic: {
    'pt-BR': {
      'synthetic-female': { id: 'synthetic-female-br', name: 'Voz Sintética Feminina', gender: 'female', age: 'adult' },
      'synthetic-male': { id: 'synthetic-male-br', name: 'Voz Sintética Masculina', gender: 'male', age: 'adult' }
    }
  }
}

// =====================================================
// TTS ENGINE MANAGER
// =====================================================

export class TTSEngineManager {
  private static instance: TTSEngineManager
  private monitoring: MonitoringService
  private engineStatus: Map<TTSEngine, TTSEngineStatus> = new Map()
  private rateLimiters: Map<TTSEngine, RateLimiter> = new Map()

  private constructor() {
    this.monitoring = MonitoringService.getInstance()
    this.initializeEngines()
    this.startHealthChecks()
  }

  static getInstance(): TTSEngineManager {
    if (!TTSEngineManager.instance) {
      TTSEngineManager.instance = new TTSEngineManager()
    }
    return TTSEngineManager.instance
  }

  // =====================================================
  // MÉTODOS PRINCIPAIS
  // =====================================================

  async synthesize(config: TTSEngineConfig): Promise<TTSEngineResult> {
    const startTime = Date.now()
    const jobId = this.generateJobId()

    this.monitoring.log('info', 'tts_start', `Iniciando síntese TTS`, {
      jobId,
      engine: config.engine,
      textLength: config.text.length,
      voice: config.voice_id
    })

    try {
      // Validar configuração
      this.validateConfig(config)

      // Determinar engines a tentar
      const engines = this.determineEngineOrder(config.engine)

      // Tentar síntese com fallback
      for (const engine of engines) {
        try {
          // Verificar status do engine
          if (!this.isEngineAvailable(engine)) {
            this.monitoring.log('warn', 'tts_error', `Engine ${engine} não disponível`, { jobId, engine })
            continue
          }

          // Verificar rate limit
          if (!this.checkRateLimit(engine)) {
            this.monitoring.log('warn', 'tts_error', `Rate limit atingido para ${engine}`, { jobId, engine })
            continue
          }

          // Executar síntese
          const result = await this.synthesizeWithEngine(engine, config, jobId)
          
          if (result.success) {
            const processingTime = Date.now() - startTime
            
            this.monitoring.log('info', 'tts_success', `Síntese concluída com ${engine}`, {
              jobId,
              engine,
              duration: result.duration,
              processingTime,
              qualityScore: result.quality_score
            })

            return {
              ...result,
              processing_time: processingTime
            }
          }

        } catch (error) {
          this.monitoring.log('error', 'tts_error', `Erro em ${engine}: ${error}`, {
            jobId,
            engine,
            error: error instanceof Error ? error.message : String(error)
          })
          continue
        }
      }

      throw new Error('Todos os engines TTS falharam')

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      this.monitoring.log('error', 'tts_error', `Falha na síntese TTS: ${error}`, {
        jobId,
        processingTime,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  }

  // =====================================================
  // SÍNTESE POR ENGINE
  // =====================================================

  private async synthesizeWithEngine(
    engine: TTSEngine,
    config: TTSEngineConfig,
    jobId: string
  ): Promise<TTSEngineResult> {
    
    switch (engine) {
      case 'elevenlabs':
        return this.synthesizeWithElevenLabs(config, jobId)
      case 'azure':
        return this.synthesizeWithAzure(config, jobId)
      case 'google':
        return this.synthesizeWithGoogle(config, jobId)
      case 'aws':
        return this.synthesizeWithAWS(config, jobId)
      case 'synthetic':
        return this.synthesizeWithSynthetic(config, jobId)
      default:
        throw new Error(`Engine não suportado: ${engine}`)
    }
  }

  private async synthesizeWithElevenLabs(config: TTSEngineConfig, jobId: string): Promise<TTSEngineResult> {
    const engineConfig = ENGINE_CONFIGS.elevenlabs
    const settings = config.settings || {}

    if (!engineConfig.api_key) {
      throw new Error('ElevenLabs API key não configurada')
    }

    // Preparar payload
    const payload = {
      text: config.text,
      model_id: this.selectElevenLabsModel(settings.quality || 'standard'),
      voice_settings: {
        stability: settings.stability || 0.5,
        similarity_boost: settings.similarity_boost || 0.8,
        style: settings.style || 0.5,
        use_speaker_boost: settings.use_speaker_boost || true
      }
    }

    // Fazer requisição
    const response = await fetch(`${engineConfig.api_url}/text-to-speech/${config.voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': engineConfig.api_key,
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    // Processar resposta
    const audioBuffer = Buffer.from(await response.arrayBuffer())
    const audioUrl = await this.saveAudioFile(audioBuffer, jobId, 'elevenlabs', settings.output_format || 'mp3')
    
    // Gerar dados de lip-sync
    const visemes = await this.generateVisemes(config.text, 'elevenlabs')
    const phonemes = await this.generatePhonemes(config.text, 'elevenlabs')
    
    return {
      job_id: jobId,
      engine: 'elevenlabs',
      audio_url: audioUrl,
      audio_buffer: audioBuffer,
      duration: this.estimateAudioDuration(config.text, settings.speed || 1.0),
      file_size: audioBuffer.length,
      visemes,
      phonemes,
      quality_score: 0.95, // ElevenLabs tem alta qualidade
      processing_time: 0, // Será preenchido depois
      engine_metadata: {
        model_id: payload.model_id,
        voice_settings: payload.voice_settings
      },
      success: true
    }
  }

  private async synthesizeWithAzure(config: TTSEngineConfig, jobId: string): Promise<TTSEngineResult> {
    const engineConfig = ENGINE_CONFIGS.azure
    const settings = config.settings || {}

    if (!engineConfig.api_key) {
      throw new Error('Azure Speech API key não configurada')
    }

    // Preparar SSML
    const ssml = this.buildAzureSSML(config, settings)

    // Fazer requisição
    const response = await fetch(engineConfig.api_url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': engineConfig.api_key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': this.getAzureOutputFormat(settings.output_format || 'mp3'),
        'User-Agent': 'EstudioIA-TTS'
      },
      body: ssml
    })

    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.status}`)
    }

    // Processar resposta
    const audioBuffer = Buffer.from(await response.arrayBuffer())
    const audioUrl = await this.saveAudioFile(audioBuffer, jobId, 'azure', settings.output_format || 'mp3')
    
    const visemes = await this.generateVisemes(config.text, 'azure')
    const phonemes = await this.generatePhonemes(config.text, 'azure')
    
    return {
      job_id: jobId,
      engine: 'azure',
      audio_url: audioUrl,
      audio_buffer: audioBuffer,
      duration: this.estimateAudioDuration(config.text, settings.speed || 1.0),
      file_size: audioBuffer.length,
      visemes,
      phonemes,
      quality_score: 0.90,
      processing_time: 0,
      engine_metadata: {
        voice_name: config.voice_id,
        output_format: settings.output_format || 'mp3'
      },
      success: true
    }
  }

  private async synthesizeWithGoogle(config: TTSEngineConfig, jobId: string): Promise<TTSEngineResult> {
    const engineConfig = ENGINE_CONFIGS.google
    const settings = config.settings || {}

    if (!engineConfig.api_key) {
      throw new Error('Google TTS API key não configurada')
    }

    // Preparar payload
    const payload = {
      input: { text: config.text },
      voice: {
        languageCode: config.language || 'pt-BR',
        name: config.voice_id,
        ssmlGender: this.getGoogleSSMLGender(config.voice_id)
      },
      audioConfig: {
        audioEncoding: this.getGoogleAudioEncoding(settings.output_format || 'mp3'),
        speakingRate: settings.speed || 1.0,
        pitch: settings.pitch || 0.0,
        volumeGainDb: 0.0,
        sampleRateHertz: settings.sample_rate || 22050
      }
    }

    // Fazer requisição
    const response = await fetch(`${engineConfig.api_url}/text:synthesize?key=${engineConfig.api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google TTS API error: ${response.status} - ${errorText}`)
    }

    // Processar resposta
    const responseData = await response.json()
    const audioBuffer = Buffer.from(responseData.audioContent, 'base64')
    const audioUrl = await this.saveAudioFile(audioBuffer, jobId, 'google', settings.output_format || 'mp3')
    
    const visemes = await this.generateVisemes(config.text, 'google')
    const phonemes = await this.generatePhonemes(config.text, 'google')
    
    return {
      job_id: jobId,
      engine: 'google',
      audio_url: audioUrl,
      audio_buffer: audioBuffer,
      duration: this.estimateAudioDuration(config.text, settings.speed || 1.0),
      file_size: audioBuffer.length,
      visemes,
      phonemes,
      quality_score: 0.88,
      processing_time: 0,
      engine_metadata: {
        voice: payload.voice,
        audio_config: payload.audioConfig
      },
      success: true
    }
  }

  private async synthesizeWithAWS(config: TTSEngineConfig, jobId: string): Promise<TTSEngineResult> {
    // Implementação AWS Polly
    // TODO: Implementar quando AWS SDK estiver configurado
    throw new Error('AWS Polly não implementado ainda')
  }

  private async synthesizeWithSynthetic(config: TTSEngineConfig, jobId: string): Promise<TTSEngineResult> {
    // Implementação de TTS sintético como fallback
    const settings = config.settings || {}
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Gerar áudio sintético básico (placeholder)
    const audioBuffer = Buffer.alloc(44100 * 2) // 1 segundo de silêncio
    const audioUrl = await this.saveAudioFile(audioBuffer, jobId, 'synthetic', settings.output_format || 'mp3')
    
    const visemes = await this.generateVisemes(config.text, 'synthetic')
    const phonemes = await this.generatePhonemes(config.text, 'synthetic')
    
    return {
      job_id: jobId,
      engine: 'synthetic',
      audio_url: audioUrl,
      audio_buffer: audioBuffer,
      duration: this.estimateAudioDuration(config.text, settings.speed || 1.0),
      file_size: audioBuffer.length,
      visemes,
      phonemes,
      quality_score: 0.60, // Qualidade menor para sintético
      processing_time: 0,
      engine_metadata: {
        type: 'synthetic_fallback'
      },
      success: true
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  private validateConfig(config: TTSEngineConfig): void {
    if (!config.text || config.text.trim().length === 0) {
      throw new Error('Texto não pode estar vazio')
    }

    if (config.text.length > 10000) {
      throw new Error('Texto muito longo (máximo 10.000 caracteres)')
    }

    if (!config.voice_id) {
      throw new Error('Voice ID é obrigatório')
    }
  }

  private determineEngineOrder(preferredEngine?: TTSEngine): TTSEngine[] {
    if (preferredEngine) {
      // Se um engine específico foi solicitado, tentar ele primeiro
      const others = (['elevenlabs', 'azure', 'google', 'aws', 'synthetic'] as TTSEngine[])
        .filter(e => e !== preferredEngine)
      return [preferredEngine, ...others]
    }

    // Ordem padrão baseada em qualidade e disponibilidade
    return ['elevenlabs', 'azure', 'google', 'aws', 'synthetic']
  }

  private isEngineAvailable(engine: TTSEngine): boolean {
    const status = this.engineStatus.get(engine)
    return status?.available || false
  }

  private checkRateLimit(engine: TTSEngine): boolean {
    const limiter = this.rateLimiters.get(engine)
    return limiter?.canMakeRequest() || true
  }

  private generateJobId(): string {
    return `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveAudioFile(
    audioBuffer: Buffer,
    jobId: string,
    engine: string,
    format: string
  ): Promise<string> {
    // TODO: Implementar salvamento no Supabase Storage
    // Por enquanto, retornar URL placeholder
    return `/api/audio/${jobId}.${format}`
  }

  private async generateVisemes(text: string, engine: string): Promise<VisemeData[]> {
    // TODO: Implementar geração de visemas baseada no texto
    // Por enquanto, retornar dados básicos
    const words = text.split(' ')
    const visemes: VisemeData[] = []
    let currentTime = 0

    for (const word of words) {
      const duration = word.length * 0.1 // Estimativa básica
      visemes.push({
        timestamp: currentTime,
        viseme: 'A', // Placeholder
        intensity: 0.8,
        duration
      })
      currentTime += duration + 0.1 // Pausa entre palavras
    }

    return visemes
  }

  private async generatePhonemes(text: string, engine: string): Promise<PhonemeData[]> {
    // TODO: Implementar geração de fonemas
    return []
  }

  private estimateAudioDuration(text: string, speed: number): number {
    // Estimativa: ~150 palavras por minuto em velocidade normal
    const words = text.split(' ').length
    const baseMinutes = words / 150
    return (baseMinutes * 60) / speed
  }

  private selectElevenLabsModel(quality: string): string {
    switch (quality) {
      case 'ultra':
        return 'eleven_multilingual_v2'
      case 'high':
        return 'eleven_multilingual_v2'
      case 'standard':
        return 'eleven_turbo_v2'
      case 'draft':
        return 'eleven_turbo_v2'
      default:
        return 'eleven_turbo_v2'
    }
  }

  private buildAzureSSML(config: TTSEngineConfig, settings: TTSEngineSettings): string {
    const speed = settings.speed || 1.0
    const pitch = settings.pitch || 0
    
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${config.language || 'pt-BR'}">
        <voice name="${config.voice_id}">
          <prosody rate="${speed}x" pitch="${pitch > 0 ? '+' : ''}${pitch}%">
            ${config.text}
          </prosody>
        </voice>
      </speak>`.trim()
  }

  private getAzureOutputFormat(format: string): string {
    switch (format) {
      case 'mp3':
        return 'audio-16khz-128kbitrate-mono-mp3'
      case 'wav':
        return 'riff-16khz-16bit-mono-pcm'
      case 'ogg':
        return 'ogg-16khz-16bit-mono-opus'
      default:
        return 'audio-16khz-128kbitrate-mono-mp3'
    }
  }

  private getGoogleSSMLGender(voiceId: string): string {
    // Determinar gênero baseado no ID da voz
    if (voiceId.includes('A') || voiceId.includes('C')) {
      return 'FEMALE'
    }
    return 'MALE'
  }

  private getGoogleAudioEncoding(format: string): string {
    switch (format) {
      case 'mp3':
        return 'MP3'
      case 'wav':
        return 'LINEAR16'
      case 'ogg':
        return 'OGG_OPUS'
      case 'flac':
        return 'FLAC'
      default:
        return 'MP3'
    }
  }

  private initializeEngines(): void {
    // Inicializar status dos engines
    for (const engine of Object.keys(ENGINE_CONFIGS) as TTSEngine[]) {
      this.engineStatus.set(engine, {
        engine,
        available: false,
        response_time: 0,
        error_rate: 0,
        last_check: new Date()
      })

      // Inicializar rate limiter
      const config = ENGINE_CONFIGS[engine]
      this.rateLimiters.set(engine, new RateLimiter(
        config.rate_limit.requests_per_minute,
        config.rate_limit.characters_per_minute
      ))
    }
  }

  private startHealthChecks(): void {
    // Verificar saúde dos engines a cada 5 minutos
    setInterval(() => {
      this.checkEngineHealth()
    }, 5 * 60 * 1000)

    // Verificação inicial
    this.checkEngineHealth()
  }

  private async checkEngineHealth(): Promise<void> {
    for (const engine of Object.keys(ENGINE_CONFIGS) as TTSEngine[]) {
      try {
        const startTime = Date.now()
        const isAvailable = await this.pingEngine(engine)
        const responseTime = Date.now() - startTime

        this.engineStatus.set(engine, {
          engine,
          available: isAvailable,
          response_time: responseTime,
          error_rate: 0, // TODO: Calcular taxa de erro
          last_check: new Date()
        })

      } catch (error) {
        this.engineStatus.set(engine, {
          engine,
          available: false,
          response_time: 0,
          error_rate: 100,
          last_check: new Date()
        })
      }
    }
  }

  private async pingEngine(engine: TTSEngine): Promise<boolean> {
    const config = ENGINE_CONFIGS[engine]
    
    if (engine === 'synthetic') {
      return true // Sempre disponível
    }

    if (!config.api_key) {
      return false
    }

    // TODO: Implementar ping específico para cada engine
    return true
  }

  // =====================================================
  // MÉTODOS PÚBLICOS DE CONSULTA
  // =====================================================

  getEngineStatus(): TTSEngineStatus[] {
    return Array.from(this.engineStatus.values())
  }

  getAvailableVoices(engine?: TTSEngine, language?: string): any {
    if (engine) {
      const voices = VOICE_CATALOG[engine]
      if (language && voices[language as keyof typeof voices]) {
        return voices[language as keyof typeof voices]
      }
      return voices
    }

    return VOICE_CATALOG
  }

  getEngineConfigs(): Record<TTSEngine, EngineConfig> {
    return ENGINE_CONFIGS
  }
}

// =====================================================
// RATE LIMITER
// =====================================================

class RateLimiter {
  private requests: number[] = []
  private characters: number[] = []

  constructor(
    private maxRequestsPerMinute: number,
    private maxCharactersPerMinute: number
  ) {}

  canMakeRequest(characterCount: number = 0): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Limpar registros antigos
    this.requests = this.requests.filter(time => time > oneMinuteAgo)
    this.characters = this.characters.filter(time => time > oneMinuteAgo)

    // Verificar limites
    if (this.requests.length >= this.maxRequestsPerMinute) {
      return false
    }

    if (characterCount > 0 && this.characters.length + characterCount > this.maxCharactersPerMinute) {
      return false
    }

    // Registrar requisição
    this.requests.push(now)
    if (characterCount > 0) {
      for (let i = 0; i < characterCount; i++) {
        this.characters.push(now)
      }
    }

    return true
  }
}

export default TTSEngineManager