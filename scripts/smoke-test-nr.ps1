param(
  [string]$BaseUrl = 'http://localhost:3000/app'
)

Write-Host "== NR Templates: GET list ==" -ForegroundColor Cyan
$list = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/nr-templates" -ErrorAction Stop
($list | ConvertTo-Json -Depth 5)

# Suporta diferentes formatos: {items}, {templates} ou array direto
if ($list -is [System.Array]) {
  $templates = $list
} elseif ($list.items) {
  $templates = $list.items
} elseif ($list.templates) {
  $templates = $list.templates
} else {
  throw "Lista vazia ou formato inesperado"
}

if (-not $templates -or $templates.Count -eq 0) { throw "Lista de templates vazia" }

$nr = $templates[0].nr_number
Write-Host "\n== NR Template detail ($nr) ==" -ForegroundColor Cyan
$detail = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/nr-templates/$nr" -ErrorAction Stop
($detail | ConvertTo-Json -Depth 5)

Write-Host "\n== Create project from NR ($nr) ==" -ForegroundColor Cyan
$payload = @{ nr_number = $nr } | ConvertTo-Json
$proj = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/projects/from-nr" -Headers @{ 'Content-Type'='application/json'; 'x-user-id'='demo-user' } -Body $payload -ErrorAction Stop
($proj | ConvertTo-Json -Depth 5)

if (-not $proj.project.id) { throw "Projeto não retornou id" }

Write-Host "\n== List projects ==" -ForegroundColor Cyan
$projs = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/projects" -Headers @{ 'x-user-id'='demo-user' } -ErrorAction Stop
($projs | ConvertTo-Json -Depth 5)

if ($projs.total -lt 1) { throw "Nenhum projeto listado" }

Write-Host "\n== List slides for created project ==" -ForegroundColor Cyan
$slides = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/slides?projectId=$($proj.project.id)" -ErrorAction Stop
($slides | ConvertTo-Json -Depth 5)
if (-not $slides.slides -or $slides.total -lt 1) { throw "Nenhum slide criado automaticamente" }

Write-Host "\nSmoke test concluído com sucesso." -ForegroundColor Green
