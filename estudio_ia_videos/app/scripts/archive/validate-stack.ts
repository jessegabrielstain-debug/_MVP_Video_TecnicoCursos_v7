// TODO: Archive script - fix types
/**
 * 🧪 TESTE RÁPIDO - Validação da Stack Completa
 * 
 * Este script valida:
 * - Prisma Client gerado
 * - Tipos PPTX disponíveis
 * - Serviços importáveis
 * - Estrutura de arquivos
 */

import { PrismaClient } from '@prisma/client'

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
}

async function validateStack() {
  console.log('\n' + '='.repeat(60))
  console.log('🧪 VALIDAÇÃO DA STACK COMPLETA')
  console.log('='.repeat(60) + '\n')

  let errors = 0
  let warnings = 0
  let success = 0

  // 1. Validar Prisma Client
  try {
    const prisma = new PrismaClient()
    log.success('Prisma Client instanciado')
    success++

    // Verificar se modelos existem
    if (prisma.pPTXBatchJob) {
      log.success('Modelo PPTXBatchJob disponível')
      success++
    } else {
      log.error('Modelo PPTXBatchJob não encontrado')
      errors++
    }

    if (prisma.pPTXProcessingJob) {
      log.success('Modelo PPTXProcessingJob disponível')
      success++
    } else {
      log.error('Modelo PPTXProcessingJob não encontrado')
      errors++
    }

    await prisma.$disconnect()
    log.success('Prisma Client desconectado')
    success++
  } catch (error) {
    log.error(`Erro ao validar Prisma: ${error}`)
    errors++
  }

  // 2. Validar imports dos serviços PPTX
  console.log('\n📦 Validando serviços PPTX...\n')

  try {
    const modules = [
      { name: 'auto-narration-service', path: './lib/pptx/auto-narration-service' },
      { name: 'animation-converter', path: './lib/pptx/animation-converter' },
      { name: 'batch-processor', path: './lib/pptx/batch-processor' },
      { name: 'layout-analyzer', path: './lib/pptx/layout-analyzer' },
      { name: 'batch-db-service', path: './lib/pptx/batch-db-service' }
    ]

    for (const module of modules) {
      try {
        await import(module.path)
        log.success(`Módulo ${module.name} disponível`)
        success++
      } catch (error) {
        log.error(`Módulo ${module.name} falhou: ${error}`)
        errors++
      }
    }
  } catch (error) {
    log.error(`Erro ao validar serviços: ${error}`)
    errors++
  }

  // 3. Validar estrutura de arquivos
  console.log('\n📁 Validando estrutura de arquivos...\n')

  const fs = await import('fs')
  const path = await import('path')

  const criticalFiles = [
    'lib/pptx/auto-narration-service.ts',
    'lib/pptx/animation-converter.ts',
    'lib/pptx/batch-processor.ts',
    'lib/pptx/layout-analyzer.ts',
    'lib/pptx/batch-db-service.ts',
    'lib/pptx/types/pptx-types.ts',
    'api/v1/pptx/process-advanced/route.ts',
    'components/pptx/BatchPPTXUpload.tsx',
    'prisma/schema.prisma',
    'scripts/test-pptx-advanced.ts',
    'scripts/setup-and-test.ps1'
  ]

  for (const file of criticalFiles) {
    const fullPath = path.join(process.cwd(), file)
    if (fs.existsSync(fullPath)) {
      log.success(`Arquivo ${file} encontrado`)
      success++
    } else {
      log.error(`Arquivo ${file} não encontrado`)
      errors++
    }
  }

  // 4. Validar variáveis de ambiente
  console.log('\n🔐 Validando variáveis de ambiente...\n')

  if (process.env.DATABASE_URL) {
    log.success('DATABASE_URL configurado')
    success++
  } else {
    log.warn('DATABASE_URL não configurado (esperado se ainda não configurou Supabase)')
    warnings++
  }

  if (process.env.DIRECT_DATABASE_URL) {
    log.success('DIRECT_DATABASE_URL configurado')
    success++
  } else {
    log.warn('DIRECT_DATABASE_URL não configurado')
    warnings++
  }

  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DA VALIDAÇÃO')
  console.log('='.repeat(60) + '\n')

  console.log(`${colors.green}✅ Sucessos: ${success}${colors.reset}`)
  console.log(`${colors.yellow}⚠️  Avisos: ${warnings}${colors.reset}`)
  console.log(`${colors.red}❌ Erros: ${errors}${colors.reset}`)

  console.log('\n' + '='.repeat(60) + '\n')

  if (errors === 0 && warnings <= 2) {
    log.success('SISTEMA PRONTO PARA USO! 🎉')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Configure Supabase: .\\scripts\\configure-supabase.ps1')
    console.log('   2. Execute testes: .\\scripts\\setup-and-test.ps1')
    console.log('   3. Inicie app: npm run dev\n')
    return 0
  } else if (errors === 0) {
    log.warn('Sistema OK, mas precisa configurar DATABASE_URL')
    console.log('\n📝 Execute: .\\scripts\\configure-supabase.ps1\n')
    return 0
  } else {
    log.error(`Sistema com ${errors} erro(s) crítico(s)`)
    console.log('\n📖 Consulte a documentação: GUIA_SUPABASE_SETUP.md\n')
    return 1
  }
}

// Executar validação
validateStack()
  .then(code => process.exit(code))
  .catch(error => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
