# Lighthouse Performance Audit Script
# Executa auditoria de performance, acessibilidade, SEO e best practices

param(
    [Parameter(Mandatory=$false)]
    [string]$Url = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("mobile", "desktop", "both")]
    [string]$Device = "both",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "evidencias/lighthouse",
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenReport
)

$ErrorActionPreference = "Stop"

# Cores
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "========================================" -ForegroundColor $Cyan
Write-Host "  Lighthouse Performance Audit" -ForegroundColor $Cyan
Write-Host "========================================" -ForegroundColor $Cyan
Write-Host ""

# Verificar se lighthouse está instalado
if (-not (Get-Command lighthouse -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Lighthouse não encontrado!" -ForegroundColor $Red
    Write-Host "Instale com: npm install -g lighthouse" -ForegroundColor $Yellow
    exit 1
}

# Criar diretório de output
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputPath = Join-Path $PSScriptRoot "..\$OutputDir\$timestamp"
if (-not (Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
}

Write-Host "📁 Output: $outputPath" -ForegroundColor $Cyan
Write-Host "🌐 URL: $Url" -ForegroundColor $Cyan
Write-Host ""

# Função para executar Lighthouse
function Invoke-LighthouseAudit {
    param(
        [string]$Url,
        [string]$FormFactor,
        [string]$OutputPath
    )
    
    $reportName = "lighthouse-$FormFactor-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $htmlReport = Join-Path $OutputPath "$reportName.html"
    $jsonReport = Join-Path $OutputPath "$reportName.json"
    
    Write-Host "🔍 Auditando ($FormFactor)..." -ForegroundColor $Yellow
    
    $lighthouseArgs = @(
        $Url,
        "--output=html",
        "--output=json",
        "--output-path=$htmlReport",
        "--form-factor=$FormFactor",
        "--chrome-flags=`"--headless --no-sandbox --disable-dev-shm-usage`"",
        "--quiet"
    )
    
    if ($FormFactor -eq "mobile") {
        $lighthouseArgs += "--emulated-device=`"Moto G4`""
    }
    else {
        $lighthouseArgs += "--preset=desktop"
    }
    
    try {
        $output = & lighthouse @lighthouseArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Auditoria $FormFactor concluída" -ForegroundColor $Green
            
            # Ler scores do JSON
            if (Test-Path $jsonReport) {
                $report = Get-Content $jsonReport | ConvertFrom-Json
                $scores = $report.categories
                
                Write-Host ""
                Write-Host "📊 Scores ($FormFactor):" -ForegroundColor $Cyan
                Write-Host "  Performance:    $([math]::Round($scores.performance.score * 100))%" -ForegroundColor $(if ($scores.performance.score -ge 0.9) { $Green } elseif ($scores.performance.score -ge 0.5) { $Yellow } else { $Red })
                Write-Host "  Accessibility:  $([math]::Round($scores.accessibility.score * 100))%" -ForegroundColor $(if ($scores.accessibility.score -ge 0.9) { $Green } elseif ($scores.accessibility.score -ge 0.5) { $Yellow } else { $Red })
                Write-Host "  Best Practices: $([math]::Round($scores.'best-practices'.score * 100))%" -ForegroundColor $(if ($scores.'best-practices'.score -ge 0.9) { $Green } elseif ($scores.'best-practices'.score -ge 0.5) { $Yellow } else { $Red })
                Write-Host "  SEO:            $([math]::Round($scores.seo.score * 100))%" -ForegroundColor $(if ($scores.seo.score -ge 0.9) { $Green } elseif ($scores.seo.score -ge 0.5) { $Yellow } else { $Red })
                Write-Host ""
                
                return @{
                    Success = $true
                    HtmlReport = $htmlReport
                    JsonReport = $jsonReport
                    Scores = $scores
                }
            }
        }
        else {
            Write-Host "❌ Falha na auditoria $FormFactor" -ForegroundColor $Red
            Write-Host $output -ForegroundColor $Red
            return @{ Success = $false }
        }
    }
    catch {
        Write-Host "❌ Erro ao executar Lighthouse: $_" -ForegroundColor $Red
        return @{ Success = $false }
    }
}

# Executar auditorias
$reports = @()

if ($Device -eq "mobile" -or $Device -eq "both") {
    $mobileReport = Invoke-LighthouseAudit -Url $Url -FormFactor "mobile" -OutputPath $outputPath
    if ($mobileReport.Success) {
        $reports += $mobileReport
    }
}

if ($Device -eq "desktop" -or $Device -eq "both") {
    $desktopReport = Invoke-LighthouseAudit -Url $Url -FormFactor "desktop" -OutputPath $outputPath
    if ($desktopReport.Success) {
        $reports += $desktopReport
    }
}

# Gerar resumo markdown
if ($reports.Count -gt 0) {
    $summaryPath = Join-Path $outputPath "RESUMO.md"
    $summary = @"
# Lighthouse Audit - $timestamp

**URL:** $Url  
**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

"@
    
    foreach ($report in $reports) {
        $formFactor = if ($report.HtmlReport -match "mobile") { "📱 Mobile" } else { "🖥️ Desktop" }
        $scores = $report.Scores
        
        $summary += @"

## $formFactor

| Métrica | Score | Status |
|---------|-------|--------|
| Performance | $([math]::Round($scores.performance.score * 100))% | $(if ($scores.performance.score -ge 0.9) { "✅" } elseif ($scores.performance.score -ge 0.5) { "⚠️" } else { "❌" }) |
| Accessibility | $([math]::Round($scores.accessibility.score * 100))% | $(if ($scores.accessibility.score -ge 0.9) { "✅" } elseif ($scores.accessibility.score -ge 0.5) { "⚠️" } else { "❌" }) |
| Best Practices | $([math]::Round($scores.'best-practices'.score * 100))% | $(if ($scores.'best-practices'.score -ge 0.9) { "✅" } elseif ($scores.'best-practices'.score -ge 0.5) { "⚠️" } else { "❌" }) |
| SEO | $([math]::Round($scores.seo.score * 100))% | $(if ($scores.seo.score -ge 0.9) { "✅" } elseif ($scores.seo.score -ge 0.5) { "⚠️" } else { "❌" }) |

**Relatório HTML:** [Ver Relatório]($(Split-Path -Leaf $report.HtmlReport))

---

"@
    }
    
    $summary += @"

## 🎯 Metas de Performance

| Métrica | Meta | Atual | Status |
|---------|------|-------|--------|
| Performance | ≥90% | $(if ($reports.Count -gt 0) { [math]::Round(($reports[0].Scores.performance.score) * 100) } else { "N/A" })% | $(if ($reports.Count -gt 0 -and $reports[0].Scores.performance.score -ge 0.9) { "✅" } else { "❌" }) |
| Accessibility | ≥90% | $(if ($reports.Count -gt 0) { [math]::Round(($reports[0].Scores.accessibility.score) * 100) } else { "N/A" })% | $(if ($reports.Count -gt 0 -and $reports[0].Scores.accessibility.score -ge 0.9) { "✅" } else { "❌" }) |
| Best Practices | ≥90% | $(if ($reports.Count -gt 0) { [math]::Round(($reports[0].Scores.'best-practices'.score) * 100) } else { "N/A" })% | $(if ($reports.Count -gt 0 -and $reports[0].Scores.'best-practices'.score -ge 0.9) { "✅" } else { "❌" }) |
| SEO | ≥90% | $(if ($reports.Count -gt 0) { [math]::Round(($reports[0].Scores.seo.score) * 100) } else { "N/A" })% | $(if ($reports.Count -gt 0 -and $reports[0].Scores.seo.score -ge 0.9) { "✅" } else { "❌" }) |

## 📋 Próximos Passos

### Performance
- [ ] Otimizar imagens (WebP, lazy loading)
- [ ] Implementar code splitting
- [ ] Configurar cache headers
- [ ] Minificar CSS/JS

### Accessibility
- [ ] Adicionar textos alt em imagens
- [ ] Melhorar contraste de cores
- [ ] Garantir navegação por teclado
- [ ] ARIA labels em componentes

### Best Practices
- [ ] Implementar HTTPS
- [ ] CSP (Content Security Policy)
- [ ] Remover console.logs em produção
- [ ] Validar bibliotecas vulneráveis

### SEO
- [ ] Meta tags completas
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Open Graph tags

---

_Gerado por: scripts/lighthouse-audit.ps1_
"@
    
    Set-Content -Path $summaryPath -Value $summary -Encoding UTF8
    Write-Host "📄 Resumo salvo: $summaryPath" -ForegroundColor $Green
    
    # Abrir relatório se solicitado
    if ($OpenReport -and $reports.Count -gt 0) {
        Start-Process $reports[0].HtmlReport
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor $Cyan
Write-Host "✅ Auditoria Lighthouse Concluída" -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Cyan
Write-Host ""
Write-Host "📁 Relatórios: $outputPath" -ForegroundColor $Cyan
Write-Host ""
Write-Host "Para abrir relatório:" -ForegroundColor $Yellow
Write-Host "  .\scripts\lighthouse-audit.ps1 -OpenReport" -ForegroundColor $Yellow
