# ============================================
# Deploy Automático - PowerShell
# MVP Video TécnicoCursos v7
# ============================================

$ErrorActionPreference = "Stop"

$VPS_IP = "168.231.90.64"
$VPS_USER = "root"
$REPO_URL = "https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh"

Write-Host "🚀 MVP Video TécnicoCursos v7 - Deploy Automático" -ForegroundColor Cyan
Write-Host ""

# Verificar conectividade
Write-Host "📡 Verificando conectividade com VPS..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $VPS_IP -Count 1 -Quiet
if (-not $ping) {
    Write-Host "❌ Não foi possível conectar ao VPS $VPS_IP" -ForegroundColor Red
    Write-Host "Verifique se o servidor está online." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ VPS está online" -ForegroundColor Green
Write-Host ""

# Tentar executar deploy remoto
Write-Host "🚀 Iniciando deploy no VPS..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Você precisará digitar a senha do root quando solicitado" -ForegroundColor Yellow
Write-Host ""

try {
    # Executar script remoto
    $command = "curl -fsSL $REPO_URL | bash"
    
    Write-Host "Executando: ssh $VPS_USER@$VPS_IP '$command'" -ForegroundColor Gray
    Write-Host ""
    
    ssh "$VPS_USER@$VPS_IP" $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Acesse: http://$VPS_IP" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Para verificar o status, execute:" -ForegroundColor Yellow
        Write-Host "  ssh $VPS_USER@$VPS_IP 'cd /opt/mvp/_MVP_Video_TecnicoCursos_v7 && docker compose -f docker-compose.prod.yml ps'" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  Deploy pode ter encontrado problemas." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Execute manualmente no VPS:" -ForegroundColor Yellow
        Write-Host "  ssh $VPS_USER@$VPS_IP" -ForegroundColor White
        Write-Host "  curl -fsSL ${REPO_URL} | bash" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar deploy: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host "  1. ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host "  2. curl -fsSL ${REPO_URL} | bash" -ForegroundColor White
}
