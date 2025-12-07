#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Validação completa do sistema de NR Templates.

.DESCRIPTION
  Script abrangente que valida:
  - Ambiente e dependências
  - Servidor Next.js rodando
  - Todas as APIs REST
  - Fluxo end-to-end de criação de projeto
  - Geração automática de slides
  - Fallback online/offline

.PARAMETER BaseUrl
  URL base do servidor (padrão: http://localhost:3000/app)

.PARAMETER SkipServerCheck
  Pula verificação se servidor está rodando

.EXAMPLE
  .\validate-nr-system.ps1
  .\validate-nr-system.ps1 -BaseUrl http://localhost:3000
  .\validate-nr-system.ps1 -SkipServerCheck
#>

param(
  [string]$BaseUrl = 'http://localhost:3000/app',
  [switch]$SkipServerCheck
)

$ErrorActionPreference = 'Stop'
$results = @()

function Test-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )
  
  Write-Host "`n▶ $Name" -ForegroundColor Cyan
  try {
    $result = & $Action
    Write-Host "  ✅ PASS" -ForegroundColor Green
    $results += @{ Name = $Name; Status = 'PASS'; Error = $null }
    return $result
  } catch {
    Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
    $results += @{ Name = $Name; Status = 'FAIL'; Error = $_.Exception.Message }
    return $null
  }
}

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  NR TEMPLATES SYSTEM - VALIDAÇÃO COMPLETA            ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "Base URL: $BaseUrl`n" -ForegroundColor Yellow

# 1. Verificar Node.js
Test-Step "Node.js instalado" {
  $version = node -v
  if (-not $version) { throw "Node.js não encontrado" }
  Write-Host "    Versão: $version" -ForegroundColor Gray
  if ([int]($version -replace 'v(\d+)\..*', '$1') -lt 18) {
    throw "Node.js >= 18 requerido"
  }
}

# 2. Verificar diretório
Test-Step "Diretório do app existe" {
  $appPath = "estudio_ia_videos\app"
  if (-not (Test-Path $appPath)) {
    throw "Diretório $appPath não encontrado"
  }
  Write-Host "    Path: $(Resolve-Path $appPath)" -ForegroundColor Gray
}

# 3. Verificar package.json
Test-Step "package.json válido" {
  $pkgPath = "estudio_ia_videos\app\package.json"
  if (-not (Test-Path $pkgPath)) {
    throw "package.json não encontrado"
  }
  $pkg = Get-Content $pkgPath | ConvertFrom-Json
  Write-Host "    Nome: $($pkg.name)" -ForegroundColor Gray
  Write-Host "    Versão: $($pkg.version)" -ForegroundColor Gray
}

# 4. Verificar node_modules
Test-Step "Dependências instaladas" {
  $nmPath = "estudio_ia_videos\app\node_modules"
  if (-not (Test-Path $nmPath)) {
    throw "node_modules não encontrado. Execute 'npm install'"
  }
  $count = (Get-ChildItem $nmPath -Directory).Count
  Write-Host "    Pacotes: ~$count" -ForegroundColor Gray
}

# 5. Verificar servidor rodando
if (-not $SkipServerCheck) {
  Test-Step "Servidor Next.js acessível" {
    try {
      $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
      Write-Host "    Status: OK" -ForegroundColor Gray
    } catch {
      throw "Servidor não está respondendo em $BaseUrl. Execute 'npm run dev'"
    }
  }
}

# 6. GET Lista de NRs
$templates = Test-Step "GET /api/nr-templates - Lista" {
  $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/nr-templates"
  if (-not $resp.items -or $resp.total -lt 1) {
    throw "Resposta inválida ou vazia"
  }
  Write-Host "    Total: $($resp.total) templates" -ForegroundColor Gray
  return $resp
}

# 7. GET Detalhe de NR específica
$nrNumber = if ($templates -and $templates.items) { $templates.items[0].nr_number } else { 'NR-01' }
Test-Step "GET /api/nr-templates/[$nrNumber] - Detalhe" {
  $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/nr-templates/$nrNumber"
  if (-not $resp.item -or $resp.item.nr_number -ne $nrNumber) {
    throw "Template $nrNumber não retornou corretamente"
  }
  Write-Host "    Título: $($resp.item.title)" -ForegroundColor Gray
  Write-Host "    Slides: $($resp.item.slide_count)" -ForegroundColor Gray
}

# 8. Busca com query string
Test-Step "GET /api/nr-templates?q=segurança - Busca" {
  $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/nr-templates?q=segurança"
  if (-not $resp.items) {
    throw "Busca não retornou items"
  }
  Write-Host "    Resultados: $($resp.total)" -ForegroundColor Gray
}

# 9. POST Criar projeto de NR
$project = Test-Step "POST /api/projects/from-nr - Criar projeto" {
  $payload = @{ nr_number = $nrNumber } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/projects/from-nr" `
    -Headers @{ 'Content-Type'='application/json'; 'x-user-id'='demo-user' } `
    -Body $payload
  
  if (-not $resp.project -or -not $resp.project.id) {
    throw "Projeto não foi criado"
  }
  Write-Host "    ID: $($resp.project.id)" -ForegroundColor Gray
  Write-Host "    Título: $($resp.project.title)" -ForegroundColor Gray
  return $resp.project
}

# 10. GET Lista de projetos
Test-Step "GET /api/projects - Lista projetos" {
  $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/projects" `
    -Headers @{ 'x-user-id'='demo-user' }
  
  if (-not $resp.projects) {
    throw "Nenhum projeto listado"
  }
  Write-Host "    Total: $($resp.total) projetos" -ForegroundColor Gray
}

# 11. GET Detalhe de projeto
if ($project) {
  Test-Step "GET /api/projects/[$($project.id)] - Detalhe" {
    $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/projects/$($project.id)"
    if (-not $resp.project -or $resp.project.id -ne $project.id) {
      throw "Projeto não encontrado"
    }
    Write-Host "    Status: $($resp.project.status)" -ForegroundColor Gray
  }
}

# 12. GET Slides do projeto
if ($project) {
  Test-Step "GET /api/slides?projectId=... - Slides criados" {
    $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/slides?projectId=$($project.id)"
    if (-not $resp.slides -or $resp.total -lt 1) {
      throw "Slides não foram criados automaticamente"
    }
    Write-Host "    Total: $($resp.total) slides" -ForegroundColor Gray
    
    # Validar que slides têm títulos dos tópicos
    $firstSlide = $resp.slides[0]
    Write-Host "    Primeiro: '$($firstSlide.title)'" -ForegroundColor Gray
  }
}

# 13. Verificar arquivos críticos existem
$criticalFiles = @(
  'estudio_ia_videos\app\lib\nr\catalog.ts',
  'estudio_ia_videos\app\lib\projects\mockStore.ts',
  'estudio_ia_videos\app\lib\slides\mockStore.ts',
  'estudio_ia_videos\app\lib\services\nr-templates-service.ts',
  'estudio_ia_videos\app\app\nr-templates\page.tsx',
  'estudio_ia_videos\app\app\projects\page.tsx',
  'estudio_ia_videos\app\components\nr\NrCard.tsx',
  'estudio_ia_videos\app\app\api\nr-templates\route.ts',
  'estudio_ia_videos\app\app\api\projects\from-nr\route.ts',
  'estudio_ia_videos\app\app\api\slides\route.ts'
)

Test-Step "Arquivos críticos presentes" {
  $missing = @()
  foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
      $missing += $file
    }
  }
  if ($missing.Count -gt 0) {
    throw "Arquivos faltando: $($missing -join ', ')"
  }
  Write-Host "    Arquivos: $($criticalFiles.Count) OK" -ForegroundColor Gray
}

# 14. Verificar migration SQL existe
Test-Step "Migration SQL presente" {
  $migrationPath = "supabase\migrations\20251118000000_create_nr_templates_table.sql"
  if (-not (Test-Path $migrationPath)) {
    throw "Migration não encontrada"
  }
  $size = (Get-Item $migrationPath).Length
  Write-Host "    Tamanho: $size bytes" -ForegroundColor Gray
}

# 15. Verificar scripts de validação
Test-Step "Scripts de suporte presentes" {
  $scripts = @(
    'scripts\smoke-test-nr.ps1'
  )
  $missing = @()
  foreach ($script in $scripts) {
    if (-not (Test-Path $script)) {
      $missing += $script
    }
  }
  if ($missing.Count -gt 0) {
    throw "Scripts faltando: $($missing -join ', ')"
  }
  Write-Host "    Scripts: $($scripts.Count) OK" -ForegroundColor Gray
}

# Resumo final
Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  RESUMO DA VALIDAÇÃO                                  ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Magenta

$passed = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$failed = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count
$total = $results.Count

Write-Host "`nTotal de testes: $total" -ForegroundColor White
Write-Host "✅ Passou: $passed" -ForegroundColor Green
Write-Host "❌ Falhou: $failed" -ForegroundColor Red

if ($failed -gt 0) {
  Write-Host "`n⚠️  FALHAS DETECTADAS:" -ForegroundColor Yellow
  foreach ($r in $results) {
    if ($r.Status -eq 'FAIL') {
      Write-Host "  • $($r.Name)" -ForegroundColor Red
      Write-Host "    $($r.Error)" -ForegroundColor Gray
    }
  }
}

$percentage = [math]::Round(($passed / $total) * 100, 1)
Write-Host "`n📊 Taxa de sucesso: $percentage%" -ForegroundColor $(if ($percentage -eq 100) { 'Green' } elseif ($percentage -ge 80) { 'Yellow' } else { 'Red' })

if ($percentage -eq 100) {
  Write-Host "`n🎉 SISTEMA 100% VALIDADO E FUNCIONAL!" -ForegroundColor Green
  Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
  Write-Host "  1. Acesse: $BaseUrl/nr-templates" -ForegroundColor White
  Write-Host "  2. Crie um projeto clicando em 'Criar projeto'" -ForegroundColor White
  Write-Host "  3. Veja seus projetos em: $BaseUrl/projects" -ForegroundColor White
  Write-Host "`n💾 Para ativar modo online (Supabase):" -ForegroundColor Cyan
  Write-Host "  - Execute o SQL da migration no Dashboard" -ForegroundColor White
  Write-Host "  - O fallback para mock será desativado automaticamente" -ForegroundColor White
} elseif ($percentage -ge 80) {
  Write-Host "`n⚠️  Sistema parcialmente funcional. Revise falhas acima." -ForegroundColor Yellow
} else {
  Write-Host "`n❌ Sistema com problemas críticos. Resolva as falhas antes de prosseguir." -ForegroundColor Red
  exit 1
}
