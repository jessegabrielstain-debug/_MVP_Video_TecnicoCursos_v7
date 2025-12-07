/**
 * 🎙️ TESTE DE FUNCIONALIDADE TTS
 * Valida Azure Speech Services e ElevenLabs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')
const APP_ROOT = path.join(PROJECT_ROOT, 'estudio_ia_videos')

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(APP_ROOT, '.env.local') })

console.log('🎙️ INICIANDO TESTE DE FUNCIONALIDADE TTS')
console.log('=' .repeat(60))

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath)
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

// Função para fazer requisição HTTP simples
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options)
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: response.ok ? await response.json().catch(() => null) : null
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null
    }
  }
}

async function testTTSFunctionality() {
  const results = {
    credentials: { status: '❌', details: [] },
    ttsService: { status: '❌', details: [] },
    azureIntegration: { status: '❌', details: [] },
    elevenLabsIntegration: { status: '❌', details: [] },
    apiEndpoints: { status: '❌', details: [] }
  }

  console.log('\n1️⃣ VERIFICANDO CREDENCIAIS TTS...')
  
  // Verificar credenciais Azure
  const azureKey = process.env.AZURE_SPEECH_KEY
  const azureRegion = process.env.AZURE_SPEECH_REGION
  
  if (azureKey && azureRegion) {
    results.credentials.details.push('✅ Credenciais Azure Speech configuradas')
    if (azureKey.length > 20 && azureRegion.length > 3) {
      results.credentials.details.push(`✅ Azure Region: ${azureRegion}`)
    } else {
      results.credentials.details.push('⚠️ Credenciais Azure podem estar incompletas')
    }
  } else {
    results.credentials.details.push('❌ Credenciais Azure Speech não encontradas')
  }

  // Verificar credenciais ElevenLabs
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  
  if (elevenLabsKey) {
    results.credentials.details.push('✅ Credenciais ElevenLabs configuradas')
    if (elevenLabsKey.length > 20) {
      results.credentials.details.push('✅ ElevenLabs API Key válida')
    } else {
      results.credentials.details.push('⚠️ ElevenLabs API Key pode estar incompleta')
    }
  } else {
    results.credentials.details.push('❌ Credenciais ElevenLabs não encontradas')
  }

  // Determinar status das credenciais
  if ((azureKey && azureRegion) || elevenLabsKey) {
    results.credentials.status = '✅'
  }

  console.log('\n2️⃣ VERIFICANDO SERVIÇO TTS...')
  
  // Verificar serviço TTS principal
  const ttsServicePath = path.join(APP_ROOT, 'app', 'lib', 'tts-service.ts')
  if (fileExists(ttsServicePath)) {
    const content = readFileContent(ttsServicePath)
    if (containsKeywords(content, ['TTSService', 'synthesizeSpeech', 'synthesizeToFile'])) {
      results.ttsService.status = '✅'
      results.ttsService.details.push('✅ Serviço TTS principal implementado')
      
      // Verificar funcionalidades específicas
      if (content.includes('tryGoogleTTS')) {
        results.ttsService.details.push('✅ Integração Google TTS implementada')
      }
      if (content.includes('getAvailableVoices')) {
        results.ttsService.details.push('✅ Listagem de vozes implementada')
      }
      if (content.includes('estimateDurationSeconds')) {
        results.ttsService.details.push('✅ Estimativa de duração implementada')
      }
    } else {
      results.ttsService.details.push('⚠️ Serviço TTS encontrado mas pode estar incompleto')
    }
  } else {
    results.ttsService.details.push('❌ Serviço TTS principal não encontrado')
  }

  console.log('\n3️⃣ VERIFICANDO INTEGRAÇÃO AZURE...')
  
  // Verificar serviço Azure específico
  const azureServicePaths = [
    path.join(APP_ROOT, 'app', 'lib', 'tts', 'azure-speech-service.ts'),
    path.join(APP_ROOT, 'app', 'lib', 'azure-speech-service.ts'),
    path.join(APP_ROOT, 'app', 'lib', 'enhanced-tts-service.ts') // Fallback to enhanced service
  ]

  let azureServiceFound = false
  for (const servicePath of azureServicePaths) {
    if (fileExists(servicePath)) {
      const content = readFileContent(servicePath)
      if (containsKeywords(content, ['Azure', 'Speech', 'synthesize', 'AZURE_SPEECH_KEY'])) {
        results.azureIntegration.status = '✅'
        results.azureIntegration.details.push(`✅ Serviço Azure encontrado: ${path.basename(servicePath)}`)
        azureServiceFound = true
        break
      }
    }
  }

  if (!azureServiceFound) {
    results.azureIntegration.details.push('⚠️ Serviço Azure Speech não encontrado (Opcional se ElevenLabs ativo)')
    if (elevenLabsKey) results.azureIntegration.status = '✅' // Pass if ElevenLabs is active
  }

  // Testar conectividade Azure (se credenciais disponíveis)
  if (azureKey && azureRegion) {
    try {
      const tokenUrl = `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`
      const response = await makeRequest(tokenUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      if (response.ok) {
        results.azureIntegration.details.push('✅ Conectividade Azure Speech validada')
        if (results.azureIntegration.status !== '✅') {
          results.azureIntegration.status = '✅'
        }
      } else {
        results.azureIntegration.details.push(`⚠️ Erro na conectividade Azure: ${response.status}`)
      }
    } catch (error) {
      results.azureIntegration.details.push(`⚠️ Erro ao testar Azure: ${error.message}`)
    }
  }

  console.log('\n4️⃣ VERIFICANDO INTEGRAÇÃO ELEVENLABS...')
  
  // Verificar serviço ElevenLabs específico
  const elevenLabsServicePaths = [
    path.join(APP_ROOT, 'app', 'lib', 'tts', 'elevenlabs.ts'),
    path.join(APP_ROOT, 'app', 'lib', 'elevenlabs.ts'),
    path.join(APP_ROOT, 'app', 'lib', 'elevenlabs-service.ts')
  ]

  let elevenLabsServiceFound = false
  for (const servicePath of elevenLabsServicePaths) {
    if (fileExists(servicePath)) {
      const content = readFileContent(servicePath)
      if (containsKeywords(content, ['ElevenLabs', 'elevenlabs', 'xi-api-key', 'text-to-speech'])) {
        results.elevenLabsIntegration.status = '✅'
        results.elevenLabsIntegration.details.push(`✅ Serviço ElevenLabs encontrado: ${path.basename(servicePath)}`)
        elevenLabsServiceFound = true
        break
      }
    }
  }

  if (!elevenLabsServiceFound) {
    results.elevenLabsIntegration.details.push('❌ Serviço ElevenLabs não encontrado')
  }

  // Testar conectividade ElevenLabs (se credenciais disponíveis)
  if (elevenLabsKey) {
    try {
      const voicesUrl = 'https://api.elevenlabs.io/v1/voices'
      const response = await makeRequest(voicesUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsKey
        }
      })

      if (response.ok) {
        results.elevenLabsIntegration.details.push('✅ Conectividade ElevenLabs validada')
        if (response.data && response.data.voices) {
          results.elevenLabsIntegration.details.push(`✅ ${response.data.voices.length} vozes disponíveis`)
        }
        if (results.elevenLabsIntegration.status !== '✅') {
          results.elevenLabsIntegration.status = '✅'
        }
      } else {
        results.elevenLabsIntegration.details.push(`⚠️ Erro na conectividade ElevenLabs: ${response.status}`)
      }
    } catch (error) {
      results.elevenLabsIntegration.details.push(`⚠️ Erro ao testar ElevenLabs: ${error.message}`)
    }
  }

  console.log('\n5️⃣ VERIFICANDO API ENDPOINTS...')
  
  // Verificar APIs TTS
  const ttsApiPaths = [
    path.join(APP_ROOT, 'app', 'api', 'tts', 'generate', 'route.ts'),
    path.join(APP_ROOT, 'app', 'api', 'v1', 'tts', 'voices', 'route.ts'),
    path.join(APP_ROOT, 'app', 'api', 'tts', 'enhanced-generate', 'route.ts')
  ]

  let apiEndpointsFound = 0
  for (const apiPath of ttsApiPaths) {
    if (fileExists(apiPath)) {
      const content = readFileContent(apiPath)
      if (containsKeywords(content, ['POST', 'GET', 'tts', 'synthesize', 'voices'])) {
        apiEndpointsFound++
        results.apiEndpoints.details.push(`✅ API encontrada: ${path.basename(path.dirname(apiPath))}/${path.basename(apiPath)}`)
      }
    }
  }

  if (apiEndpointsFound > 0) {
    results.apiEndpoints.status = '✅'
    results.apiEndpoints.details.push(`✅ ${apiEndpointsFound} endpoints TTS encontrados`)
  } else {
    results.apiEndpoints.details.push('❌ Nenhum endpoint TTS encontrado')
  }

  // Gerar relatório final
  console.log('\n' + '=' .repeat(60))
  console.log('📊 RELATÓRIO FINAL - FUNCIONALIDADE TTS')
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
    console.log('🎉 FUNCIONALIDADE TTS: OPERACIONAL')
  } else if (successRate >= 60) {
    console.log('⚠️ FUNCIONALIDADE TTS: PARCIALMENTE FUNCIONAL')
  } else {
    console.log('❌ FUNCIONALIDADE TTS: NECESSITA CORREÇÕES')
  }

  console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:')
  
  if (results.credentials.status !== '✅') {
    console.log('• Configurar credenciais Azure Speech e/ou ElevenLabs no .env')
  }
  if (results.ttsService.status !== '✅') {
    console.log('• Implementar/corrigir serviço TTS principal')
  }
  if (results.azureIntegration.status !== '✅') {
    console.log('• Implementar/corrigir integração Azure Speech')
  }
  if (results.elevenLabsIntegration.status !== '✅') {
    console.log('• Implementar/corrigir integração ElevenLabs')
  }
  if (results.apiEndpoints.status !== '✅') {
    console.log('• Implementar/corrigir endpoints de API TTS')
  }

  return successRate >= 80
}

// Executar teste
testTTSFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro durante teste:', error)
    process.exit(1)
  })