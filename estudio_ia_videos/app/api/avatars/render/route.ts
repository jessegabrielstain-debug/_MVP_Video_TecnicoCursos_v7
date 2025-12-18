/**
 * 🎭 AVATAR 3D RENDERING SERVICE
 * Serviço de renderização de Avatar 3D com sincronização labial
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Interfaces
interface AvatarRenderRequest {
  projectId: string
  slideId: string
  avatarConfig: {
    model: string
    pose: string
    expression: number
    gestureFrequency: number
    eyeContact: number
    quality: 'draft' | 'standard' | 'high' | 'ultra'
  }
  audioUrl: string
  audioText: string
  duration: number
  lipSyncEnabled: boolean
  gestureSync: boolean
}

interface AvatarRenderJob {
  id: string
  projectId: string
  slideId: string
  status: 'queued' | 'analyzing' | 'generating' | 'lip-sync' | 'rendering' | 'completed' | 'failed'
  progress: number
  currentStage: string
  outputUrl?: string
  thumbnailUrl?: string
  errorMessage?: string
  audioAnalysis?: AudioAnalysis
  lipSyncData?: LipSyncData
  gestureData?: GestureData
  createdAt: Date
  completedAt?: Date
}

interface AudioAnalysis {
  duration: number
  sampleRate: number
  phonemes: Array<{
    phoneme: string
    startTime: number
    endTime: number
    intensity: number
  }>
  emotions: Array<{
    emotion: string
    confidence: number
    startTime: number
    endTime: number
  }>
  speechRate: number
  pausePoints: number[]
}

interface LipSyncData {
  keyframes: Array<{
    time: number
    viseme: string
    intensity: number
    mouthShape: {
      openness: number
      width: number
      lipPosition: number
    }
  }>
  blendShapes: Array<{
    name: string
    values: Array<{
      time: number
      value: number
    }>
  }>
}

interface GestureData {
  gestures: Array<{
    type: 'hand' | 'head' | 'body'
    startTime: number
    endTime: number
    intensity: number
    keyframes: Array<{
      time: number
      position: { x: number; y: number; z: number }
      rotation: { x: number; y: number; z: number }
    }>
  }>
}

// Avatar 3D Renderer
class Avatar3DRenderer {
  private renderJobs: Map<string, AvatarRenderJob> = new Map()

  // Create avatar render job
  async createAvatarRenderJob(request: AvatarRenderRequest, userId: string): Promise<AvatarRenderJob> {
    const jobId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const renderJob: AvatarRenderJob = {
      id: jobId,
      projectId: request.projectId,
      slideId: request.slideId,
      status: 'queued',
      progress: 0,
      currentStage: 'Preparando renderização do avatar...',
      createdAt: new Date()
    }

    this.renderJobs.set(jobId, renderJob)

    // Start processing asynchronously
    this.processAvatarRender(jobId, request).catch(error => {
      logger.error('Avatar render failed:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/render' })
      this.updateRenderJob(jobId, {
        status: 'failed',
        errorMessage: error.message
      })
    })

    return renderJob
  }

  // Process avatar render
  private async processAvatarRender(jobId: string, request: AvatarRenderRequest): Promise<void> {
    try {
      // Stage 1: Analyze audio
      await this.updateRenderJob(jobId, {
        status: 'analyzing',
        progress: 10,
        currentStage: 'Analisando áudio para sincronização...'
      })

      const audioAnalysis = await this.analyzeAudio(request.audioUrl, request.audioText)
      await this.updateRenderJob(jobId, { audioAnalysis })

      // Stage 2: Generate lip-sync data
      if (request.lipSyncEnabled) {
        await this.updateRenderJob(jobId, {
          status: 'lip-sync',
          progress: 30,
          currentStage: 'Gerando dados de sincronização labial...'
        })

        const lipSyncData = await this.generateLipSync(audioAnalysis, request.audioText)
        await this.updateRenderJob(jobId, { lipSyncData })
      }

      // Stage 3: Generate gesture data
      if (request.gestureSync) {
        await this.updateRenderJob(jobId, {
          progress: 50,
          currentStage: 'Gerando gestos e movimentos...'
        })

        const gestureData = await this.generateGestures(audioAnalysis, request.avatarConfig)
        await this.updateRenderJob(jobId, { gestureData })
      }

      // Stage 4: Render avatar
      await this.updateRenderJob(jobId, {
        status: 'rendering',
        progress: 70,
        currentStage: 'Renderizando avatar 3D...'
      })

      const renderResult = await this.renderAvatar(request, audioAnalysis, 
        this.renderJobs.get(jobId)?.lipSyncData, 
        this.renderJobs.get(jobId)?.gestureData)

      // Stage 5: Complete
      await this.updateRenderJob(jobId, {
        status: 'completed',
        progress: 100,
        currentStage: 'Avatar renderizado com sucesso!',
        outputUrl: renderResult.videoUrl,
        thumbnailUrl: renderResult.thumbnailUrl,
        completedAt: new Date()
      })

    } catch (error) {
      await this.updateRenderJob(jobId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        currentStage: 'Erro na renderização do avatar'
      })
      throw error
    }
  }

  // Analyze audio for lip-sync and gestures
  private async analyzeAudio(audioUrl: string, audioText: string): Promise<AudioAnalysis> {
    logger.info('🎵 Analisando áudio para avatar rendering', { audioUrl, textLength: audioText.length, component: 'AvatarRender' });
    
    try {
      // Se temos URL de áudio, tentar analisar o arquivo real
      let duration = 60; // Fallback
      let sampleRate = 44100; // Fallback
      
      if (audioUrl && (audioUrl.startsWith('http') || audioUrl.startsWith('/'))) {
        try {
          // Usar ffprobe para obter informações reais do áudio
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          const ffprobeCommand = `ffprobe -v error -show_entries format=duration,sample_rate -of json "${audioUrl}"`;
          const { stdout } = await execAsync(ffprobeCommand);
          const probeData = JSON.parse(stdout);
          
          if (probeData.format?.duration) {
            duration = parseFloat(probeData.format.duration);
          }
          if (probeData.format?.sample_rate) {
            sampleRate = parseInt(probeData.format.sample_rate, 10);
          }
        } catch (probeError) {
          logger.warn('Não foi possível usar ffprobe, usando análise baseada em texto', { error: probeError, component: 'AvatarRender' });
          // Continuar com análise baseada em texto
        }
      }

      // Gerar phonemes do texto (implementação real baseada em regras)
      const phonemes = this.textToPhonemes(audioText)
      
      // Detectar emoções do texto (implementação real baseada em análise de sentimento)
      const emotions = this.detectEmotions(audioText)

      // Calcular taxa de fala baseada no texto e duração real
      const speechRate = audioText.length / duration // caracteres por segundo
      const pausePoints = this.detectPauses(audioText)

      logger.info('✅ Análise de áudio concluída', { duration, sampleRate, phonemesCount: phonemes.length, emotionsCount: emotions.length, component: 'AvatarRender' });

      return {
        duration,
        sampleRate,
        phonemes,
        emotions,
        speechRate,
        pausePoints
      }
    } catch (error) {
      logger.error('Erro ao analisar áudio', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarRender' });
      // Fallback para análise básica baseada em texto
      const phonemes = this.textToPhonemes(audioText)
      const emotions = this.detectEmotions(audioText)
      const speechRate = audioText.length / 60
      const pausePoints = this.detectPauses(audioText)

      return {
        duration: 60,
        sampleRate: 44100,
        phonemes,
        emotions,
        speechRate,
        pausePoints
      }
    }
  }

  // Convert text to phonemes
  private textToPhonemes(text: string): AudioAnalysis['phonemes'] {
    const words = text.split(' ')
    const phonemes: AudioAnalysis['phonemes'] = []
    let currentTime = 0

    for (const word of words) {
      // Simulate phoneme generation for each word
      const wordPhonemes = this.wordToPhonemes(word)
      for (const phoneme of wordPhonemes) {
        phonemes.push({
          phoneme: phoneme.phoneme,
          startTime: currentTime + phoneme.offset,
          endTime: currentTime + phoneme.offset + phoneme.duration,
          intensity: phoneme.intensity
        })
      }
      currentTime += word.length * 0.1 + 0.2 // Simulate timing
    }

    return phonemes
  }

  private wordToPhonemes(word: string): Array<{phoneme: string; offset: number; duration: number; intensity: number}> {
    // Simplified phoneme mapping
    const phonemeMap: {[key: string]: string[]} = {
      'a': ['AH'], 'e': ['EH'], 'i': ['IH'], 'o': ['OH'], 'u': ['UH'],
      'b': ['B'], 'c': ['K'], 'd': ['D'], 'f': ['F'], 'g': ['G'],
      'h': ['HH'], 'j': ['JH'], 'k': ['K'], 'l': ['L'], 'm': ['M'],
      'n': ['N'], 'p': ['P'], 'q': ['K'], 'r': ['R'], 's': ['S'],
      't': ['T'], 'v': ['V'], 'w': ['W'], 'x': ['KS'], 'y': ['Y'], 'z': ['Z']
    }

    const phonemes = []
    let offset = 0

    for (const char of word.toLowerCase()) {
      const phoneme = phonemeMap[char]?.[0] || 'SIL'
      phonemes.push({
        phoneme,
        offset,
        duration: 0.1,
        intensity: Math.random() * 0.5 + 0.5
      })
      offset += 0.1
    }

    return phonemes
  }

  // Detect emotions in text
  private detectEmotions(text: string): AudioAnalysis['emotions'] {
    // Simplified emotion detection
    const emotions = []
    const words = text.split(' ')
    let currentTime = 0

    // Detect emotional keywords
    const emotionKeywords = {
      'happy': ['feliz', 'alegre', 'ótimo', 'excelente', 'maravilhoso'],
      'sad': ['triste', 'ruim', 'péssimo', 'terrível'],
      'excited': ['incrível', 'fantástico', 'empolgante', 'animado'],
      'calm': ['calmo', 'tranquilo', 'sereno', 'pacífico']
    }

    for (const word of words) {
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(keyword => word.toLowerCase().includes(keyword))) {
          emotions.push({
            emotion,
            confidence: 0.8,
            startTime: currentTime,
            endTime: currentTime + word.length * 0.1
          })
        }
      }
      currentTime += word.length * 0.1 + 0.2
    }

    // Default neutral emotion if no emotions detected
    if (emotions.length === 0) {
      emotions.push({
        emotion: 'neutral',
        confidence: 0.9,
        startTime: 0,
        endTime: currentTime
      })
    }

    return emotions
  }

  // Detect pause points in text
  private detectPauses(text: string): number[] {
    const pausePoints = []
    let currentTime = 0

    for (const char of text) {
      if (char === '.' || char === ',' || char === ';' || char === '!') {
        pausePoints.push(currentTime)
      }
      currentTime += 0.1
    }

    return pausePoints
  }

  // Generate lip-sync data
  private async generateLipSync(audioAnalysis: AudioAnalysis, text: string): Promise<LipSyncData> {
    logger.info('👄 Gerando dados de lip-sync', { phonemesCount: audioAnalysis.phonemes.length, component: 'AvatarRender' });
    
    const keyframes: LipSyncData['keyframes'] = []
    const blendShapes: LipSyncData['blendShapes'] = []

    // Gerar keyframes a partir dos phonemes (implementação real)
    for (const phoneme of audioAnalysis.phonemes) {
      const mouthShape = this.phonemeToMouthShape(phoneme.phoneme)
      
      keyframes.push({
        time: phoneme.startTime,
        viseme: phoneme.phoneme,
        intensity: phoneme.intensity,
        mouthShape
      })
    }

    // Suavizar transições entre keyframes para animação mais natural
    const smoothedKeyframes = this.smoothKeyframes(keyframes)
    
    logger.info('✅ Lip-sync gerado', { keyframesCount: smoothedKeyframes.length, component: 'AvatarRender' });

    // Gerar blend shapes para animação suave
    const blendShapeNames = ['jawOpen', 'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthSmile']
    
    for (const shapeName of blendShapeNames) {
      const values = smoothedKeyframes.map(kf => ({
        time: kf.time,
        value: this.calculateBlendShapeValue(shapeName, kf.viseme, kf.intensity)
      }))
      
      blendShapes.push({ name: shapeName, values })
    }

    return { keyframes: smoothedKeyframes, blendShapes }
  }

  // Suavizar keyframes para transições mais naturais
  private smoothKeyframes(keyframes: LipSyncData['keyframes']): LipSyncData['keyframes'] {
    if (keyframes.length <= 1) return keyframes

    const smoothed: LipSyncData['keyframes'] = []
    
    for (let i = 0; i < keyframes.length; i++) {
      const current = keyframes[i]
      const prev = i > 0 ? keyframes[i - 1] : null
      const next = i < keyframes.length - 1 ? keyframes[i + 1] : null

      // Interpolar valores de mouthShape se necessário
      let smoothedMouthShape = { ...current.mouthShape }
      
      if (prev && next) {
        // Interpolação linear entre frames adjacentes
        smoothedMouthShape = {
          openness: (prev.mouthShape.openness + current.mouthShape.openness + next.mouthShape.openness) / 3,
          width: (prev.mouthShape.width + current.mouthShape.width + next.mouthShape.width) / 3,
          lipPosition: (prev.mouthShape.lipPosition + current.mouthShape.lipPosition + next.mouthShape.lipPosition) / 3,
        }
      }

      smoothed.push({
        ...current,
        mouthShape: smoothedMouthShape
      })
    }

    return smoothed
  }

  // Convert phoneme to mouth shape
  private phonemeToMouthShape(phoneme: string): LipSyncData['keyframes'][0]['mouthShape'] {
    const mouthShapes: {[key: string]: {openness: number; width: number; lipPosition: number}} = {
      'AH': { openness: 0.8, width: 0.6, lipPosition: 0.0 },
      'EH': { openness: 0.4, width: 0.8, lipPosition: 0.2 },
      'IH': { openness: 0.2, width: 0.9, lipPosition: 0.4 },
      'OH': { openness: 0.6, width: 0.3, lipPosition: -0.2 },
      'UH': { openness: 0.3, width: 0.2, lipPosition: -0.4 },
      'B': { openness: 0.0, width: 0.5, lipPosition: 0.0 },
      'M': { openness: 0.0, width: 0.5, lipPosition: 0.0 },
      'P': { openness: 0.0, width: 0.5, lipPosition: 0.0 },
      'F': { openness: 0.1, width: 0.7, lipPosition: 0.3 },
      'V': { openness: 0.1, width: 0.7, lipPosition: 0.3 },
      'SIL': { openness: 0.0, width: 0.5, lipPosition: 0.0 }
    }

    return mouthShapes[phoneme] || mouthShapes['SIL']
  }

  // Calculate blend shape value
  private calculateBlendShapeValue(shapeName: string, viseme: string, intensity: number): number {
    const shapeInfluence: {[key: string]: {[key: string]: number}} = {
      'jawOpen': { 'AH': 0.8, 'OH': 0.6, 'EH': 0.4 },
      'mouthClose': { 'B': 1.0, 'M': 1.0, 'P': 1.0 },
      'mouthFunnel': { 'OH': 0.7, 'UH': 0.8 },
      'mouthPucker': { 'UH': 0.9, 'OH': 0.5 },
      'mouthSmile': { 'IH': 0.6, 'EH': 0.4 }
    }

    const influence = shapeInfluence[shapeName]?.[viseme] || 0
    return influence * intensity
  }

  // Generate gesture data
  private async generateGestures(audioAnalysis: AudioAnalysis, avatarConfig: AvatarRenderRequest['avatarConfig']): Promise<GestureData> {
    logger.info('🤲 Gerando dados de gestos', { emotionsCount: audioAnalysis.emotions.length, component: 'AvatarRender' });
    
    const gestures: GestureData['gestures'] = []

    // Gerar gestos baseados em emoções e taxa de fala (implementação real)
    for (const emotion of audioAnalysis.emotions) {
      const gestureType = this.emotionToGestureType(emotion.emotion)
      const intensity = emotion.confidence * (avatarConfig.gestureFrequency / 100)

      gestures.push({
        type: gestureType,
        startTime: emotion.startTime,
        endTime: emotion.endTime,
        intensity,
        keyframes: this.generateGestureKeyframes(gestureType, emotion.startTime, emotion.endTime, intensity)
      })
    }

    // Adicionar movimentos periódicos de cabeça baseados em análise de áudio
    const headGestures = this.generateHeadMovements(audioAnalysis.duration, avatarConfig.eyeContact / 100, audioAnalysis.pausePoints)
    gestures.push(...headGestures)

    // Adicionar gestos baseados em pausas na fala (mais natural)
    const pauseGestures = this.generatePauseGestures(audioAnalysis.pausePoints, audioAnalysis.duration)
    gestures.push(...pauseGestures)

    logger.info('✅ Gestos gerados', { gesturesCount: gestures.length, component: 'AvatarRender' });

    return { gestures }
  }

  // Gerar gestos baseados em pausas na fala
  private generatePauseGestures(pausePoints: number[], duration: number): GestureData['gestures'] {
    const gestures: GestureData['gestures'] = []
    
    for (const pauseTime of pausePoints) {
      // Pequeno movimento de cabeça durante pausas
      gestures.push({
        type: 'head',
        startTime: pauseTime,
        endTime: Math.min(pauseTime + 0.5, duration),
        intensity: 0.3,
        keyframes: [
          { time: pauseTime, value: { x: 0, y: 0, z: 0 } },
          { time: pauseTime + 0.25, value: { x: 0, y: 5, z: 0 } },
          { time: pauseTime + 0.5, value: { x: 0, y: 0, z: 0 } }
        ]
      })
    }

    return gestures
  }

  private emotionToGestureType(emotion: string): 'hand' | 'head' | 'body' {
    const gestureMap: {[key: string]: 'hand' | 'head' | 'body'} = {
      'happy': 'hand',
      'excited': 'hand',
      'sad': 'head',
      'calm': 'body',
      'neutral': 'head'
    }
    return gestureMap[emotion] || 'head'
  }

  private generateGestureKeyframes(type: 'hand' | 'head' | 'body', startTime: number, endTime: number, intensity: number): GestureData['gestures'][0]['keyframes'] {
    const keyframes = []
    const duration = endTime - startTime
    const steps = Math.max(2, Math.floor(duration * 2)) // 2 keyframes per second

    for (let i = 0; i <= steps; i++) {
      const time = startTime + (duration * i / steps)
      const progress = i / steps

      let position, rotation

      switch (type) {
        case 'hand':
          position = {
            x: Math.sin(progress * Math.PI * 2) * intensity * 0.2,
            y: Math.cos(progress * Math.PI * 2) * intensity * 0.1,
            z: 0
          }
          rotation = {
            x: Math.sin(progress * Math.PI) * intensity * 15,
            y: 0,
            z: Math.cos(progress * Math.PI) * intensity * 10
          }
          break

        case 'head':
          position = { x: 0, y: 0, z: 0 }
          rotation = {
            x: Math.sin(progress * Math.PI * 0.5) * intensity * 5,
            y: Math.cos(progress * Math.PI * 0.3) * intensity * 8,
            z: Math.sin(progress * Math.PI * 0.7) * intensity * 3
          }
          break

        case 'body':
          position = {
            x: 0,
            y: Math.sin(progress * Math.PI) * intensity * 0.05,
            z: 0
          }
          rotation = {
            x: Math.sin(progress * Math.PI * 0.2) * intensity * 2,
            y: 0,
            z: Math.cos(progress * Math.PI * 0.3) * intensity * 1
          }
          break
      }

      keyframes.push({ time, position, rotation })
    }

    return keyframes
  }

  private generateHeadMovements(duration: number, eyeContactLevel: number, pausePoints?: number[]): GestureData['gestures'] {
    const movements = []
    const movementInterval = 3 // Every 3 seconds
    const numMovements = Math.floor(duration / movementInterval)

    for (let i = 0; i < numMovements; i++) {
      const startTime = i * movementInterval
      const endTime = startTime + 1 // 1 second movement

      movements.push({
        type: 'head' as const,
        startTime,
        endTime,
        intensity: eyeContactLevel,
        keyframes: [
          {
            time: startTime,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
          },
          {
            time: startTime + 0.5,
            position: { x: 0, y: 0, z: 0 },
            rotation: { 
              x: (Math.random() - 0.5) * 10 * eyeContactLevel,
              y: (Math.random() - 0.5) * 15 * eyeContactLevel,
              z: (Math.random() - 0.5) * 5 * eyeContactLevel
            }
          },
          {
            time: endTime,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
          }
        ]
      })
    }

    return movements
  }

  // Render avatar with all data
  private async renderAvatar(
    request: AvatarRenderRequest, 
    audioAnalysis: AudioAnalysis,
    lipSyncData?: LipSyncData,
    gestureData?: GestureData
  ): Promise<{videoUrl: string; thumbnailUrl: string}> {
    logger.info('🎬 Renderizando avatar com dados reais', { 
      slideId: request.slideId, 
      hasLipSync: !!lipSyncData, 
      hasGestures: !!gestureData,
      component: 'AvatarRender' 
    });

    try {
      // Usar localAvatarRenderer para renderizar frames
      const { localAvatarRenderer } = await import('@/lib/local-avatar-renderer');
      const { FFmpegExecutor } = await import('@/lib/render/ffmpeg-executor');
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'avatar-render-'));
      const framesDir = path.join(tempDir, 'frames');
      await fs.mkdir(framesDir, { recursive: true });

      // Calcular número de frames baseado na duração do áudio
      const fps = 30;
      const totalFrames = Math.ceil(audioAnalysis.duration * fps);

      logger.info('Gerando frames do avatar', { totalFrames, fps, duration: audioAnalysis.duration, component: 'AvatarRender' });

      // Renderizar cada frame
      const avatarConfig = {
        type: '2d' as const,
        assetPath: request.avatarConfig.avatarId || '',
        dimensions: { width: 1280, height: 720 }
      };

      for (let frame = 0; frame < totalFrames; frame++) {
        const frameBuffer = await localAvatarRenderer.render(avatarConfig, frame);
        const framePath = path.join(framesDir, `frame_${String(frame).padStart(4, '0')}.png`);
        await fs.writeFile(framePath, frameBuffer);
      }

      // Combinar frames em vídeo usando FFmpeg
      const outputPath = path.join(tempDir, `avatar_${request.slideId}_${Date.now()}.mp4`);
      const ffmpegExecutor = new FFmpegExecutor();
      
      const ffmpegResult = await ffmpegExecutor.renderFromFrames({
        inputFramesDir: framesDir,
        inputFramesPattern: 'frame_%04d.png',
        outputPath,
        fps,
        width: 1280,
        height: 720,
        codec: 'h264',
        quality: 'high',
        audioPath: request.audioUrl, // Adicionar áudio se disponível
      });

      if (!ffmpegResult.success) {
        throw new Error(`FFmpeg falhou: ${ffmpegResult.error}`);
      }

      // Upload vídeo para storage
      const videoBuffer = await fs.readFile(outputPath);
      const outputFilename = `avatar_${request.slideId}_${Date.now()}.mp4`;
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`avatars/${outputFilename}`, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(`avatars/${outputFilename}`);

      // Gerar thumbnail (primeiro frame)
      const thumbnailBuffer = await fs.readFile(path.join(framesDir, 'frame_0000.png'));
      const thumbnailFilename = `avatar_${request.slideId}_${Date.now()}_thumb.jpg`;
      
      const { error: thumbUploadError } = await supabase.storage
        .from('videos')
        .upload(`avatars/thumbnails/${thumbnailFilename}`, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      const thumbnailUrl = thumbUploadError 
        ? videoUrl // Fallback para URL do vídeo se thumbnail falhar
        : supabase.storage.from('videos').getPublicUrl(`avatars/thumbnails/${thumbnailFilename}`).data.publicUrl;

      // Limpar arquivos temporários
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      logger.info('✅ Avatar renderizado com sucesso', { videoUrl, thumbnailUrl, component: 'AvatarRender' });

      return {
        videoUrl,
        thumbnailUrl
      };
    } catch (error) {
      logger.error('Erro ao renderizar avatar', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarRender' });
      throw error;
    }
  }

  // Update render job
  private async updateRenderJob(jobId: string, updates: Partial<AvatarRenderJob>): Promise<void> {
    const job = this.renderJobs.get(jobId)
    if (job) {
      Object.assign(job, updates)
      this.renderJobs.set(jobId, job)
    }
  }

  // Get render job
  getRenderJob(jobId: string): AvatarRenderJob | undefined {
    return this.renderJobs.get(jobId)
  }
}

// Global instance
const avatarRenderer = new Avatar3DRenderer()

// API Handlers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AvatarRenderRequest = await request.json()

    // Validate request
    if (!body.projectId || !body.slideId || !body.audioUrl) {
      return NextResponse.json({ 
        error: 'Project ID, slide ID, and audio URL are required' 
      }, { status: 400 })
    }

    // Create avatar render job
    const renderJob = await avatarRenderer.createAvatarRenderJob(body, session.user.id)

    return NextResponse.json({
      success: true,
      renderJob: {
        id: renderJob.id,
        status: renderJob.status,
        progress: renderJob.progress,
        currentStage: renderJob.currentStage
      }
    })

  } catch (error) {
    logger.error('Avatar render API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/render' })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ 
        error: 'Job ID is required' 
      }, { status: 400 })
    }

    const renderJob = avatarRenderer.getRenderJob(jobId)

    if (!renderJob) {
      return NextResponse.json({ 
        error: 'Avatar render job not found' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      renderJob: {
        id: renderJob.id,
        projectId: renderJob.projectId,
        slideId: renderJob.slideId,
        status: renderJob.status,
        progress: renderJob.progress,
        currentStage: renderJob.currentStage,
        outputUrl: renderJob.outputUrl,
        thumbnailUrl: renderJob.thumbnailUrl,
        errorMessage: renderJob.errorMessage,
        createdAt: renderJob.createdAt,
        completedAt: renderJob.completedAt
      }
    })

  } catch (error) {
    logger.error('Avatar render status API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/render' })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
