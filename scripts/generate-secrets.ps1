#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Gera secrets seguros para uso em produção

.DESCRIPTION
    Este script gera secrets criptograficamente seguros para:
    - NEXTAUTH_SECRET (32+ bytes)
    - API keys aleatórias
    - Tokens de sessão
    - Outros secrets necessários

.PARAMETER Type
    Tipo de secret a gerar: nextauth, api-key, token, all

.PARAMETER Length
    Comprimento do secret em bytes (default: 32)

.PARAMETER Count
    Número de secrets a gerar (default: 1)

.EXAMPLE
    .\generate-secrets.ps1
    Gera todos os secrets necessários

.EXAMPLE
    .\generate-secrets.ps1 -Type nextauth
    Gera apenas NEXTAUTH_SECRET

.EXAMPLE
    .\generate-secrets.ps1 -Type api-key -Count 5
    Gera 5 API keys
#>

param(
    [ValidateSet("nextauth", "api-key", "token", "session", "all")]
    [string]$Type = "all",
    
    [ValidateRange(16, 128)]
    [int]$Length = 32,
    
    [ValidateRange(1, 20)]
    [int]$Count = 1
)

# Cores
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"

# Banner
Write-Host "`n============================================" -ForegroundColor $ColorInfo
Write-Host "  SECRET GENERATOR v1.0" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

# Função para gerar secret seguro
function Generate-Secret {
    param(
        [int]$ByteLength = 32,
        [switch]$Base64,
        [switch]$Hex
    )
    
    $bytes = New-Object byte[] $ByteLength
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    
    if ($Base64) {
        return [Convert]::ToBase64String($bytes)
    } elseif ($Hex) {
        return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
    } else {
        # URL-safe base64
        return ([Convert]::ToBase64String($bytes) -replace '\+', '-' -replace '/', '_' -replace '=', '')
    }
}

# Função para gerar API key formato padrão
function Generate-ApiKey {
    param([string]$Prefix = "sk")
    
    $secret = Generate-Secret -ByteLength 32
    return "$Prefix`_$secret"
}

# Processar tipo
switch ($Type) {
    "nextauth" {
        Write-Host "🔐 Gerando NEXTAUTH_SECRET..." -ForegroundColor $ColorInfo
        Write-Host ""
        for ($i = 1; $i -le $Count; $i++) {
            $secret = Generate-Secret -ByteLength 32 -Base64
            Write-Host "# Secret ${i} (adicione ao .env.production):" -ForegroundColor DarkGray
            Write-Host "NEXTAUTH_SECRET=$secret" -ForegroundColor $ColorSuccess
            Write-Host ""
        }
    }
    
    "api-key" {
        Write-Host "🔑 Gerando API Keys..." -ForegroundColor $ColorInfo
        Write-Host ""
        for ($i = 1; $i -le $Count; $i++) {
            $apiKey = Generate-ApiKey -Prefix "sk"
            Write-Host "# API Key ${i}:" -ForegroundColor DarkGray
            Write-Host "API_KEY=$apiKey" -ForegroundColor $ColorSuccess
            Write-Host ""
        }
    }
    
    "token" {
        Write-Host "🎫 Gerando Tokens..." -ForegroundColor $ColorInfo
        Write-Host ""
        for ($i = 1; $i -le $Count; $i++) {
            $token = Generate-Secret -ByteLength $Length
            Write-Host "# Token ${i}:" -ForegroundColor DarkGray
            Write-Host "TOKEN=$token" -ForegroundColor $ColorSuccess
            Write-Host ""
        }
    }
    
    "session" {
        Write-Host "📝 Gerando Session Secrets..." -ForegroundColor $ColorInfo
        Write-Host ""
        for ($i = 1; $i -le $Count; $i++) {
            $sessionSecret = Generate-Secret -ByteLength 32 -Hex
            Write-Host "# Session Secret ${i}:" -ForegroundColor DarkGray
            Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor $ColorSuccess
            Write-Host ""
        }
    }
    
    "all" {
        Write-Host "🔐 Gerando todos os secrets necessários...`n" -ForegroundColor $ColorInfo
        
        # NEXTAUTH_SECRET
        Write-Host "# 1. NextAuth Secret (para autenticação)" -ForegroundColor DarkGray
        $nextauthSecret = Generate-Secret -ByteLength 32 -Base64
        Write-Host "NEXTAUTH_SECRET=$nextauthSecret" -ForegroundColor $ColorSuccess
        Write-Host ""
        
        # API Key para integrações
        Write-Host "# 2. API Key (para integrações internas)" -ForegroundColor DarkGray
        $apiKey = Generate-ApiKey -Prefix "sk"
        Write-Host "INTERNAL_API_KEY=$apiKey" -ForegroundColor $ColorSuccess
        Write-Host ""
        
        # Session Secret
        Write-Host "# 3. Session Secret (para cookies)" -ForegroundColor DarkGray
        $sessionSecret = Generate-Secret -ByteLength 32 -Hex
        Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor $ColorSuccess
        Write-Host ""
        
        # Webhook Secret
        Write-Host "# 4. Webhook Secret (para validar webhooks)" -ForegroundColor DarkGray
        $webhookSecret = Generate-Secret -ByteLength 32 -Base64
        Write-Host "WEBHOOK_SECRET=$webhookSecret" -ForegroundColor $ColorSuccess
        Write-Host ""
        
        # Encryption Key
        Write-Host "# 5. Encryption Key (para dados sensíveis)" -ForegroundColor DarkGray
        $encryptionKey = Generate-Secret -ByteLength 32 -Hex
        Write-Host "ENCRYPTION_KEY=$encryptionKey" -ForegroundColor $ColorSuccess
        Write-Host ""
        
        Write-Host "============================================" -ForegroundColor $ColorInfo
        Write-Host "✅ Secrets gerados com sucesso!" -ForegroundColor $ColorSuccess
        Write-Host "============================================`n" -ForegroundColor $ColorInfo
        
        Write-Host "⚠️  IMPORTANTE:" -ForegroundColor $ColorWarning
        Write-Host "1. Copie os secrets acima para .env.production" -ForegroundColor DarkGray
        Write-Host "2. NUNCA commite secrets no git" -ForegroundColor DarkGray
        Write-Host "3. Use um gerenciador de secrets em produção" -ForegroundColor DarkGray
        Write-Host "4. Rotacione secrets periodicamente" -ForegroundColor DarkGray
        Write-Host ""
        
        Write-Host "💡 Dica: Salve em arquivo seguro:" -ForegroundColor $ColorInfo
        Write-Host "   .\generate-secrets.ps1 | Out-File secrets.txt" -ForegroundColor DarkGray
        Write-Host "   (depois mova para gerenciador de senhas)" -ForegroundColor DarkGray
    }
}

Write-Host "`n============================================`n" -ForegroundColor $ColorInfo
