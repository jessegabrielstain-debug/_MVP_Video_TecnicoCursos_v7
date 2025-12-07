// TODO: Script - fix types
// 🧪 Script de Teste - PPTX Processing Real
// FASE 1: Validação completa do sistema de processamento PPTX

import fs from 'fs'
import path from 'path'
import PptxGenJS from 'pptxgenjs'
import { parsePPTXAdvanced } from '../lib/pptx-parser-advanced'
import { PPTXProcessorReal } from '../lib/pptx/pptx-processor-real'

// Criar um PPTX de teste simples
async function createTestPPTX(): Promise<Buffer> {
  console.log('🔧 Criando PPTX de teste...')
  
  const pptx = new PptxGenJS()
  
  // Slide 1: Título
  const slide1 = pptx.addSlide()
  slide1.addText('Teste de Processamento PPTX', {
    x: 1,
    y: 1,
    w: 8,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '363636'
  })
  slide1.addText('Sistema Real de Extração de Conteúdo', {
    x: 1,
    y: 2.5,
    w: 8,
    h: 0.5,
    fontSize: 18,
    color: '666666'
  })

  // Slide 2: Conteúdo com lista
  const slide2 = pptx.addSlide()
  slide2.addText('Funcionalidades Testadas', {
    x: 1,
    y: 0.5,
    w: 8,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: '363636'
  })
  
  const listItems = [
    'Extração de texto real dos slides',
    'Processamento de imagens com Sharp',
    'Upload para S3 com URLs públicas',
    'Salvamento no banco PostgreSQL',
    'Geração de metadados completos'
  ]
  
  slide2.addText(listItems.map(item => `• ${item}`).join('\n'), {
    x: 1,
    y: 1.5,
    w: 8,
    h: 4,
    fontSize: 16,
    color: '444444'
  })

  // Slide 3: Dados técnicos
  const slide3 = pptx.addSlide()
  slide3.addText('Especificações Técnicas', {
    x: 1,
    y: 0.5,
    w: 8,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: '363636'
  })
  
  slide3.addText('Parser: PPTX Advanced Parser\nProcessamento: Sharp + JSZip\nArmazenamento: AWS S3\nBanco: PostgreSQL + Prisma', {
    x: 1,
    y: 1.5,
    w: 8,
    h: 3,
    fontSize: 14,
    color: '555555'
  })

  // Slide 4: Resultados esperados
  const slide4 = pptx.addSlide()
  slide4.addText('Resultados Esperados', {
    x: 1,
    y: 0.5,
    w: 8,
    h: 0.8,
    fontSize: 24,
    bold: true,
    color: '363636'
  })
  
  slide4.addText('✅ Extração de 4 slides\n✅ Textos extraídos corretamente\n✅ Metadados completos\n✅ Zero mocks no processo', {
    x: 1,
    y: 1.5,
    w: 8,
    h: 3,
    fontSize: 16,
    color: '2d5a27'
  })

  // Gerar buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
  console.log(`✅ PPTX de teste criado: ${buffer.length} bytes`)
  
  return buffer
}

// Testar parser avançado
async function testAdvancedParser(buffer: Buffer) {
  console.log('\n🔍 Testando Parser Avançado...')
  
  try {
    const result = await parsePPTXAdvanced(buffer)
    
    console.log('📊 Resultados do Parser:')
    console.log(`- Slides extraídos: ${result.slides.length}`)
    // console.log(`- Imagens encontradas: ${result.images.length}`)
    console.log(`- Título: ${result.metadata.title || 'N/A'}`)
    console.log(`- Autor: ${result.metadata.author || 'N/A'}`)
    console.log(`- Data criação: ${result.metadata.createdAt || 'N/A'}`)
    
    // Mostrar conteúdo dos slides
    result.slides.forEach((slide, index) => {
      console.log(`\n📄 Slide ${slide.index}:`)
      console.log(`  Título: ${slide.title}`)
      const content = Array.isArray(slide.content) ? slide.content.join(' ') : slide.content
      console.log(`  Conteúdo: ${content.slice(0, 100)}...`)
      // console.log(`  Layout: ${slide.layout}`)
      console.log(`  Imagens: ${slide.images.length}`)
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Erro no parser avançado:', error)
    throw error
  }
}

// Testar processador completo
async function testCompleteProcessor(buffer: Buffer) {
  console.log('\n🚀 Testando Processador Completo...')
  
  try {
    const projectId = `test-${Date.now()}`
    
    const result = await PPTXProcessorReal.extract(buffer)
    
    console.log('\n📊 Resultados do Processador Completo:')
    console.log(`- Sucesso: ${result.success}`)
    console.log(`- Total de slides: ${result.slides.length}`)
    console.log(`- Duração estimada: ${result.timeline?.totalDuration || 0}s`)
    console.log(`- Blocos de texto: ${result.extractionStats?.textBlocks || 0}`)
    console.log(`- Imagens processadas: ${result.extractionStats?.images || 0}`)
    // console.log(`- Tempo de processamento: ${result.extractionStats.processingTime}ms`)
    
    // Mostrar detalhes dos slides
    result.slides.forEach((slide, index) => {
      console.log(`\n📄 Slide ${slide.slideNumber}:`)
      console.log(`  Título: ${slide.title}`)
      console.log(`  Conteúdo: ${slide.content.slice(0, 80)}...`)
      console.log(`  Duração: ${slide.duration}s`)
      console.log(`  Imagens: ${slide.images.length}`)
      console.log(`  Layout: ${slide.layout}`)
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Erro no processador completo:', error)
    throw error
  }
}

// Função principal de teste
async function runTests() {
  console.log('🧪 INICIANDO TESTES DO SISTEMA PPTX REAL')
  console.log('=' .repeat(50))
  
  try {
    // 1. Criar PPTX de teste
    const testBuffer = await createTestPPTX()
    
    // 2. Testar parser avançado
    const parserResult = await testAdvancedParser(testBuffer)
    
    // 3. Testar processador completo
    const processorResult = await testCompleteProcessor(testBuffer)
    
    // 4. Validar resultados
    console.log('\n✅ VALIDAÇÃO DOS RESULTADOS:')
    console.log('=' .repeat(30))
    
    const validations = [
      {
        test: 'Parser extraiu slides',
        result: parserResult.slides.length > 0,
        expected: 4,
        actual: parserResult.slides.length
      },
      {
        test: 'Processador extraiu slides',
        result: processorResult.slides.length > 0,
        expected: 4,
        actual: processorResult.slides.length
      },
      {
        test: 'Metadados extraídos',
        result: (parserResult.metadata.title?.length || 0) > 0,
        expected: 'string',
        actual: typeof parserResult.metadata.title
      },
      {
        test: 'Textos extraídos',
        result: (processorResult.extractionStats?.textBlocks || 0) > 0,
        expected: '> 0',
        actual: processorResult.extractionStats?.textBlocks
      },
      {
        test: 'Timeline gerada',
        result: (processorResult.timeline?.totalDuration || 0) > 0,
        expected: '> 0',
        actual: processorResult.timeline?.totalDuration
      }
    ]
    
    let passedTests = 0
    validations.forEach(validation => {
      const status = validation.result ? '✅' : '❌'
      console.log(`${status} ${validation.test}: ${validation.actual} (esperado: ${validation.expected})`)
      if (validation.result) passedTests++
    })
    
    console.log(`\n📊 RESULTADO FINAL: ${passedTests}/${validations.length} testes passaram`)
    
    if (passedTests === validations.length) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema PPTX está funcionando corretamente.')
    } else {
      console.log('⚠️ Alguns testes falharam. Verificar implementação.')
    }
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO NOS TESTES:', error)
    process.exit(1)
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n🏁 Testes concluídos!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { runTests, createTestPPTX, testAdvancedParser, testCompleteProcessor }