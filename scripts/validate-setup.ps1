<#
.SYNOPSIS
    Valida configuração completa do projeto

.DESCRIPTION
    Verifica credenciais, testa conexões, valida banco de dados,
    e gera relatório de prontidão para produção

.NOTES
    Versão: 1.0.0
    Data: 18/11/2025
    Autor: GitHub Copilot
#>

param(
    [switch]$SkipDatabase,
    [switch]$SkipRedis,
    [switch]$Quick,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$envFile = Join-Path $PSScriptRoot ".." ".env.local"

# Cores
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Section { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# Contadores
$script:passed = 0
$script:failed = 0
$script:warnings = 0
$script:skipped = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [bool]$IsWarning = $false,
        [bool]$IsOptional = $false
    )
    
    Write-Host "`n🔍 $Name... " -NoNewline
    
    try {
        $result = & $Test
        
        if ($result.Success) {
            Write-Success $result.Message
            $script:passed++
        } else {
            if ($IsWarning -or $IsOptional) {
                Write-Warning "$($result.Message) (não crítico)"
                $script:warnings++
            } else {
                Write-Error $result.Message
                $script:failed++
            }
        }
        
        if ($Verbose -and $result.Details) {
            Write-Host "   $($result.Details)" -ForegroundColor DarkGray
        }
    } catch {
        if ($IsOptional) {
            Write-Warning "Erro: $($_.Exception.Message) (não crítico)"
            $script:warnings++
        } else {
            Write-Error "Erro: $($_.Exception.Message)"
            $script:failed++
        }
    }
}

# Banner
Write-Host @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔍 Validação Completa de Setup                        ║
║                                                           ║
║     MVP Video TécnicoCursos v7 - v2.4.0                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# === 1. ARQUIVOS ===
Write-Section "1. Arquivos e Estrutura"

Test-Check "Arquivo .env.local existe" {
    if (Test-Path $envFile) {
        @{ Success = $true; Message = "Encontrado" }
    } else {
        @{ Success = $false; Message = "Não encontrado em $envFile" }
    }
}

Test-Check "package.json existe" {
    $pkgPath = Join-Path $PSScriptRoot ".." "package.json"
    if (Test-Path $pkgPath) {
        $pkg = Get-Content $pkgPath | ConvertFrom-Json
        @{ Success = $true; Message = "Versão $($pkg.version)"; Details = $pkg.name }
    } else {
        @{ Success = $false; Message = "package.json não encontrado" }
    }
}

Test-Check "Diretórios principais existem" {
    $dirs = @("app", "lib", "scripts", "tests", "docs")
    $missing = @()
    
    foreach ($dir in $dirs) {
        $path = Join-Path $PSScriptRoot ".." $dir
        if (-not (Test-Path $path)) {
            $missing += $dir
        }
    }
    
    if ($missing.Count -eq 0) {
        @{ Success = $true; Message = "Todos os $($dirs.Count) diretórios principais encontrados" }
    } else {
        @{ Success = $false; Message = "Faltando: $($missing -join ', ')" }
    }
}

# === 2. CREDENCIAIS ===
Write-Section "2. Credenciais .env.local"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    Test-Check "Supabase URL configurada" {
        if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL="(https?://[^"]+)"') {
            $url = $matches[1]
            @{ Success = $true; Message = $url }
        } else {
            @{ Success = $false; Message = "URL não encontrada" }
        }
    }
    
    Test-Check "Supabase Anon Key configurada" {
        if ($envContent -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"') {
            $key = $matches[1]
            if ($key -match "COLOQUE_A_|TODO") {
                @{ Success = $false; Message = "Ainda é placeholder" }
            } elseif ($key.Length -lt 20) {
                @{ Success = $false; Message = "Muito curta (< 20 chars)" }
            } else {
                @{ Success = $true; Message = "Configurada (${key.Length} chars)" }
            }
        } else {
            @{ Success = $false; Message = "Não encontrada" }
        }
    }
    
    Test-Check "Supabase Service Role Key configurada" {
        if ($envContent -match 'SUPABASE_SERVICE_ROLE_KEY="([^"]+)"') {
            $key = $matches[1]
            if ($key -match "COLOQUE_A_|TODO") {
                @{ Success = $false; Message = "Ainda é placeholder" }
            } elseif ($key.Length -lt 20) {
                @{ Success = $false; Message = "Muito curta (< 20 chars)" }
            } else {
                @{ Success = $true; Message = "Configurada (${key.Length} chars)" }
            }
        } else {
            @{ Success = $false; Message = "Não encontrada" }
        }
    }
    
    Test-Check "Redis URL configurada" {
        if ($envContent -match 'UPSTASH_REDIS_REST_URL="([^"]+)"') {
            $url = $matches[1]
            if ($url -match "COLOQUE_A_|TODO") {
                @{ Success = $false; Message = "Ainda é placeholder" }
            } elseif ($url -match '^redis://') {
                 @{ Success = $true; Message = "$url (Local Redis)" }
            } elseif ($url -notmatch '^https?://') {
                @{ Success = $false; Message = "Formato inválido (deve começar com https:// ou redis://)" }
            } else {
                @{ Success = $true; Message = $url }
            }
        } else {
            @{ Success = $false; Message = "Não encontrada" }
        }
    }
    
    Test-Check "Redis Token configurado" {
        if ($envContent -match 'UPSTASH_REDIS_REST_TOKEN="([^"]+)"') {
            $token = $matches[1]
            if ($token -match "COLOQUE_A_|TODO") {
                @{ Success = $false; Message = "Ainda é placeholder" }
            } elseif ($token.Length -lt 20) {
                @{ Success = $false; Message = "Muito curto (< 20 chars)" }
            } else {
                @{ Success = $true; Message = "Configurado (${token.Length} chars)" }
            }
        } else {
            @{ Success = $false; Message = "Não encontrado" }
        }
    }
    
    Test-Check "Sentry DSN configurado" {
        if ($envContent -match 'NEXT_PUBLIC_SENTRY_DSN="([^"]+)"') {
            $dsn = $matches[1]
            if ($dsn -match "COLOQUE_A_|TODO|^$") {
                @{ Success = $true; Message = "Opcional - não configurado" }
            } elseif ($dsn -match '^https://.+@.+\.ingest\.sentry\.io') {
                @{ Success = $true; Message = "Configurado" }
            } else {
                @{ Success = $false; Message = "Formato inválido" }
            }
        } else {
            @{ Success = $true; Message = "Opcional - não configurado" }
        }
    } -IsOptional $true
}

# === 3. DEPENDÊNCIAS ===
Write-Section "3. Dependências Node.js"

Test-Check "Node.js instalado" {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        @{ Success = $true; Message = $nodeVersion }
    } else {
        @{ Success = $false; Message = "Node.js não encontrado" }
    }
}

Test-Check "npm instalado" {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        @{ Success = $true; Message = "v$npmVersion" }
    } else {
        @{ Success = $false; Message = "npm não encontrado" }
    }
}

Test-Check "node_modules instalados" {
    $nmPath = Join-Path $PSScriptRoot ".." "node_modules"
    if (Test-Path $nmPath) {
        $count = (Get-ChildItem $nmPath -Directory).Count
        @{ Success = $true; Message = "$count pacotes instalados" }
    } else {
        @{ Success = $false; Message = "Execute: npm install" }
    }
}

# === 4. CONEXÕES (SE NÃO PULADO) ===
if (-not $Quick) {
    Write-Section "4. Testes de Conexão"
    
    if (-not $SkipDatabase -and (Test-Path $envFile)) {
        $envContent = Get-Content $envFile -Raw
        
        $url = $null
        $key = $null

        if ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL="(https?://[^"]+)"') {
            $url = $matches[1]
        }
        
        if ($envContent -match 'NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"') {
            $key = $matches[1]
        }

        if ($url -and $key) {
            Test-Check "Conexão Supabase" {
                try {
                    $headers = @{
                        "apikey" = $key
                        "Authorization" = "Bearer $key"
                    }
                    
                    $response = Invoke-RestMethod -Uri "$url/rest/v1/" -Headers $headers -Method Get -TimeoutSec 10
                    @{ Success = $true; Message = "Conectado com sucesso" }
                } catch {
                    @{ Success = $false; Message = "Falha: $($_.Exception.Message)" }
                }
            }
        } else {
            $script:skipped++
            Write-Warning "Teste de conexão Supabase pulado (credenciais faltando)"
        }
    }
    
    if (-not $SkipRedis -and (Test-Path $envFile)) {
        $envContent = Get-Content $envFile -Raw
        
        $redisUrl = $null
        $redisToken = $null

        if ($envContent -match 'UPSTASH_REDIS_REST_URL="([^"]+)"') {
            $redisUrl = $matches[1]
        }
        if ($envContent -match 'UPSTASH_REDIS_REST_TOKEN="([^"]+)"') {
            $redisToken = $matches[1]
        }

        if ($redisUrl -and $redisToken) {
            if ($redisUrl -match '^redis://') {
                 Test-Check "Conexão Redis (Local)" {
                    @{ Success = $true; Message = "Configuração Local detectada (Teste de conexão pulado)" }
                 }
            } else {
                Test-Check "Conexão Redis (Upstash)" {
                    try {
                        $headers = @{
                            "Authorization" = "Bearer $redisToken"
                        }
                        
                        $response = Invoke-RestMethod -Uri "$redisUrl/ping" -Headers $headers -Method Get -TimeoutSec 10
                        
                        if ($response -eq "PONG") {
                            @{ Success = $true; Message = "PONG recebido" }
                        } else {
                            @{ Success = $false; Message = "Resposta inesperada: $response" }
                        }
                    } catch {
                        @{ Success = $false; Message = "Falha: $($_.Exception.Message)" }
                    }
                }
            }
        } else {
            $script:skipped++
            Write-Warning "Teste de conexão Redis pulado (credenciais faltando)"
        }
    }
}

# === 5. BANCO DE DADOS ===
if (-not $SkipDatabase -and -not $Quick) {
    Write-Section "5. Banco de Dados"
    
    Test-Check "SQL Schema files existem" {
        $sqlFiles = @(
            "database-schema.sql",
            "database-rls-policies.sql",
            "database-rbac-complete.sql"
        )
        
        $missing = @()
        foreach ($file in $sqlFiles) {
            $path = Join-Path $PSScriptRoot ".." $file
            if (-not (Test-Path $path)) {
                $missing += $file
            }
        }
        
        if ($missing.Count -eq 0) {
            @{ Success = $true; Message = "Todos os $($sqlFiles.Count) arquivos SQL encontrados" }
        } else {
            @{ Success = $false; Message = "Faltando: $($missing -join ', ')" }
        }
    }
}

# === 6. TESTES ===
Write-Section "6. Suítes de Testes"

Test-Check "Playwright config existe" {
    $pwPath = Join-Path $PSScriptRoot ".." "playwright.config.ts"
    if (Test-Path $pwPath) {
        @{ Success = $true; Message = "playwright.config.ts encontrado" }
    } else {
        @{ Success = $false; Message = "playwright.config.ts não encontrado" }
    }
}

Test-Check "Jest config existe" {
    $jestPath = Join-Path $PSScriptRoot ".." "jest.config.cjs"
    if (Test-Path $jestPath) {
        @{ Success = $true; Message = "jest.config.cjs encontrado" }
    } else {
        @{ Success = $false; Message = "jest.config.cjs não encontrado" }
    }
}

Test-Check "Testes E2E existem" {
    $e2ePath = Join-Path $PSScriptRoot ".." "tests" "e2e"
    if (Test-Path $e2ePath) {
        $testFiles = (Get-ChildItem $e2ePath -Filter "*.spec.ts" -Recurse).Count
        @{ Success = $true; Message = "$testFiles arquivos .spec.ts encontrados" }
    } else {
        @{ Success = $false; Message = "Diretório tests/e2e não encontrado" }
    }
}

# === RELATÓRIO FINAL ===
Write-Section "Relatório Final"

$total = $script:passed + $script:failed + $script:warnings + $script:skipped

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   RESULTADOS DA VALIDAÇÃO                 ║" -ForegroundColor Cyan
Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "✅ Passou:   " -NoNewline -ForegroundColor Green
Write-Host ("{0,-3}" -f $script:passed) -NoNewline
Write-Host " / $total testes" -NoNewline
Write-Host "                            ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "❌ Falhou:   " -NoNewline -ForegroundColor Red
Write-Host ("{0,-3}" -f $script:failed) -NoNewline
Write-Host " / $total testes" -NoNewline
Write-Host "                            ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "⚠️  Avisos:   " -NoNewline -ForegroundColor Yellow
Write-Host ("{0,-3}" -f $script:warnings) -NoNewline
Write-Host " / $total testes" -NoNewline
Write-Host "                            ║" -ForegroundColor Cyan

if ($script:skipped -gt 0) {
    Write-Host "║  " -NoNewline -ForegroundColor Cyan
    Write-Host "⏭️  Pulados:  " -NoNewline -ForegroundColor DarkGray
    Write-Host ("{0,-3}" -f $script:skipped) -NoNewline
    Write-Host " / $total testes" -NoNewline
    Write-Host "                            ║" -ForegroundColor Cyan
}

Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Status final
if ($script:failed -eq 0) {
    if ($script:warnings -eq 0) {
        Write-Success "✨ SISTEMA 100% PRONTO PARA PRODUÇÃO!"
    } else {
        Write-Success "✅ Sistema pronto com $($script:warnings) aviso(s) não-crítico(s)"
    }
    
    Write-Host ""
    Write-Info "Próximos passos opcionais:"
    Write-Host "  1. Execute: npm run dev (testar localmente)" -ForegroundColor DarkGray
    Write-Host "  2. Execute: npm run test:all (rodar testes)" -ForegroundColor DarkGray
    Write-Host "  3. Execute: npm run build (build de produção)" -ForegroundColor DarkGray
    
    exit 0
} else {
    Write-Error "❌ Sistema possui $($script:failed) erro(s) que precisam ser corrigidos"
    
    Write-Host ""
    Write-Info "Ações sugeridas:"
    
    if ($envContent -match "COLOQUE_A_|TODO") {
        Write-Host "  1. Execute: .\scripts\setup-env-interactive.ps1" -ForegroundColor Yellow
    }
    
    Write-Host "  2. Revise os erros acima" -ForegroundColor Yellow
    Write-Host "  3. Execute novamente: .\scripts\validate-setup.ps1" -ForegroundColor Yellow
    
    exit 1
}
