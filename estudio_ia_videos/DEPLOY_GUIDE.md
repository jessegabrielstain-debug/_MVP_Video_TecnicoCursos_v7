# 🚀 GUIA DE DEPLOY - PRODUÇÃO

**Versão:** 1.0  
**Data:** 17 de Dezembro de 2025  
**Ambiente:** Produção

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Processo de Deploy](#processo-de-deploy)
4. [Verificação Pós-Deploy](#verificação-pós-deploy)
5. [Rollback](#rollback)
6. [Troubleshooting](#troubleshooting)
7. [Monitoramento](#monitoramento)

---

## 🎯 PRÉ-REQUISITOS

### Software Necessário

```bash
# Node.js
node --version  # >= 18.0.0

# npm
npm --version   # >= 9.0.0

# Git
git --version   # >= 2.30.0

# PM2 (opcional, recomendado)
npm install -g pm2

# PostgreSQL Client (para backups)
psql --version  # >= 14.0
```

### Acessos Necessários

- [ ] Acesso ao repositório Git (main branch)
- [ ] Credenciais do Supabase (Production)
- [ ] API Key do ElevenLabs (Production)
- [ ] Credenciais AWS/S3 (se aplicável)
- [ ] Acesso ao servidor de produção (SSH)
- [ ] Credenciais de monitoramento (Sentry, New Relic)

### Backups

- [ ] Backup do banco de dados recente (< 24h)
- [ ] Backup do código atual
- [ ] Backup das variáveis de ambiente

---

## ⚙️ CONFIGURAÇÃO DE AMBIENTE

### 1. Variáveis de Ambiente

Crie o arquivo `.env.production` com as seguintes variáveis:

```bash
# ==============================================
# AMBIENTE
# ==============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# ==============================================
# SUPABASE (PRODUCTION)
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres:[password]@db.seu-projeto.supabase.co:5432/postgres

# ==============================================
# AUTENTICAÇÃO
# ==============================================
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=gerado-com-openssl-rand-base64-32

# ==============================================
# TTS - ELEVENLABS (PRODUCTION)
# ==============================================
ELEVENLABS_API_KEY=seu_api_key_producao
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# ==============================================
# AZURE TTS (FALLBACK)
# ==============================================
AZURE_SPEECH_KEY=seu_azure_key
AZURE_SPEECH_REGION=eastus

# ==============================================
# GOOGLE TTS (FALLBACK)
# ==============================================
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# ==============================================
# STORAGE - S3 / SUPABASE STORAGE
# ==============================================
S3_BUCKET=seu-bucket-producao
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=seu_access_key
S3_SECRET_ACCESS_KEY=seu_secret_key

# ==============================================
# FFMPEG
# ==============================================
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# ==============================================
# REDIS (CACHE)
# ==============================================
REDIS_URL=redis://seu-redis-producao:6379
REDIS_PASSWORD=seu_redis_password

# ==============================================
# MONITORAMENTO
# ==============================================
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=seu_license_key
NEW_RELIC_APP_NAME=estudio-ia-videos-prod

# ==============================================
# RATE LIMITING
# ==============================================
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# ==============================================
# WEBSOCKET
# ==============================================
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=https://seu-dominio.com

# ==============================================
# PERFORMANCE
# ==============================================
MAX_CONCURRENT_RENDERS=5
CACHE_TTL_SECONDS=3600
```

### 2. Segurança das Variáveis

```bash
# Nunca commitar .env files
echo ".env*" >> .gitignore

# Criptografar variáveis sensíveis (opcional)
# Use ferramentas como: age, sops, vault
```

### 3. Configurar Secrets Manager (Recomendado)

Para produção, use um gerenciador de secrets:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Secret Manager**

---

## 🚀 PROCESSO DE DEPLOY

### Método 1: Deploy Automatizado (Recomendado)

```bash
# 1. Navegar para o diretório do projeto
cd estudio_ia_videos

# 2. Executar validação pré-deploy
./scripts/pre-deploy-check.sh

# 3. Executar deploy
./scripts/deploy-production.sh production

# O script irá:
# - Validar ambiente
# - Criar backup
# - Atualizar código
# - Instalar dependências
# - Executar migrations
# - Build da aplicação
# - Executar testes
# - Reiniciar serviços
# - Fazer health check
```

### Método 2: Deploy Manual

```bash
# 1. Backup do banco de dados
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Parar serviços atuais
pm2 stop estudio-ia-videos

# 3. Atualizar código
git checkout main
git pull origin main

# 4. Instalar dependências
cd app
npm ci --production

# 5. Executar migrations
npx prisma migrate deploy

# 6. Build da aplicação
npm run build

# 7. Iniciar serviços
pm2 start npm --name "estudio-ia-videos" -- start
pm2 save

# 8. Verificar health
curl http://localhost:3000/api/health
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### 1. Health Checks

```bash
# API Health
curl https://seu-dominio.com/api/health

# Database connectivity
curl https://seu-dominio.com/api/health/db

# External services
curl https://seu-dominio.com/api/health/services
```

### 2. Smoke Tests

Teste as funcionalidades críticas manualmente:

- [ ] Login de usuário
- [ ] Upload de PPTX
- [ ] Geração de TTS
- [ ] Renderização de vídeo
- [ ] WebSocket (colaboração)
- [ ] Export de vídeo

### 3. Monitoramento Inicial

```bash
# Logs em tempo real
pm2 logs estudio-ia-videos

# Ou com tail
tail -f logs/production.log

# Métricas PM2
pm2 monit
```

### 4. Verificar Métricas

- **Response Time:** < 2s (95th percentile)
- **Error Rate:** < 1%
- **CPU Usage:** < 70%
- **Memory Usage:** < 80%
- **Database Connections:** < 80% do pool

---

## 🔄 ROLLBACK

### Rollback Rápido

```bash
# 1. Identificar commit anterior
git log --oneline -5

# 2. Executar script de rollback
./scripts/rollback.sh <commit-hash>

# Ou manualmente:
git checkout <commit-hash>
npm ci
npm run build
pm2 restart estudio-ia-videos
```

### Rollback do Banco de Dados

```bash
# Restaurar backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Ou via Supabase Dashboard:
# 1. Acessar Supabase Dashboard
# 2. Database > Backups
# 3. Restore backup específico
```

### Checklist de Rollback

- [ ] Parar serviços atuais
- [ ] Reverter código (git checkout)
- [ ] Restaurar banco de dados (se necessário)
- [ ] Reinstalar dependências
- [ ] Rebuild aplicação
- [ ] Reiniciar serviços
- [ ] Verificar health checks
- [ ] Notificar equipe

---

## 🔧 TROUBLESHOOTING

### Problema: Build Falha

```bash
# Limpar cache
rm -rf app/.next app/node_modules
npm install
npm run build
```

### Problema: Erro de Conexão com Banco

```bash
# Verificar conectividade
nc -zv db.seu-projeto.supabase.co 5432

# Verificar credenciais
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1"
```

### Problema: Serviço Não Inicia

```bash
# Ver logs de erro
pm2 logs estudio-ia-videos --err

# Verificar portas
netstat -tulpn | grep 3000

# Verificar permissões
ls -la /path/to/project
```

### Problema: High Memory Usage

```bash
# Restart PM2
pm2 restart estudio-ia-videos

# Ajustar max memory
pm2 start app.js --max-memory-restart 2G

# Verificar memory leaks
node --inspect app.js
```

### Problema: WebSocket Não Conecta

```bash
# Verificar porta WebSocket
netstat -tulpn | grep 3001

# Verificar CORS
curl -H "Origin: https://seu-dominio.com" \
     --verbose \
     https://seu-dominio.com/socket.io/

# Logs WebSocket
grep "WebSocket" logs/production.log
```

---

## 📊 MONITORAMENTO

### Logs

```bash
# Logs da aplicação
pm2 logs estudio-ia-videos

# Logs do sistema
journalctl -u nginx -f
journalctl -u pm2-user -f

# Logs de erros
tail -f logs/error.log
```

### Métricas

#### PM2 Monitoring

```bash
# Dashboard PM2
pm2 monit

# Status
pm2 status

# Informações detalhadas
pm2 info estudio-ia-videos
```

#### Sistema

```bash
# CPU e Memória
top
htop

# Disco
df -h

# Rede
netstat -tuln
```

### Alertas

Configure alertas para:

- **CPU > 80%** por 5 minutos
- **Memória > 85%** por 5 minutos
- **Disco > 90%**
- **Error Rate > 5%** por 1 minuto
- **Response Time > 5s** (p95)
- **Serviço Down**

### Dashboards

- **Sentry:** Monitoramento de erros
- **New Relic:** APM e performance
- **Supabase Dashboard:** Banco de dados
- **PM2 Plus:** Monitoramento de processos

---

## 📞 CONTATOS DE EMERGÊNCIA

| Papel            | Nome   | Telefone | Email               | Horário  |
| ---------------- | ------ | -------- | ------------------- | -------- |
| Tech Lead        | [Nome] | [Tel]    | [Email]             | 24/7     |
| DevOps           | [Nome] | [Tel]    | [Email]             | 24/7     |
| On-Call          | [Nome] | [Tel]    | [Email]             | Rotativo |
| Supabase Support | -      | -        | support@supabase.io | Ticket   |

### Canais de Comunicação

- **Slack:** #production-incidents
- **PagerDuty:** https://seu-org.pagerduty.com
- **Status Page:** https://status.seu-dominio.com

---

## 📝 CHECKLIST FINAL DE DEPLOY

### Pré-Deploy

- [ ] Code review aprovado
- [ ] Testes passando 100%
- [ ] Backup do banco criado
- [ ] Variáveis de ambiente configuradas
- [ ] Equipe notificada sobre janela de deploy
- [ ] Rollback plan documentado

### Durante Deploy

- [ ] Serviços parados gracefully
- [ ] Migrations executadas com sucesso
- [ ] Build concluído sem erros
- [ ] Serviços iniciados
- [ ] Health checks passando

### Pós-Deploy

- [ ] Smoke tests executados
- [ ] Métricas normais
- [ ] Logs sem erros críticos
- [ ] Funcionalidades críticas testadas
- [ ] Equipe notificada sobre deploy concluído
- [ ] Documentação atualizada

---

## 🎉 SUCESSO!

Se todos os passos foram concluídos com sucesso:

✅ **Deploy em produção realizado!**

Próximos passos:

1. Monitorar por 24-48h
2. Coletar feedback dos usuários
3. Ajustar configurações se necessário
4. Planejar próximas features

---

**Última Atualização:** 17 de Dezembro de 2025  
**Próxima Revisão:** Após cada deploy
