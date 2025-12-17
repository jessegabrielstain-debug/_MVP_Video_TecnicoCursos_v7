# 🚀 Guia de Deploy - MVP Video TécnicoCursos v7

## VPS: 168.231.90.64

---

## ⚡ Deploy Rápido (Recomendado)

### Passo 1: Conectar no VPS
```powershell
ssh root@168.231.90.64
```
*(Digite a senha quando solicitado)*

### Passo 2: Executar Script Completo
No terminal do VPS, cole e execute:
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

**O script faz tudo automaticamente:**
- ✅ Atualiza sistema
- ✅ Instala Docker
- ✅ Configura firewall (portas 80, 443)
- ✅ Cria swap de 4GB
- ✅ Cria usuário `deploy`
- ✅ Configura SSH
- ✅ Clona repositório
- ✅ Configura Redis
- ✅ Inicia containers Docker

---

## 📝 Se o script pedir .env.production

O script vai criar um arquivo `.env.production` com template. Você precisa editá-lo:

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
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🔍 Verificar Status

### Ver containers rodando:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
docker compose -f docker-compose.prod.yml ps
```

### Ver logs:
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### Testar saúde:
```bash
curl http://localhost/api/health
```

### Verificar porta 80:
```bash
ss -tlnp | grep :80
```

---

## 🌐 Acessar Aplicação

Após o deploy completo, acesse:
- **HTTP:** http://168.231.90.64
- **API Health:** http://168.231.90.64/api/health

---

## 🛠️ Comandos Úteis

### Reiniciar tudo:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
docker compose -f docker-compose.prod.yml restart
```

### Parar tudo:
```bash
docker compose -f docker-compose.prod.yml down
```

### Atualizar código:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
git pull origin main
git lfs pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Ver uso de recursos:
```bash
docker stats
```

---

## 🔐 SSH com Chave (Após primeiro deploy)

Depois que o script configurar o SSH, você pode usar:

```powershell
ssh deploy@168.231.90.64
```

Ou usando o alias configurado:
```powershell
ssh mvp-vps
```

---

## 🔍 Diagnóstico e Correção Rápida

### Script de Diagnóstico Completo:
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/diagnose.sh | bash
```

### Correção Rápida (se porta 80 não responde):
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/quick-fix.sh | bash
```

---

## ❌ Troubleshooting

### Porta 80 não responde:
```bash
# Verificar firewall
ufw status
ufw allow 80/tcp

# Verificar containers
docker ps

# Verificar logs do nginx
docker compose -f docker-compose.prod.yml logs nginx

# Corrigir server_name do Nginx (se necessário)
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
sed -i 's/server_name tecnicocursos.com www.tecnicocursos.com;/server_name _;/' nginx/conf.d/app.conf
docker compose -f docker-compose.prod.yml restart nginx
```

### Container não inicia:
```bash
# Ver logs completos
docker compose -f docker-compose.prod.yml logs

# Verificar .env.production
cat .env.production

# Rebuild completo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Erro de permissão:
```bash
# Ajustar permissões
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
chown -R deploy:deploy .
```

### Nginx não aceita conexões:
```bash
# Verificar configuração
docker exec mvp-videos-nginx nginx -t

# Verificar se server_name está correto
grep server_name nginx/conf.d/app.conf

# Deve mostrar: server_name _;
# Se mostrar tecnicocursos.com, execute:
sed -i 's/server_name tecnicocursos.com www.tecnicocursos.com;/server_name _;/' nginx/conf.d/app.conf
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 📞 Suporte

Se algo não funcionar, verifique:
1. ✅ Docker está rodando: `systemctl status docker`
2. ✅ Firewall liberou portas: `ufw status`
3. ✅ Containers estão up: `docker ps`
4. ✅ Logs não mostram erros: `docker compose logs`
