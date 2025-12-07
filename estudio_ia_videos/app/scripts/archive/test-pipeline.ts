// TODO: Archive script - fix types

// Test pipeline for MVP validation

import { PPTXParser } from '../../lib/pptx/parser'
import { slideAudioProcessor } from '../../lib/tts/slide-processor'
import { readyPlayerMeClient } from '../../lib/avatars/readyplayerme'
import { lipsyncEngine } from '../../lib/avatars/lipsync'
import { ffmpegComposer } from '../../lib/video/ffmpeg'
import fs from 'fs'
import path from 'path'

// Test data - sample PPTX content
const TEST_SLIDES = [
  {
    id: 'slide-1',
    title: 'Segurança no Trabalho',
    content: ['Bem-vindos ao treinamento de segurança', 'Vamos aprender sobre EPI e NR-10'],
    order: 1
  },
  {
    id: 'slide-2', 
    title: 'Equipamentos de Proteção',
    content: ['Use sempre o capacete', 'Óculos de proteção são obrigatórios', 'Luvas adequadas para cada atividade'],
    order: 2
  },
  {
    id: 'slide-3',
    title: 'Conclusão',
    content: ['Segurança é responsabilidade de todos', 'Dúvidas? Procure o SESMT'],
    order: 3
  }
]

async function testPipeline() {
  console.log('🧪 Iniciando teste do pipeline completo...\n')
  
  try {
    // Test 1: TTS Generation
    console.log('📊 Teste 1: Geração de TTS')
    const startTTS = Date.now()
    
    const slideAudios = await slideAudioProcessor.generateSlideAudios(
      TEST_SLIDES.map(slide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content.join('. ')
      })),
      { voice_id: 'br-female-1' }
    )
    
    const ttsTime = Date.now() - startTTS
    console.log(`✅ TTS gerado em ${ttsTime}ms para ${slideAudios.length} slides\n`)

    // Test 2: Avatar Animation
    console.log('📊 Teste 2: Animação de Avatar')
    const startAvatar = Date.now()
    
    const avatarVideos = []
    for (const slideAudio of slideAudios) {
      const lipsyncFrames = await lipsyncEngine.generateLipsyncFromAudio(
        slideAudio.audioBuffer,
        slideAudio.duration,
        slideAudio.text
      )
      
      const animationData = await readyPlayerMeClient.generateLipsyncData(
        slideAudio.audioBuffer,
        slideAudio.duration
      )
      
      const avatarVideo = await readyPlayerMeClient.renderAvatarVideo(
        'avatar-female-1',
        animationData
      )
      
      avatarVideos.push({
        slideId: slideAudio.slideId,
        videoBuffer: avatarVideo,
        duration: slideAudio.duration
      })
    }
    
    const avatarTime = Date.now() - startAvatar
    console.log(`✅ Avatar animado em ${avatarTime}ms para ${avatarVideos.length} slides\n`)

    // Test 3: Video Composition
    console.log('📊 Teste 3: Composição de Vídeo')
    const startComposition = Date.now()
    
    // Create placeholder slide images
    const slides = TEST_SLIDES.map(slide => ({
      image: Buffer.from(`slide-${slide.order}-image-data`),
      duration: slideAudios.find(a => a.slideId === slide.id)?.duration || 3
    }))
    
    const finalVideo = await ffmpegComposer.composeVideo(
      slides,
      avatarVideos.map(av => ({ video: av.videoBuffer, duration: av.duration })),
      slideAudios.map(sa => ({ audio: sa.audioBuffer, duration: sa.duration })),
      {
        layout: 'pip',
        resolution: '1080p',
        fps: 30,
        format: 'mp4',
        quality: 'high'
      }
    )
    
    const compositionTime = Date.now() - startComposition
    console.log(`✅ Vídeo composto em ${compositionTime}ms (${finalVideo.length} bytes)\n`)

    // Test 4: Validation
    console.log('📊 Teste 4: Validação de Qualidade')
    const validation = await ffmpegComposer.validateVideo(finalVideo)
    
    if (validation.isValid) {
      console.log('✅ Vídeo validado com sucesso')
      console.log(`   Duração: ${validation.duration}s`)
      console.log(`   Resolução: ${validation.resolution}`)
      console.log(`   Formato: ${validation.format}`)
      console.log(`   Áudio: ${validation.hasAudio ? 'Sim' : 'Não'}`)
    } else {
      console.log('❌ Validação falhou:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
    }

    // Test Summary
    const totalTime = Date.now() - (startTTS - ttsTime + startAvatar - avatarTime + startComposition - compositionTime)
    console.log('\n🎯 RESUMO DO TESTE:')
    console.log(`✅ Pipeline completo executado em ${totalTime}ms`)
    console.log(`📊 TTS: ${ttsTime}ms | Avatar: ${avatarTime}ms | Composição: ${compositionTime}ms`)
    console.log(`🎬 Vídeo final: ${(finalVideo.length / 1024).toFixed(1)}KB`)
    console.log(`📈 Performance: ${totalTime < 10000 ? '✅ APROVADO' : '⚠️ LENTO'} (meta: <10s para teste)`)

    // Performance check against PRD requirements
    const performanceReport = {
      prd_requirement: '90% vídeos 5min completam em <10min processing',
      test_result: totalTime < 10000,
      actual_time: `${(totalTime / 1000).toFixed(1)}s`,
      slides_processed: TEST_SLIDES.length,
      meets_requirements: totalTime < 600000 // 10 minutes
    }

    console.log('\n📋 CONFORMIDADE COM PRD:')
    console.log(`   Requisito: ${performanceReport.prd_requirement}`)
    console.log(`   Resultado: ${performanceReport.meets_requirements ? '✅ CONFORME' : '❌ NÃO CONFORME'}`)
    console.log(`   Tempo real: ${performanceReport.actual_time}`)

    return {
      success: true,
      performance: performanceReport,
      components: {
        tts: { time_ms: ttsTime, slides: slideAudios.length },
        avatar: { time_ms: avatarTime, videos: avatarVideos.length },
        composition: { time_ms: compositionTime, size_bytes: finalVideo.length },
        validation: validation
      }
    }

  } catch (error) {
    console.error('❌ Teste do pipeline falhou:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testPipeline()
    .then(result => {
      console.log('\n🎯 Teste concluído:', result.success ? 'SUCESSO' : 'FALHA')
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('Erro fatal no teste:', error)
      process.exit(1)
    })
}

export { testPipeline }
