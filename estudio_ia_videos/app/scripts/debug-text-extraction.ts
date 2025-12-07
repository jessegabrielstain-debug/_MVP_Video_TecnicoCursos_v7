/**
 * 🔍 Debug Text Extraction
 * Teste específico para verificar extração de texto
 */

import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
import { PPTXTextParser } from '../lib/pptx/parsers/text-parser'

async function debugTextExtraction() {
  console.log('🔍 DEBUGANDO EXTRAÇÃO DE TEXTO')
  console.log('=' .repeat(40))
  
  // 1. Criar PPTX simples
  console.log('📝 Criando PPTX simples...')
  const pptx = new PptxGenJS()
  const slide = pptx.addSlide()
  
  slide.addText('Título de Teste', {
    x: 1,
    y: 1,
    w: 8,
    h: 1,
    fontSize: 24,
    bold: true
  })
  
  slide.addText('Este é o conteúdo do slide de teste.', {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1,
    fontSize: 16
  })
  
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
  console.log(`✅ PPTX criado: ${buffer.length} bytes`)
  
  // 2. Abrir como ZIP
  console.log('\n📦 Abrindo como ZIP...')
  const zip = new JSZip()
  await zip.loadAsync(buffer)
  
  // 3. Listar arquivos
  console.log('\n📁 Arquivos no ZIP:')
  Object.keys(zip.files).forEach(filename => {
    console.log(`  - ${filename}`)
  })
  
  // 4. Verificar slide1.xml
  console.log('\n📄 Conteúdo do slide1.xml:')
  const slideFile = zip.file('ppt/slides/slide1.xml')
  if (slideFile) {
    const slideXml = await slideFile.async('text')
    console.log('Primeiros 500 caracteres:')
    console.log(slideXml.substring(0, 500))
    console.log('...')
  } else {
    console.log('❌ slide1.xml não encontrado!')
  }
  
  // 5. Testar parser
  console.log('\n🔧 Testando parser de texto...')
  try {
    const parser = new PPTXTextParser()
    const textResult = await parser.extractTextFromSlide(zip, 1)
    
    console.log('📊 Resultado do parser:')
    console.log(`- Sucesso: ${textResult.success}`)
    console.log(`- Texto plano: "${textResult.plainText}"`)
    // console.log(`- Texto formatado: "${textResult.formattedText}"`) // Removed as it doesn't exist
    console.log(`- Caixas de texto: ${textResult.textBoxes?.length || 0}`)
    console.log(`- Contagem de palavras: ${textResult.wordCount}`)
    console.log(`- Contagem de caracteres: ${textResult.characterCount}`)
    
    if (textResult.error) {
      console.log(`❌ Erro: ${textResult.error}`)
    }
    
    textResult.textBoxes?.forEach((box, index) => {
      console.log(`\n📝 Caixa de texto ${index + 1}:`)
      console.log(`  Texto: "${box.text}"`)
      if (box.position) {
        console.log(`  Posição: x=${box.position.x}, y=${box.position.y}`)
        console.log(`  Tamanho: w=${box.position.width}, h=${box.position.height}`)
      }
    })
    
  } catch (error) {
    console.error('💥 Erro no parser:', error)
  }
}

// Executar debug
if (require.main === module) {
  debugTextExtraction()
    .then(() => {
      console.log('\n🏁 Debug concluído!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

export { debugTextExtraction }