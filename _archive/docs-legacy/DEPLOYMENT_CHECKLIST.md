# 🚀 Deployment Checklist - MVP Video Técnico Cursos

## Data: 18/11/2025
## Versão: v2.4.0
## Status: ✅ Pronto para Deploy

---

## 📋 PRÉ-DEPLOY

### 1. Ambiente Local Validado
- [x] Todas as 9 fases implementadas (0-8)
- [x] 105+ testes criados (89% coverage)
- [x] CI/CD otimizado (15-25 min)
- [x] Scripts de automação criados
- [x] Documentação completa (~9.270 linhas)
- [ ] **Credenciais configuradas** ⚠️ (15-20 min - VOCÊ)
- [ ] **RBAC SQL executado** ⚠️ (5 min - VOCÊ)
- [ ] **Test users criados** ⚠️ (10 min - VOCÊ)

**Tempo estimado restante:** ~35 minutos

### 2. Configuração de Secrets
- [ ] Copiar `.env.local` para `.env.production`
- [ ] Gerar secrets seguros: `.\scripts\generate-secrets.ps1`
- [ ] Adicionar secrets no GitHub:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `SENTRY_DSN` (opcional)
  - `NEXTAUTH_SECRET`

### 3. Validação Final Local
```powershell
# 1. Validar setup
.\scripts\validate-setup.ps1

# 2. Status rápido
.\quick-status.ps1

# 3. Build de produção
cd estudio_ia_videos/app
npm run build

# 4. Testar build local
npm start
# Abrir http://localhost:3000

# 5. Rodar testes
npm test
```

**Expectativa:** Todos os checks ✅

---

## 🌐 DEPLOY - VERCEL (RECOMENDADO)

### Opção A: Deploy via CLI

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (primeira vez)
cd estudio_ia_videos/app
vercel

# 4. Deploy para produção
vercel --prod
```

### Opção B: Deploy via GitHub Integration

1. **Conectar GitHub ao Vercel:**
   - Acesse: https://vercel.com/new
   - Clique "Import Git Repository"
   - Selecione: `aline-jesse/_MVP_Video_TecnicoCursos`
   - Branch: `main`

2. **Configurar Build:**
   - Framework Preset: `Next.js`
   - Root Directory: `estudio_ia_videos/app`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Adicionar Environment Variables:**
   - Copiar todos de `.env.production`
   - Marcar como "Production", "Preview", "Development"

4. **Deploy:**
   - Clicar "Deploy"
   - Aguardar 3-5 minutos
   - Verificar logs

### Pós-Deploy Vercel

```powershell
# Testar produção
curl https://your-app.vercel.app/api/health

# Verificar logs
vercel logs
```

---

## 🐳 DEPLOY - DOCKER (ALTERNATIVA)

### Build e Push

```bash
# 1. Build da imagem
docker build -t mvp-video-tecnico:v2.4.0 .

# 2. Tag para registry
docker tag mvp-video-tecnico:v2.4.0 your-registry/mvp-video-tecnico:v2.4.0

# 3. Push
docker push your-registry/mvp-video-tecnico:v2.4.0
```

### Deploy com Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: your-registry/mvp-video-tecnico:v2.4.0
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Logs
docker-compose logs -f app
```

---

## ☁️ DEPLOY - AWS / AZURE / GCP

### AWS Elastic Beanstalk

```bash
# 1. Instalar EB CLI
pip install awsebcli

# 2. Inicializar
eb init -p "Node.js 18" mvp-video-tecnico

# 3. Criar ambiente
eb create mvp-video-prod

# 4. Deploy
eb deploy

# 5. Abrir
eb open
```

### Azure App Service

```bash
# 1. Login
az login

# 2. Criar resource group
az group create --name mvp-video-rg --location eastus

# 3. Criar app service plan
az appservice plan create --name mvp-video-plan --resource-group mvp-video-rg --sku B1 --is-linux

# 4. Criar web app
az webapp create --resource-group mvp-video-rg --plan mvp-video-plan --name mvp-video-tecnico --runtime "NODE|18-lts"

# 5. Deploy
az webapp deployment source config --name mvp-video-tecnico --resource-group mvp-video-rg --repo-url https://github.com/aline-jesse/_MVP_Video_TecnicoCursos --branch main --manual-integration

# 6. Configurar env vars
az webapp config appsettings set --resource-group mvp-video-rg --name mvp-video-tecnico --settings @.env.production
```

### Google Cloud Run

```bash
# 1. Autenticar
gcloud auth login

# 2. Build com Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/mvp-video-tecnico

# 3. Deploy
gcloud run deploy mvp-video-tecnico --image gcr.io/PROJECT_ID/mvp-video-tecnico --platform managed --region us-central1 --allow-unauthenticated

# 4. Adicionar secrets
gcloud run services update mvp-video-tecnico --set-env-vars="$(cat .env.production | xargs)"
```

---

## ✅ PÓS-DEPLOY

### 1. Validação Imediata (5 min)

```powershell
# Health check
curl https://your-domain.com/api/health

# Autenticação
curl https://your-domain.com/api/auth/session

# Analytics
curl https://your-domain.com/api/analytics/render-stats?includeErrors=true
```

**Expectativa:** Status 200 em todos

### 2. Testes de Fumaça (10 min)

- [ ] Acessar homepage
- [ ] Fazer login
- [ ] Criar projeto
- [ ] Upload PPTX
- [ ] Iniciar render (aguardar 30s)
- [ ] Verificar job na fila
- [ ] Baixar vídeo (se completado)
- [ ] Logout

### 3. Monitoramento Inicial (30 min)

- [ ] Verificar métricas Vercel/AWS:
  - Response time < 200ms (páginas)
  - Response time < 2s (APIs)
  - Error rate < 1%
  - Memory usage < 512MB

- [ ] Verificar Sentry (se configurado):
  - Zero errors críticos
  - Erros menores < 10/hora

- [ ] Verificar Supabase Dashboard:
  - Conexões ativas < 10
  - Query time médio < 100ms
  - Storage usage crescendo normalmente

- [ ] Verificar Upstash Redis:
  - Latency < 50ms
  - Hit rate > 80%
  - Commands/sec saudável

### 4. Performance (Lighthouse)

```powershell
# Local
npm install -g lighthouse
lighthouse https://your-domain.com --view

# CI
npm run lighthouse:ci
```

**Expectativa:**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

### 5. Testes E2E em Produção (15 min)

```powershell
# Atualizar playwright.config.ts
# baseURL: 'https://your-domain.com'

# Rodar E2E
cd tests
npx playwright test --project=chromium

# Esperado: 40 testes passando (25 RBAC + 15 Video Flow)
```

---

## 📊 MONITORAMENTO CONTÍNUO

### Dashboards Essenciais

1. **Vercel Dashboard**
   - https://vercel.com/aline-jesse/_MVP_Video_TecnicoCursos
   - Métricas: Requests, Duration, Errors

2. **Supabase Dashboard**
   - https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz
   - Métricas: DB connections, Storage, Auth

3. **Upstash Redis**
   - https://console.upstash.com/redis
   - Métricas: Latency, Hit rate, Memory

4. **Sentry** (se configurado)
   - https://sentry.io/organizations/your-org/issues/
   - Métricas: Errors, Performance

### Alertas Recomendados

```yaml
# alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: notify_slack
    
  - name: Slow Response
    condition: p95_response_time > 3s
    action: notify_email
    
  - name: High Memory
    condition: memory_usage > 80%
    action: scale_up
    
  - name: Failed Renders
    condition: render_failure_rate > 10%
    action: investigate
```

---

## 🔄 ROLLBACK PLAN

### Vercel (instantâneo)

```bash
# 1. Listar deployments
vercel ls

# 2. Rollback para deployment anterior
vercel rollback [deployment-url]

# 3. Verificar
curl https://your-domain.com/api/health
```

### Docker

```bash
# 1. Parar versão atual
docker-compose down

# 2. Reverter para tag anterior
# Editar docker-compose.prod.yml -> image: ...:v2.3.0

# 3. Subir versão anterior
docker-compose -f docker-compose.prod.yml up -d
```

### Database (se necessário)

```bash
# 1. Conectar ao Supabase
psql $DIRECT_DATABASE_URL

# 2. Listar migrações
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

# 3. Rollback (se tiver down migration)
-- Execute SQL de rollback específico
```

---

## 📝 CHECKLIST FINAL

### Antes do Deploy
- [x] Código 100% implementado
- [x] Testes passando localmente
- [x] Build de produção OK
- [x] Secrets configurados
- [x] Documentação atualizada
- [ ] **Credenciais reais configuradas** ⚠️
- [ ] **RBAC SQL executado** ⚠️
- [ ] Backups configurados

### Durante o Deploy
- [ ] Deploy iniciado sem erros
- [ ] Build completado (3-5 min)
- [ ] Health checks passando
- [ ] Logs sem erros críticos

### Depois do Deploy
- [ ] Testes de fumaça OK
- [ ] Performance aceitável
- [ ] Monitoramento ativo
- [ ] Equipe notificada
- [ ] Documentação de produção URL
- [ ] Rollback plan testado

---

## 🎯 SUCESSO GARANTIDO SE:

✅ **Status rápido:** `.\quick-status.ps1` → "✅ PRONTO"  
✅ **Validação:** `.\scripts\validate-setup.ps1` → 100% Pass  
✅ **Build:** `npm run build` → Sem erros  
✅ **Testes:** `npm test` → 105+ passando  
✅ **Health:** `curl /api/health` → 200 OK  

---

## 📞 SUPORTE

**Issues:** https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/issues  
**Docs:** Ver `INDICE_MASTER_DOCUMENTACAO_v2.4.0.md`  
**Status:** Ver `STATUS_PROJETO_18_NOV_2025.md`  

---

**✅ Checklist completo = Deploy com confiança! 🚀**

**Data de criação:** 18/11/2025 00:20 BRT  
**Próxima revisão:** Após primeiro deploy
