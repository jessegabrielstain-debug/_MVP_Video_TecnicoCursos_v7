# 🚀 README - Deploy MVP Video TécnicoCursos v7

## 📚 Documentação Completa de Deploy

Este projeto está **100% pronto para deploy** no VPS Hostinger (168.231.90.64).

---

## 🎯 Início Rápido

### Para executar o deploy AGORA:

1. **Abra PowerShell:**
   ```powershell
   ssh root@168.231.90.64
   ```

2. **Execute o deploy completo:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
   ```

**Pronto!** O script faz tudo automaticamente.

---

## 📖 Documentação Disponível

### 🚀 Guias de Deploy

1. **`EXECUTAR_AGORA.txt`** ⭐ **COMECE AQUI**
   - Instruções passo a passo simples
   - Comandos prontos para copiar e colar

2. **`INICIO_RAPIDO.md`**
   - Guia rápido de início
   - Opções de deploy automático e manual

3. **`DEPLOY.md`**
   - Guia completo e detalhado
   - Troubleshooting avançado
   - Comandos úteis

4. **`RESUMO_DEPLOY.md`**
   - Resumo executivo
   - Estrutura do deploy
   - Checklist final

5. **`CHECKLIST_DEPLOY.md`** ✅
   - Checklist completo passo a passo
   - Verificações pós-deploy
   - Troubleshooting organizado

### 📁 Scripts de Deploy

Localizados em: `scripts/deploy/`

1. **`complete-deploy.sh`** ⭐ **PRINCIPAL**
   - Script completo que faz TUDO
   - Instala Docker, configura tudo, inicia containers

2. **`diagnose.sh`** 🔍
   - Diagnóstico completo do sistema
   - Identifica problemas automaticamente

3. **`quick-fix.sh`** 🔧
   - Correções rápidas para problemas comuns
   - Ajusta Nginx, firewall, reinicia containers

4. **`vps-initial-setup.sh`**
   - Setup inicial do VPS (sem app)
   - Use apenas se quiser preparar VPS separadamente

5. **`deploy-production.sh`**
   - Deploy apenas da aplicação
   - Use quando VPS já está configurado

6. **`deploy-now.ps1`** (Windows)
   - Script PowerShell para Windows
   - Tenta executar deploy automaticamente

7. **`executar-deploy.ps1`** (Windows)
   - Versão alternativa do script PowerShell

### 📚 Documentação dos Scripts

- **`scripts/deploy/README.md`**
  - Documentação completa de todos os scripts
  - Quando usar cada script
  - Exemplos de uso

---

## 🏗️ Estrutura do Deploy

```
VPS (168.231.90.64)
│
├── Docker Stack
│   ├── app (Next.js) - Porta 3000
│   ├── nginx (Reverse Proxy) - Porta 80/443
│   ├── redis (Cache/Queue) - Porta 6379
│   └── worker (Background Jobs)
│
├── /opt/mvp/_MVP_Video_TecnicoCursos_v7/
│   ├── .env.production (variáveis de ambiente)
│   ├── docker-compose.prod.yml
│   ├── nginx/conf.d/app.conf
│   └── redis/redis.conf
│
└── Firewall (UFW)
    ├── Porta 22 (SSH)
    ├── Porta 80 (HTTP)
    └── Porta 443 (HTTPS)
```

---

## ⚙️ Variáveis de Ambiente Necessárias

### Obrigatórias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-key
DIRECT_DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres
ELEVENLABS_API_KEY=sua-key
HEYGEN_API_KEY=sua-key
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
NODE_ENV=production
```

### Opcionais (recomendadas):

```env
METRICS_TOKEN=seu-token
SENTRY_DSN=https://seu-sentry-dsn
WORKER_CONCURRENCY=3
```

---

## 🔄 Fluxo de Deploy

### Primeira Vez:

1. Conectar no VPS: `ssh root@168.231.90.64`
2. Executar: `curl -fsSL [URL] | bash`
3. Configurar `.env.production` (se solicitado)
4. Verificar: `docker compose ps`

### Atualizações:

```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
git pull origin main
git lfs pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🐛 Troubleshooting

### Diagnóstico:
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/diagnose.sh | bash
```

### Correção Rápida:
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/quick-fix.sh | bash
```

### Problemas Comuns:

- **Porta 80 não responde:** Ver `DEPLOY.md` seção Troubleshooting
- **Containers não iniciam:** Ver logs com `docker compose logs`
- **Nginx com erro:** Verificar configuração com `nginx -t`

---

## ✅ Checklist Final

Use `CHECKLIST_DEPLOY.md` para verificação completa:

- [ ] VPS acessível
- [ ] Deploy executado
- [ ] `.env.production` configurado
- [ ] Containers rodando
- [ ] Health check passando
- [ ] Porta 80 acessível
- [ ] Aplicação funcionando

---

## 🔗 Links Úteis

- **Repositório:** https://github.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7
- **VPS IP:** 168.231.90.64
- **Script Principal:** `scripts/deploy/complete-deploy.sh`

---

## 📞 Suporte

1. Execute diagnóstico primeiro
2. Verifique logs: `docker compose logs`
3. Consulte `DEPLOY.md` para troubleshooting detalhado
4. Use `CHECKLIST_DEPLOY.md` para verificação sistemática

---

## 🎉 Pronto para Deploy!

Tudo está configurado e pronto. Execute o deploy e aproveite! 🚀
