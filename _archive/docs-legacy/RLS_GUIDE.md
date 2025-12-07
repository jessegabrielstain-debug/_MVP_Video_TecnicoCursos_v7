# 🔐 Guia de Configuração RLS (Row Level Security)

**Data:** 09/10/2025

---

## 📋 O que é RLS?

**Row Level Security (RLS)** é um sistema de segurança do PostgreSQL/Supabase que permite controlar o acesso a linhas específicas de uma tabela baseado no usuário autenticado.

### 🎯 Benefícios
- ✅ Proteção automática de dados por usuário
- ✅ Não precisa filtrar manualmente nas queries
- ✅ Previne vazamento de dados entre usuários
- ✅ Segurança em nível de banco de dados

---

## 🚀 Como Aplicar as Políticas RLS

### Opção 1: Via Dashboard Supabase (Recomendado)

1. **Acesse o SQL Editor:**
   ```
   https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/editor
   ```

2. **Cole o SQL:**
   - Abra o arquivo `database-rls-policies.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"**

3. **Verifique:**
   - Vá para "Authentication" > "Policies"
   - Você verá todas as políticas criadas

### Opção 2: Via psql

```powershell
psql "postgresql://postgres:Tr1unf0%40@db.ofhzrdiadxigrvmrhaiz.supabase.co:5432/postgres" -f database-rls-policies.sql
```

---

## 📊 Políticas Criadas

### 🔹 Tabela: `users`
- ✅ Usuários só veem seus próprios dados
- ✅ Usuários só podem atualizar seus próprios dados

### 🔹 Tabela: `projects`
- ✅ Usuários só veem seus próprios projetos
- ✅ Usuários podem criar projetos
- ✅ Usuários podem atualizar/deletar apenas seus projetos

### 🔹 Tabela: `slides`
- ✅ Usuários veem slides apenas de seus projetos
- ✅ Usuários podem criar/editar/deletar slides de seus projetos

### 🔹 Tabela: `render_jobs`
- ✅ Usuários veem render jobs apenas de seus projetos
- ✅ Usuários podem criar/atualizar jobs de seus projetos

### 🔹 Tabela: `analytics_events`
- ✅ Usuários veem apenas seus eventos
- ✅ Usuários autenticados podem criar eventos

### 🔹 Tabelas: `nr_courses` e `nr_modules`
- ✅ **Público:** Todos podem visualizar (incluindo anônimos)
- ✅ **Admin:** Apenas admins podem criar/editar/deletar

---

## 🔑 Sistema de Permissões Admin

### Como Tornar um Usuário Admin

**Via Dashboard Supabase:**

1. Acesse: `Authentication` > `Users`
2. Clique no usuário
3. Vá para "User Metadata"
4. Adicione em `app_metadata`:
   ```json
   {
     "role": "admin"
   }
   ```
5. Salve

**Via SQL:**

```sql
-- Substituir 'user-uuid' pelo ID do usuário
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE id = 'user-uuid';
```

---

## 🧪 Testando as Políticas

### Teste 1: Criar Usuário e Projeto

```javascript
// No seu código JavaScript/TypeScript
const { data: { user } } = await supabase.auth.signUp({
  email: 'teste@example.com',
  password: 'senha123'
});

// Criar um projeto (será automaticamente vinculado ao usuário)
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'Meu Projeto',
    description: 'Teste de RLS'
  })
  .select();
```

### Teste 2: Verificar Isolamento de Dados

```javascript
// Como usuário A
const { data } = await supabase
  .from('projects')
  .select('*');

// Retornará APENAS projetos do usuário A
// Projetos de outros usuários não aparecem
```

### Teste 3: Tentar Acessar Dados de Outro Usuário

```javascript
// Tentar acessar projeto de outro usuário
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', 'outro-usuario-project-uuid');

// Retornará vazio ou erro - RLS bloqueia!
```

---

## ⚠️ Casos Especiais

### Acesso de Service Role

```javascript
// Service Role bypassa RLS - use com CUIDADO!
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Bypassa RLS
);

// Útil para:
// - Operações administrativas
// - Processos background
// - Migrações de dados
```

### Conteúdo Público

```javascript
// Cursos NR são públicos - podem ser acessados sem login
const { data } = await supabase
  .from('nr_courses')
  .select('*, nr_modules(*)')
  .eq('course_code', 'NR12');

// Funciona mesmo sem autenticação!
```

---

## 📚 Estrutura das Políticas

### Formato Padrão

```sql
CREATE POLICY "policy_name" ON table_name
    FOR operation          -- SELECT, INSERT, UPDATE, DELETE, ALL
    USING (condition)      -- Quando o usuário pode VER
    WITH CHECK (condition) -- Quando o usuário pode MODIFICAR
```

### Exemplo Comentado

```sql
-- Política para visualizar projetos
CREATE POLICY "Users can view own projects" 
ON public.projects
    FOR SELECT                    -- Operação de leitura
    USING (auth.uid() = user_id); -- Somente se auth.uid() = user_id
```

---

## 🔍 Funções Úteis do Supabase Auth

| Função | Descrição | Exemplo |
|--------|-----------|---------|
| `auth.uid()` | ID do usuário atual | `auth.uid() = user_id` |
| `auth.role()` | Role do usuário | `auth.role() = 'authenticated'` |
| `auth.jwt()` | Token JWT completo | `auth.jwt() -> 'app_metadata'` |
| `auth.email()` | Email do usuário | `auth.email() = 'admin@example.com'` |

---

## 🐛 Troubleshooting

### Problema: "Permission Denied"

**Causa:** RLS está bloqueando a operação

**Solução:**
1. Verifique se o usuário está autenticado
2. Verifique se a política existe para aquela operação
3. Verifique se a condição da política é verdadeira

```sql
-- Ver políticas de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

### Problema: "Infinite Recursion"

**Causa:** Política fazendo referência circular

**Solução:**
```sql
-- Use SECURITY DEFINER nas funções auxiliares
CREATE OR REPLACE FUNCTION funcao()
RETURNS ... AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Problema: Usuários veem dados de outros

**Causa:** RLS não está habilitado ou políticas erradas

**Solução:**
```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Habilitar RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## 📖 Recursos Adicionais

### Documentação Oficial
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### Dashboard Supabase
- **Policies:** https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/policies
- **Users:** https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/users

---

## ✅ Checklist de Segurança

- [ ] RLS habilitado em todas as tabelas sensíveis
- [ ] Políticas criadas para todas as operações (SELECT, INSERT, UPDATE, DELETE)
- [ ] Testado com múltiplos usuários
- [ ] Service Role Key protegida (não exposta no frontend)
- [ ] Anon Key pode ser exposta (acesso público limitado por RLS)
- [ ] Políticas de admin configuradas
- [ ] Conteúdo público identificado e configurado

---

**Última atualização:** 09/10/2025
