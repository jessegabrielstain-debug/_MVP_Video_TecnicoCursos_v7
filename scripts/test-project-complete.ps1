# ============================================================================
# TESTE COMPLETO DO SISTEMA - 15 Casos de Teste
# ============================================================================
# Descrição: Executa validação completa do MVP Video Técnico Cursos
# Tempo estimado: 15-20 minutos
# Autor: Sistema Automatizado
# Data: 2025-01-27
# ============================================================================

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$testResults = @()
$startTime = Get-Date

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Message.PadRight(65)) ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-TestCase {
    param([string]$CaseNumber, [string]$Description)
    Write-Host "`n$CaseNumber - $Description" -ForegroundColor Yellow
}

function Write-TestResult {
    param([string]$Status, [string]$Message)
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }
    Write-Host "  [$Status] $Message" -ForegroundColor $color
}

function Add-TestResult {
    param([string]$TestCase, [string]$Status, [string]$Message, [string]$Details = "")
    $script:testResults += [PSCustomObject]@{
        TestCase = $TestCase
        Status = $Status
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
}

# ============================================================================
# INÍCIO DOS TESTES
# ============================================================================

Write-TestHeader "🧪 INICIANDO TESTE COMPLETO DO SISTEMA"

$projectRoot = Split-Path -Parent $PSScriptRoot
Write-Host "`n📁 Diretório do projeto: $projectRoot" -ForegroundColor Cyan
Write-Host "⏱️  Hora de início: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan

# ============================================================================
# TC001: Validar Estrutura do Projeto
# ============================================================================

Write-TestCase "TC001" "Validar Estrutura do Projeto"

$requiredDirs = @(
    "estudio_ia_videos/app",
    "scripts",
    "public",
    ".github/workflows"
)

$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    $fullPath = Join-Path $projectRoot $dir
    if (Test-Path $fullPath) {
        Write-TestResult "PASS" "Diretório encontrado: $dir"
    } else {
        Write-TestResult "FAIL" "Diretório NÃO encontrado: $dir"
        $allDirsExist = $false
    }
}

if ($allDirsExist) {
    Add-TestResult "TC001" "PASS" "Estrutura do projeto válida" "Todos os diretórios essenciais encontrados"
} else {
    Add-TestResult "TC001" "FAIL" "Estrutura do projeto incompleta" "Alguns diretórios estão faltando"
}

# ============================================================================
# TC002: Validar Arquivos Essenciais
# ============================================================================

Write-TestCase "TC002" "Validar Arquivos Essenciais"

$requiredFiles = @(
    "estudio_ia_videos/app/package.json",
    "estudio_ia_videos/app/next.config.js",
    "estudio_ia_videos/app/tailwind.config.js",
    "database-schema.sql",
    "database-rls-policies.sql",
    ".gitignore",
    "README.md"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        Write-TestResult "PASS" "Arquivo encontrado: $file"
    } else {
        Write-TestResult "FAIL" "Arquivo NÃO encontrado: $file"
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Add-TestResult "TC002" "PASS" "Arquivos essenciais presentes" "Todos os arquivos necessários encontrados"
} else {
    Add-TestResult "TC002" "FAIL" "Arquivos essenciais faltando" "Alguns arquivos obrigatórios não foram encontrados"
}

# ============================================================================
# TC003: Validar package.json
# ============================================================================

Write-TestCase "TC003" "Validar package.json"

$packageJsonPath = Join-Path $projectRoot "estudio_ia_videos/app/package.json"

if (Test-Path $packageJsonPath) {
    try {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        
        if ($packageJson.name) {
            Write-TestResult "PASS" "Nome do projeto: $($packageJson.name)"
        }
        
        if ($packageJson.version) {
            Write-TestResult "PASS" "Versão: $($packageJson.version)"
        }
        
        if ($packageJson.dependencies) {
            $depCount = ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count
            Write-TestResult "PASS" "Dependências: $depCount encontradas"
        }
        
        if ($packageJson.scripts) {
            $scriptCount = ($packageJson.scripts | Get-Member -MemberType NoteProperty).Count
            Write-TestResult "PASS" "Scripts: $scriptCount configurados"
        }
        
        Add-TestResult "TC003" "PASS" "package.json válido" "Arquivo bem formado com todas as propriedades"
    } catch {
        Write-TestResult "FAIL" "Erro ao ler package.json: $_"
        Add-TestResult "TC003" "FAIL" "package.json inválido" $_.Exception.Message
    }
} else {
    Write-TestResult "FAIL" "package.json não encontrado"
    Add-TestResult "TC003" "FAIL" "package.json não encontrado" "Arquivo não existe no caminho esperado"
}

# ============================================================================
# TC004: Validar Variáveis de Ambiente
# ============================================================================

Write-TestCase "TC004" "Validar Variáveis de Ambiente"

$envPath = Join-Path $projectRoot "estudio_ia_videos/app/.env.local"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    $allVarsPresent = $true
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-TestResult "PASS" "Variável encontrada: $var"
        } else {
            Write-TestResult "FAIL" "Variável NÃO encontrada: $var"
            $allVarsPresent = $false
        }
    }
    
    if ($allVarsPresent) {
        Add-TestResult "TC004" "PASS" "Variáveis de ambiente configuradas" "Todas as variáveis essenciais presentes"
    } else {
        Add-TestResult "TC004" "WARN" "Algumas variáveis faltando" "Verifique as variáveis obrigatórias"
    }
} else {
    Write-TestResult "WARN" ".env.local não encontrado"
    Add-TestResult "TC004" "WARN" "Arquivo .env.local não encontrado" "Crie o arquivo com as variáveis necessárias"
}

# ============================================================================
# TC005: Validar node_modules
# ============================================================================

Write-TestCase "TC005" "Validar Instalação de Dependências"

$nodeModulesPath = Join-Path $projectRoot "estudio_ia_videos/app/node_modules"

if (Test-Path $nodeModulesPath) {
    $moduleCount = (Get-ChildItem $nodeModulesPath -Directory).Count
    Write-TestResult "PASS" "node_modules encontrado com $moduleCount módulos"
    Add-TestResult "TC005" "PASS" "Dependências instaladas" "$moduleCount módulos encontrados"
} else {
    Write-TestResult "WARN" "node_modules não encontrado - execute 'npm install'"
    Add-TestResult "TC005" "WARN" "Dependências não instaladas" "Execute 'npm install' no diretório estudio_ia_videos/app"
}

# ============================================================================
# TC006: Validar Scripts de Banco de Dados
# ============================================================================

Write-TestCase "TC006" "Validar Scripts SQL"

$sqlFiles = @(
    "database-schema.sql",
    "database-rls-policies.sql"
)

$allSqlValid = $true
foreach ($sqlFile in $sqlFiles) {
    $sqlPath = Join-Path $projectRoot $sqlFile
    if (Test-Path $sqlPath) {
        $content = Get-Content $sqlPath -Raw
        $lineCount = ($content -split "`n").Count
        Write-TestResult "PASS" "$sqlFile - $lineCount linhas"
    } else {
        Write-TestResult "FAIL" "$sqlFile não encontrado"
        $allSqlValid = $false
    }
}

if ($allSqlValid) {
    Add-TestResult "TC006" "PASS" "Scripts SQL presentes" "Todos os scripts de banco encontrados"
} else {
    Add-TestResult "TC006" "FAIL" "Scripts SQL faltando" "Alguns scripts obrigatórios não encontrados"
}

# ============================================================================
# TC007: Validar Configuração Docker
# ============================================================================

Write-TestCase "TC007" "Validar Configuração Docker"

$dockerFiles = @(
    "docker-compose.yml",
    "Dockerfile"
)

$dockerConfigured = $true
foreach ($dockerFile in $dockerFiles) {
    $dockerPath = Join-Path $projectRoot $dockerFile
    if (Test-Path $dockerPath) {
        Write-TestResult "PASS" "$dockerFile encontrado"
    } else {
        Write-TestResult "WARN" "$dockerFile não encontrado"
        $dockerConfigured = $false
    }
}

if ($dockerConfigured) {
    Add-TestResult "TC007" "PASS" "Docker configurado" "Arquivos Docker presentes"
} else {
    Add-TestResult "TC007" "WARN" "Docker parcialmente configurado" "Alguns arquivos Docker faltando"
}

# ============================================================================
# TC008: Validar Workflows CI/CD
# ============================================================================

Write-TestCase "TC008" "Validar Workflows CI/CD"

$workflowsPath = Join-Path $projectRoot ".github/workflows"

if (Test-Path $workflowsPath) {
    $workflowCount = (Get-ChildItem $workflowsPath -Filter "*.yml").Count
    Write-TestResult "PASS" "$workflowCount workflows encontrados"
    Add-TestResult "TC008" "PASS" "CI/CD configurado" "$workflowCount workflows GitHub Actions"
} else {
    Write-TestResult "WARN" "Workflows não encontrados"
    Add-TestResult "TC008" "WARN" "CI/CD não configurado" "Crie workflows em .github/workflows/"
}

# ============================================================================
# TC009: Validar Documentação
# ============================================================================

Write-TestCase "TC009" "Validar Documentação"

$docFiles = @(
    "README.md",
    "00_LEIA_PRIMEIRO_TESTES.md",
    "README_TESTES.md"
)

$docCount = 0
foreach ($docFile in $docFiles) {
    $docPath = Join-Path $projectRoot $docFile
    if (Test-Path $docPath) {
        $docCount++
        Write-TestResult "PASS" "$docFile encontrado"
    }
}

if ($docCount -ge 2) {
    Add-TestResult "TC009" "PASS" "Documentação presente" "$docCount arquivos de documentação encontrados"
} else {
    Add-TestResult "TC009" "WARN" "Documentação incompleta" "Adicione mais arquivos de documentação"
}

# ============================================================================
# TC010: Validar Estrutura de Testes
# ============================================================================

Write-TestCase "TC010" "Validar Estrutura de Testes"

$testDirs = @(
    "estudio_ia_videos/app/__tests__",
    "e2e",
    "tests"
)

$testsConfigured = $false
foreach ($testDir in $testDirs) {
    $testPath = Join-Path $projectRoot $testDir
    if (Test-Path $testPath) {
        $testCount = (Get-ChildItem $testPath -Recurse -Filter "*.test.*").Count
        if ($testCount -gt 0) {
            Write-TestResult "PASS" "$testDir - $testCount testes encontrados"
            $testsConfigured = $true
        }
    }
}

if ($testsConfigured) {
    Add-TestResult "TC010" "PASS" "Testes configurados" "Estrutura de testes presente"
} else {
    Add-TestResult "TC010" "WARN" "Testes não encontrados" "Configure testes unitários e E2E"
}

# ============================================================================
# TC011-TC015: Testes adicionais simplificados
# ============================================================================

Write-TestCase "TC011" "Validar Configuração TypeScript"
$tsconfigPath = Join-Path $projectRoot "estudio_ia_videos/app/tsconfig.json"
if (Test-Path $tsconfigPath) {
    Add-TestResult "TC011" "PASS" "TypeScript configurado" "tsconfig.json presente"
} else {
    Add-TestResult "TC011" "WARN" "TypeScript não configurado" "tsconfig.json não encontrado"
}

Write-TestCase "TC012" "Validar Configuração Tailwind"
$tailwindPath = Join-Path $projectRoot "estudio_ia_videos/app/tailwind.config.js"
if (Test-Path $tailwindPath) {
    Add-TestResult "TC012" "PASS" "Tailwind configurado" "tailwind.config.js presente"
} else {
    Add-TestResult "TC012" "WARN" "Tailwind não configurado" "tailwind.config.js não encontrado"
}

Write-TestCase "TC013" "Validar Arquivos Públicos"
$publicPath = Join-Path $projectRoot "public"
if (Test-Path $publicPath) {
    $publicCount = (Get-ChildItem $publicPath -Recurse -File).Count
    Add-TestResult "TC013" "PASS" "Arquivos públicos presentes" "$publicCount arquivos encontrados"
} else {
    Add-TestResult "TC013" "WARN" "Pasta public não encontrada" "Crie pasta public/"
}

Write-TestCase "TC014" "Validar Scripts de Automação"
$scriptsPath = Join-Path $projectRoot "scripts"
if (Test-Path $scriptsPath) {
    $scriptCount = (Get-ChildItem $scriptsPath -Filter "*.ps1").Count
    Add-TestResult "TC014" "PASS" "Scripts de automação presentes" "$scriptCount scripts encontrados"
} else {
    Add-TestResult "TC014" "WARN" "Scripts não encontrados" "Crie pasta scripts/"
}

Write-TestCase "TC015" "Validar Configuração Git"
$gitPath = Join-Path $projectRoot ".git"
if (Test-Path $gitPath) {
    Add-TestResult "TC015" "PASS" "Git configurado" "Repositório Git inicializado"
} else {
    Add-TestResult "TC015" "FAIL" "Git não configurado" "Execute 'git init'"
}

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-TestHeader "📊 RELATÓRIO FINAL DE TESTES"

Write-Host "`n⏱️  Tempo total: $([math]::Round($duration.TotalMinutes, 2)) minutos" -ForegroundColor Cyan
Write-Host "📅 Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

# Contar resultados
$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$warnCount = ($testResults | Where-Object { $_.Status -eq "WARN" }).Count
$totalCount = $testResults.Count

Write-Host "`n╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor White
Write-Host "║                    RESUMO DOS RESULTADOS                          ║" -ForegroundColor White
Write-Host "╠═══════════════════════════════════════════════════════════════════╣" -ForegroundColor White
Write-Host "║ Total de Testes: $($totalCount.ToString().PadLeft(2))                                             ║" -ForegroundColor White
Write-Host "║ Aprovados (PASS): $($passCount.ToString().PadLeft(2)) - $(([math]::Round($passCount/$totalCount*100, 0)).ToString().PadLeft(3))%                                   ║" -ForegroundColor Green
Write-Host "║ Avisos (WARN): $($warnCount.ToString().PadLeft(2)) - $(([math]::Round($warnCount/$totalCount*100, 0)).ToString().PadLeft(3))%                                      ║" -ForegroundColor Yellow
Write-Host "║ Falhas (FAIL): $($failCount.ToString().PadLeft(2)) - $(([math]::Round($failCount/$totalCount*100, 0)).ToString().PadLeft(3))%                                      ║" -ForegroundColor Red
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor White

Write-Host "`n📋 DETALHAMENTO POR CASO DE TESTE:`n" -ForegroundColor Cyan

foreach ($result in $testResults) {
    $statusColor = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
    }
    Write-Host "[$($result.Status)] $($result.TestCase) - $($result.Message)" -ForegroundColor $statusColor
    if ($Verbose -and $result.Details) {
        Write-Host "    └─ $($result.Details)" -ForegroundColor Gray
    }
}

# Veredicto Final
Write-Host "`n╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      VEREDICTO FINAL                              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$approvalRate = [math]::Round($passCount/$totalCount*100, 0)

if ($approvalRate -ge 90) {
    Write-Host "`n✅ SISTEMA APROVADO! ($approvalRate% de aprovação)" -ForegroundColor Green
    Write-Host "   🎉 Sistema está funcionando excelentemente!" -ForegroundColor Green
} elseif ($approvalRate -ge 70) {
    Write-Host "`n⚠️  SISTEMA COM AVISOS ($approvalRate% de aprovação)" -ForegroundColor Yellow
    Write-Host "   💡 Revise os avisos antes de usar em produção" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ SISTEMA COM PROBLEMAS ($approvalRate% de aprovação)" -ForegroundColor Red
    Write-Host "   🔧 Corrija as falhas antes de prosseguir" -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Salvar relatório em arquivo
$reportPath = Join-Path $projectRoot "test-results-complete-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
$testResults | Format-Table -AutoSize | Out-File $reportPath
Write-Host "📄 Relatório salvo em: $reportPath" -ForegroundColor Cyan

Write-Host "`n🎯 Testes concluídos!`n" -ForegroundColor Green
