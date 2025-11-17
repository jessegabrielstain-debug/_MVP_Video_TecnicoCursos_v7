/**
 * Script de Teste Completo - PPTX Advanced Features v2.1
 * 
 * Testa todas as funcionalidades:
 * 1. Auto Narration Service
 * 2. Animation Converter
 * 3. Batch Processor
 * 4. Layout Analyzer
 * 5. Database Service (Prisma)
 * 6. API Endpoints
 */

import { PrismaClient } from '@prisma/client'
import { PPTXBatchDBService } from '../lib/pptx/batch-db-service'
import { AutoNarrationService } from '../lib/pptx/auto-narration-service'
import { AnimationConverter } from '../lib/pptx/animation-converter'
import { LayoutAnalyzer } from '../lib/pptx/layout-analyzer'

type AnalyzeSlideInput = Parameters<LayoutAnalyzer['analyzeSlide']>[0]
type LayoutAnalysis = ReturnType<LayoutAnalyzer['analyzeSlide']>
type AnimationInput = Parameters<AnimationConverter['convertAnimation']>[0]
type ConvertedAnimation = ReturnType<AnimationConverter['convertAnimation']>
type ProcessingJobEntity = Awaited<ReturnType<typeof PPTXBatchDBService.createProcessingJob>>
type BatchJobEntity = Awaited<ReturnType<typeof PPTXBatchDBService.createBatchJob>>
type BatchStatistics = Awaited<ReturnType<typeof PPTXBatchDBService.getBatchStatistics>>

interface NarrationSlide {
  slideNumber: number
  title: string
  content: string
  slideNotes: string
  extractedText: string
}

type NarrationServiceWithExtraction = AutoNarrationService & {
  extractScriptFromSlide(slide: NarrationSlide): string
  cleanScript(script: string): string
}

type AsyncReturn<T extends (...args: unknown[]) => unknown> = Awaited<ReturnType<T>>

interface TestSuiteResults {
  database?: AsyncReturn<typeof testDatabaseService>
  layoutAnalyzer?: AsyncReturn<typeof testLayoutAnalyzer>
  animationConverter?: AsyncReturn<typeof testAnimationConverter>
  autoNarration?: AsyncReturn<typeof testAutoNarrationService>
  integration?: AsyncReturn<typeof testFullIntegration>
}

const prisma = new PrismaClient()

function createLayoutTestSlide(): AnalyzeSlideInput {
  const baseTimestamp = '2025-01-01T12:00:00.000Z'

  return {
    slideNumber: 1,
    title: 'Teste de Validação',
    content: 'Este é um teste de validação de qualidade de slides.',
    notes: 'Notas adicionais sobre o conteúdo do slide.',
    layout: 'content',
    backgroundType: 'solid',
    backgroundColor: '#FFFFFF',
    backgroundImage: undefined,
    backgroundVideo: undefined,
    images: [
      {
        id: 'image-hero',
        filename: 'image.jpg',
        originalName: 'image.jpg',
        path: 'assets/image.jpg',
        mimeType: 'image/jpeg',
        type: 'photo',
        size: 307200,
        dimensions: {
          width: 640,
          height: 480
        },
        extractedAt: baseTimestamp
      }
    ],
    shapes: [],
    textBoxes: [
      {
        id: 'title-text',
        text: 'Título Grande',
        position: {
          x: 100,
          y: 80,
          width: 800,
          height: 120
        },
        formatting: {
          fontFamily: 'Arial',
          fontSize: 32,
          fontWeight: '700',
          color: '#000000',
          alignment: 'center',
          lineHeight: 1.2
        },
        bulletPoints: false,
        listLevel: 0
      },
      {
        id: 'body-text',
        text: 'Texto pequeno que pode ser difícil de ler',
        position: {
          x: 120,
          y: 240,
          width: 780,
          height: 200
        },
        formatting: {
          fontFamily: 'Arial',
          fontSize: 10,
          color: '#999999',
          alignment: 'left',
          lineHeight: 1.4
        },
        bulletPoints: true,
        listLevel: 0
      }
    ],
    charts: [],
    tables: [],
    smartArt: [],
    animations: [],
    hyperlinks: [],
    duration: 45,
    estimatedReadingTime: 30,
    wordCount: 85,
    characterCount: 420
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`)
}

function logError(message: string) {
  console.log(`❌ ${message}`)
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`)
}

// ============================================================================
// TESTE 1: DATABASE SERVICE
// ============================================================================

async function testDatabaseService() {
  log('📦', 'TESTE 1: Database Service (Prisma)')
  console.log('━'.repeat(80))
  
  try {
    // 1.1 Criar batch job
    logInfo('Criando batch job...')
    const batchJob: BatchJobEntity = await PPTXBatchDBService.createBatchJob({
      userId: 'test_user_123',
      organizationId: 'test_org_456',
      batchName: 'Teste Batch - ' + new Date().toISOString(),
      totalFiles: 3,
      options: {
        maxConcurrent: 2,
        generateNarration: true,
        narrationOptions: {
          provider: 'azure',
          voice: 'pt-BR-FranciscaNeural',
          speed: 1.0,
          preferNotes: true
        }
      }
    })
    logSuccess(`Batch job criado: ${batchJob.id}`)
    
    // 1.2 Criar processing jobs
    logInfo('Criando processing jobs...')
    const jobs: ProcessingJobEntity[] = []
    for (let i = 0; i < 3; i++) {
      const job = await PPTXBatchDBService.createProcessingJob({
        batchJobId: batchJob.id,
        userId: 'test_user_123',
        filename: `test_file_${i + 1}.pptx`,
        originalSize: 1024000 + i * 100000
      })
      jobs.push(job)
      logSuccess(`Job ${i + 1} criado: ${job.id}`)
    }
    
    // 1.3 Atualizar batch job
    logInfo('Atualizando batch job para "processing"...')
    await PPTXBatchDBService.updateBatchJob(batchJob.id, {
      status: 'processing',
      progress: 0
    })
    logSuccess('Batch job atualizado')
    
    // 1.4 Simular progresso dos jobs
    logInfo('Simulando progresso dos jobs...')
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      
      // Job processing
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        status: 'processing',
        progress: 50,
        phase: 'extraction',
        slidesProcessed: 5,
        totalSlides: 10
      })
      
      // Job completed
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        status: 'completed',
        progress: 100,
        phase: 'complete',
        slidesProcessed: 10,
        totalSlides: 10,
        duration: 60000,
        narrationGenerated: true,
        qualityScore: 85 + i * 2,
        processingTime: 5000 + i * 1000
      })
      
      logSuccess(`Job ${i + 1} concluído`)
    }
    
    // 1.5 Atualizar batch job para completed
    logInfo('Finalizando batch job...')
    await PPTXBatchDBService.updateBatchJob(batchJob.id, {
      status: 'completed',
      progress: 100,
      completed: 3,
      failed: 0,
      totalSlides: 30,
      totalDuration: 180000,
      processingTime: 18000
    })
    logSuccess('Batch job finalizado')
    
    // 1.6 Obter estatísticas
    logInfo('Obtendo estatísticas...')
    const stats: BatchStatistics = await PPTXBatchDBService.getBatchStatistics(batchJob.id)
    console.log('\n📊 Estatísticas:')
    console.log('   Total de arquivos:', stats.batchJob.totalFiles)
    console.log('   Completos:', stats.batchJob.completed)
    console.log('   Falhas:', stats.batchJob.failed)
    console.log('   Total de slides:', stats.batchJob.totalSlides)
    console.log('   Tempo total:', stats.batchJob.processingTime, 'ms')
    
    // 1.7 Obter progresso
    logInfo('Obtendo progresso...')
    const progress = await PPTXBatchDBService.getBatchProgress(batchJob.id)
    console.log('\n📈 Progresso:')
    console.log('   Progresso geral:', progress.overallProgress + '%')
    console.log('   Jobs completos:', progress.summary.completed)
    console.log('   Jobs em andamento:', progress.summary.processing)
    
    // 1.8 Listar batch jobs do usuário
    logInfo('Listando batch jobs do usuário...')
    const { jobs: userJobs, total } = await PPTXBatchDBService.listUserBatchJobs(
      'test_user_123',
      { limit: 10 }
    )
    console.log(`\n📋 Encontrados ${total} batch jobs`)
    userJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.batchName} - Status: ${job.status}`)
    })
    
    // 1.9 Cleanup (opcional - comentado para manter dados de teste)
    // logInfo('Limpando dados de teste...')
    // await prisma.pPTXBatchJob.delete({ where: { id: batchJob.id } })
    // logSuccess('Dados limpos')
    
    console.log('\n' + '━'.repeat(80))
    logSuccess('TESTE 1 CONCLUÍDO COM SUCESSO!\n')
    
    return { batchJob, jobs }
    
  } catch (error) {
    logError('TESTE 1 FALHOU!')
    console.error(error)
    throw error
  }
}

// ============================================================================
// TESTE 2: LAYOUT ANALYZER
// ============================================================================

async function testLayoutAnalyzer() {
  log('🔍', 'TESTE 2: Layout Analyzer')
  console.log('━'.repeat(80))
  
  try {
    const analyzer = new LayoutAnalyzer()

    // Mock slide data
    const mockSlide = createLayoutTestSlide()

    // 2.1 Analisar slide
    logInfo('Analisando slide...')
    const result: LayoutAnalysis = analyzer.analyzeSlide(mockSlide)
    
    console.log('\n📊 Resultado da Análise:')
    console.log('   Score:', result.score + '/100')
    console.log('   Erros:', result.errors)
    console.log('   Avisos:', result.warnings)
    console.log('   Sugestões:', result.suggestions)
    console.log('   Issues encontrados:', result.issues.length)
    
    // Mostrar issues
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues Detectados:')
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity}] ${issue.category}: ${issue.message}`)
        if (issue.suggestion) {
          console.log(`      💡 Sugestão: ${issue.suggestion}`)
        }
      })
    }
    
    // 2.2 Auto-fix
    if (result.issues.length > 0) {
      logInfo('Tentando auto-fix...')
      const fixed = analyzer.autoFixIssues(result.issues)
      logSuccess(`${fixed} issues corrigidos automaticamente`)
    }
    
    // 2.3 Cálculo de contraste WCAG
    logInfo('Testando cálculo de contraste WCAG...')
    const contrastTests = [
      { fg: '#000000', bg: '#FFFFFF', expected: 21 },
      { fg: '#FFFFFF', bg: '#000000', expected: 21 },
      { fg: '#777777', bg: '#FFFFFF', expected: 4.5 },
      { fg: '#999999', bg: '#CCCCCC', expected: 2.5 },
    ]
    
    console.log('\n🎨 Testes de Contraste WCAG:')
    contrastTests.forEach(test => {
      const ratio = analyzer.calculateContrastRatio(test.fg, test.bg)
      const passes = ratio >= 4.5 ? '✅ PASSA' : '❌ FALHA'
      console.log(`   ${test.fg} / ${test.bg}: ${ratio.toFixed(2)}:1 ${passes}`)
    })
    
    console.log('\n' + '━'.repeat(80))
    logSuccess('TESTE 2 CONCLUÍDO COM SUCESSO!\n')
    
    return result
    
  } catch (error) {
    logError('TESTE 2 FALHOU!')
    console.error(error)
    throw error
  }
}

// ============================================================================
// TESTE 3: ANIMATION CONVERTER
// ============================================================================

async function testAnimationConverter() {
  log('🎬', 'TESTE 3: Animation Converter')
  console.log('━'.repeat(80))
  
  try {
    const converter = new AnimationConverter()
    
    // Mock animation data
    const mockAnimations: AnimationInput[] = [
      {
        id: 'anim-fade',
        type: 'entrance',
        effect: 'Fade',
        targetId: 'text1',
        targetType: 'text',
        trigger: 'on-click',
        duration: 1000,
        delay: 0
      },
      {
        id: 'anim-fly-in',
        type: 'entrance',
        effect: 'FlyIn',
        targetId: 'image1',
        targetType: 'image',
        trigger: 'with-previous',
        duration: 800,
        delay: 200,
        direction: 'from-left'
      },
      {
        id: 'anim-zoom',
        type: 'entrance',
        effect: 'Zoom',
        targetId: 'shape1',
        targetType: 'shape',
        trigger: 'after-previous',
        duration: 600,
        delay: 400
      },
      {
        id: 'anim-pulse',
        type: 'emphasis',
        effect: 'Pulse',
        targetId: 'text2',
        targetType: 'text',
        trigger: 'on-click',
        duration: 500,
        delay: 0
      },
      {
        id: 'anim-unsupported',
        type: 'entrance',
        effect: 'UnsupportedType',
        targetId: 'obj1',
        targetType: 'shape',
        trigger: 'on-click',
        duration: 1000,
        delay: 0
      }
    ]
    
    logInfo('Convertendo animações...')
    console.log(`\n🎬 Tentando converter ${mockAnimations.length} animações:\n`)
    
    let supportedCount = 0
    let unsupportedCount = 0
    
    for (const anim of mockAnimations) {
      const converted: ConvertedAnimation = converter.convertAnimation(anim)
      
      if (converted) {
        supportedCount++
        console.log(`   ✅ ${anim.type.padEnd(20)} → ${converted.keyframes.length} keyframes`)
      } else {
        unsupportedCount++
        console.log(`   ⚠️  ${anim.type.padEnd(20)} → Não suportado (fallback: fade)`)
      }
    }
    
    console.log(`\n📊 Resultado:`)
    console.log(`   Suportadas: ${supportedCount}`)
    console.log(`   Não suportadas: ${unsupportedCount}`)
    console.log(`   Taxa de conversão: ${Math.round((supportedCount / mockAnimations.length) * 100)}%`)
    
    console.log('\n' + '━'.repeat(80))
    logSuccess('TESTE 3 CONCLUÍDO COM SUCESSO!\n')
    
    return { supportedCount, unsupportedCount }
    
  } catch (error) {
    logError('TESTE 3 FALHOU!')
    console.error(error)
    throw error
  }
}

// ============================================================================
// TESTE 4: AUTO NARRATION SERVICE
// ============================================================================

async function testAutoNarrationService() {
  log('🎙️', 'TESTE 4: Auto Narration Service')
  console.log('━'.repeat(80))
  
  try {
    const service = new AutoNarrationService() as NarrationServiceWithExtraction
    
    // Mock slides data
    const mockSlides: NarrationSlide[] = [
      {
        slideNumber: 1,
        title: 'Introdução',
        content: 'Bem-vindo ao curso',
        slideNotes: 'Esta é uma introdução completa ao curso de segurança.',
        extractedText: 'Introdução ao Curso'
      },
      {
        slideNumber: 2,
        title: 'Objetivos',
        content: '• Objetivo 1\n• Objetivo 2\n• Objetivo 3',
        slideNotes: '',
        extractedText: 'Objetivos do Curso'
      }
    ]
    
    logInfo('Extraindo scripts das notas...')
    const scripts = mockSlides.map(slide => 
      service.extractScriptFromSlide(slide)
    )
    
    console.log('\n📝 Scripts Extraídos:\n')
    scripts.forEach((script, index) => {
      console.log(`   Slide ${index + 1}:`)
      console.log(`   "${script.substring(0, 60)}${script.length > 60 ? '...' : ''}"`)
      console.log()
    })
    
    logInfo('Limpando scripts...')
    const cleanedScripts = scripts.map(script => 
      service.cleanScript(script)
    )
    
    console.log('📋 Scripts Limpos:\n')
    cleanedScripts.forEach((script, index) => {
      console.log(`   Slide ${index + 1}: ${script.split(' ').length} palavras`)
    })
    
    console.log('\n' + '━'.repeat(80))
    logSuccess('TESTE 4 CONCLUÍDO COM SUCESSO!\n')
    logInfo('Nota: Geração real de TTS requer credenciais Azure/ElevenLabs')
    
    return { scripts, cleanedScripts }
    
  } catch (error) {
    logError('TESTE 4 FALHOU!')
    console.error(error)
    throw error
  }
}

// ============================================================================
// TESTE 5: INTEGRAÇÃO COMPLETA
// ============================================================================

async function testFullIntegration() {
  log('🚀', 'TESTE 5: Integração Completa')
  console.log('━'.repeat(80))
  
  try {
    logInfo('Simulando fluxo completo de processamento...')
    
    // 1. Criar batch job no DB
    const batchJob: BatchJobEntity = await PPTXBatchDBService.createBatchJob({
      userId: 'integration_test_user',
      batchName: 'Teste Integração - ' + new Date().toISOString(),
      totalFiles: 2,
      options: {
        maxConcurrent: 2,
        generateNarration: true,
        analyzeQuality: true
      }
    })
    logSuccess(`Batch job criado: ${batchJob.id}`)
    
    // 2. Criar jobs individuais
    const jobs: ProcessingJobEntity[] = []
    for (let i = 0; i < 2; i++) {
      const job = await PPTXBatchDBService.createProcessingJob({
        batchJobId: batchJob.id,
        userId: 'integration_test_user',
        filename: `integration_test_${i + 1}.pptx`,
        originalSize: 2048000 + i * 100000
      })
      jobs.push(job)
    }
    logSuccess(`${jobs.length} jobs criados`)
    
    // 3. Processar cada job
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      logInfo(`Processando job ${i + 1}/${jobs.length}: ${job.filename}`)
      
      // Fase 1: Upload
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        status: 'processing',
        phase: 'upload',
        progress: 10
      })
      
      // Fase 2: Extraction
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        phase: 'extraction',
        progress: 30,
        slidesProcessed: 3,
        totalSlides: 10
      })
      
      // Fase 3: Narration
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        phase: 'narration',
        progress: 60,
        narrationGenerated: true
      })
      
      // Fase 4: Quality
      const analyzer = new LayoutAnalyzer()
      const mockSlide = createLayoutTestSlide()
      const qualityResult: LayoutAnalysis = analyzer.analyzeSlide(mockSlide)
      
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        phase: 'quality',
        progress: 80,
        qualityAnalyzed: true,
        qualityScore: qualityResult.score,
        qualityData: qualityResult
      })
      
      // Fase 5: Complete
      await PPTXBatchDBService.updateProcessingJob(job.id, {
        status: 'completed',
        phase: 'complete',
        progress: 100,
        slidesProcessed: 10,
        totalSlides: 10,
        duration: 60000,
        processingTime: 8000 + i * 1000
      })
      
      logSuccess(`Job ${i + 1} concluído`)
    }
    
    // 4. Finalizar batch
    await PPTXBatchDBService.updateBatchJob(batchJob.id, {
      status: 'completed',
      progress: 100,
      completed: 2,
      failed: 0,
      totalSlides: 20,
      totalDuration: 120000,
      processingTime: 17000
    })
    logSuccess('Batch job finalizado')
    
    // 5. Obter estatísticas finais
    const stats: BatchStatistics = await PPTXBatchDBService.getBatchStatistics(batchJob.id)
    
    console.log('\n📊 Estatísticas Finais:')
    console.log('   Status:', stats.batchJob.status)
    console.log('   Arquivos processados:', stats.batchJob.completed)
    console.log('   Total de slides:', stats.batchJob.totalSlides)
    console.log('   Tempo total:', stats.batchJob.processingTime + 'ms')
    console.log('   Tempo médio por arquivo:', Math.round(stats.batchJob.processingTime! / stats.batchJob.completed) + 'ms')
    
    console.log('\n' + '━'.repeat(80))
    logSuccess('TESTE 5 CONCLUÍDO COM SUCESSO!\n')
    
    return { batchJob, jobs, stats }
    
  } catch (error) {
    logError('TESTE 5 FALHOU!')
    console.error(error)
    throw error
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 PPTX ADVANCED FEATURES v2.1 - SUITE DE TESTES COMPLETA')
  console.log('='.repeat(80) + '\n')
  
  const results: TestSuiteResults = {}
  
  try {
    // Teste 1: Database Service
    results.database = await testDatabaseService()
    
    // Teste 2: Layout Analyzer
    results.layoutAnalyzer = await testLayoutAnalyzer()
    
    // Teste 3: Animation Converter
    results.animationConverter = await testAnimationConverter()
    
    // Teste 4: Auto Narration Service
    results.autoNarration = await testAutoNarrationService()
    
    // Teste 5: Integração Completa
    results.integration = await testFullIntegration()
    
    // Resumo Final
    console.log('\n' + '='.repeat(80))
    console.log('🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!')
    console.log('='.repeat(80))
    
    console.log('\n📋 Resumo:')
    console.log('   ✅ Database Service - OK')
    console.log('   ✅ Layout Analyzer - OK')
    console.log('   ✅ Animation Converter - OK')
    console.log('   ✅ Auto Narration Service - OK')
    console.log('   ✅ Integração Completa - OK')
    
    console.log('\n💾 Dados de teste salvos no banco de dados')
    console.log('   Você pode visualizá-los com: npx prisma studio\n')
    
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ TESTES FALHARAM!')
    console.error('='.repeat(80))
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Execute if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

export { main as runTests }
