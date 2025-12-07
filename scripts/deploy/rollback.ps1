# Rollback Script para MVP Video TecnicoCursos (PowerShell)
# Automatiza reversão de deploy com health checks

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("git", "database", "full")]
    [string]$RollbackType = "git",
    
    [Parameter(Mandatory=$false)]
    [string]$Target = "HEAD~1",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseMigration = "latest",
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"

# ==============================================
# Configuração
# ==============================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$LogFile = Join-Path $ProjectRoot "logs\rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$HealthCheckUrl = if ($env:HEALTH_CHECK_URL) { $env:HEALTH_CHECK_URL } else { "http://localhost:3000/api/health" }
$HealthCheckTimeout = 30
$HealthCheckRetries = 3

# ==============================================
# Funções Auxiliares
# ==============================================

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp [$Level] $Message"
    
    $color = switch ($Level) {
        "INFO" { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-Health {
    param(
        [string]$Url,
        [int]$Retries = $HealthCheckRetries
    )
    
    Write-Log "INFO" "Verificando saúde da aplicação em: $Url"
    
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec $HealthCheckTimeout -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Log "SUCCESS" "✅ Health check OK (tentativa $i/$Retries)"
                return $true
            }
        }
        catch {
            Write-Log "WARNING" "⚠️ Health check falhou (tentativa $i/$Retries): $_"
            if ($i -lt $Retries) {
                Start-Sleep -Seconds 5
            }
        }
    }
    
    Write-Log "ERROR" "❌ Health check falhou após $Retries tentativas"
    return $false
}

# ==============================================
# Git Rollback
# ==============================================

function Invoke-GitRollback {
    param([string]$TargetCommit)
    
    Write-Log "INFO" "Iniciando rollback Git para: $TargetCommit"
    
    Set-Location $ProjectRoot
    
    # Verifica mudanças não commitadas
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Log "ERROR" "❌ Há mudanças não commitadas. Commite ou descarte antes de fazer rollback."
        return $false
    }
    
    # Obtém commits
    $currentCommit = git rev-parse HEAD
    $targetHash = git rev-parse $TargetCommit
    
    Write-Log "INFO" "Commit atual: $currentCommit"
    Write-Log "INFO" "Commit de destino: $targetHash"
    
    # Confirma rollback
    if (-not $AutoApprove) {
        $confirm = Read-Host "Confirma rollback de $currentCommit para $targetHash? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Log "WARNING" "⚠️ Rollback cancelado pelo usuário"
            return $false
        }
    }
    
    # Executa revert
    Write-Log "INFO" "Revertendo para $targetHash..."
    try {
        git revert --no-commit "$targetHash..HEAD"
        git commit -m "chore: rollback to $targetHash [automated]"
        Write-Log "SUCCESS" "✅ Git rollback executado"
        return $true
    }
    catch {
        Write-Log "ERROR" "❌ Falha ao executar git revert: $_"
        git revert --abort 2>$null
        return $false
    }
}

# ==============================================
# Database Rollback
# ==============================================

function Invoke-DatabaseRollback {
    param([string]$MigrationName)
    
    Write-Log "INFO" "Executando rollback de migration: $MigrationName"
    
    $migrationPath = Join-Path $ProjectRoot "database-migrations\$MigrationName.down.sql"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Log "ERROR" "❌ Migration down não encontrada: $MigrationName"
        return $false
    }
    
    # Verifica Supabase CLI
    if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
        Write-Log "ERROR" "❌ Supabase CLI não instalado"
        return $false
    }
    
    # Dry run
    Write-Log "INFO" "Executando dry run..."
    supabase db push --dry-run $migrationPath
    
    # Confirma execução
    if (-not $AutoApprove) {
        $confirm = Read-Host "Confirma execução da migration down? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Log "WARNING" "⚠️ Database rollback cancelado"
            return $false
        }
    }
    
    try {
        supabase db push $migrationPath
        Write-Log "SUCCESS" "✅ Database rollback executado"
        return $true
    }
    catch {
        Write-Log "ERROR" "❌ Falha ao executar database rollback: $_"
        return $false
    }
}

# ==============================================
# Service Restart
# ==============================================

function Restart-Services {
    Write-Log "INFO" "Reiniciando serviços..."
    
    # PM2
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        Write-Log "INFO" "Reiniciando via PM2..."
        pm2 restart all
        Start-Sleep -Seconds 5
        Write-Log "SUCCESS" "✅ Serviços PM2 reiniciados"
    }
    
    # Docker
    $dockerComposePath = Join-Path $ProjectRoot "docker-compose.yml"
    if ((Test-Path $dockerComposePath) -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Log "INFO" "Reiniciando via Docker Compose..."
        docker-compose restart
        Start-Sleep -Seconds 10
        Write-Log "SUCCESS" "✅ Serviços Docker reiniciados"
    }
}

# ==============================================
# Alertas
# ==============================================

function Send-Alerts {
    param(
        [string]$Status,
        [string]$Message
    )
    
    Write-Log "INFO" "Enviando alertas: $Status"
    
    # Slack
    if ($env:SLACK_WEBHOOK_URL) {
        try {
            $body = @{ text = "🚨 Rollback $Status`: $Message" } | ConvertTo-Json
            Invoke-RestMethod -Uri $env:SLACK_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json"
        }
        catch {
            Write-Log "WARNING" "Falha ao enviar alerta Slack: $_"
        }
    }
    
    # Sentry
    if ($env:SENTRY_DSN -and (Get-Command sentry-cli -ErrorAction SilentlyContinue)) {
        try {
            sentry-cli send-event -m "Rollback $Status`: $Message" -t level:error -t environment:production
        }
        catch {
            Write-Log "WARNING" "Falha ao enviar alerta Sentry: $_"
        }
    }
}

# ==============================================
# Main
# ==============================================

Write-Log "INFO" "=========================================="
Write-Log "INFO" "Iniciando Rollback - MVP Video TecnicoCursos"
Write-Log "INFO" "=========================================="

# Cria diretório de logs
$logDir = Split-Path -Parent $LogFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$success = $false

switch ($RollbackType) {
    "git" {
        Write-Log "INFO" "Tipo: Git Rollback"
        $success = Invoke-GitRollback -TargetCommit $Target
        if (-not $success) {
            Send-Alerts "FAILED" "Git rollback falhou para $Target"
            exit 1
        }
    }
    
    "database" {
        Write-Log "INFO" "Tipo: Database Rollback"
        $success = Invoke-DatabaseRollback -MigrationName $DatabaseMigration
        if (-not $success) {
            Send-Alerts "FAILED" "Database rollback falhou para $DatabaseMigration"
            exit 1
        }
    }
    
    "full" {
        Write-Log "INFO" "Tipo: Full Rollback (Git + Database)"
        
        $gitSuccess = Invoke-GitRollback -TargetCommit $Target
        if (-not $gitSuccess) {
            Send-Alerts "FAILED" "Full rollback - Git falhou"
            exit 1
        }
        
        $dbSuccess = Invoke-DatabaseRollback -MigrationName $DatabaseMigration
        if (-not $dbSuccess) {
            Send-Alerts "FAILED" "Full rollback - Database falhou"
            # Tenta reverter git rollback
            git reset --hard HEAD~1
            exit 1
        }
        
        $success = $true
    }
}

# Reinicia serviços
Restart-Services

# Health check pós-rollback
Write-Log "INFO" "Verificando saúde pós-rollback..."
$healthOk = Test-Health -Url $HealthCheckUrl

if ($healthOk) {
    Write-Log "SUCCESS" "=========================================="
    Write-Log "SUCCESS" "✅ ROLLBACK CONCLUÍDO COM SUCESSO"
    Write-Log "SUCCESS" "=========================================="
    Send-Alerts "SUCCESS" "Rollback executado e aplicação está saudável"
    exit 0
}
else {
    Write-Log "ERROR" "=========================================="
    Write-Log "ERROR" "❌ ROLLBACK CONCLUÍDO MAS HEALTH CHECK FALHOU"
    Write-Log "ERROR" "=========================================="
    Send-Alerts "WARNING" "Rollback executado mas health check falhou"
    exit 2
}
