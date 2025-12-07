# Script para adicionar export const dynamic = 'force-dynamic' em rotas que usam headers/session

$routesWithHeaders = @(
    "app/api/comments/stats/route.ts",
    "app/api/analytics/user/route.ts",
    "app/api/analytics/dashboard/route.ts",
    "app/api/dashboard/unified-stats/route.ts",
    "app/api/compliance/metrics/route.ts",
    "app/api/analytics/user-metrics/route.ts",
    "app/api/analytics/system-metrics/route.ts",
    "app/api/render/queue/route.ts",
    "app/api/review/status/route.ts",
    "app/api/review/stats/route.ts",
    "app/api/render/stats/route.ts",
    "app/api/external/media/search/route.ts",
    "app/api/v1/timeline/multi-track/history/route.ts",
    "app/api/v1/timeline/multi-track/analytics/route.ts"
)

$workspaceRoot = "c:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\estudio_ia_videos"

foreach ($route in $routesWithHeaders) {
    $filePath = Join-Path $workspaceRoot $route
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Verifica se já tem dynamic
        if ($content -notmatch "export const dynamic = 'force-dynamic'") {
            # Adiciona na primeira linha após imports/comentários
            if ($content -match "^((?:\/\/.*\n|\/\*[\s\S]*?\*\/\n|\n)*)(import .*)") {
                $newContent = $content -replace "^((?:\/\/.*\n|\/\*[\s\S]*?\*\/\n|\n)*)(import .*)", "`$1export const dynamic = 'force-dynamic';`n`n`$2"
                Set-Content $filePath $newContent -NoNewline
                Write-Host "✓ Adicionado dynamic em: $route" -ForegroundColor Green
            } else {
                Write-Host "⚠ Não encontrado padrão de import em: $route" -ForegroundColor Yellow
            }
        } else {
            Write-Host "- Já possui dynamic: $route" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Arquivo não encontrado: $route" -ForegroundColor Red
    }
}

Write-Host "`n✓ Processamento concluído!" -ForegroundColor Cyan
