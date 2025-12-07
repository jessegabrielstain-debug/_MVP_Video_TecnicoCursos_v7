# ============================================
#  MVP Video TecnicoCursos v7 - Iniciar App
# ============================================
#  Execute: .\INICIAR-APP.ps1
#  Ou clique com botão direito > "Run with PowerShell"
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MVP Video TecnicoCursos v7" -ForegroundColor Cyan
Write-Host "  Iniciando servidor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$projectRoot\estudio_ia_videos"

Write-Host "[1/2] Verificando dependencias..." -ForegroundColor Yellow
npm install --silent 2>$null

Write-Host "[2/2] Iniciando Next.js..." -ForegroundColor Green
Write-Host ""
Write-Host "  URL: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Blue
Write-Host "  Pressione Ctrl+C para parar" -ForegroundColor Gray
Write-Host ""

npm run dev
