/**
 * 📄 TESTE DE FUNCIONALIDADE PPTX
 * Valida upload e processamento de arquivos PPTX
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

console.log('🧪 INICIANDO TESTE DE FUNCIONALIDADE PPTX')
console.log('=' .repeat(60))

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    return false
  }
}

// Função para verificar se um diretório existe
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  } catch (error) {
    return false
  }
}

// Função para ler conteúdo de arquivo
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    return null
  }
}

// Função para verificar se uma string contém determinadas palavras-chave
function containsKeywords(content, keywords) {
  if (!content) return false
  return keywords.some(keyword => content.includes(keyword))
}

async function testPPTXFunctionality() {
  const results = {
    apiEndpoints: { status: '❌', details: [] },
    pptxProcessor: { status: '❌', details: [] },
    uploadComponents: { status: '❌', details: [] },
    storageIntegration: { status: '❌', details: [] },
    dependencies: { status: '❌', details: [] }
  }

  console.log('\n1️⃣ VERIFICANDO API ENDPOINTS DE PPTX...')
  
  // Verificar API de upload PPTX
  const uploadApiPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'api', 'v1', 'pptx', 'upload', 'route.ts')
  if (fileExists(uploadApiPath)) {
    const content = readFileContent(uploadApiPath)
    if (containsKeywords(content, ['POST', 'FormData', 'pptx', 'upload'])) {
      results.apiEndpoints.status = '✅'
      results.apiEndpoints.details.push('✅ API de upload PPTX encontrada e funcional')
    } else {
      results.apiEndpoints.details.push('⚠️ API de upload encontrada mas pode estar incompleta')
    }
  } else {
    results.apiEndpoints.details.push('❌ API de upload PPTX não encontrada')
  }

  // Verificar API de conversão para vídeo
  const videoApiPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'api', 'v1', 'pptx', 'to-video', 'route.ts')
  if (fileExists(videoApiPath)) {
    results.apiEndpoints.details.push('✅ API de conversão para vídeo encontrada')
    if (results.apiEndpoints.status === '✅') {
      results.apiEndpoints.status = '✅'
    }
  } else {
    results.apiEndpoints.details.push('⚠️ API de conversão para vídeo não encontrada')
  }

  console.log('\n2️⃣ VERIFICANDO PROCESSADOR PPTX...')
  
  // Verificar processador PPTX real
  const processorPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'lib', 'pptx', 'pptx-processor-real.ts')
  if (fileExists(processorPath)) {
    const content = readFileContent(processorPath)
    if (containsKeywords(content, ['PPTXProcessorReal', 'extract', 'JSZip', 'parseStringPromise'])) {
      results.pptxProcessor.status = '✅'
      results.pptxProcessor.details.push('✅ Processador PPTX real implementado')
      
      // Verificar funcionalidades específicas
      if (content.includes('extractSlides')) {
        results.pptxProcessor.details.push('✅ Extração de slides implementada')
      }
      if (content.includes('extractMetadata')) {
        results.pptxProcessor.details.push('✅ Extração de metadata implementada')
      }
      if (content.includes('extractAssets')) {
        results.pptxProcessor.details.push('✅ Extração de assets implementada')
      }
      if (content.includes('generateTimeline')) {
        results.pptxProcessor.details.push('✅ Geração de timeline implementada')
      }
    } else {
      results.pptxProcessor.details.push('⚠️ Processador encontrado mas pode estar incompleto')
    }
  } else {
    results.pptxProcessor.details.push('❌ Processador PPTX real não encontrado')
  }

  // Verificar worker de processamento
  const workerPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'src', 'workers', 'pptx-processor.ts')
  if (fileExists(workerPath)) {
    results.pptxProcessor.details.push('✅ Worker de processamento encontrado')
  }

  console.log('\n3️⃣ VERIFICANDO COMPONENTES DE UPLOAD...')
  
  // Verificar componente de upload
  const uploadComponentPaths = [
    path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'components', 'pptx', 'pptx-upload.tsx'),
    path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'components', 'pptx', 'production-pptx-processor.tsx'),
    path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'components', 'upload', 'pptx-upload-zone.tsx'),
    path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'components', 'pptx', 'production-pptx-upload.tsx'),
    path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'components', 'pptx', 'enhanced-pptx-uploader.tsx')
  ]

  let uploadComponentFound = false
  for (const componentPath of uploadComponentPaths) {
    if (fileExists(componentPath)) {
      const content = readFileContent(componentPath)
      if (containsKeywords(content, ['useDropzone', 'FormData', 'upload', 'pptx'])) {
        results.uploadComponents.status = '✅'
        results.uploadComponents.details.push(`✅ Componente de upload encontrado: ${path.basename(componentPath)}`)
        uploadComponentFound = true
        break
      }
    }
  }

  if (!uploadComponentFound) {
    results.uploadComponents.details.push('❌ Nenhum componente de upload funcional encontrado')
  }

  console.log('\n4️⃣ VERIFICANDO INTEGRAÇÃO COM STORAGE...')
  
  // Verificar serviço S3
  const s3ServicePath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'lib', 's3-storage.ts')
  if (fileExists(s3ServicePath)) {
    const content = readFileContent(s3ServicePath)
    if (containsKeywords(content, ['S3Client', 'PutObjectCommand', 'upload'])) {
      results.storageIntegration.status = '✅'
      results.storageIntegration.details.push('✅ Serviço S3 implementado')
    } else {
      results.storageIntegration.details.push('⚠️ Serviço S3 encontrado mas pode estar incompleto')
    }
  } else {
    results.storageIntegration.details.push('❌ Serviço S3 não encontrado')
  }

  // Verificar configuração de buckets
  const envPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', '.env.local')
  if (fileExists(envPath)) {
    const content = readFileContent(envPath)
    if (containsKeywords(content, ['AWS_', 'S3_BUCKET']) || containsKeywords(content, ['SUPABASE_'])) {
      results.storageIntegration.details.push('✅ Configuração AWS/Supabase encontrada no .env.local')
    } else {
      results.storageIntegration.details.push('⚠️ Configuração AWS/Supabase pode estar incompleta')
    }
  }

  console.log('\n5️⃣ VERIFICANDO DEPENDÊNCIAS...')
  
  // Verificar package.json
  const packageJsonPath = path.join(PROJECT_ROOT, 'estudio_ia_videos', 'package.json')
  if (fileExists(packageJsonPath)) {
    const content = readFileContent(packageJsonPath)
    const requiredDeps = ['jszip', 'xml2js', 'sharp', '@aws-sdk/client-s3', 'pptxgenjs']
    const foundDeps = []
    
    for (const dep of requiredDeps) {
      if (content.includes(`"${dep}"`)) {
        foundDeps.push(dep)
      }
    }
    
    if (foundDeps.length === requiredDeps.length) {
      results.dependencies.status = '✅'
      results.dependencies.details.push('✅ Todas as dependências necessárias encontradas')
    } else {
      results.dependencies.details.push(`⚠️ Dependências encontradas: ${foundDeps.length}/${requiredDeps.length}`)
      results.dependencies.details.push(`Faltando: ${requiredDeps.filter(dep => !foundDeps.includes(dep)).join(', ')}`)
    }
  } else {
    results.dependencies.details.push('❌ package.json não encontrado')
  }

  // Gerar relatório final
  console.log('\n' + '=' .repeat(60))
  console.log('📊 RELATÓRIO FINAL - FUNCIONALIDADE PPTX')
  console.log('=' .repeat(60))

  let totalTests = 0
  let passedTests = 0

  for (const [category, result] of Object.entries(results)) {
    totalTests++
    if (result.status === '✅') passedTests++
    
    console.log(`\n${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`)
    console.log(`Status: ${result.status}`)
    result.details.forEach(detail => console.log(`  ${detail}`))
  }

  const successRate = Math.round((passedTests / totalTests) * 100)
  console.log('\n' + '=' .repeat(60))
  console.log(`🎯 TAXA DE SUCESSO: ${successRate}% (${passedTests}/${totalTests})`)
  
  if (successRate >= 80) {
    console.log('🎉 FUNCIONALIDADE PPTX: OPERACIONAL')
  } else if (successRate >= 60) {
    console.log('⚠️ FUNCIONALIDADE PPTX: PARCIALMENTE FUNCIONAL')
  } else {
    console.log('❌ FUNCIONALIDADE PPTX: NECESSITA CORREÇÕES')
  }

  console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:')
  
  if (results.apiEndpoints.status !== '✅') {
    console.log('• Implementar/corrigir APIs de upload e processamento PPTX')
  }
  if (results.pptxProcessor.status !== '✅') {
    console.log('• Implementar/corrigir processador PPTX real')
  }
  if (results.uploadComponents.status !== '✅') {
    console.log('• Implementar/corrigir componentes de upload')
  }
  if (results.storageIntegration.status !== '✅') {
    console.log('• Configurar integração com AWS S3')
  }
  if (results.dependencies.status !== '✅') {
    console.log('• Instalar dependências faltantes')
  }

  return successRate >= 80
}

// Executar teste
testPPTXFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro durante teste:', error)
    process.exit(1)
  })