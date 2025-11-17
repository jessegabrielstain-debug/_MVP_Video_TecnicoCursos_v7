# ============================================
# Setup Fase 6 - E2E Testing & Monitoring
# ============================================
# Data: 17/11/2025
# Versão: v2.3.0
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MVP Video TécnicoCursos - Fase 6" -ForegroundColor Cyan
Write-Host "  E2E Testing & Monitoring Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Função: Check Prerequisites
# ============================================
function Test-Prerequisites {
    Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Yellow
    
    $errors = @()
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "  ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
    } catch {
        $errors += "Node.js não encontrado"
        Write-Host "  ❌ Node.js não encontrado" -ForegroundColor Red
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "  ✅ npm instalado: v$npmVersion" -ForegroundColor Green
    } catch {
        $errors += "npm não encontrado"
        Write-Host "  ❌ npm não encontrado" -ForegroundColor Red
    }
    
    # Check Playwright
    try {
        $playwrightVersion = npx playwright --version 2>$null
        if ($playwrightVersion -match "Version (\d+\.\d+\.\d+)") {
            Write-Host "  ✅ Playwright instalado: Version $($matches[1])" -ForegroundColor Green
        } else {
            $errors += "Playwright não instalado corretamente"
            Write-Host "  ⚠️  Playwright não instalado - será instalado" -ForegroundColor Yellow
        }
    } catch {
        $errors += "Playwright não encontrado"
        Write-Host "  ⚠️  Playwright não encontrado - será instalado" -ForegroundColor Yellow
    }
    
    # Check package.json
    if (Test-Path "package.json") {
        Write-Host "  ✅ package.json encontrado" -ForegroundColor Green
    } else {
        $errors += "package.json não encontrado - você está na raiz do projeto?"
        Write-Host "  ❌ package.json não encontrado" -ForegroundColor Red
    }
    
    Write-Host ""
    
    if ($errors.Count -gt 0) {
        Write-Host "❌ Erros encontrados:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "   - $error" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Por favor, corrija os erros acima antes de continuar." -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

# ============================================
# Função: Install Playwright
# ============================================
function Install-Playwright {
    Write-Host "📦 Instalando Playwright..." -ForegroundColor Yellow
    
    try {
        # Verificar se já está instalado
        $playwrightInstalled = npx playwright --version 2>$null
        
        if ($playwrightInstalled) {
            Write-Host "  ℹ️  Playwright já instalado" -ForegroundColor Cyan
            
            $response = Read-Host "  Deseja reinstalar browsers? (s/n)"
            if ($response -eq 's' -or $response -eq 'S') {
                Write-Host "  📥 Instalando browsers (Chromium, Firefox, WebKit)..." -ForegroundColor Yellow
                npx playwright install --with-deps
                Write-Host "  ✅ Browsers instalados com sucesso" -ForegroundColor Green
            }
        } else {
            Write-Host "  📥 Instalando dependências do projeto..." -ForegroundColor Yellow
            npm install
            
            Write-Host "  📥 Instalando Playwright e browsers..." -ForegroundColor Yellow
            npx playwright install --with-deps
            
            Write-Host "  ✅ Playwright instalado com sucesso" -ForegroundColor Green
        }
        
        # Verificar versão final
        $version = npx playwright --version
        Write-Host "  ℹ️  $version" -ForegroundColor Cyan
        
        return $true
    } catch {
        Write-Host "  ❌ Erro ao instalar Playwright: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Função: Check Test Users
# ============================================
function Test-TestUsers {
    Write-Host "👥 Verificando test users..." -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "  ⚠️  IMPORTANTE: Test users devem ser criados manualmente no Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Você criou os 4 test users no Supabase Dashboard?" -ForegroundColor Cyan
    Write-Host "    - test-admin@tecnicocursos.local" -ForegroundColor White
    Write-Host "    - test-editor@tecnicocursos.local" -ForegroundColor White
    Write-Host "    - test-viewer@tecnicocursos.local" -ForegroundColor White
    Write-Host "    - test-moderator@tecnicocursos.local" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "  Test users criados? (s/n)"
    
    if ($response -eq 's' -or $response -eq 'S') {
        Write-Host "  ✅ Test users confirmados" -ForegroundColor Green
        return $true
    } else {
        Write-Host ""
        Write-Host "  ℹ️  Para criar os test users, siga o guia:" -ForegroundColor Cyan
        Write-Host "     cat docs/setup/TEST_USERS_SETUP.md" -ForegroundColor White
        Write-Host ""
        Write-Host "  Ou acesse: https://supabase.com/dashboard" -ForegroundColor White
        Write-Host "  Navegue para: Projeto → Authentication → Users" -ForegroundColor White
        Write-Host ""
        return $false
    }
}

# ============================================
# Função: Run E2E Tests
# ============================================
function Invoke-E2ETests {
    param (
        [string]$Suite = "all"
    )
    
    Write-Host "🧪 Executando testes E2E..." -ForegroundColor Yellow
    Write-Host ""
    
    switch ($Suite) {
        "rbac" {
            Write-Host "  📋 Executando suite RBAC (25 testes)..." -ForegroundColor Cyan
            npm run test:e2e:rbac
        }
        "video" {
            Write-Host "  🎬 Executando suite Video Flow (15 testes)..." -ForegroundColor Cyan
            npx playwright test tests/e2e/video-flow.spec.ts
        }
        "all" {
            Write-Host "  📋 Executando todos os testes E2E (40 testes)..." -ForegroundColor Cyan
            npm run test:e2e
        }
        default {
            Write-Host "  ❌ Suite desconhecida: $Suite" -ForegroundColor Red
            return $false
        }
    }
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    
    if ($exitCode -eq 0) {
        Write-Host "  ✅ Testes executados com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  📊 Ver relatório HTML:" -ForegroundColor Cyan
        Write-Host "     npx playwright show-report" -ForegroundColor White
        Write-Host ""
        return $true
    } else {
        Write-Host "  ❌ Alguns testes falharam (código $exitCode)" -ForegroundColor Red
        Write-Host ""
        Write-Host "  🔍 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "     1. Verificar se test users foram criados" -ForegroundColor White
        Write-Host "     2. Verificar se SQL RBAC foi executado" -ForegroundColor White
        Write-Host "     3. Ver logs em test-results/" -ForegroundColor White
        Write-Host "     4. Ver guia: docs/setup/TEST_USERS_SETUP.md" -ForegroundColor White
        Write-Host ""
        Write-Host "  📊 Ver relatório de falhas:" -ForegroundColor Cyan
        Write-Host "     npx playwright show-report" -ForegroundColor White
        Write-Host ""
        return $false
    }
}

# ============================================
# Função: Show Report
# ============================================
function Show-TestReport {
    Write-Host "📊 Abrindo relatório HTML..." -ForegroundColor Yellow
    
    try {
        npx playwright show-report
        return $true
    } catch {
        Write-Host "  ❌ Erro ao abrir relatório: $_" -ForegroundColor Red
        Write-Host "  ℹ️  Execute os testes primeiro: npm run test:e2e" -ForegroundColor Cyan
        return $false
    }
}

# ============================================
# Função: Test Monitoring
# ============================================
function Test-Monitoring {
    Write-Host "📡 Testando monitoramento sintético..." -ForegroundColor Yellow
    Write-Host ""
    
    if (-not (Test-Path "scripts/monitoring/synthetic-api-monitor.js")) {
        Write-Host "  ❌ Script de monitoramento não encontrado" -ForegroundColor Red
        return $false
    }
    
    Write-Host "  ℹ️  Executando script de monitoramento..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        node scripts/monitoring/synthetic-api-monitor.js
        
        Write-Host ""
        Write-Host "  ✅ Monitoramento executado com sucesso" -ForegroundColor Green
        Write-Host ""
        Write-Host "  📄 Relatórios gerados:" -ForegroundColor Cyan
        
        $jsonReport = Get-ChildItem -Path . -Filter "synthetic-monitor-report-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $mdReport = Get-ChildItem -Path . -Filter "synthetic-monitor-report-*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if ($jsonReport) {
            Write-Host "     - $($jsonReport.Name)" -ForegroundColor White
        }
        if ($mdReport) {
            Write-Host "     - $($mdReport.Name)" -ForegroundColor White
        }
        
        Write-Host ""
        
        return $true
    } catch {
        Write-Host "  ❌ Erro ao executar monitoramento: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Função: Show Menu
# ============================================
function Show-Menu {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  MENU - Fase 6 Setup" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Instalar/Verificar Playwright" -ForegroundColor White
    Write-Host "  2. Verificar Test Users (manual)" -ForegroundColor White
    Write-Host "  3. Executar Testes E2E - RBAC (25 testes)" -ForegroundColor White
    Write-Host "  4. Executar Testes E2E - Video Flow (15 testes)" -ForegroundColor White
    Write-Host "  5. Executar Todos Testes E2E (40 testes)" -ForegroundColor White
    Write-Host "  6. Ver Relatório HTML dos Testes" -ForegroundColor White
    Write-Host "  7. Testar Monitoramento Sintético" -ForegroundColor White
    Write-Host "  8. Abrir Documentação Completa" -ForegroundColor White
    Write-Host "  0. Sair" -ForegroundColor White
    Write-Host ""
}

# ============================================
# Função: Open Documentation
# ============================================
function Open-Documentation {
    Write-Host "📚 Abrindo documentação..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Documentos disponíveis:" -ForegroundColor Cyan
    Write-Host "    1. Guia de Setup Test Users (docs/setup/TEST_USERS_SETUP.md)" -ForegroundColor White
    Write-Host "    2. Documentação Técnica Fase 6 (FASE_6_E2E_SETUP_PRONTO.md)" -ForegroundColor White
    Write-Host "    3. Resumo Executivo (FASE_6_RESUMO_EXECUTIVO_FINAL.md)" -ForegroundColor White
    Write-Host "    4. Próximos Passos (PROXIMOS_PASSOS_FASE_6.md)" -ForegroundColor White
    Write-Host "    5. Release Notes (RELEASE_v2.3.0.md)" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "  Qual documento deseja abrir? (1-5)"
    
    $docPath = switch ($response) {
        "1" { "docs/setup/TEST_USERS_SETUP.md" }
        "2" { "FASE_6_E2E_SETUP_PRONTO.md" }
        "3" { "FASE_6_RESUMO_EXECUTIVO_FINAL.md" }
        "4" { "PROXIMOS_PASSOS_FASE_6.md" }
        "5" { "RELEASE_v2.3.0.md" }
        default { $null }
    }
    
    if ($docPath -and (Test-Path $docPath)) {
        Write-Host ""
        Write-Host "  📄 Abrindo: $docPath" -ForegroundColor Cyan
        Write-Host ""
        
        # Try to open with default editor
        try {
            Invoke-Item $docPath
        } catch {
            # Fallback to cat
            Get-Content $docPath | Out-Host
        }
    } else {
        Write-Host "  ❌ Documento não encontrado ou opção inválida" -ForegroundColor Red
    }
}

# ============================================
# Main Script
# ============================================

# Check prerequisites first
if (-not (Test-Prerequisites)) {
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "  Escolha uma opção"
    
    Write-Host ""
    
    switch ($choice) {
        "1" {
            Install-Playwright
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "2" {
            Test-TestUsers
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "3" {
            Invoke-E2ETests -Suite "rbac"
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "4" {
            Invoke-E2ETests -Suite "video"
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "5" {
            Invoke-E2ETests -Suite "all"
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "6" {
            Show-TestReport
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "7" {
            Test-Monitoring
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "8" {
            Open-Documentation
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "0" {
            Write-Host "👋 Até logo!" -ForegroundColor Cyan
            Write-Host ""
            break
        }
        default {
            Write-Host "❌ Opção inválida. Por favor, escolha uma opção do menu." -ForegroundColor Red
            Write-Host ""
            Write-Host "Pressione qualquer tecla para continuar..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
} while ($choice -ne "0")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fase 6 - Setup Concluído" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "   - docs/setup/TEST_USERS_SETUP.md" -ForegroundColor White
Write-Host "   - FASE_6_E2E_SETUP_PRONTO.md" -ForegroundColor White
Write-Host "   - PROXIMOS_PASSOS_FASE_6.md" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Comandos úteis:" -ForegroundColor Yellow
Write-Host "   npm run test:e2e              # Todos E2E" -ForegroundColor White
Write-Host "   npm run test:e2e:rbac         # Suite RBAC" -ForegroundColor White
Write-Host "   npx playwright show-report    # Relatório" -ForegroundColor White
Write-Host ""
Write-Host "✅ MVP Video TécnicoCursos v2.3.0 - Fase 6 Completa" -ForegroundColor Green
Write-Host ""
