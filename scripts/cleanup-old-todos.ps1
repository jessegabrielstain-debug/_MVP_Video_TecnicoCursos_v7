#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Remove ou arquiva arquivos legados com TODOs que foram substituídos

.DESCRIPTION
    Este script identifica e arquiva arquivos antigos que contêm TODOs mas foram
    substituídos por versões completas. Mantém histórico mas limpa workspace.

.PARAMETER DryRun
    Se especificado, apenas mostra o que seria feito sem executar

.PARAMETER ArchiveDir
    Diretório para arquivar arquivos (default: _Archive)

.EXAMPLE
    .\cleanup-old-todos.ps1
    Remove arquivos legados

.EXAMPLE
    .\cleanup-old-todos.ps1 -DryRun
    Simula remoção sem executar
#>

param(
    [switch]$DryRun,
    [string]$ArchiveDir = "_Archive"
)

# Cores para output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

# Banner
Write-Host "`n============================================" -ForegroundColor $ColorInfo
Write-Host "  CLEANUP OLD TODOs v1.0" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

if ($DryRun) {
    Write-Host "🔍 Modo DRY RUN - Nenhuma ação será executada`n" -ForegroundColor $ColorWarning
}

# Arquivos legados conhecidos
$legacyFiles = @(
    @{
        Path = "tests/e2e/rbac.spec.ts"
        Reason = "Substituído por tests/e2e/rbac-complete.spec.ts"
        Replacement = "tests/e2e/rbac-complete.spec.ts"
    }
)

$totalFiles = $legacyFiles.Count
$archivedCount = 0
$skippedCount = 0
$errorCount = 0

Write-Host "📋 Arquivos legados identificados: $totalFiles`n" -ForegroundColor $ColorInfo

foreach ($file in $legacyFiles) {
    $filePath = $file.Path
    $reason = $file.Reason
    $replacement = $file.Replacement
    
    Write-Host "📄 Analisando: $filePath" -ForegroundColor $ColorInfo
    Write-Host "   Motivo: $reason" -ForegroundColor DarkGray
    
    if (-not (Test-Path $filePath)) {
        Write-Host "   ⚠️  Arquivo não encontrado, pulando..." -ForegroundColor $ColorWarning
        $skippedCount++
        Write-Host ""
        continue
    }
    
    # Verificar se replacement existe
    if ($replacement -and -not (Test-Path $replacement)) {
        Write-Host "   ❌ Arquivo substituto não encontrado: $replacement" -ForegroundColor $ColorError
        Write-Host "   ⚠️  Não é seguro arquivar, pulando..." -ForegroundColor $ColorWarning
        $skippedCount++
        Write-Host ""
        continue
    }
    
    # Contar TODOs no arquivo
    $content = Get-Content $filePath -Raw
    $todoCount = ([regex]::Matches($content, "TODO|FIXME|HACK|XXX")).Count
    Write-Host "   📊 TODOs encontrados: $todoCount" -ForegroundColor DarkGray
    
    if ($DryRun) {
        Write-Host "   🔍 [DRY RUN] Seria arquivado para: $ArchiveDir/$filePath" -ForegroundColor $ColorWarning
        $archivedCount++
    } else {
        try {
            # Criar diretório de arquivo
            $archivePath = Join-Path $ArchiveDir $filePath
            $archiveParentDir = Split-Path $archivePath -Parent
            
            if (-not (Test-Path $archiveParentDir)) {
                New-Item -Path $archiveParentDir -ItemType Directory -Force | Out-Null
            }
            
            # Mover arquivo
            Move-Item -Path $filePath -Destination $archivePath -Force
            
            Write-Host "   ✅ Arquivado com sucesso!" -ForegroundColor $ColorSuccess
            Write-Host "   📁 Localização: $archivePath" -ForegroundColor DarkGray
            $archivedCount++
            
            # Criar arquivo .txt explicativo
            $readmePath = Join-Path $archiveParentDir "README.txt"
            $readmeContent = @"
ARQUIVOS ARQUIVADOS - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
================================================================

Este diretório contém arquivos legados que foram substituídos por
versões mais completas e funcionais.

Arquivo: $filePath
Motivo: $reason
Substituído por: $replacement
TODOs encontrados: $todoCount
Data de arquivamento: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Estes arquivos são mantidos para referência histórica mas não devem
ser usados em desenvolvimento ativo.

Para restaurar um arquivo:
  Move-Item "$archivePath" "$filePath"

"@
            if (-not (Test-Path $readmePath)) {
                Set-Content -Path $readmePath -Value $readmeContent
            } else {
                Add-Content -Path $readmePath -Value "`n---`n$readmeContent"
            }
            
        } catch {
            Write-Host "   ❌ Erro ao arquivar: $_" -ForegroundColor $ColorError
            $errorCount++
        }
    }
    
    Write-Host ""
}

# Resumo final
Write-Host "============================================" -ForegroundColor $ColorInfo
Write-Host "  RESUMO DA LIMPEZA" -ForegroundColor $ColorInfo
Write-Host "============================================`n" -ForegroundColor $ColorInfo

Write-Host "📊 Total analisado: $totalFiles" -ForegroundColor $ColorInfo
Write-Host "✅ Arquivados: $archivedCount" -ForegroundColor $ColorSuccess
Write-Host "⚠️  Pulados: $skippedCount" -ForegroundColor $ColorWarning
Write-Host "❌ Erros: $errorCount" -ForegroundColor $ColorError

if ($DryRun) {
    Write-Host "`n💡 Execute sem -DryRun para aplicar mudanças" -ForegroundColor $ColorWarning
} elseif ($archivedCount -gt 0) {
    Write-Host "`n✅ Limpeza concluída! Workspace mais organizado." -ForegroundColor $ColorSuccess
    Write-Host "📁 Arquivos mantidos em: $ArchiveDir" -ForegroundColor $ColorInfo
}

Write-Host "`n============================================`n" -ForegroundColor $ColorInfo

# Retornar código de saída
if ($errorCount -gt 0) {
    exit 1
} else {
    exit 0
}
