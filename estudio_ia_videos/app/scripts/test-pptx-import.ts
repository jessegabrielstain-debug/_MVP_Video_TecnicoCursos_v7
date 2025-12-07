// TODO: Script - fix types
/**
 * 🧪 Script de Teste - Importação PPTX End-to-End
 * Testa todo o fluxo de processamento PPTX
 */

import fs from 'fs'
import path from 'path'
import { processPPTXFile, validatePPTXFile } from '../lib/pptx-processor'

// Mock File for Node.js environment
class NodeFile {
  name: string;
  size: number;
  lastModified: number;
  private buffer: Buffer;

  constructor(buffer: Buffer, name: string) {
    this.buffer = buffer;
    this.name = name;
    this.size = buffer.length;
    this.lastModified = Date.now();
  }

  async arrayBuffer() {
    return this.buffer.buffer.slice(this.buffer.byteOffset, this.buffer.byteOffset + this.buffer.byteLength);
  }
}

async function testPPTXImport() {
  console.log('🧪 Iniciando teste de importação PPTX...\n')

  try {
    // 1. Verificar se existe arquivo de teste
    const testFilesDir = path.join(process.cwd(), 'test-files')

    if (!fs.existsSync(testFilesDir)) {
      console.log('❌ Diretório test-files não encontrado')
      console.log('💡 Crie o diretório e adicione um arquivo .pptx para teste')
      console.log(`   Caminho esperado: ${testFilesDir}`)
      return
    }

    const pptxFiles = fs.readdirSync(testFilesDir).filter(f => f.endsWith('.pptx'))

    if (pptxFiles.length === 0) {
      console.log('❌ Nenhum arquivo .pptx encontrado em test-files/')
      console.log('💡 Adicione um arquivo .pptx para teste')
      return
    }

    const testFile = pptxFiles[0]
    const testFilePath = path.join(testFilesDir, testFile)

    console.log(`📄 Arquivo de teste: ${testFile}`)
    console.log(`📁 Caminho: ${testFilePath}\n`)

    // 2. Ler arquivo
    const buffer = fs.readFileSync(testFilePath)
    console.log(`✅ Arquivo lido: ${buffer.length} bytes\n`)
    
    const fileMock = new NodeFile(buffer, testFile) as unknown as File;

    // 3. Validar arquivo PPTX
    console.log('🔍 Validando estrutura do arquivo PPTX...')
    const validation = await validatePPTXFile(fileMock)

    if (!validation.valid) {
      console.log('❌ Arquivo PPTX inválido:')
      console.log(`   - ${validation.error}`)
      return
    }

    console.log('✅ Arquivo PPTX válido')
    console.log()

    // 4. Processar PPTX
    console.log('🔄 Processando PPTX...\n')

    const startTime = Date.now()
    let lastProgress = 0

    const result = await processPPTXFile(
      fileMock,
      'test-project-id',
      {
        extractImages: true,
        // extractVideos: true, // Not supported in options
        // extractAudio: true, // Not supported in options
        // generateThumbnails: false,
        // uploadToS3: false,
        // preserveAnimations: true,
        extractNotes: true,
        // detectLayouts: true,
        // estimateDurations: true,
        // extractHyperlinks: true,
        // maxImageSize: 1920,
        // imageQuality: 85
        extractFormatting: true
      },
      (progress) => {
        if (Math.floor(progress.progress) > lastProgress) {
          lastProgress = Math.floor(progress.progress)
          console.log(`📊 ${progress.stage}: ${lastProgress}% - ${progress.currentStep}`)
        }
      }
    )

    const processingTime = Date.now() - startTime

    // 5. Exibir resultados
    console.log('\n' + '='.repeat(60))
    console.log('✅ PROCESSAMENTO CONCLUÍDO')
    console.log('='.repeat(60) + '\n')

    if (!result.success) {
      console.log('❌ Erro no processamento:')
      console.log(`   ${result.error}\n`)
      return
    }

    if (result.metadata) {
        console.log('📋 METADADOS:')
        console.log(`   Título: ${result.metadata.title}`)
        console.log(`   Autor: ${result.metadata.author}`)
        console.log(`   Total de slides: ${result.metadata.slideCount}`)
        console.log(`   Nome arquivo: ${result.metadata.fileName}`)
        console.log(`   Tamanho: ${result.metadata.fileSize}\n`)
    }

    console.log('📊 ESTATÍSTICAS:')
    console.log(`   Slides processados: ${result.slides?.length}`)
    
    console.log('⏱️ PERFORMANCE:')
    console.log(`   Tempo de processamento: ${processingTime}ms`)
    if (result.slides?.length) {
        console.log(`   Tempo médio por slide: ${Math.round(processingTime / result.slides.length)}ms\n`)
    }

    console.log('📄 SLIDES:')
    result.slides?.forEach((slide, index) => {
      console.log(`\n   Slide ${index + 1}/${result.slides?.length}:`)
      console.log(`   ├─ Título: ${slide.title}`)
      // console.log(`   ├─ Layout: ${slide.layout}`)
      // console.log(`   ├─ Palavras: ${slide.wordCount}`)
      // console.log(`   ├─ Caracteres: ${slide.characterCount}`)
      console.log(`   ├─ Imagens: ${slide.images?.length}`)
      // console.log(`   ├─ Text boxes: ${slide.textBoxes.length}`)
      console.log(`   ├─ Duração estimada: ${slide.duration}ms`)
      // console.log(`   └─ Tempo de leitura: ${slide.estimatedReadingTime}s`)

      if (slide.content && slide.content.length > 0) {
        const preview = slide.content.substring(0, 100)
        console.log(`      Preview: "${preview}${slide.content.length > 100 ? '...' : ''}"`)
      }

      if (slide.notes && slide.notes.length > 0) {
        console.log(`      Notas: ${slide.notes.substring(0, 50)}...`)
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!')
    console.log('='.repeat(60) + '\n')

    // 6. Salvar resultado em JSON para análise
    const outputPath = path.join(testFilesDir, 'test-result.json')
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
    console.log(`💾 Resultado salvo em: ${outputPath}\n`)

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error)
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`)
      console.error(`   Stack: ${error.stack}`)
    }
  }
}

// Executar teste
testPPTXImport()
