# ============================================
# Executar Deploy no VPS - PowerShell
# MVP Video TécnicoCursos v7
# ============================================

$VPS_IP = "168.231.90.64"
$VPS_USER = "root"
$REPO_URL = "https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh"
$SSH_KEY = "$env:USERPROFILE\.ssh\mvp_hostinger_ed25519"

Write-Host ""
Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host "🚀 MVP Video TécnicoCursos v7 - Deploy no VPS" -ForegroundColor Cyan
Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar conectividade
Write-Host "📡 Verificando conectividade com VPS $VPS_IP..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $VPS_IP -Count 2 -Quiet -ErrorAction SilentlyContinue
if (-not $ping) {
    Write-Host "❌ Não foi possível conectar ao VPS $VPS_IP" -ForegroundColor Red
    Write-Host "   Verifique se o servidor está online e acessível." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ VPS está online" -ForegroundColor Green
Write-Host ""

# Tentar SSH com chave
Write-Host "🔑 Tentando conectar via SSH..." -ForegroundColor Yellow

$sshCommand = "curl -fsSL $REPO_URL | bash"
$sshArgs = @(
    "-i", $SSH_KEY,
    "-o", "StrictHostKeyChecking=no",
    "-o", "ConnectTimeout=10",
    "$VPS_USER@$VPS_IP",
    $sshCommand
)

Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Se pedir senha, digite a senha do root do VPS" -ForegroundColor Yellow
Write-Host "   O deploy pode levar 5-10 minutos" -ForegroundColor Yellow
Write-Host ""
Write-Host "Executando deploy..." -ForegroundColor Cyan
Write-Host ""

try {
    # Tentar executar via SSH
    & ssh $sshArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ ============================================" -ForegroundColor Green
        Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
        Write-Host "✅ ============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Acesse: http://$VPS_IP" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Para verificar o status:" -ForegroundColor Yellow
        Write-Host "  ssh $VPS_USER@$VPS_IP 'cd /opt/mvp/_MVP_Video_TecnicoCursos_v7 && docker compose -f docker-compose.prod.yml ps'" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  Deploy pode ter encontrado problemas ou precisa de configuração adicional." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Yellow
        Write-Host "  1. Conecte manualmente: ssh $VPS_USER@$VPS_IP" -ForegroundColor White
        Write-Host "  2. Execute: curl -fsSL $REPO_URL | bash" -ForegroundColor White
        Write-Host ""
        Write-Host "Ou se já executou o deploy, configure .env.production:" -ForegroundColor Yellow
        Write-Host "  cd /opt/mvp/_MVP_Video_TecnicoCursos_v7" -ForegroundColor White
        Write-Host "  nano .env.production" -ForegroundColor White
        Write-Host "  docker compose -f docker-compose.prod.yml up -d --build" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar via SSH automático" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Abra o PowerShell e execute:" -ForegroundColor Cyan
    Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "2. No VPS, execute:" -ForegroundColor Cyan
    Write-Host "   curl -fsSL $REPO_URL | bash" -ForegroundColor White
    Write-Host ""
    Write-Host "O script fará tudo automaticamente!" -ForegroundColor Green
}

Write-Host ""
