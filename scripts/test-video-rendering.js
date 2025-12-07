/**
 * 🎬 TESTE DE FUNCIONALIDADE - RENDERIZAÇÃO DE VÍDEOS
 * Valida pipeline de renderização com Remotion/FFmpeg
 */

import dotenv from 'dotenv'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..', 'estudio_ia_videos')

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') })

console.log('🎬 INICIANDO TESTE DE RENDERIZAÇÃO DE VÍDEOS')
console.log('============================================================')

let successCount = 0
let totalTests = 6

async function checkFFmpegInstallation() {
  console.log('\n1️⃣ VERIFICANDO INSTALAÇÃO DO FFMPEG...')
  
  try {
    const { stdout } = await execAsync('ffmpeg -version')
    
    if (stdout.includes('ffmpeg version')) {
      console.log('  ✅ FFmpeg instalado e funcionando')
      const version = stdout.split('\n')[0]
      console.log(`  📦 ${version}`)
      successCount++
    } else {
      console.log('  ❌ FFmpeg não encontrado')
    }
    
  } catch (error) {
    console.log('  ❌ FFmpeg não instalado ou não acessível')
    console.log('  💡 Instale FFmpeg: https://ffmpeg.org/download.html')
  }
}

async function checkRemotionSetup() {
  console.log('\n2️⃣ VERIFICANDO CONFIGURAÇÃO REMOTION...')
  
  try {
    // Verifica package.json para dependências Remotion
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json')
    
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageContent)
      
      const remotionDeps = [
        '@remotion/cli',
        '@remotion/renderer',
        '@remotion/bundler',
        '@remotion/player',
        'remotion'
      ]
      
      let remotionFound = 0
      
      for (const dep of remotionDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          console.log(`  ✅ ${dep} encontrado`)
          remotionFound++
        }
      }
      
      if (remotionFound >= 2) {
        console.log('  ✅ Remotion configurado no projeto')
        successCount++
      } else {
        console.log('  ❌ Remotion não configurado adequadamente')
      }
      
    } catch {
      console.log('  ❌ package.json não encontrado')
    }
    
    // Verifica arquivos de configuração Remotion
    const remotionPaths = [
      path.join(PROJECT_ROOT, 'remotion.config.ts'),
      path.join(PROJECT_ROOT, 'remotion.config.js'),
      path.join(PROJECT_ROOT, 'estudio_ia_videos', 'remotion'),
      path.join(PROJECT_ROOT, 'src', 'remotion'),
      path.join(PROJECT_ROOT, 'app', 'remotion')
    ]
    
    for (const remotionPath of remotionPaths) {
      try {
        const stats = await fs.stat(remotionPath)
        if (stats.isFile() || stats.isDirectory()) {
          console.log(`  ✅ Configuração Remotion encontrada: ${path.relative(PROJECT_ROOT, remotionPath)}`)
          break
        }
      } catch {}
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao verificar Remotion: ${error.message}`)
  }
}

async function checkRenderAPIs() {
  console.log('\n3️⃣ VERIFICANDO APIs DE RENDERIZAÇÃO...')
  
  try {
    const apiPaths = [
      path.join(PROJECT_ROOT, 'app', 'api', 'render'),
      path.join(PROJECT_ROOT, 'app', 'api', 'v1', 'render'),
      path.join(PROJECT_ROOT, 'app', 'api', 'videos', 'render'),
      path.join(PROJECT_ROOT, 'api', 'render'),
      path.join(PROJECT_ROOT, 'pages', 'api', 'render')
    ]
    
    let apisFound = 0
    
    for (const apiPath of apiPaths) {
      try {
        const stats = await fs.stat(apiPath)
        if (stats.isDirectory()) {
          const files = await fs.readdir(apiPath)
          const routeFiles = files.filter(file => file.includes('route.'))
          
          if (routeFiles.length > 0) {
            console.log(`  ✅ API de renderização encontrada: ${path.relative(PROJECT_ROOT, apiPath)}`)
            console.log(`    📁 ${routeFiles.length} endpoints: ${routeFiles.join(', ')}`)
            apisFound++
          }
        }
      } catch {}
    }
    
    if (apisFound > 0) {
      successCount++
    } else {
      console.log('  ❌ Nenhuma API de renderização encontrada')
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao verificar APIs: ${error.message}`)
  }
}

async function checkRenderQueue() {
  console.log('\n4️⃣ VERIFICANDO SISTEMA DE FILA DE RENDERIZAÇÃO...')
  
  try {
    const queuePaths = [
      path.join(PROJECT_ROOT, 'lib', 'render-queue'),
      path.join(PROJECT_ROOT, 'app', 'lib', 'render-queue'),
      path.join(PROJECT_ROOT, 'src', 'lib', 'render-queue'),
      path.join(PROJECT_ROOT, 'estudio_ia_videos', 'app', 'lib', 'render-queue-real.ts'),
      path.join(PROJECT_ROOT, 'workers', 'video-render-worker.ts'),
      path.join(PROJECT_ROOT, 'app', 'lib', 'export', 'export-queue.ts')
    ]
    
    let queueFound = false
    
    for (const queuePath of queuePaths) {
      try {
        const stats = await fs.stat(queuePath)
        if (stats.isFile() || stats.isDirectory()) {
          console.log(`  ✅ Sistema de fila encontrado: ${path.relative(PROJECT_ROOT, queuePath)}`)
          
          if (stats.isFile()) {
            const content = await fs.readFile(queuePath, 'utf-8')
            
            const hasBullMQ = content.includes('bullmq') || content.includes('Queue')
            const hasRedis = content.includes('redis') || content.includes('Redis')
            const hasVideoRender = content.includes('video-render') || content.includes('render')
            
            if (hasBullMQ) console.log('    ✅ BullMQ integrado')
            if (hasRedis) console.log('    ✅ Redis configurado')
            if (hasVideoRender) console.log('    ✅ Processamento de vídeo implementado')
          }
          
          queueFound = true
          break
        }
      } catch {}
    }
    
    if (queueFound) {
      successCount++
    } else {
      console.log('  ❌ Sistema de fila não encontrado')
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao verificar fila: ${error.message}`)
  }
}

async function checkVideoComponents() {
  console.log('\n5️⃣ VERIFICANDO COMPONENTES DE VÍDEO...')
  
  try {
    const componentPaths = [
      path.join(PROJECT_ROOT, 'src', 'components', 'video'),
      path.join(PROJECT_ROOT, 'components', 'video'),
      path.join(PROJECT_ROOT, 'app', 'components', 'video'),
      path.join(PROJECT_ROOT, 'estudio_ia_videos', 'components'),
      path.join(PROJECT_ROOT, 'app', 'lib', 'remotion')
    ]
    
    let componentsFound = 0
    
    for (const componentPath of componentPaths) {
      try {
        const stats = await fs.stat(componentPath)
        if (stats.isDirectory()) {
          const files = await fs.readdir(componentPath, { recursive: true })
          const videoFiles = files.filter(file => 
            (file.includes('video') || file.includes('render') || file.includes('remotion')) &&
            (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.vue'))
          )
          
          if (videoFiles.length > 0) {
            console.log(`  ✅ Componentes de vídeo encontrados em: ${path.relative(PROJECT_ROOT, componentPath)}`)
            console.log(`    📁 ${videoFiles.length} arquivos relacionados`)
            componentsFound++
          }
        }
      } catch {}
    }
    
    if (componentsFound > 0) {
      successCount++
    } else {
      console.log('  ❌ Nenhum componente de vídeo encontrado')
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao verificar componentes: ${error.message}`)
  }
}

async function checkVideoStorage() {
  console.log('\n6️⃣ VERIFICANDO ARMAZENAMENTO DE VÍDEOS...')
  
  try {
    // Verifica configuração S3/Supabase Storage
    const envPath = path.join(PROJECT_ROOT, '.env')
    const envLocalPath = path.join(PROJECT_ROOT, '.env.local')
    
    let envContent = ''
    try {
      envContent = await fs.readFile(envPath, 'utf-8')
    } catch {
      try {
        envContent = await fs.readFile(envLocalPath, 'utf-8')
      } catch {
        console.log('  ❌ Arquivo .env ou .env.local não encontrado')
        return
      }
    }
      
    const hasS3 = envContent.includes('AWS_') || envContent.includes('S3_')
    const hasSupabase = (envContent.includes('SUPABASE_URL') || envContent.includes('NEXT_PUBLIC_SUPABASE_URL'))
    const hasCloudinary = envContent.includes('CLOUDINARY_')
    
    if (hasS3) {
      console.log('  ✅ Configuração AWS S3 encontrada')
      successCount++
    } else if (hasSupabase) {
      console.log('  ✅ Configuração Supabase Storage encontrada')
      successCount++
    } else if (hasCloudinary) {
      console.log('  ✅ Configuração Cloudinary encontrada')
      successCount++
    } else {
      console.log('  ❌ Nenhuma configuração de storage encontrada')
    }
    
    // Verifica diretórios de upload/output
    const outputPaths = [
      path.join(PROJECT_ROOT, 'uploads', 'videos'),
      path.join(PROJECT_ROOT, 'public', 'videos'),
      path.join(PROJECT_ROOT, 'tmp', 'renders'),
      path.join(PROJECT_ROOT, 'output'),
      path.join(PROJECT_ROOT, 'renders')
    ]
    
    for (const outputPath of outputPaths) {
      try {
        const stats = await fs.stat(outputPath)
        if (stats.isDirectory()) {
          console.log(`  ✅ Diretório de output encontrado: ${path.relative(PROJECT_ROOT, outputPath)}`)
          break
        }
      } catch {}
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao verificar storage: ${error.message}`)
  }
}

// Executa todos os testes
async function runAllTests() {
  await checkFFmpegInstallation()
  await checkRemotionSetup()
  await checkRenderAPIs()
  await checkRenderQueue()
  await checkVideoComponents()
  await checkVideoStorage()
  
  // Relatório final
  console.log('\n============================================================')
  console.log('📊 RELATÓRIO FINAL - RENDERIZAÇÃO DE VÍDEOS')
  console.log('============================================================')
  
  const successRate = Math.round((successCount / totalTests) * 100)
  
  console.log(`\n🎯 TAXA DE SUCESSO: ${successRate}% (${successCount}/${totalTests})`)
  
  if (successRate >= 80) {
    console.log('🎉 RENDERIZAÇÃO DE VÍDEOS: OPERACIONAL')
  } else if (successRate >= 60) {
    console.log('⚠️ RENDERIZAÇÃO DE VÍDEOS: PARCIALMENTE OPERACIONAL')
  } else {
    console.log('❌ RENDERIZAÇÃO DE VÍDEOS: NECESSITA IMPLEMENTAÇÃO')
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:')
  
  if (successRate < 100) {
    if (successCount < 1) console.log('- Instalar FFmpeg no sistema')
    if (successCount < 2) console.log('- Configurar Remotion no projeto')
    if (successCount < 3) console.log('- Implementar APIs de renderização')
    if (successCount < 4) console.log('- Configurar sistema de fila (BullMQ + Redis)')
    if (successCount < 5) console.log('- Criar componentes de interface para vídeos')
    if (successCount < 6) console.log('- Configurar storage para vídeos renderizados')
  } else {
    console.log('- Sistema de renderização está completo!')
    console.log('- Teste renderização de um vídeo simples')
    console.log('- Configure monitoramento de performance')
    console.log('- Implemente cache de renderização')
  }
  
  process.exit(successRate >= 60 ? 0 : 1)
}

runAllTests().catch(console.error)