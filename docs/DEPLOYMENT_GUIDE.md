# 🚀 Deployment Guide - MVP Vídeos TécnicoCursos v7

**Versão:** 1.0.0  
**Última Atualização:** Dezembro 2025

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Deploy Local (Desenvolvimento)](#deploy-local-desenvolvimento)
4. [Deploy Docker](#deploy-docker)
5. [Deploy Produção](#deploy-produção)
6. [Verificação Pós-Deploy](#verificação-pós-deploy)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Propósito |
|----------|---------------|-----------|
| Node.js | 20.x LTS | Runtime JavaScript |
| npm | 10.x | Gerenciador de pacotes |
| Docker | 24.x | Containerização |
| Docker Compose | 2.x | Orquestração local |
| Git | 2.x | Controle de versão |

### Serviços Externos

| Serviço | Obrigatório | Propósito |
|---------|-------------|-----------|
| Supabase | ✅ Sim | Database + Auth + Storage |
| Redis | ✅ Sim | Job queue (BullMQ) |
| ElevenLabs | ⚠️ Opcional | TTS avançado |
| HeyGen | ⚠️ Opcional | Avatares AI |

---

## ⚙️ Configuração de Ambiente

### 1. Clonar Repositório

```bash
git clone https://github.com/your-org/mvp-video-tecnicocursos.git
cd mvp-video-tecnicocursos
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env.local

# Editar com suas credenciais
nano .env.local
```

**Variáveis Obrigatórias:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=production
```

### 3. Validar Configuração

```bash
npm run validate:env:production
```

---

## 🖥️ Deploy Local (Desenvolvimento)

### Setup Inicial

```bash
# 1. Instalar dependências raiz
npm install

# 2. Setup banco de dados
npm run setup:supabase

# 3. Instalar dependências da app
cd estudio_ia_videos
npm install

# 4. Iniciar Redis
cd ..
npm run redis:start

# 5. Iniciar servidor de desenvolvimento
cd estudio_ia_videos
npm run dev
```

### Verificação

- App: http://localhost:3000
- Health: http://localhost:3000/api/health

---

## 🐳 Deploy Docker

### Build da Imagem

```bash
# Build de produção (multi-stage)
docker build -f Dockerfile.production -t mvp-video:latest .

# Build do worker
docker build -f Dockerfile.worker -t mvp-video-worker:latest .
```

### Docker Compose (Ambiente Completo)

```bash
# Subir todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f app

# Parar serviços
docker compose down
```

### Estrutura de Serviços

```yaml
services:
  app:          # Next.js app (porta 3000)
  worker:       # Render worker (BullMQ)
  redis:        # Job queue
  postgres:     # Database (dev only)
```

---

## ☁️ Deploy Produção

### Opção 1: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd estudio_ia_videos
vercel --prod
```

**Configurar Environment Variables no Vercel Dashboard:**
- Settings → Environment Variables
- Adicionar todas as variáveis do `.env.example`

### Opção 2: Docker + VPS

```bash
# 1. No servidor, clonar e configurar
git clone <repo>
cp .env.example .env
nano .env  # Configurar variáveis

# 2. Build e run
docker compose -f docker-compose.prod.yml up -d

# 3. Configurar reverse proxy (nginx)
# Ver /docs/nginx-config.example
```

### Opção 3: Kubernetes

```bash
# Aplicar manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## ✅ Verificação Pós-Deploy

### 1. Health Check

```bash
# Endpoint básico
curl https://your-domain.com/api/health

# Health detalhado
curl https://your-domain.com/api/health/detailed
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 12345,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

### 2. Script de Health Check

```bash
npm run health
```

### 3. Smoke Tests

```bash
# Executar testes E2E de smoke
npm run test:e2e:playwright -- --grep "@smoke"
```

### 4. Métricas

```bash
# Verificar métricas
curl https://your-domain.com/api/metrics/custom
```

---

## ↩️ Rollback

### Vercel

```bash
# Listar deployments
vercel ls

# Rollback para versão anterior
vercel rollback <deployment-url>
```

### Docker

```bash
# Listar imagens
docker images mvp-video

# Rollback para versão anterior
docker compose down
docker tag mvp-video:previous mvp-video:latest
docker compose up -d
```

### Banco de Dados

```bash
# Restaurar backup
npm run backup:list
# Identificar backup desejado

# Restaurar (manual - ver scripts/backup-database.ts)
```

---

## 🔍 Troubleshooting

### Problema: App não inicia

```bash
# Verificar logs
docker compose logs app

# Verificar variáveis de ambiente
npm run validate:env:production

# Verificar conexão com banco
npm run test:supabase
```

### Problema: Render jobs travados

```bash
# Verificar Redis
docker compose logs redis

# Verificar worker
docker compose logs worker

# Verificar jobs na fila
curl https://your-domain.com/api/render/queue/stats
```

### Problema: Erros de autenticação

```bash
# Verificar chaves Supabase
# NEXT_PUBLIC_SUPABASE_ANON_KEY deve ser a chave anon
# SUPABASE_SERVICE_ROLE_KEY deve ser service_role

# Testar conexão
npm run test:supabase
```

### Problema: TTS não funciona

```bash
# Verificar edge-tts instalado
edge-tts --list-voices

# Verificar diretório de áudio
ls -la estudio_ia_videos/public/tts-audio/
```

### Logs de Diagnóstico

```bash
# Coletar logs estruturados
tail -f logs/app.log | jq .

# Filtrar por nível
tail -f logs/app.log | jq 'select(.level == "error")'
```

---

## 📊 Checklist de Deploy

### Pré-Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] `npm run validate:env:production` passa
- [ ] `npm run health` passa
- [ ] `npm run type-check` sem erros
- [ ] Testes passando (`npm test`)
- [ ] Backup do banco feito (`npm run backup:full`)

### Deploy
- [ ] Build executado com sucesso
- [ ] Imagem Docker criada (se aplicável)
- [ ] Deploy executado sem erros

### Pós-Deploy
- [ ] Health check retorna 200
- [ ] Login funciona
- [ ] Upload de PPTX funciona
- [ ] Render job é criado
- [ ] Métricas sendo coletadas

---

## 📞 Suporte

- **Documentação:** `/docs/`
- **API Docs:** `/docs/api-docs.html`
- **Issues:** GitHub Issues
- **Email:** suporte@tecnicocursos.com
