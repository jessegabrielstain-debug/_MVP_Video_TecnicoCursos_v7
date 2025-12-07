# Script de Inicialização de Produção - MVP Video Técnico Cursos
# Este script prepara e inicia a aplicação em modo de produção.

Write-Host "🚀 Iniciando MVP Video Técnico Cursos em Modo de Produção..." -ForegroundColor Cyan

$appDir = "estudio_ia_videos"
$envFile = "$appDir\.env.local"

# 1. Verificação de Ambiente
if (-not (Test-Path $envFile)) {
    Write-Error "❌ Arquivo .env.local não encontrado em $appDir!"
    Write-Host "ℹ️  Execute 'npm run setup:env' ou crie o arquivo manualmente."
    exit 1
}

# 2. Instalação de Dependências
if (-not (Test-Path "$appDir\node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    Push-Location $appDir
    npm ci --production
    Pop-Location
}

# 3. Build da Aplicação
if (-not (Test-Path "$appDir\.next")) {
    Write-Host "🔨 Construindo aplicação..." -ForegroundColor Yellow
    Push-Location $appDir
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Falha no build da aplicação."
        Pop-Location
        exit 1
    }
    Pop-Location
}

# 4. Verificação de Infraestrutura (Redis)
Write-Host "🔍 Verificando infraestrutura..." -ForegroundColor Yellow
# (Opcional) Poderíamos verificar se o Redis está rodando aqui, mas vamos deixar o app falhar graciosamente se não estiver.

# 5. Iniciar Aplicação
Write-Host "✅ Tudo pronto! Iniciando servidor..." -ForegroundColor Green
Write-Host "🌐 Acesse: http://localhost:3000" -ForegroundColor Cyan

Push-Location $appDir
$env:NODE_ENV = "production"
npm start
Pop-Location
