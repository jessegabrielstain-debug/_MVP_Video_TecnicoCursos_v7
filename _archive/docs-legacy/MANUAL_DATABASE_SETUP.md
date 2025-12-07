# 🚀 CONFIGURAÇÃO MANUAL DO BANCO DE DADOS

## 📊 Status Atual
- ✅ **Conexão Supabase**: Funcionando
- ✅ **Storage Buckets**: Configurados (4/4)
- ⚠️ **Tabelas**: Parcialmente configuradas (1/7)
- ❌ **Dados Iniciais**: Não populados

## 🎯 Ação Necessária: Executar Scripts SQL Manualmente

### Passo 1: Acessar Supabase Dashboard
1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/sql
3. Faça login se necessário

### Passo 2: Executar database-schema.sql
1. No SQL Editor, cole o conteúdo completo do arquivo `database-schema.sql`
2. Clique em **"RUN"**
3. Aguarde a confirmação de sucesso
4. ✅ Deve criar 7 tabelas: users, projects, slides, render_jobs, analytics_events, nr_courses, nr_modules

### Passo 3: Executar database-rls-policies.sql
1. No SQL Editor, cole o conteúdo completo do arquivo `database-rls-policies.sql`
2. Clique em **"RUN"**
3. Aguarde a confirmação de sucesso
4. ✅ Deve aplicar políticas de segurança RLS em todas as tabelas

### Passo 4: Executar seed-nr-courses.sql
1. No SQL Editor, cole o conteúdo completo do arquivo `seed-nr-courses.sql`
2. Clique em **"RUN"**
3. Aguarde a confirmação de sucesso
4. ✅ Deve popular 3 cursos NR (NR-12, NR-33, NR-35) com módulos

### Passo 5: Validar Configuração
Execute no terminal:
```bash
node validate-database-setup.js
```

**Resultado esperado:**
```
🎉 BANCO DE DADOS CONFIGURADO CORRETAMENTE!
✅ Todas as tabelas necessárias estão presentes
✅ Sistema pronto para uso
```

## 📋 Conteúdo dos Arquivos SQL

### database-schema.sql (143 linhas)
```sql
-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- [... resto do schema ...]
```

### database-rls-policies.sql (249 linhas)
```sql
-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- [... resto das políticas ...]
```

### seed-nr-courses.sql (290 linhas)
```sql
-- ============================================
-- DADOS INICIAIS - CURSOS NR
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, ...)
VALUES ('NR12', 'NR12 - Segurança em Máquinas e Equipamentos', ...);
-- [... resto dos dados ...]
```

## 🔧 Solução de Problemas

### Se aparecer erro "already exists":
- ✅ **Normal** - significa que o recurso já foi criado
- Continue com o próximo passo

### Se aparecer erro de permissão:
1. Verifique se está usando o projeto correto
2. Confirme que tem permissões de admin no projeto
3. Tente executar um comando por vez

### Se aparecer erro de sintaxe:
1. Certifique-se de copiar o arquivo completo
2. Não modifique o conteúdo dos arquivos SQL
3. Execute exatamente como fornecido

## ⏱️ Tempo Estimado
- **Execução manual**: 10-15 minutos
- **Validação**: 2-3 minutos
- **Total**: ~20 minutos

## 🎯 Próximos Passos Após Configuração
1. ✅ Validar banco de dados
2. 🧪 Executar testes de integração
3. 🔄 Testar funcionalidades end-to-end
4. 🚀 Sistema pronto para uso

---

**Data**: 14/10/2025  
**Status**: Configuração manual necessária  
**Prioridade**: CRÍTICA - Bloqueador para funcionamento do sistema