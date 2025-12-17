# 🚀 START - Deploy em 2 Minutos

## VPS: 168.231.90.64

---

## Passo 1: Abrir PowerShell
```powershell
ssh root@168.231.90.64
```

## Passo 2: Executar Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

## Passo 3: Aguardar (5-10 min)
O script faz tudo automaticamente!

## Passo 4: Acessar
```
http://168.231.90.64
```

---

## Se Pedir .env.production:

```bash
cd /opt/mvp/_MVP_Video_TecnicoCursos_v7
nano .env.production
```

Preencha e salve (Ctrl+O, Enter, Ctrl+X), depois:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Verificar:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/api/health
```

---

**Mais detalhes: `DEPLOY_FINAL.md`**
