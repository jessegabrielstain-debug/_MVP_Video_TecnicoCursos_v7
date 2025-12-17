# ============================================
# Deploy Script - Windows PowerShell
# MVP Video TécnicoCursos v7
# ============================================

$VPS_IP = "168.231.90.64"
$VPS_USER = "root"
$SSH_KEY = "$env:USERPROFILE\.ssh\mvp_hostinger_ed25519"
$REPO_URL = "https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh"

Write-Host "🚀 MVP Video TécnicoCursos v7 - Deploy Automático" -ForegroundColor Cyan
Write-Host ""

# Verificar se chave SSH existe
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ Chave SSH não encontrada: $SSH_KEY" -ForegroundColor Red
    Write-Host "Execute primeiro: ssh-keygen -t ed25519 -f $SSH_KEY -N ''" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Conectando ao VPS $VPS_IP..." -ForegroundColor Yellow

# Tentar executar script remoto
$script = @"
set -e
curl -fsSL $REPO_URL | bash
"@

try {
    # Tentar com chave SSH primeiro
    $result = & ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VPS_USER@$VPS_IP" $script 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy executado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Acesse: http://$VPS_IP" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Erro ao executar via SSH com chave. Tentando com senha..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Por favor, execute manualmente no VPS:" -ForegroundColor Yellow
        Write-Host "  ssh $VPS_USER@$VPS_IP" -ForegroundColor White
        Write-Host "  curl -fsSL $REPO_URL | bash" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erro ao conectar: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host "  1. ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "  2. curl -fsSL $REPO_URL | bash" -ForegroundColor White
}
