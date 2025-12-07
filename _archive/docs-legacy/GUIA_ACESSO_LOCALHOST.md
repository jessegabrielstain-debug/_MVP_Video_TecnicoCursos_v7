# 🚀 GUIA RÁPIDO - Como Acessar http://localhost:3000

**Data:** 10 de Outubro de 2025  
**Problema:** Não consegue acessar `http://localhost:3000/`  
**Status:** ✅ RESOLVIDO

---

## 🔍 DIAGNÓSTICO

**Problema Identificado:**
O servidor Next.js **NÃO estava rodando**.

**Causa:**
A aplicação Next.js precisa ser iniciada manualmente com o comando `npm run dev`.

---

## ✅ SOLUÇÃO APLICADA

### Passo 1: Navegar até o diretório da aplicação
```bash
cd C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\estudio_ia_videos\app
```

### Passo 2: Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### Passo 3: Aguardar a inicialização (10-30 segundos)
Você verá algo como:
```
> app@ dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info Loaded env from .env
- event compiled client and server successfully in 5.2s
```

### Passo 4: Acessar a aplicação
Abra o navegador e acesse:
```
http://localhost:3000
```

---

## 🛠️ COMANDOS DISPONÍVEIS

### Desenvolvimento
```bash
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)
npm run dev:websocket    # Inicia servidor WebSocket
```

### Produção
```bash
npm run build            # Cria build de produção
npm run start            # Inicia servidor de produção
```

### Testes
```bash
npm run test             # Executa testes
npm run lint             # Verifica linting
```

---

## ⚠️ PROBLEMAS COMUNS

### 1. Porta 3000 já está em uso
**Sintoma:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solução:**
```bash
# Windows - Encontrar processo na porta 3000
netstat -ano | findstr :3000

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Ou usar outra porta
npm run dev -- -p 3001
```

### 2. Dependências não instaladas
**Sintoma:**
```
Error: Cannot find module 'next'
```

**Solução:**
```bash
npm install
```

### 3. Erro de compilação
**Sintoma:**
```
Failed to compile
```

**Solução:**
```bash
# Limpar cache e rebuild
rm -rf .next
npm run dev
```

### 4. Variáveis de ambiente faltando
**Sintoma:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not set
```

**Solução:**
```bash
# Verificar .env
cd C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7
cat .env

# Ou executar validação
cd scripts
npm run validate:env
```

---

## 📊 VERIFICAÇÃO RÁPIDA

### Verificar se o servidor está rodando
```bash
# Windows
netstat -ano | findstr :3000

# Deve retornar algo como:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

### Verificar processos Node.js
```bash
# Windows
tasklist | findstr node

# PowerShell
Get-Process -Name node | Select-Object Id, ProcessName, CPU
```

### Acessar pelo navegador
```
http://localhost:3000
http://127.0.0.1:3000
```

---

## 🔧 WORKFLOW COMPLETO

### Iniciar o Projeto pela Primeira Vez

**1. Validar Ambiente**
```bash
cd C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\scripts
npm run validate:env
```

**2. Instalar Dependências**
```bash
cd ../estudio_ia_videos/app
npm install
```

**3. Configurar Database (se necessário)**
```bash
cd ../../scripts
npm run setup:supabase
```

**4. Iniciar Servidor**
```bash
cd ../estudio_ia_videos/app
npm run dev
```

**5. Acessar**
```
http://localhost:3000
```

---

## 🚀 MODO PRODUÇÃO

### Build de Produção
```bash
# 1. Criar build otimizada
npm run build

# 2. Iniciar servidor de produção
npm run start

# 3. Acessar
http://localhost:3000
```

---

## 📝 LOGS E DEBUG

### Verificar logs em tempo real
```bash
# O terminal mostra logs automáticos do Next.js
# Exemplo:
# - ready started server on 0.0.0.0:3000
# - event compiled successfully
# - info Fast Refresh enabled
```

### Logs de erro
```bash
# Erros aparecem em vermelho no terminal
# Exemplo:
# ⨯ Error: Cannot connect to database
```

### Debug mode
```bash
# Modo debug com logs detalhados
NODE_OPTIONS='--inspect' npm run dev

# Acessar debugger em:
chrome://inspect
```

---

## ✅ CHECKLIST PRÉ-ACESSO

Antes de acessar `http://localhost:3000`, verifique:

- [ ] Node.js v20+ instalado (`node --version`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Porta 3000 livre
- [ ] Sem erros no terminal
- [ ] Mensagem "ready started server" apareceu

---

## 🎯 PRÓXIMOS PASSOS

Após o servidor iniciar com sucesso:

1. ✅ Acessar `http://localhost:3000`
2. ✅ Verificar se a página inicial carrega
3. ✅ Testar funcionalidades principais
4. ✅ Monitorar logs no terminal
5. ✅ Usar `Ctrl+C` para parar o servidor quando necessário

---

## 📞 AJUDA ADICIONAL

Se ainda não conseguir acessar:

**1. Verificar firewall**
- Windows Firewall pode estar bloqueando a porta 3000
- Adicionar exceção para Node.js

**2. Verificar antivírus**
- Alguns antivírus bloqueiam servidores locais
- Adicionar exceção temporária

**3. Tentar outra porta**
```bash
npm run dev -- -p 3001
# Acessar: http://localhost:3001
```

**4. Reiniciar o computador**
- Último recurso se nada funcionar
- Libera todas as portas e processos

---

## 🏆 STATUS ATUAL

**Servidor:** ✅ INICIANDO  
**Porta:** 3000  
**URL:** http://localhost:3000  
**Comando:** `npm run dev`  

**Aguarde 10-30 segundos para o servidor inicializar completamente.**

---

**Desenvolvido para MVP Video Técnico Cursos v7**  
**Data:** 10 de Outubro de 2025
