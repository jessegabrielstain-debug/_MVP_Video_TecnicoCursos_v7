# ✅ Checklist Completo de Deploy

## 📋 Pré-Deploy

- [ ] VPS Hostinger configurado (IP: 168.231.90.64)
- [ ] Acesso SSH ao VPS funcionando
- [ ] Senha do root do VPS disponível
- [ ] Variáveis de ambiente do Supabase coletadas
- [ ] API Keys (ElevenLabs, HeyGen) disponíveis

---

## 🚀 Deploy Inicial

### 1. Conectar no VPS
```bash
ssh root@168.231.90.64
```

### 2. Executar Script de Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

**Checklist durante execução:**
- [ ] Sistema atualizado
- [ ] Docker instalado
- [ ] Firewall configurado
- [ ] Swap criado (4GB)
- [ ] Usuário deploy criado
- [ ] Repositório clonado
- [ ] Containers iniciados

---

## ⚙️ Configuração de Variáveis

### 3. Configurar .env.production

```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
nano .env.production
```

**Variáveis OBRIGATÓRIAS:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DIRECT_DATABASE_URL`
- [ ] `ELEVENLABS_API_KEY`
- [ ] `HEYGEN_API_KEY`
- [ ] `REDIS_URL=redis://redis:6379`
- [ ] `LOG_LEVEL=info`
- [ ] `NODE_ENV=production`

**Variáveis OPCIONAIS (recomendadas):**
- [ ] `METRICS_TOKEN` (para monitoramento)
- [ ] `SENTRY_DSN` (para error tracking)
- [ ] `WORKER_CONCURRENCY=3`

### 4. Iniciar Containers (se não iniciaram automaticamente)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Verificação Pós-Deploy

### 5. Verificar Containers
```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
docker compose -f docker-compose.prod.yml ps
```

**Deve mostrar 4 containers rodando:**
- [ ] `mvp-videos-app` (Status: Up)
- [ ] `mvp-videos-nginx` (Status: Up)
- [ ] `mvp-videos-redis` (Status: Up)
- [ ] `mvp-videos-worker` (Status: Up)

### 6. Verificar Logs
```bash
# Logs do App
docker compose -f docker-compose.prod.yml logs app --tail=50

# Logs do Nginx
docker compose -f docker-compose.prod.yml logs nginx --tail=50

# Logs do Redis
docker compose -f docker-compose.prod.yml logs redis --tail=50

# Logs do Worker
docker compose -f docker-compose.prod.yml logs worker --tail=50
```

**Verificar:**
- [ ] Sem erros críticos nos logs
- [ ] App iniciou corretamente
- [ ] Nginx sem erros de configuração
- [ ] Redis respondendo
- [ ] Worker conectado ao Redis

### 7. Testar Endpoints

```bash
# Health check interno
curl http://localhost/api/health

# Deve retornar JSON com status
```

**Verificar:**
- [ ] Health check retorna 200 OK
- [ ] JSON válido com informações de saúde

### 8. Testar Acesso Externo

```bash
# Do seu computador local
curl http://168.231.90.64/api/health
```

**Verificar:**
- [ ] Resposta HTTP 200
- [ ] JSON válido
- [ ] Sem erros de timeout

### 9. Acessar no Navegador

Abrir: `http://168.231.90.64`

**Verificar:**
- [ ] Página carrega
- [ ] Sem erros no console do navegador
- [ ] API endpoints funcionando

---

## 🔧 Troubleshooting

### Se porta 80 não responde:

```bash
# Verificar firewall
ufw status
ufw allow 80/tcp

# Verificar se porta está escutando
ss -tlnp | grep :80

# Verificar Nginx
docker logs mvp-videos-nginx
docker exec mvp-videos-nginx nginx -t

# Corrigir server_name se necessário
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
sed -i 's/server_name tecnicocursos.com www.tecnicocursos.com;/server_name _;/' nginx/conf.d/app.conf
docker compose -f docker-compose.prod.yml restart nginx
```

### Se containers não iniciam:

```bash
# Ver logs de erro
docker compose -f docker-compose.prod.yml logs

# Verificar .env.production
cat .env.production

# Rebuild completo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Se health check falha:

```bash
# Verificar conexão com banco
docker exec mvp-videos-app curl http://localhost:3000/api/health

# Verificar Redis
docker exec mvp-videos-redis redis-cli ping

# Verificar variáveis de ambiente
docker exec mvp-videos-app env | grep SUPABASE
```

---

## 📊 Monitoramento

### Comandos Úteis

```bash
# Status dos containers
docker compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Espaço em disco
df -h

# Memória
free -h

# Logs em tempo real
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🔄 Atualizações Futuras

### Atualizar Código

```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
git pull origin main
git lfs pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Reiniciar Serviços

```bash
# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart

# Reiniciar apenas app
docker compose -f docker-compose.prod.yml restart app

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Iniciar tudo
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Segurança

### Verificações de Segurança

- [ ] SSH configurado com chave (não apenas senha)
- [ ] Firewall ativo (UFW)
- [ ] Usuário deploy criado (não usar root)
- [ ] Containers rodando com usuário não-root
- [ ] .env.production não commitado no Git
- [ ] Senhas fortes configuradas

### Próximos Passos de Segurança

- [ ] Configurar SSL/HTTPS (Let's Encrypt)
- [ ] Configurar backup automático
- [ ] Configurar monitoramento (Sentry, etc.)
- [ ] Configurar logs centralizados

---

## 📝 Notas Finais

- ✅ Todos os scripts estão no GitHub
- ✅ Documentação completa disponível
- ✅ Scripts de diagnóstico disponíveis
- ✅ Correções rápidas disponíveis

**Arquivos importantes:**
- `EXECUTAR_AGORA.txt` - Instruções passo a passo
- `DEPLOY.md` - Guia completo
- `INICIO_RAPIDO.md` - Início rápido
- `RESUMO_DEPLOY.md` - Resumo executivo

---

## 🆘 Suporte

Se algo não funcionar:

1. Execute diagnóstico:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/diagnose.sh | bash
   ```

2. Execute correção rápida:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/quick-fix.sh | bash
   ```

3. Verifique logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs
   ```

---

**✅ Deploy completo quando todos os itens acima estiverem marcados!**
