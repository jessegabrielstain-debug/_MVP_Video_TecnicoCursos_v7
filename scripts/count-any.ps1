# Script: count-any.ps1
# Purpose: Contar ocorrências de 'any' e '@ts-nocheck' em arquivos TypeScript
# Usage: .\scripts\count-any.ps1 [-Detailed] [-Top n]

param(
  [switch]$Detailed,
  [int]$Top = 20
)

$rootPath = "estudio_ia_videos/app"
$workspaceRoot = Split-Path -Parent $PSScriptRoot

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Contador de 'any' e '@ts-nocheck' - MVP Video TécnicoCursos   " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Mudar para o diretório do workspace
Push-Location $workspaceRoot

# Contar total de ocorrências de 'any'
Write-Host "Contando ocorrências de 'any'..." -ForegroundColor Yellow
$anyMatches = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path $rootPath | 
              Select-String -Pattern '\bany\b'
$anyCount = ($anyMatches | Measure-Object).Count

# Contar arquivos com '@ts-nocheck'
Write-Host "Contando arquivos com '@ts-nocheck'..." -ForegroundColor Yellow
$noCheckFiles = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path $rootPath | 
                Select-String -Pattern '// @ts-nocheck' -List
$noCheckCount = ($noCheckFiles | Measure-Object).Count

# Baseline (13/01/2025)
$baselineAny = 4734
$baselineNoCheck = 37

# Calcular progresso
$anyReduction = $baselineAny - $anyCount
$anyPercent = [math]::Round(($anyReduction / $baselineAny) * 100, 2)

$noCheckReduction = $baselineNoCheck - $noCheckCount
$noCheckPercent = [math]::Round(($noCheckReduction / $baselineNoCheck) * 100, 2)

# Exibir resultados
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    RESULTADOS GERAIS                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Ocorrências de 'any': " -NoNewline
Write-Host "$anyCount" -ForegroundColor $(if ($anyCount -lt $baselineAny) { "Green" } else { "Red" }) -NoNewline
Write-Host " (Baseline: $baselineAny)"

Write-Host "  Redução: " -NoNewline
Write-Host "$anyReduction" -ForegroundColor $(if ($anyReduction -gt 0) { "Green" } else { "Yellow" }) -NoNewline
Write-Host " ($anyPercent%)"
Write-Host ""

Write-Host "  Arquivos com '@ts-nocheck': " -NoNewline
Write-Host "$noCheckCount" -ForegroundColor $(if ($noCheckCount -lt $baselineNoCheck) { "Green" } else { "Red" }) -NoNewline
Write-Host " (Baseline: $baselineNoCheck)"

Write-Host "  Redução: " -NoNewline
Write-Host "$noCheckReduction" -ForegroundColor $(if ($noCheckReduction -gt 0) { "Green" } else { "Yellow" }) -NoNewline
Write-Host " ($noCheckPercent%)"
Write-Host ""

# Se -Detailed, mostrar top arquivos com mais 'any'
if ($Detailed) {
  Write-Host ""
  Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║              TOP $Top ARQUIVOS COM MAIS 'any'                 ║" -ForegroundColor Cyan
  Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""

  $fileGroups = $anyMatches | Group-Object Path | 
                Sort-Object Count -Descending | 
                Select-Object -First $Top

  $index = 1
  foreach ($group in $fileGroups) {
    $relativePath = $group.Name.Replace($workspaceRoot, "").TrimStart("\").Replace("\", "/")
    $count = $group.Count
    
    Write-Host "  $index. " -NoNewline
    Write-Host "$relativePath" -ForegroundColor Yellow
    Write-Host "     Ocorrências: " -NoNewline
    Write-Host "$count" -ForegroundColor $(if ($count -gt 50) { "Red" } elseif ($count -gt 20) { "Yellow" } else { "Green" })
    
    $index++
  }

  # Listar arquivos com @ts-nocheck
  if ($noCheckCount -gt 0) {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║            ARQUIVOS COM '@ts-nocheck' ($noCheckCount total)              ║" -ForegroundColor Magenta
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    $index = 1
    foreach ($file in $noCheckFiles) {
      $relativePath = $file.Path.Replace($workspaceRoot, "").TrimStart("\").Replace("\", "/")
      Write-Host "  $index. " -NoNewline
      Write-Host "$relativePath" -ForegroundColor Magenta
      $index++
    }
  }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Salvar em JSON para rastreamento histórico
$reportPath = "evidencias/fase-1/any-report-$(Get-Date -Format 'yyyy-MM-dd').json"
$reportDir = Split-Path $reportPath -Parent

if (!(Test-Path $reportDir)) {
  New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$report = @{
  timestamp = (Get-Date -Format "o")
  any = @{
    current = $anyCount
    baseline = $baselineAny
    reduction = $anyReduction
    percentReduction = $anyPercent
  }
  tsNoCheck = @{
    current = $noCheckCount
    baseline = $baselineNoCheck
    reduction = $noCheckReduction
    percentReduction = $noCheckPercent
  }
} | ConvertTo-Json -Depth 10

Set-Content -Path $reportPath -Value $report
Write-Host "Relatório salvo em: $reportPath" -ForegroundColor Green

Pop-Location
