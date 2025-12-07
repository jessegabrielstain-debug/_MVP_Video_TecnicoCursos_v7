# 🚀 GUIA PASSO A PASSO - CONFIGURAÇÃO SUPABASE

**Data:** 10 de Outubro de 2025  
**Status:** ✅ FASE 1 Concluída | ⏳ FASES 2-8 Pendentes  
**Projeto:** Sistema de Vídeos IA com Cursos NR  

---

## ✅ FASE 1: CONFIGURAÇÃO INICIAL (COMPLETA)

- [x] Credenciais configuradas
- [x] Variáveis de ambiente definidas
- [x] Conectividade testada
- [x] Autenticação verificada

---

## 📋 FASE 2: CRIAR SCHEMA DO BANCO DE DADOS

### Passo 1: Acessar o SQL Editor

1. Abra o navegador e acesse: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz
2. Faça login se necessário
3. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone </>)
4. Clique no botão **"+ New query"** no canto superior direito

### Passo 2: Executar o Script de Schema

1. Abra o arquivo `database-schema.sql` no VS Code
2. Copie **TODO o conteúdo** do arquivo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique no botão **"Run"** (ou pressione Ctrl+Enter)

### Passo 3: Verificar Criação das Tabelas

Execute o seguinte SQL para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Resultado esperado** (7 tabelas):
- ✅ analytics_events
- ✅ nr_courses
- ✅ nr_modules
- ✅ projects
- ✅ render_jobs
- ✅ slides
- ✅ users

### Passo 4: Verificar Índices

Execute:

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

**Resultado esperado** (pelo menos 5 índices):
- ✅ idx_analytics_user_id
- ✅ idx_nr_modules_course_id
- ✅ idx_projects_user_id
- ✅ idx_render_jobs_project_id
- ✅ idx_slides_project_id

### Passo 5: Verificar Triggers

Execute:

```sql
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Resultado esperado** (5 triggers updated_at):
- ✅ update_users_updated_at
- ✅ update_projects_updated_at
- ✅ update_slides_updated_at
- ✅ update_nr_courses_updated_at
- ✅ update_nr_modules_updated_at

### ✅ Checklist FASE 2

- [ ] Script database-schema.sql executado sem erros
- [ ] 7 tabelas criadas
- [ ] 5 índices criados
- [ ] 5 triggers criados
- [ ] Nenhum erro reportado no console

---

## 🔐 FASE 3: APLICAR POLÍTICAS RLS DE SEGURANÇA

### Passo 1: Acessar SQL Editor

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **"+ New query"**

### Passo 2: Executar Script de Políticas RLS

1. Abra o arquivo `database-rls-policies.sql` no VS Code
2. Copie **TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"**

### Passo 3: Verificar RLS Habilitado

Execute:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado**: `rowsecurity = true` para **todas as 7 tabelas**

### Passo 4: Verificar Políticas Criadas

Execute:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Resultado esperado**: Múltiplas políticas para cada tabela

### Passo 5: Acessar Interface Gráfica de Políticas

1. No menu lateral, clique em **"Authentication"** > **"Policies"**
2. Verifique visualmente as políticas de cada tabela
3. Link direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/policies

### ✅ Checklist FASE 3

- [ ] Script database-rls-policies.sql executado sem erros
- [ ] RLS habilitado em todas as 7 tabelas
- [ ] Políticas criadas para users
- [ ] Políticas criadas para projects
- [ ] Políticas criadas para slides
- [ ] Políticas criadas para render_jobs
- [ ] Políticas criadas para analytics_events
- [ ] Políticas públicas criadas para nr_courses
- [ ] Políticas públicas criadas para nr_modules
- [ ] Nenhum erro reportado

---

## 📊 FASE 4: POPULAR DADOS INICIAIS (CURSOS NR)

### Passo 1: Acessar SQL Editor

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em **"+ New query"**

### Passo 2: Executar Script de Seed

1. Abra o arquivo `seed-nr-courses.sql` no VS Code
2. Copie **TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"**

### Passo 3: Verificar Cursos Criados

Execute:

```sql
SELECT course_code, title, modules_count, status 
FROM public.nr_courses 
ORDER BY course_code;
```

**Resultado esperado** (3 cursos):
- ✅ NR12 - Segurança no Trabalho em Máquinas e Equipamentos
- ✅ NR33 - Segurança e Saúde nos Trabalhos em Espaços Confinados
- ✅ NR35 - Trabalho em Altura

### Passo 4: Verificar Módulos Criados

Execute:

```sql
SELECT c.course_code, COUNT(m.id) as total_modules
FROM public.nr_courses c
LEFT JOIN public.nr_modules m ON m.course_id = c.id
GROUP BY c.course_code
ORDER BY c.course_code;
```

**Resultado esperado**:
- ✅ NR12: 9 módulos
- ✅ NR33: 6-8 módulos (verificar seed file)
- ✅ NR35: 6-8 módulos (verificar seed file)

### Passo 5: Visualizar Dados na Interface

1. No menu lateral, clique em **"Table Editor"**
2. Selecione a tabela **"nr_courses"**
3. Verifique os 3 cursos
4. Selecione a tabela **"nr_modules"**
5. Verifique os módulos de cada curso

### ✅ Checklist FASE 4

- [ ] Script seed-nr-courses.sql executado sem erros
- [ ] 3 cursos NR criados (NR12, NR33, NR35)
- [ ] Módulos criados para NR12 (9 módulos)
- [ ] Módulos criados para NR33
- [ ] Módulos criados para NR35
- [ ] Dados visíveis no Table Editor
- [ ] Nenhum erro reportado

---

## 📦 FASE 5: CRIAR BUCKETS DE STORAGE

### Passo 1: Acessar Storage

1. No menu lateral do Supabase Dashboard, clique em **"Storage"**
2. Link direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/storage/buckets

### Passo 2: Criar Bucket "videos"

1. Clique no botão **"New bucket"** (ou **"Create a new bucket"**)
2. Preencha:
   - **Name**: `videos`
   - **Public bucket**: **Desmarcar** (privado)
   - **File size limit**: `500 MB`
   - **Allowed MIME types**: `video/mp4, video/webm, video/quicktime`
3. Clique em **"Save"** ou **"Create bucket"**

### Passo 3: Criar Bucket "avatars"

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `avatars`
   - **Public bucket**: **Desmarcar** (privado)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
3. Clique em **"Save"**

### Passo 4: Criar Bucket "thumbnails"

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `thumbnails`
   - **Public bucket**: **Marcar** ✅ (público)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
3. Clique em **"Save"**

### Passo 5: Criar Bucket "assets"

1. Clique em **"New bucket"**
2. Preencha:
   - **Name**: `assets`
   - **Public bucket**: **Marcar** ✅ (público)
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `*/*` (todos os tipos)
3. Clique em **"Save"**

### Passo 6: Configurar Políticas de Storage (Opcional)

Para cada bucket privado (videos, avatars), você pode configurar políticas RLS:

1. Clique no bucket
2. Vá para a aba **"Policies"**
3. Adicione políticas conforme necessário (usuários só veem seus próprios arquivos)

### ✅ Checklist FASE 5

- [ ] Bucket "videos" criado (privado, 500MB)
- [ ] Bucket "avatars" criado (privado, 10MB)
- [ ] Bucket "thumbnails" criado (público, 5MB)
- [ ] Bucket "assets" criado (público, 50MB)
- [ ] Políticas de storage configuradas (opcional)
- [ ] 4 buckets visíveis no dashboard

---

## 👥 FASE 6: CONFIGURAR AUTENTICAÇÃO

### Passo 1: Configurar Email Authentication

1. No menu lateral, clique em **"Authentication"** > **"Providers"**
2. Link direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/providers
3. Localize **"Email"** na lista de providers
4. Certifique-se que está **habilitado** (toggle verde)

### Passo 2: Configurar Confirmação de Email

1. Na mesma página de Providers, clique em **"Email"**
2. Procure a opção **"Confirm email"**
3. **Marque** a opção se quiser que usuários confirmem email
4. **Desmarque** para desenvolvimento (permite login sem confirmação)
5. Clique em **"Save"**

### Passo 3: Configurar Templates de Email

1. No menu lateral, clique em **"Authentication"** > **"Email Templates"**
2. Você verá templates para:
   - Confirm signup
   - Magic Link
   - Reset password
   - Change email
3. Customize os templates se necessário (opcional para agora)

### Passo 4: Configurar URLs de Redirecionamento

1. No menu lateral, clique em **"Authentication"** > **"URL Configuration"**
2. Adicione suas URLs permitidas:
   - `http://localhost:3000` (desenvolvimento)
   - `http://localhost:3000/**` (wildcard)
   - `https://seu-dominio.com` (produção - quando tiver)
3. Clique em **"Add URL"** para cada uma
4. Salve as configurações

### Passo 5: Criar Primeiro Usuário Admin

1. No menu lateral, clique em **"Authentication"** > **"Users"**
2. Link direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/users
3. Clique no botão **"Add user"** ou **"Invite user"**
4. Escolha **"Create new user"**
5. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: Senha@Segura123
   - **Auto Confirm User**: ✅ Marcar
6. Clique em **"Create user"**

### Passo 6: Adicionar Metadata de Admin

1. Após criar o usuário, clique no email dele na lista
2. Role até **"User Metadata"**
3. Clique em **"Edit"** ou adicione um campo
4. Adicione:
   ```json
   {
     "role": "admin",
     "name": "Administrador do Sistema"
   }
   ```
5. Clique em **"Save"**

### Passo 7: Testar Login

Execute o script de teste:

```powershell
.\test-supabase-connection.ps1
```

Ou teste manualmente criando um login simples.

### ✅ Checklist FASE 6

- [ ] Email Auth habilitado
- [ ] Configuração de confirmação de email definida
- [ ] URLs de redirecionamento configuradas
- [ ] Primeiro usuário admin criado
- [ ] Metadata de admin adicionada ao usuário
- [ ] Login testado com sucesso

---

## 🧪 FASE 7: EXECUTAR TESTES DE INTEGRAÇÃO

### Passo 1: Testar Conexão Básica

Execute no PowerShell:

```powershell
.\test-supabase-connection.ps1
```

**Resultado esperado**:
- ✅ Conexão estabelecida
- ✅ Tabelas acessíveis
- ✅ Autenticação funcionando

### Passo 2: Testar Criação de Projeto

Execute no SQL Editor do Supabase:

```sql
-- Primeiro, obtenha o ID do usuário admin
SELECT id, email FROM auth.users LIMIT 1;

-- Use o ID retornado acima no INSERT abaixo
INSERT INTO public.projects (user_id, title, description, status)
VALUES (
  'SEU-USER-ID-AQUI',
  'Projeto de Teste',
  'Teste de criação de projeto via SQL',
  'draft'
)
RETURNING *;
```

### Passo 3: Testar Criação de Slides

```sql
-- Use o ID do projeto criado acima
INSERT INTO public.slides (project_id, order_index, title, content, duration)
VALUES (
  'SEU-PROJECT-ID-AQUI',
  1,
  'Slide de Teste 1',
  'Conteúdo do slide de teste',
  5
)
RETURNING *;
```

### Passo 4: Testar Upload de Arquivo

1. No Supabase Dashboard, vá para **Storage** > **videos**
2. Clique em **"Upload file"**
3. Faça upload de um vídeo de teste (pequeno)
4. Verifique que o arquivo aparece na lista

### Passo 5: Testar Render Job

```sql
INSERT INTO public.render_jobs (project_id, status, progress)
VALUES (
  'SEU-PROJECT-ID-AQUI',
  'pending',
  0
)
RETURNING *;
```

### Passo 6: Testar Analytics

```sql
INSERT INTO public.analytics_events (user_id, event_type, event_data)
VALUES (
  'SEU-USER-ID-AQUI',
  'video_created',
  '{"video_id": "test-123", "duration": 120}'::jsonb
)
RETURNING *;
```

### Passo 7: Testar Isolamento RLS (Segurança)

1. Crie um segundo usuário (não-admin)
2. Tente acessar projetos do primeiro usuário
3. **Resultado esperado**: Acesso negado (RLS funcionando)

### Passo 8: Testar Acesso Público a Cursos NR

```sql
-- Este SELECT deve funcionar mesmo sem autenticação
SELECT * FROM public.nr_courses;
SELECT * FROM public.nr_modules;
```

### ✅ Checklist FASE 7

- [ ] test-supabase-connection.ps1 executado com sucesso
- [ ] Projeto criado via SQL
- [ ] Slide criado e associado ao projeto
- [ ] Upload de arquivo testado
- [ ] Render job criado
- [ ] Evento analytics registrado
- [ ] RLS testado (isolamento de dados)
- [ ] Acesso público a cursos NR verificado
- [ ] Todos os testes passaram

---

## 📈 FASE 8: CONFIGURAR MONITORAMENTO (OPCIONAL)

### Passo 1: Acessar Logs

1. No menu lateral, clique em **"Logs"** > **"Logs Explorer"**
2. Link direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/logs/explorer

### Passo 2: Explorar Logs Disponíveis

- **Database Logs**: Queries SQL executadas
- **API Logs**: Requisições para a API
- **Auth Logs**: Eventos de autenticação
- **Storage Logs**: Operações de storage

### Passo 3: Configurar Alertas (Opcional)

1. No menu **Settings** > **Integrations**
2. Configure integrações com:
   - Slack
   - Discord
   - Webhook customizado
3. Defina alertas para:
   - Erros de database
   - Falhas de autenticação
   - Uso de storage acima do limite

### Passo 4: Monitorar Performance

1. No menu **Database** > **Query Performance**
2. Identifique queries lentas
3. Otimize índices se necessário

### Passo 5: Configurar Backup (Recomendado)

1. No menu **Settings** > **Database**
2. Verifique configuração de backup automático
3. O plano Free tem backups diários

### ✅ Checklist FASE 8

- [ ] Logs acessíveis e funcionais
- [ ] Database logs visualizados
- [ ] API logs verificados
- [ ] Performance de queries monitorada
- [ ] Backup automático verificado
- [ ] Alertas configurados (opcional)

---

## 🎯 RESUMO DO PROGRESSO

```
✅ FASE 1: Configuração Inicial     [████████████] 100%
⏳ FASE 2: Banco de Dados           [░░░░░░░░░░░░]   0%
⏳ FASE 3: Segurança - RLS          [░░░░░░░░░░░░]   0%
⏳ FASE 4: Dados Iniciais           [░░░░░░░░░░░░]   0%
⏳ FASE 5: Storage                  [░░░░░░░░░░░░]   0%
⏳ FASE 6: Autenticação             [░░░░░░░░░░░░]   0%
⏳ FASE 7: Testes                   [░░░░░░░░░░░░]   0%
⏳ FASE 8: Monitoramento            [░░░░░░░░░░░░]   0%
```

---

## 📞 SUPORTE

### Links Úteis

- **Projeto Supabase**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz
- **SQL Editor**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/sql
- **Table Editor**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/editor
- **Storage**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/storage/buckets
- **Auth Users**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/users
- **Auth Policies**: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/auth/policies

### Documentação Supabase

- **Docs Gerais**: https://supabase.com/docs
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Storage**: https://supabase.com/docs/guides/storage
- **Auth**: https://supabase.com/docs/guides/auth

---

## ✅ PRÓXIMA AÇÃO

**Execute as fases na ordem:**

1. ✅ FASE 2: Criar Schema (10-15 min)
2. ✅ FASE 3: Aplicar RLS (5-10 min)
3. ✅ FASE 4: Popular Dados (5 min)
4. ✅ FASE 5: Criar Buckets (10 min)
5. ✅ FASE 6: Configurar Auth (10-15 min)
6. ✅ FASE 7: Testar Tudo (15-20 min)
7. ⭐ FASE 8: Monitoramento (opcional)

**Tempo total estimado**: 1-1.5 horas

---

**🎯 Ao finalizar todas as fases, o sistema estará 100% configurado e pronto para uso!**

**📅 Data de criação deste guia**: 10 de Outubro de 2025  
**🔄 Última atualização**: 10 de Outubro de 2025  
**✨ Status**: Aguardando execução manual no Supabase Dashboard
