# Auditoria Supabase – Estúdio IA Vídeos

Este guia mostra como usar o script `migrate-to-supabase.ps1` para inspecionar ou migrar dados do projeto Supabase `ofhzrdiadxigrvmrhaiz`.

## Pré-requisitos

- PowerShell 7+ (Windows, Linux ou macOS)
- Chave pública (anon) já embutida no script
- **Opcional**: service role key do Supabase para habilitar escrita

## Uso básico (somente leitura)

```pwsh
cd C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7
./migrate-to-supabase.ps1 -ReportPath .\supabase-audit.json
```

O script faz:

1. Teste de conexão com a API REST
2. Inventário das tabelas disponíveis
3. Leitura dos modelos de avatar e perfis de voz
4. Tentativa de acessar tabelas sensíveis (`render_jobs`, `avatar_analytics`, `system_stats`) – o resultado indica se há restrição
5. Geração de um relatório JSON (opcional) com tudo que foi detectado

## Habilitando escrita (service role)

Para criar/atualizar organização, projeto demo e métricas do sistema, forneça a service role key:

```pwsh
$serviceKey = "coloque_aqui_sua_service_role"
./migrate-to-supabase.ps1 -UseServiceKey -ServiceKey $serviceKey -ReportPath .\supabase-audit.json
```

> ⚠️ A service role key concede acesso total. Armazene-a com segurança e não faça commit do valor real no repositório.

## Estrutura do relatório JSON

Exemplo de chaves presentes em `supabase-audit.json`:

- `timestamp`: Momento em que a auditoria foi executada
- `mode`: `anon` ou `service_role`
- `connection_ok`: status da conexão
- `tables`: lista das rotas REST disponíveis
- `resources.avatars` e `resources.voices`: amostra das entidades lidas
- `operations`: resultado das operações de leitura/escrita (ok, restricted, error)

O arquivo pode ser versionado como histórico de auditorias ou consumido por ferramentas externas.

## Troubleshooting

- **401/403**: a tabela requer autenticação ou política RLS – execute com `-UseServiceKey`
- **404**: rota não disponível para o perfil atual ou tabela não existe
- **429**: limite de requisições. Aguarde alguns segundos e tente novamente
- **SSL/TLS**: certifique-se de que o relógio do sistema está correto

## Próximos passos sugeridos

- Automatizar a execução em pipeline CI para gerar snapshots recorrentes
- Expandir o relatório com estatísticas adicionais quando a service role estiver disponível
- Integrar o dashboard `dashboard-supabase.html` com o JSON gerado para visualização offline
