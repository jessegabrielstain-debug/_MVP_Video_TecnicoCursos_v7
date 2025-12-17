# 📖 Operations Runbook - MVP Vídeos TécnicoCursos v7

**Versão:** 1.0.0  
**Última Atualização:** Dezembro 2025

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Monitoramento](#monitoramento)
3. [Alertas e Respostas](#alertas-e-respostas)
4. [Procedimentos Operacionais](#procedimentos-operacionais)
5. [Manutenção Programada](#manutenção-programada)
6. [Recuperação de Desastres](#recuperação-de-desastres)
7. [Contatos de Escalação](#contatos-de-escalação)

---

## 🏗️ Visão Geral do Sistema

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js App)                            │
│                   Port 3000                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
│   /api/render, /api/tts, /api/analytics, /api/health       │
└──────┬─────────────────────┬────────────────────────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐    ┌───────────────┐    ┌─────────────────┐
│   Supabase   │    │     Redis     │    │  External APIs  │
│  (Database)  │    │   (BullMQ)    │    │ ElevenLabs/etc  │
└──────────────┘    └───────┬───────┘    └─────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Render Worker │
                    │  (Remotion)   │
                    └───────────────┘
```

### Componentes Críticos

| Componente | Descrição | SLA |
|------------|-----------|-----|
| Next.js App | Frontend + API | 99.9% uptime |
| Supabase | Database + Auth + Storage | 99.95% (SLA Supabase) |
| Redis | Job queue | 99.9% uptime |
| Render Worker | Video processing | 95% success rate |

---

## 📊 Monitoramento

### Endpoints de Saúde

| Endpoint | Frequência | Timeout | Alerta |
|----------|------------|---------|--------|
| `/api/health` | 30s | 5s | Se 3 falhas consecutivas |
| `/api/health/detailed` | 5min | 30s | Se qualquer check falhar |
| `/api/metrics/custom` | 1min | 10s | Se indisponível |

### Métricas Principais

```bash
# Verificar métricas via CLI
curl -s http://localhost:3000/api/metrics/custom | jq .

# Métricas em formato Prometheus
curl http://localhost:3000/api/metrics/custom?format=prometheus
```

**KPIs Críticos:**

| Métrica | Threshold Warning | Threshold Critical |
|---------|-------------------|-------------------|
| API Latency (p95) | > 300ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| Render Queue Depth | > 50 jobs | > 100 jobs |
| Memory Usage | > 70% | > 90% |
| Disk Usage | > 70% | > 90% |

### Dashboard Rápido

```bash
# Script de status rápido
npm run health

# Exemplo de output:
# ✅ Database: healthy (45ms)
# ✅ Redis: healthy (12ms)
# ✅ Storage: healthy (89ms)
# ✅ FFmpeg: available
# 
# Overall Score: 95/100
```

---

## 🚨 Alertas e Respostas

### P1 - Crítico (Resposta: 15min)

#### 🔴 Sistema Offline
**Sintomas:** Health check falhando, 5xx errors
**Procedimento:**
1. Verificar status dos containers: `docker compose ps`
2. Verificar logs: `docker compose logs --tail=100 app`
3. Reiniciar se necessário: `docker compose restart app`
4. Se persistir, verificar Supabase status
5. Comunicar stakeholders

#### 🔴 Database Inacessível
**Sintomas:** Erro "Connection refused" ou timeout
**Procedimento:**
1. Verificar status Supabase: https://status.supabase.com
2. Testar conexão: `npm run test:supabase`
3. Verificar variáveis de ambiente
4. Se Supabase OK, verificar network/firewall

#### 🔴 Taxa de Erro > 5%
**Sintomas:** Muitos 5xx nos logs
**Procedimento:**
1. Identificar endpoint com mais erros
2. Verificar logs: `grep -i error logs/app.log | tail -50`
3. Verificar recursos (CPU/RAM)
4. Considerar rollback se recente deploy

### P2 - Alto (Resposta: 1h)

#### 🟠 Render Queue Congestionada
**Sintomas:** Jobs pendentes > 100, tempo de espera alto
**Procedimento:**
1. Verificar status do worker: `docker compose logs worker`
2. Verificar Redis: `docker compose exec redis redis-cli INFO`
3. Escalar workers se necessário
4. Identificar jobs problemáticos

#### 🟠 Latência Alta (p95 > 1s)
**Sintomas:** Requests lentos, timeouts
**Procedimento:**
1. Identificar endpoints lentos via métricas
2. Verificar queries no Supabase Dashboard
3. Verificar cache hit rate
4. Considerar otimização ou escala

### P3 - Médio (Resposta: 4h)

#### 🟡 Disk Usage > 80%
**Procedimento:**
1. Identificar consumo: `du -sh /* | sort -h`
2. Limpar logs antigos: `find logs/ -mtime +7 -delete`
3. Limpar arquivos temporários
4. Limpar backups antigos: `npm run backup:cleanup`

#### 🟡 Certificado SSL Expirando
**Procedimento:**
1. Verificar data de expiração
2. Renovar certificado (Let's Encrypt auto-renew ou manual)
3. Reiniciar nginx/reverse proxy

---

## 🔧 Procedimentos Operacionais

### Deploy de Nova Versão

```bash
# 1. Pre-deploy checks
npm run predeploy

# 2. Criar backup
npm run backup:full

# 3. Pull latest code
git pull origin main

# 4. Build
docker build -f Dockerfile.production -t mvp-video:new .

# 5. Deploy (blue-green)
docker tag mvp-video:latest mvp-video:previous
docker tag mvp-video:new mvp-video:latest
docker compose up -d --no-deps app

# 6. Verify
curl http://localhost:3000/api/health

# 7. Se falhar, rollback
docker tag mvp-video:previous mvp-video:latest
docker compose up -d --no-deps app
```

### Reiniciar Serviços

```bash
# Reiniciar app (graceful)
docker compose restart app

# Reiniciar worker
docker compose restart worker

# Reiniciar todos
docker compose down && docker compose up -d

# Force restart (último recurso)
docker compose kill && docker compose up -d
```

### Escalar Workers

```bash
# Adicionar workers
docker compose up -d --scale worker=3

# Reduzir workers
docker compose up -d --scale worker=1
```

### Limpar Job Queue

```bash
# Via Redis CLI
docker compose exec redis redis-cli

# Listar queues
KEYS bull:*

# Limpar queue específica (CUIDADO!)
DEL bull:render-queue:waiting
DEL bull:render-queue:active
```

### Backup Manual

```bash
# Full backup
npm run backup:full

# Schema only
npm run backup:schema

# Listar backups
npm run backup:list
```

---

## 🗓️ Manutenção Programada

### Diária
- [ ] Verificar health checks
- [ ] Revisar logs de erro
- [ ] Monitorar queue depth

### Semanal
- [ ] Executar backup full
- [ ] Revisar métricas de performance
- [ ] Limpar arquivos temporários
- [ ] Verificar atualizações de segurança

### Mensal
- [ ] Rodar load tests
- [ ] Revisar e otimizar queries lentas
- [ ] Atualizar dependências (npm audit)
- [ ] Verificar certificados SSL
- [ ] Testar procedimento de restore

### Trimestral
- [ ] Revisar e atualizar runbook
- [ ] Teste de disaster recovery
- [ ] Auditoria de segurança
- [ ] Capacity planning

---

## 🔄 Recuperação de Desastres

### RTO (Recovery Time Objective): 4 horas
### RPO (Recovery Point Objective): 24 horas

### Cenário: Perda Total do Servidor

1. **Provisionar novo servidor**
   - Requisitos: 4 vCPU, 8GB RAM, 100GB SSD
   - Ubuntu 22.04 LTS ou Debian 12

2. **Instalar dependências**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs docker.io docker-compose-plugin
   ```

3. **Restaurar código**
   ```bash
   git clone https://github.com/your-org/mvp-video-tecnicocursos.git
   cd mvp-video-tecnicocursos
   ```

4. **Restaurar configuração**
   ```bash
   # Restaurar .env de backup seguro (Vault, S3, etc.)
   aws s3 cp s3://backups/env/.env.production .env
   ```

5. **Restaurar banco (se necessário)**
   ```bash
   # Supabase mantém backups automáticos
   # Ou restaurar de backup local
   npm run backup:list
   # Seguir procedimento de restore manual
   ```

6. **Iniciar serviços**
   ```bash
   docker compose up -d
   npm run health
   ```

7. **Validar**
   ```bash
   npm run test:e2e:playwright -- --grep "@smoke"
   ```

### Cenário: Corrupção de Banco de Dados

1. **Identificar extensão do problema**
   ```bash
   npm run test:supabase
   ```

2. **Restaurar do backup mais recente**
   - Via Supabase Dashboard: Database → Backups
   - Ou via backup local

3. **Validar integridade**
   ```bash
   npm run test:migrations
   ```

---

## 📞 Contatos de Escalação

### Nível 1 - Operações
- **Horário:** 24/7
- **Canal:** #ops-alerts (Slack)
- **Resposta:** 15min para P1

### Nível 2 - Engenharia
- **Horário:** Business hours + on-call
- **Canal:** #engineering (Slack)
- **Escalação:** Após 30min sem resolução L1

### Nível 3 - Arquitetura
- **Horário:** On-call
- **Escalação:** Incidentes de infraestrutura críticos

### Fornecedores

| Serviço | Suporte | SLA |
|---------|---------|-----|
| Supabase | https://supabase.com/dashboard/support | Pro: 24h |
| Vercel | https://vercel.com/support | Pro: 12h |
| ElevenLabs | https://elevenlabs.io/contact | 48h |

---

## 📝 Changelog do Runbook

| Data | Versão | Alteração |
|------|--------|-----------|
| Dez 2025 | 1.0.0 | Versão inicial |

---

*Este runbook deve ser revisado e atualizado trimestralmente ou após incidentes significativos.*
