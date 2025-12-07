# Sistema de Migração de Banco de Dados

Este projeto utiliza um sistema de migração customizado baseado em arquivos SQL e uma função RPC no Supabase.

## Pré-requisitos

Para que o sistema de migração funcione via scripts automatizados, é necessário criar a função `exec_sql` no banco de dados. Esta função permite a execução de SQL dinâmico via API.

### Passo 1: Habilitar RPC `exec_sql`

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard).
2. Vá para o **SQL Editor**.
3. Crie uma nova query.
4. Cole o conteúdo do arquivo `scripts/create-exec-sql.sql`:

```sql
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
```

5. Execute a query.

## Como Usar

### Criar uma Nova Migração

1. Crie um arquivo `.sql` na pasta `supabase/migrations/`.
2. O nome do arquivo deve seguir o padrão: `YYYYMMDDHHMMSS_nome_da_migracao.sql`.
   - Exemplo: `20251130120000_add_users_table.sql`

### Aplicar Migrações

Execute o script de migração:

```bash
npx tsx scripts/migrate-db.ts
```

O script irá:
1. Verificar se a tabela `_migrations` existe (e criar se não existir).
2. Ler todos os arquivos em `supabase/migrations/`.
3. Verificar quais já foram aplicados.
4. Aplicar as migrações pendentes em ordem cronológica.
5. Registrar o sucesso na tabela `_migrations`.

## Estrutura de Arquivos

- `scripts/migrate-db.ts`: Script executor das migrações.
- `supabase/migrations/`: Diretório contendo os arquivos SQL.
- `scripts/create-exec-sql.sql`: Script para criar a função RPC necessária.

## Segurança

A função `exec_sql` é `SECURITY DEFINER`, o que significa que ela roda com privilégios elevados. Certifique-se de que apenas a `service_role` key (usada nos scripts de backend) tenha permissão para executá-la, ou que ela não esteja exposta publicamente via API para usuários anônimos/autenticados (o padrão do Supabase é expor, então cuidado).

Para restringir o acesso (Recomendado):

```sql
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
```
