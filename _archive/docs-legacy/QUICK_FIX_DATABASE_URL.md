# ⚡ Quick Fix: DIRECT_DATABASE_URL

**Problema:** Sistema bloqueado em 91% por falta de `DIRECT_DATABASE_URL`  
**Tempo para resolver:** 5 minutos  
**Impacto:** Desbloqueia provisioning dos 10 templates NR

---

## 🎯 Passo a Passo (3 etapas)

### 1️⃣ Acesse o Supabase Dashboard
```
https://supabase.com/dashboard/project/SEU_PROJECT_ID
```

### 2️⃣ Copie a Connection String
1. No menu lateral, clique em **"Settings"** ⚙️
2. Clique em **"Database"** 🗄️
3. Role até **"Connection string"**
4. Selecione a aba **"URI"**
5. Clique no botão **"Copy"** 📋

**Formato esperado:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### 3️⃣ Adicione ao .env
Abra o arquivo `.env` na raiz do projeto e adicione:

```env
# Adicione esta linha (substitua pelo valor copiado)
DIRECT_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**⚠️ IMPORTANTE:** Substitua `[YOUR-PASSWORD]` pela senha real do banco.

---

## ✅ Validar Configuração

Execute no terminal:
```bash
node scripts/validate-env.js
```

**Saída esperada:**
```
✅ DIRECT_DATABASE_URL
   Feature: Provisioning SQL Scripts
   Valor: ✓ Configurado

Resultado: 4/4 configuradas ✅
```

---

## 🚀 Provisionar Banco de Dados

Agora execute:
```bash
node scripts/execute-supabase-sql.js database-nr-templates.sql
```

**Resultado esperado:**
```
✅ Tabela nr_templates criada
✅ 10 templates inseridos
✅ RLS policies aplicadas
```

---

## 🎉 Conclusão

Após provisionar, você terá:
- ✅ 10 templates NR no banco
- ✅ API `/api/nr-templates` funcional
- ✅ Dashboard `/dashboard/admin/nr-templates` operacional
- ✅ Fase 9 completa em **100%**

---

## 🆘 Problemas Comuns

### ❌ "Error: Connection refused"
**Causa:** Senha incorreta ou IP não autorizado  
**Solução:** Verifique senha no Supabase Dashboard → Settings → Database → Reset Password

### ❌ "Error: relation already exists"
**Causa:** Tabela já foi criada anteriormente  
**Solução:** Normal! Script é idempotente, ignore o erro

### ❌ "Error: permission denied"
**Causa:** Service Role Key incorreto  
**Solução:** Recopie `SUPABASE_SERVICE_ROLE_KEY` do dashboard

---

## 📞 Suporte

- **Documentação completa:** `GUIA_SETUP_ENV_FASE_9.md`
- **Validação:** `node scripts/validate-env.js`
- **Status:** `./setup-fase-9.ps1`

---

**Tempo total:** 5 minutos ⏱️  
**Complexidade:** Baixa 🟢  
**Impacto:** Desbloqueio total da Fase 9 🎯
