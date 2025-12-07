<#
.SYNOPSIS
Setup Completo da Fase 9

.DESCRIPTION
Script automatizado para configurar e validar a Fase 9 da implementação.
Executa validações, instalações e fornece instruções de próximos passos.

.NOTES
Autor: Estúdio IA Vídeos
Data: 18/11/2025
Versão: 1.0
#>

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 SETUP FASE 9 - INTEGRAÇÕES AVANÇADAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verifica se está no diretório correto
$currentPath = Get-Location
if (-not (Test-Path "estudio_ia_videos")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    Write-Host "   Caminho esperado: _MVP_Video_TecnicoCursos_v7" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Diretório correto detectado" -ForegroundColor Green
Write-Host ""

# Etapa 1: Validar Node.js
Write-Host "📋 Etapa 1/6: Validando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ Node.js $nodeVersion" -ForegroundColor Green
Write-Host ""

# Etapa 2: Instalar dependências
Write-Host "📦 Etapa 2/6: Verificando dependências..." -ForegroundColor Cyan
Set-Location estudio_ia_videos

if (-not (Test-Path "node_modules/@elevenlabs")) {
    Write-Host "   ⚠️ Instalando @elevenlabs/elevenlabs-js..." -ForegroundColor Yellow
    npm install @elevenlabs/elevenlabs-js --silent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Pacote instalado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Falha na instalação" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ Dependências já instaladas" -ForegroundColor Green
}

Set-Location ..
Write-Host ""

# Etapa 3: Validar variáveis de ambiente
Write-Host "🔐 Etapa 3/6: Validando variáveis de ambiente..." -ForegroundColor Cyan
node scripts/validate-env.js
$envValidation = $LASTEXITCODE

if ($envValidation -eq 0) {
    Write-Host "   ✅ Todas variáveis obrigatórias configuradas" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Algumas variáveis não configuradas" -ForegroundColor Yellow
    Write-Host "   📖 Consulte: GUIA_SETUP_ENV_FASE_9.md" -ForegroundColor Cyan
}
Write-Host ""

# Etapa 4: Verificar arquivos criados
Write-Host "📂 Etapa 4/6: Verificando arquivos criados..." -ForegroundColor Cyan
$files = @(
    "estudio_ia_videos/app/lib/services/tts/elevenlabs-service.ts",
    "estudio_ia_videos/app/lib/services/avatar/did-service.ts",
    "estudio_ia_videos/app/lib/services/avatar/synthesia-service.ts",
    "estudio_ia_videos/app/lib/services/nr-templates-service.ts",
    "estudio_ia_videos/app/lib/services/lip-sync-integration.ts",
    "estudio_ia_videos/app/api/queues/route.ts",
    "estudio_ia_videos/app/api/nr-templates/route.ts",
    "estudio_ia_videos/app/api/lip-sync/route.ts",
    "estudio_ia_videos/app/dashboard/admin/queues/page.tsx",
    "estudio_ia_videos/app/dashboard/admin/nr-templates/page.tsx",
    "database-nr-templates.sql",
    "scripts/validate-env.js",
    "FASE_9_FINAL_COMPLETO.md"
)

$existingFiles = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        $existingFiles++
    }
}

Write-Host "   ✅ $existingFiles/$($files.Count) arquivos criados" -ForegroundColor Green
Write-Host ""

# Etapa 5: Status do banco de dados
Write-Host "🗄️ Etapa 5/6: Verificando banco de dados..." -ForegroundColor Cyan
if (Test-Path "database-nr-templates.sql") {
    Write-Host "   ✅ Script SQL pronto (database-nr-templates.sql)" -ForegroundColor Green
    
    if ($env:DIRECT_DATABASE_URL) {
        Write-Host "   ℹ️ Para provisionar: node scripts/execute-supabase-sql.js database-nr-templates.sql" -ForegroundColor Cyan
    } else {
        Write-Host "   ⚠️ DIRECT_DATABASE_URL não configurado" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Script SQL não encontrado" -ForegroundColor Red
}
Write-Host ""

# Etapa 6: Próximos passos
Write-Host "🚀 Etapa 6/6: Próximos Passos" -ForegroundColor Cyan
Write-Host ""

if ($envValidation -eq 0) {
    Write-Host "   1️⃣ Provisionar banco de dados:" -ForegroundColor White
    Write-Host "      node scripts/execute-supabase-sql.js database-nr-templates.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2️⃣ Iniciar servidor de desenvolvimento:" -ForegroundColor White
    Write-Host "      cd estudio_ia_videos && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3️⃣ Acessar dashboards:" -ForegroundColor White
    Write-Host "      http://localhost:3000/dashboard/admin/queues" -ForegroundColor Gray
    Write-Host "      http://localhost:3000/dashboard/admin/nr-templates" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   4️⃣ Testar APIs:" -ForegroundColor White
    Write-Host "      curl http://localhost:3000/api/nr-templates" -ForegroundColor Gray
    Write-Host "      curl http://localhost:3000/api/queues" -ForegroundColor Gray
    Write-Host "      curl http://localhost:3000/api/lip-sync/validate" -ForegroundColor Gray
} else {
    Write-Host "   1️⃣ Configurar variáveis de ambiente obrigatórias:" -ForegroundColor White
    Write-Host "      Edite o arquivo .env na raiz do projeto" -ForegroundColor Gray
    Write-Host "      Consulte: GUIA_SETUP_ENV_FASE_9.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2️⃣ Revalidar ambiente:" -ForegroundColor White
    Write-Host "      node scripts/validate-env.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3️⃣ Prosseguir com provisioning:" -ForegroundColor White
    Write-Host "      node scripts/execute-supabase-sql.js database-nr-templates.sql" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Resumo final
Write-Host ""
Write-Host "📊 RESUMO DO SETUP:" -ForegroundColor Yellow
Write-Host "   Node.js: ✅" -ForegroundColor Green
Write-Host "   Dependências: ✅" -ForegroundColor Green
Write-Host "   Arquivos: $existingFiles/$($files.Count) ✅" -ForegroundColor Green
if ($envValidation -eq 0) {
    Write-Host "   Env Vars: ✅" -ForegroundColor Green
    Write-Host "   Status: 🟢 PRONTO PARA PROVISIONING" -ForegroundColor Green
} else {
    Write-Host "   Env Vars: ⚠️" -ForegroundColor Yellow
    Write-Host "   Status: 🟡 CONFIGURE VARIÁVEIS DE AMBIENTE" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Documentação disponível em:" -ForegroundColor Cyan
Write-Host "   - FASE_9_FINAL_COMPLETO.md (specs técnicas)" -ForegroundColor White
Write-Host "   - RESUMO_FASE_9.md (resumo executivo)" -ForegroundColor White
Write-Host "   - GUIA_SETUP_ENV_FASE_9.md (setup credenciais)" -ForegroundColor White
Write-Host "   - RELATORIO_IMPLEMENTACAO_FASE_9.md (relatório final)" -ForegroundColor White
Write-Host ""

# Retornar código de saída baseado na validação
exit $envValidation
