# ============================================
# Deploy Automático - MVP Video TécnicoCursos v7
# ============================================

$VPS_IP = "168.231.90.64"
$VPS_USER = "root"
$REPO_URL = "https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY AUTOMATICO NO VPS" -ForegroundColor Cyan
Write-Host "  MVP Video TecnicoCursos v7" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar conectividade
Write-Host "[1/4] Verificando conectividade com VPS..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $VPS_IP -Count 2 -Quiet -ErrorAction Stop
    if ($ping) {
        Write-Host "       OK - VPS esta online" -ForegroundColor Green
    } else {
        Write-Host "       ERRO - VPS nao responde" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "       ERRO - Nao foi possivel conectar: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Preparando comando de deploy..." -ForegroundColor Yellow
Write-Host "       URL do script: $REPO_URL" -ForegroundColor Gray
Write-Host ""

Write-Host "[3/4] Tentando executar deploy via SSH..." -ForegroundColor Yellow
Write-Host ""
Write-Host "ATENCAO:" -ForegroundColor Yellow
Write-Host "  - Se pedir senha, digite a senha do root do VPS" -ForegroundColor Yellow
Write-Host "  - O deploy pode levar 5-10 minutos" -ForegroundColor Yellow
Write-Host "  - Nao feche esta janela durante o processo" -ForegroundColor Yellow
Write-Host ""

# Tentar executar
$sshCommand = "curl -fsSL $REPO_URL | bash"

Write-Host "Executando: ssh $VPS_USER@$VPS_IP '$sshCommand'" -ForegroundColor Gray
Write-Host ""

try {
    # Executar SSH
    ssh "$VPS_USER@$VPS_IP" $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[4/4] Deploy concluido com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ACESSE: http://$VPS_IP" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para verificar o status:" -ForegroundColor Yellow
        Write-Host "  ssh $VPS_USER@$VPS_IP 'cd /opt/mvp/_MVP_Video_TecnicoCursos_v7 && docker compose -f docker-compose.prod.yml ps'" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "[4/4] Deploy pode ter encontrado problemas" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Execute manualmente:" -ForegroundColor Yellow
        Write-Host "  1. ssh $VPS_USER@$VPS_IP" -ForegroundColor White
        Write-Host "  2. curl -fsSL $REPO_URL | bash" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "[4/4] Erro ao executar via SSH automatico" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Abra um novo PowerShell e execute:" -ForegroundColor Cyan
    Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "2. No VPS, execute:" -ForegroundColor Cyan
    Write-Host "   curl -fsSL $REPO_URL | bash" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
