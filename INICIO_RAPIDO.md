# 🚀 Início Rápido - Deploy no VPS

## VPS: 168.231.90.64

---

## ⚡ Opção 1: Deploy Automático (Recomendado)

### No PowerShell (Windows):
```powershell
cd c:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7
.\scripts\deploy\deploy-now.ps1
```

**OU** execute diretamente no VPS:
```bash
ssh root@168.231.90.64
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

---

## 📋 Opção 2: Deploy Manual Passo a Passo

### 1. Conectar no VPS
```powershell
ssh root@168.231.90.64
```

### 2. Executar Script Completo
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

O script faz **TUDO automaticamente**:
- ✅ Atualiza sistema
- ✅ Instala Docker
- ✅ Configura firewall
- ✅ Cria swap
- ✅ Configura usuário deploy
- ✅ Clona repositório
- ✅ Inicia containers

---

## ⚙️ Configurar Variáveis de Ambiente

Se o script pedir `.env.production`, execute:

```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
nano .env.production
```

**Preencha as variáveis obrigatórias:**
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

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Depois execute:**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔍 Verificar Status

### Ver containers:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
docker compose -f docker-compose.prod.yml ps
```

### Ver logs:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Testar saúde:
```bash
curl http://localhost/api/health
```

---

## 🛠️ Se Algo Não Funcionar

### Diagnóstico Completo:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/diagnose.sh | bash
```

### Correção Rápida:
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/quick-fix.sh | bash
```

---

## 🌐 Acessar Aplicação

Após deploy bem-sucedido:
- **HTTP:** http://168.231.90.64
- **Health Check:** http://168.231.90.64/api/health

---

## 📚 Documentação Completa

Veja `DEPLOY.md` para guia completo com troubleshooting detalhado.
