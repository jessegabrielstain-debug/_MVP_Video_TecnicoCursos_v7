<#
.SYNOPSIS
    Script interativo para configurar credenciais do .env.local

.DESCRIPTION
    Solicita credenciais ao usuário e atualiza o arquivo .env.local
    com valores reais de Supabase, Upstash Redis, Sentry, etc.

.NOTES
    Versão: 1.0.0
    Data: 18/11/2025
    Autor: GitHub Copilot
#>

param(
    [switch]$SkipValidation,
    [switch]$ShowCurrent
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot ".." ".env.local"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Section { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# Função para ler valor mascarado
function Read-SecretValue {
    param(
        [string]$Prompt,
        [string]$CurrentValue,
        [bool]$IsSecret = $true
    )
    
    if ($CurrentValue -notmatch "COLOQUE_A_|TODO") {
        Write-Host "$Prompt (atual: " -NoNewline
        if ($IsSecret) {
            Write-Host "***${CurrentValue.Substring($CurrentValue.Length - 4)}" -NoNewline -ForegroundColor DarkGray
        } else {
            Write-Host "$CurrentValue" -NoNewline -ForegroundColor DarkGray
        }
        Write-Host ")" -NoNewline
    } else {
        Write-Host "$Prompt" -NoNewline
    }
    
    Write-Host ": " -NoNewline
    
    if ($IsSecret) {
        $secure = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        $value = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    } else {
        $value = Read-Host
    }
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $CurrentValue
    }
    
    return $value
}

# Mostrar configuração atual
if ($ShowCurrent) {
    Write-Section "Configuração Atual"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        $lines = $content -split "`n"
        
        foreach ($line in $lines) {
            if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) {
                Write-Host $line -ForegroundColor DarkGray
            } elseif ($line -match 'COLOQUE_A_|TODO') {
                Write-Host $line -ForegroundColor Yellow
            } else {
                # Mascarar valores sensíveis
                if ($line -match '(.+?)="(.+)"') {
                    $key = $matches[1]
                    $value = $matches[2]
                    
                    if ($key -match 'KEY|TOKEN|SECRET|PASSWORD|DSN') {
                        $masked = if ($value.Length -gt 8) { 
                            "***" + $value.Substring($value.Length - 4) 
                        } else { 
                            "***" 
                        }
                        Write-Host "$key=" -NoNewline
                        Write-Host """$masked""" -ForegroundColor Green
                    } else {
                        Write-Host $line -ForegroundColor Green
                    }
                }
            }
        }
    } else {
        Write-Error "Arquivo .env.local não encontrado!"
    }
    exit 0
}

# Banner
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔧 Setup Interativo de Credenciais .env.local         ║
║                                                           ║
║     MVP Video TécnicoCursos v7 - Configuração v2.4.0     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Error "Arquivo .env.local não encontrado em: $envFile"
    exit 1
}

# Ler arquivo atual
$content = Get-Content $envFile -Raw

# Backup
$backupFile = "$envFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $envFile $backupFile
Write-Info "Backup criado: $backupFile"

# === SUPABASE ===
Write-Section "1/4 - Supabase"
Write-Host @"

Obtenha as credenciais em:
https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/settings/api

1. NEXT_PUBLIC_SUPABASE_URL: Project URL (já configurada)
2. NEXT_PUBLIC_SUPABASE_ANON_KEY: anon/public key
3. SUPABASE_SERVICE_ROLE_KEY: service_role key (⚠️ NUNCA compartilhar!)

"@ -ForegroundColor DarkGray

# Extrair valores atuais
if ($content -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"') {
    $currentAnonKey = $matches[1]
} else {
    $currentAnonKey = ""
}

if ($content -match 'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"') {
    $currentServiceKey = $matches[1]
} else {
    $currentServiceKey = ""
}

$newAnonKey = Read-SecretValue -Prompt "NEXT_PUBLIC_SUPABASE_ANON_KEY" -CurrentValue $currentAnonKey
$newServiceKey = Read-SecretValue -Prompt "SUPABASE_SERVICE_ROLE_KEY" -CurrentValue $currentServiceKey

# === UPSTASH REDIS ===
Write-Section "2/4 - Upstash Redis"
Write-Host @"

Obtenha as credenciais em:
https://console.upstash.com/redis

1. Selecione seu database Redis
2. Copie REST URL
3. Copie REST Token

"@ -ForegroundColor DarkGray

if ($content -match 'UPSTASH_REDIS_REST_URL="([^"]+)"') {
    $currentRedisUrl = $matches[1]
} else {
    $currentRedisUrl = ""
}

if ($content -match 'UPSTASH_REDIS_REST_TOKEN="([^"]+)"') {
    $currentRedisToken = $matches[1]
} else {
    $currentRedisToken = ""
}

$newRedisUrl = Read-SecretValue -Prompt "UPSTASH_REDIS_REST_URL" -CurrentValue $currentRedisUrl -IsSecret $false
$newRedisToken = Read-SecretValue -Prompt "UPSTASH_REDIS_REST_TOKEN" -CurrentValue $currentRedisToken

# === SENTRY (OPCIONAL) ===
Write-Section "3/4 - Sentry (Opcional)"
Write-Host @"

Obtenha o DSN em:
https://sentry.io/settings/projects/<seu-projeto>/keys/

Pressione ENTER para pular se não usar Sentry.

"@ -ForegroundColor DarkGray

if ($content -match 'NEXT_PUBLIC_SENTRY_DSN="([^"]+)"') {
    $currentSentryDsn = $matches[1]
} else {
    $currentSentryDsn = ""
}

$newSentryDsn = Read-SecretValue -Prompt "NEXT_PUBLIC_SENTRY_DSN" -CurrentValue $currentSentryDsn -IsSecret $false

# === DATABASE DIRECT URL (OPCIONAL) ===
Write-Section "4/4 - Database Direct URL (Opcional)"
Write-Host @"

Para scripts SQL diretos (database-rbac-complete.sql):
https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/settings/database

Connection String → Transaction mode
Formato: postgresql://postgres:[PASSWORD]@...

Pressione ENTER para pular.

"@ -ForegroundColor DarkGray

if ($content -match 'DIRECT_DATABASE_URL="([^"]+)"') {
    $currentDbUrl = $matches[1]
} else {
    $currentDbUrl = ""
}

$newDbUrl = Read-SecretValue -Prompt "DIRECT_DATABASE_URL" -CurrentValue $currentDbUrl

# === ATUALIZAR ARQUIVO ===
Write-Section "Atualizando .env.local"

$newContent = $content

# Supabase
if ($newAnonKey) {
    $newContent = $newContent -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY="[^"]+"', "NEXT_PUBLIC_SUPABASE_ANON_KEY=""$newAnonKey"""
}
if ($newServiceKey) {
    $newContent = $newContent -replace 'SUPABASE_SERVICE_ROLE_KEY="[^"]+"', "SUPABASE_SERVICE_ROLE_KEY=""$newServiceKey"""
}

# Redis
if ($newRedisUrl) {
    $newContent = $newContent -replace 'UPSTASH_REDIS_REST_URL="[^"]+"', "UPSTASH_REDIS_REST_URL=""$newRedisUrl"""
}
if ($newRedisToken) {
    $newContent = $newContent -replace 'UPSTASH_REDIS_REST_TOKEN="[^"]+"', "UPSTASH_REDIS_REST_TOKEN=""$newRedisToken"""
}

# Sentry (adicionar se não existir)
if ($newSentryDsn -and $newSentryDsn -notmatch "COLOQUE_A_") {
    if ($newContent -notmatch 'NEXT_PUBLIC_SENTRY_DSN=') {
        $newContent += "`n# Sentry (Opcional)`nNEXT_PUBLIC_SENTRY_DSN=""$newSentryDsn""`nSENTRY_DSN=""$newSentryDsn""`n"
    } else {
        $newContent = $newContent -replace 'NEXT_PUBLIC_SENTRY_DSN="[^"]+"', "NEXT_PUBLIC_SENTRY_DSN=""$newSentryDsn"""
        $newContent = $newContent -replace 'SENTRY_DSN="[^"]+"', "SENTRY_DSN=""$newSentryDsn"""
    }
}

# Database Direct URL (adicionar se não existir)
if ($newDbUrl -and $newDbUrl -notmatch "COLOQUE_A_") {
    if ($newContent -notmatch 'DIRECT_DATABASE_URL=') {
        $newContent += "`n# Database Direct URL (para scripts SQL)`nDIRECT_DATABASE_URL=""$newDbUrl""`n"
    } else {
        $newContent = $newContent -replace 'DIRECT_DATABASE_URL="[^"]+"', "DIRECT_DATABASE_URL=""$newDbUrl"""
    }
}

# Salvar
Set-Content -Path $envFile -Value $newContent -NoNewline
Write-Success "Arquivo .env.local atualizado!"

# === VALIDAÇÃO ===
if (-not $SkipValidation) {
    Write-Section "Validando Configuração"
    
    $errors = @()
    
    # Verificar placeholders restantes
    $remainingPlaceholders = ($newContent | Select-String -Pattern 'COLOQUE_A_|TODO' -AllMatches).Matches.Count
    
    if ($remainingPlaceholders -gt 0) {
        Write-Warning "Ainda existem $remainingPlaceholders placeholder(s) no arquivo"
        
        # Mostrar quais
        $lines = $newContent -split "`n"
        foreach ($line in $lines) {
            if ($line -match 'COLOQUE_A_|TODO') {
                Write-Host "  - $line" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Success "Nenhum placeholder restante!"
    }
    
    # Verificar formato das credenciais
    if ($newAnonKey -and $newAnonKey.Length -lt 20) {
        $errors += "ANON_KEY parece muito curta (< 20 chars)"
    }
    
    if ($newServiceKey -and $newServiceKey.Length -lt 20) {
        $errors += "SERVICE_ROLE_KEY parece muito curta (< 20 chars)"
    }
    
    if ($newRedisUrl -and $newRedisUrl -notmatch '^https?://') {
        $errors += "REDIS_REST_URL deve começar com http:// ou https://"
    }
    
    if ($newRedisToken -and $newRedisToken.Length -lt 20) {
        $errors += "REDIS_REST_TOKEN parece muito curto (< 20 chars)"
    }
    
    if ($newSentryDsn -and $newSentryDsn -notmatch '^https://.+@.+\.ingest\.sentry\.io') {
        Write-Warning "SENTRY_DSN pode estar em formato incorreto (esperado: https://...@....ingest.sentry.io/...)"
    }
    
    if ($errors.Count -gt 0) {
        Write-Warning "`nProblemas detectados:"
        foreach ($err in $errors) {
            Write-Host "  ⚠️  $err" -ForegroundColor Yellow
        }
    } else {
        Write-Success "Todas as validações básicas passaram!"
    }
}

# === PRÓXIMOS PASSOS ===
Write-Section "Próximos Passos"

Write-Host @"

1. ✅ Credenciais configuradas

2. ⏳ Executar RBAC SQL (~5 min):
   node scripts/execute-supabase-sql.js database-rbac-complete.sql

3. ⏳ Criar test users (~10 min):
   - Abra: https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/auth/users
   - Crie 4 usuários conforme docs/setup/TEST_USERS_SETUP.md

4. ⏳ Testar aplicação:
   cd estudio_ia_videos/app
   npm run dev

5. 🧪 Rodar testes E2E (após criar test users):
   npm run test:e2e

Documentação completa: RELATORIO_FINAL_17_NOV_2025.md

"@ -ForegroundColor Green

Write-Host ""
Write-Success "Setup de credenciais concluído com sucesso!"
Write-Info "Backup mantido em: $backupFile"
Write-Host ""
