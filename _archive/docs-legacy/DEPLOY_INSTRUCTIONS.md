# 🚀 GUIA DE DEPLOY COMPLETO - MVP VÍDEO TÉCNICO CURSOS v7

## 📋 Pré-requisitos
- Conta no **GitHub** (para código)
- Conta na **Vercel** (para Frontend/API)
- Conta no **Supabase** (para Banco de Dados/Storage)
- (Opcional) Conta no **Upstash** (para Redis/Filas)

---

## 1️⃣ Banco de Dados (Supabase)
O projeto já inclui scripts de automação para configurar o Supabase.

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Obtenha as credenciais em `Project Settings > API`:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret)
3. Configure as variáveis locais em `.env.local` (se ainda não fez).
4. Execute o script de setup:
   ```bash
   npm run setup:supabase
   ```
   *Isso criará todas as tabelas, buckets e políticas de segurança automaticamente.*

---

## 2️⃣ Frontend & API (Vercel)
A Vercel é a plataforma recomendada para Next.js.

1. Instale a Vercel CLI ou use o dashboard web.
2. Importe o repositório do GitHub.
3. Configure as **Environment Variables** (copie do seu `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (se usar filas em produção)
   - `AZURE_SPEECH_KEY` (opcional)
   - `AZURE_SPEECH_REGION` (opcional)
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. Clique em **Deploy**.

---

## 3️⃣ Filas e Processamento (Redis)
Para processamento de vídeo em background (renderização), o sistema usa BullMQ e requer Redis.

1. Crie um banco Redis gratuito no [Upstash](https://upstash.com).
2. Copie a `REDIS_URL` (ex: `redis://default:pass@url:port`).
3. Adicione essa variável na Vercel.
4. O Next.js processará as filas via API Routes ou você pode deployar um worker separado.

---

## 4️⃣ Execução Local (Modo Produção)
Para testar exatamente como rodará no servidor:

1. Execute o script de inicialização:
   ```powershell
   .\start-production.ps1
   ```
2. Acesse `http://localhost:3000`.

---

## 🔍 Verificação Pós-Deploy
Após o deploy, acesse a rota de saúde para verificar se tudo está OK:
`https://seu-projeto.vercel.app/api/health`

---

**Status do Projeto:** 100% PRONTO PARA DEPLOY 🚀
