#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verificação pré-commit para garantir qualidade do código

.DESCRIPTION
    Este script executa verificações automáticas antes de permitir commit:
    - Verifica se há TODOs no código
    - Verifica se há credenciais expostas
    - Verifica se há console.log esquecidos
    - Roda linter
    - Roda testes (opcional)

.PARAMETER SkipTests
    Pula execução de testes (mais rápido)

.PARAMETER SkipLint
    Pula linter (não recomendado)

.EXAMPLE
    .\pre-commit-check.ps1
    Executa todas as verificações

.EXAMPLE
    .\pre-commit-check.ps1 -SkipTests
    Executa verificações sem rodar testes
#>

param(
    [switch]$SkipTests,
    [switch]$SkipLint
)

# Cores
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

# Banner
Write-Host "`n============================================" -ForegroundColor $ColorInfo
Write-Host "  PRE-COMMIT CHECK v1.0" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

$totalChecks = 0
$passedChecks = 0
$failedChecks = 0
$warningChecks = 0

# Função para rodar check
function Run-Check {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [ValidateSet("error", "warning")]
        [string]$Level = "error"
    )
    
    $script:totalChecks++
    Write-Host "🔍 Verificando: $Name..." -ForegroundColor $ColorInfo
    
    try {
        $result = & $Check
        if ($result -eq $true -or $result -eq 0 -or $result -eq $null) {
            Write-Host "   ✅ OK" -ForegroundColor $ColorSuccess
            $script:passedChecks++
            return $true
        } else {
            if ($Level -eq "error") {
                Write-Host "   ❌ FALHOU: $result" -ForegroundColor $ColorError
                $script:failedChecks++
                return $false
            } else {
                Write-Host "   ⚠️  AVISO: $result" -ForegroundColor $ColorWarning
                $script:warningChecks++
                return $true
            }
        }
    } catch {
        Write-Host "   ❌ ERRO: $_" -ForegroundColor $ColorError
        $script:failedChecks++
        return $false
    }
}

# Check 1: Verificar TODOs no código staged
$check1 = Run-Check -Name "TODOs no código staged" -Check {
    $staged = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.(ts|tsx|js|jsx)$' }
    if ($staged) {
        $todos = $staged | ForEach-Object { git diff --cached $_ | Select-String -Pattern "TODO|FIXME|HACK|XXX" }
        if ($todos) {
            return "Encontrados TODOs no código staged. Remova ou documente no issue tracker."
        }
    }
    return $true
}

# Check 2: Verificar credenciais expostas
$check2 = Run-Check -Name "Credenciais expostas" -Check {
    $staged = git diff --cached --name-only --diff-filter=ACM
    if ($staged) {
        $patterns = @(
            "SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"](?!COLOQUE_A_|your_)",
            "UPSTASH_REDIS_REST_TOKEN\s*=\s*['\"](?!COLOQUE_A_|your_)",
            "SENTRY_DSN\s*=\s*https://[a-f0-9]+@",
            "-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----",
            "api[_-]?key\s*=\s*['\"][a-zA-Z0-9]{20,}",
            "password\s*=\s*['\"][^'\"]{8,}"
        )
        
        foreach ($pattern in $patterns) {
            $matches = $staged | ForEach-Object { git diff --cached $_ | Select-String -Pattern $pattern }
            if ($matches) {
                return "CREDENCIAIS EXPOSTAS DETECTADAS! Não commite secrets!"
            }
        }
    }
    return $true
}

# Check 3: Verificar console.log esquecidos
$check3 = Run-Check -Name "console.log esquecidos" -Level "warning" -Check {
    $staged = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.(ts|tsx|js|jsx)$' }
    if ($staged) {
        $consoleLogs = $staged | ForEach-Object { git diff --cached $_ | Select-String -Pattern "console\.(log|debug|info)" }
        if ($consoleLogs) {
            return "Encontrados console.log no código. Considere remover para produção."
        }
    }
    return $true
}

# Check 4: Verificar arquivos grandes
$check4 = Run-Check -Name "Arquivos grandes" -Check {
    $staged = git diff --cached --name-only --diff-filter=ACM
    if ($staged) {
        foreach ($file in $staged) {
            if (Test-Path $file) {
                $size = (Get-Item $file).Length / 1MB
                if ($size -gt 5) {
                    return "Arquivo grande detectado: $file ($([math]::Round($size, 2)) MB). Considere Git LFS."
                }
            }
        }
    }
    return $true
}

# Check 5: Verificar .env.local não está sendo commitado
$check5 = Run-Check -Name ".env.local não commitado" -Check {
    $staged = git diff --cached --name-only --diff-filter=ACM
    if ($staged -contains ".env.local") {
        return ".env.local NÃO DEVE ser commitado! Use git reset HEAD .env.local"
    }
    return $true
}

# Check 6: Rodar linter (opcional)
if (-not $SkipLint) {
    $check6 = Run-Check -Name "ESLint" -Level "warning" -Check {
        if (Test-Path "estudio_ia_videos/app") {
            Push-Location "estudio_ia_videos/app"
            try {
                $output = npm run lint 2>&1
                if ($LASTEXITCODE -ne 0) {
                    return "Linter encontrou problemas. Execute: npm run lint -- --fix"
                }
            } finally {
                Pop-Location
            }
        }
        return $true
    }
}

# Check 7: Rodar testes (opcional)
if (-not $SkipTests) {
    Write-Host "`n🧪 Executando testes rápidos..." -ForegroundColor $ColorInfo
    
    $check7 = Run-Check -Name "Testes unitários" -Level "warning" -Check {
        if (Test-Path "estudio_ia_videos/app") {
            Push-Location "estudio_ia_videos/app"
            try {
                $output = npm test -- --passWithNoTests --bail 2>&1
                if ($LASTEXITCODE -ne 0) {
                    return "Testes falharam. Execute: npm test"
                }
            } finally {
                Pop-Location
            }
        }
        return $true
    }
}

# Check 8: Verificar commit message (se possível)
$check8 = Run-Check -Name "Commit message format" -Level "warning" -Check {
    # Este check é informativo apenas, pois message ainda não foi escrita
    Write-Host "   💡 Lembre-se de seguir conventional commits:" -ForegroundColor DarkGray
    Write-Host "      feat: nova feature" -ForegroundColor DarkGray
    Write-Host "      fix: correção de bug" -ForegroundColor DarkGray
    Write-Host "      docs: documentação" -ForegroundColor DarkGray
    Write-Host "      chore: tarefas diversas" -ForegroundColor DarkGray
    return $true
}

# Resumo final
Write-Host "`n============================================" -ForegroundColor $ColorInfo
Write-Host "  RESUMO DAS VERIFICAÇÕES" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

Write-Host "📊 Total de checks: $totalChecks" -ForegroundColor $ColorInfo
Write-Host "✅ Passaram: $passedChecks" -ForegroundColor $ColorSuccess
Write-Host "⚠️  Avisos: $warningChecks" -ForegroundColor $ColorWarning
Write-Host "❌ Falharam: $failedChecks" -ForegroundColor $ColorError

if ($failedChecks -gt 0) {
    Write-Host "`n❌ PRE-COMMIT CHECK FALHOU!" -ForegroundColor $ColorError
    Write-Host "   Corrija os erros acima antes de commitar." -ForegroundColor $ColorError
    Write-Host "`n💡 Para pular estas verificações (não recomendado):" -ForegroundColor $ColorWarning
    Write-Host "   git commit --no-verify" -ForegroundColor DarkGray
    Write-Host "`n============================================`n" -ForegroundColor $ColorInfo
    exit 1
}

if ($warningChecks -gt 0) {
    Write-Host "`n⚠️  PRE-COMMIT CHECK COM AVISOS" -ForegroundColor $ColorWarning
    Write-Host "   Revise os avisos, mas commit pode prosseguir." -ForegroundColor $ColorWarning
}

if ($failedChecks -eq 0 -and $warningChecks -eq 0) {
    Write-Host "`n✅ PRE-COMMIT CHECK PASSOU!" -ForegroundColor $ColorSuccess
    Write-Host "   Código pronto para commit." -ForegroundColor $ColorSuccess
}

Write-Host "`n============================================`n" -ForegroundColor $ColorInfo
exit 0
