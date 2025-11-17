// 🧪 Teste da API PPTX
// Teste completo via HTTP da API de processamento PPTX

import PptxGenJS from 'pptxgenjs'

interface ProcessedSlidePreview {
  slideNumber: number
  title: string
  content?: string
  images?: unknown[]
  duration?: number
}

async function testPPTXAPI() {
  console.log('🧪 TESTANDO API PPTX VIA HTTP')
  console.log('=' .repeat(40))
  
  try {
    // 1. Criar PPTX de teste
    console.log('📝 Criando PPTX de teste...')
    const pptx = new PptxGenJS()
    
    const slide1 = pptx.addSlide()
    slide1.addText('API Test - Slide 1', {
      x: 1, y: 1, w: 8, h: 1,
      fontSize: 24, bold: true
    })
    slide1.addText('Testando processamento real via API', {
      x: 1, y: 2.5, w: 8, h: 1,
      fontSize: 16
    })
    
    const slide2 = pptx.addSlide()
    slide2.addText('API Test - Slide 2', {
      x: 1, y: 1, w: 8, h: 1,
      fontSize: 24, bold: true
    })
    slide2.addText('Sistema funcionando sem mocks!', {
      x: 1, y: 2.5, w: 8, h: 1,
      fontSize: 16
    })
    
    const buffer = await pptx.write('nodebuffer') as Buffer
    console.log(`✅ PPTX criado: ${buffer.length} bytes`)
    
    // 2. Preparar FormData
    console.log('\n📤 Enviando para API...')
    const formData = new FormData()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    formData.append('file', blob, 'test-api.pptx')
    
    // 3. Fazer requisição
    const response = await fetch('http://localhost:3000/api/pptx/process', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token' // Token de teste
      }
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      
      console.log('\n✅ RESPOSTA DA API:')
      console.log(`- Sucesso: ${result.success}`)
      console.log(`- Project ID: ${result.projectId}`)
      console.log(`- Total slides: ${result.stats?.totalSlides}`)
      console.log(`- Total imagens: ${result.stats?.totalImages}`)
      console.log(`- Blocos de texto: ${result.stats?.totalTextBlocks}`)
      console.log(`- Duração estimada: ${result.stats?.estimatedDuration}s`)
      console.log(`- Tamanho do arquivo: ${result.stats?.fileSize} bytes`)
      console.log(`- Tempo de processamento: ${result.stats?.processingTime}ms`)
      
      if (result.slidesData && result.slidesData.length > 0) {
        console.log('\n📄 SLIDES PROCESSADOS:')
        result.slidesData.forEach((slide: ProcessedSlidePreview, index: number) => {
          console.log(`\nSlide ${slide.slideNumber}:`)
          console.log(`  Título: ${slide.title}`)
          console.log(`  Conteúdo: ${slide.content?.substring(0, 50)}...`)
          console.log(`  Imagens: ${slide.images?.length || 0}`)
          console.log(`  Duração: ${slide.duration}s`)
        })
      }
      
      console.log('\n🎉 TESTE DA API PASSOU!')
      return true
      
    } else {
      const error = await response.text()
      console.error(`❌ Erro na API: ${error}`)
      return false
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error)
    return false
  }
}

// Executar teste
if (require.main === module) {
  testPPTXAPI()
    .then((success) => {
      if (success) {
        console.log('\n🏁 Teste da API concluído com sucesso!')
        process.exit(0)
      } else {
        console.log('\n💥 Teste da API falhou!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { testPPTXAPI }