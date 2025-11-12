# 🎓 Tutorial Completo - MVP Vídeo Técnico Cursos

## 📚 Guia Passo a Passo para Iniciantes

Este tutorial vai te guiar desde a instalação até a criação do seu primeiro vídeo técnico automatizado.

---

## 🎯 Parte 1: Instalação e Configuração (15 minutos)

### Passo 1: Verificar Pré-requisitos

Antes de começar, certifique-se que tem instalado:

```powershell
# Verificar Node.js (necessário v20+)
node --version
# Deve retornar: v20.x.x ou superior

# Verificar npm
npm --version
# Deve retornar: v9.x.x ou superior

# Verificar Git
git --version
# Deve retornar: git version 2.x.x
```

**Não tem instalado?**
- Node.js: https://nodejs.org/
- Git: https://git-scm.com/

### Passo 2: Clonar o Projeto

```powershell
# Clone o repositório
git clone https://github.com/aline-jesse/_MVP_Video_TecnicoCursos.git

# Entre na pasta
cd _MVP_Video_TecnicoCursos_v7
```

### Passo 3: Instalar Dependências

```powershell
# Entre na pasta da aplicação
cd estudio_ia_videos\app

# Instale as dependências
npm install --legacy-peer-deps

# Aguarde 2-3 minutos (910 pacotes serão instalados)
```

### Passo 4: Criar Conta Supabase (GRÁTIS)

1. Acesse: https://app.supabase.com
2. Clique em "Start your project"
3. Login com GitHub
4. Clique em "New Project"
5. Preencha:
   - **Name:** video-tecnico-cursos
   - **Database Password:** (escolha uma senha forte)
   - **Region:** South America (São Paulo)
6. Clique em "Create new project"
7. **Aguarde 2-3 minutos** (projeto sendo criado)

### Passo 5: Obter Credenciais Supabase

1. No dashboard do projeto, clique em **Settings** (⚙️)
2. Clique em **API**
3. Copie:
   - **Project URL** (ex: https://xxx.supabase.co)
   - **anon/public key** (começa com eyJhbGci...)
   - **service_role key** (⚠️ SECRETO - começa com eyJhbGci...)

### Passo 6: Configurar Variáveis de Ambiente

```powershell
# Volte para a raiz do projeto
cd ..\..

# Execute o script de configuração
cd scripts
.\create-env.ps1
```

**Cole as credenciais quando solicitado:**
- URL do Supabase: (cole o Project URL)
- Chave Anônima: (cole anon key)
- Chave de Serviço: (cole service_role key)
- Serviços opcionais: **pressione ENTER** (vamos pular por enquanto)

✅ Arquivo `.env.local` criado!

### Passo 7: Configurar Banco de Dados

```powershell
# Ainda na pasta scripts
npm run setup:supabase
```

Isso vai:
- ✅ Criar 7 tabelas (users, projects, slides, render_jobs, etc)
- ✅ Configurar RLS (segurança)
- ✅ Criar 4 buckets de storage
- ✅ Inserir dados de exemplo
- ⏱️ Tempo: ~15 segundos

### Passo 8: Iniciar o Sistema

```powershell
# Entre na pasta da aplicação
cd ..\estudio_ia_videos\app

# Inicie o servidor de desenvolvimento
npm run dev
```

✅ **Sistema rodando em:** http://localhost:3000

---

## 🎬 Parte 2: Criando Seu Primeiro Projeto (10 minutos)

### Passo 1: Criar Conta

1. Abra: http://localhost:3000
2. Clique em **"Criar Conta"**
3. Preencha:
   - Email: seu-email@example.com
   - Senha: (mínimo 6 caracteres)
4. Clique em **"Registrar"**
5. ✅ Você será redirecionado para o dashboard

### Passo 2: Criar Projeto

1. No dashboard, clique em **"Novo Projeto"** (botão azul)
2. Preencha:
   - **Nome:** Meu Primeiro Curso
   - **Descrição:** Curso introdutório sobre TypeScript
   - **Categoria:** Programming
3. Clique em **"Criar Projeto"**
4. ✅ Projeto criado!

### Passo 3: Upload de Apresentação

1. Na tela do projeto, clique em **"Upload PPTX"**
2. Selecione um arquivo `.pptx` do seu computador
   - **Não tem um?** Crie um PowerPoint simples com 3-5 slides
3. Aguarde upload (pode levar 10-30 segundos)
4. ✅ Slides importados aparecem na tela!

### Passo 4: Editar Slides

Agora você pode:

**Reordenar slides:**
- Arraste e solte para mudar a ordem
- A numeração atualiza automaticamente

**Editar conteúdo:**
1. Clique em um slide
2. Altere o título ou descrição
3. Clique em **"Salvar"**

**Configurar duração:**
1. Clique no ⚙️ ao lado do slide
2. Ajuste segundos (padrão: 5s)
3. Clique em **"Aplicar"**

**Preview:**
- Clique em **"👁️ Visualizar"** para ver como ficará

---

## 🎥 Parte 3: Gerando Vídeo (5 minutos)

### Passo 1: Configurar Render

1. Clique em **"Gerar Vídeo"** (botão verde)
2. Escolha opções:
   - **Resolução:** 1920x1080 (Full HD)
   - **FPS:** 30
   - **Qualidade:** Alta
3. Clique em **"Iniciar Render"**

### Passo 2: Acompanhar Progresso

1. Você será redirecionado para página de status
2. Acompanhe:
   - 📊 Barra de progresso
   - ⏱️ Tempo estimado
   - 🎬 Frame atual
3. **Aguarde 2-5 minutos** (depende do número de slides)

### Passo 3: Download do Vídeo

1. Quando status = **"Concluído"** ✅
2. Clique em **"📥 Baixar Vídeo"**
3. ✅ Vídeo salvo na pasta Downloads!

---

## 📊 Parte 4: Recursos Avançados (Opcional)

### Analytics

Veja métricas do seu sistema:

1. Dashboard > **"Analytics"**
2. Visualize:
   - Total de vídeos gerados
   - Tempo médio de render
   - Taxa de sucesso
   - Erros comuns

### Cursos e Módulos

Organize conteúdo em cursos:

1. Dashboard > **"Cursos"**
2. Clique em **"Novo Curso"**
3. Adicione módulos
4. Associe projetos aos módulos
5. Publique!

### Configurações Avançadas

**TTS (Text-to-Speech):**
- Configure Azure Speech ou ElevenLabs
- Gere narração automática dos slides

**Storage:**
- Configure AWS S3 para storage externo
- Maior capacidade de armazenamento

**IA:**
- Adicione OpenAI API Key
- Gere descrições automáticas de slides

---

## 🔧 Parte 5: Comandos Úteis

### Desenvolvimento

```powershell
# Iniciar servidor (modo dev com hot reload)
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Linter (verificar código)
npm run lint
```

### Testes

```powershell
# Teste rápido (estrutura básica)
cd scripts
.\test-project-quick.ps1

# Teste completo (15 casos)
.\test-project-complete.ps1 -Verbose

# Testes unitários
cd ..\estudio_ia_videos\app
npm test
```

### Banco de Dados

```powershell
# Recriar banco (⚠️ APAGA TUDO)
cd scripts
npm run setup:supabase

# Verificar status
npm run health

# Validar environment
npm run validate:env
```

### Docker

```powershell
# Iniciar com Docker
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Parar tudo
docker-compose down
```

---

## 🐛 Parte 6: Solução de Problemas

### Erro: "Cannot find module"

**Solução:**
```powershell
cd estudio_ia_videos\app
rm -r node_modules
npm install --legacy-peer-deps
```

### Erro: "Supabase connection failed"

**Solução:**
1. Verifique `.env.local`
2. Confirme credenciais no Supabase
3. Teste conexão:
```powershell
cd scripts
npm run test:supabase
```

### Erro: "Port 3000 already in use"

**Solução:**
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou use outra porta
$env:PORT=3001
npm run dev
```

### Erro: "FFmpeg not found"

**Solução:**
1. Baixe FFmpeg: https://ffmpeg.org/download.html
2. Extraia para `C:\ffmpeg`
3. Adicione ao PATH:
   - Pesquise "Variáveis de ambiente"
   - Edite PATH
   - Adicione `C:\ffmpeg\bin`

### Sistema lento?

**Otimizações:**
- Feche outras aplicações
- Use SSD (não HDD)
- Aumente RAM disponível
- Reduza resolução do vídeo (720p)

---

## 📚 Parte 7: Próximos Passos

### Aprender Mais

1. **Documentação Completa:** `DOCUMENTATION.md`
2. **Guia de API:** `COMPLETE_FEATURE_LIST.md`
3. **Checklist de Deploy:** `CHECKLIST_DEPLOY.md`
4. **Changelog:** `CHANGELOG.md`

### Melhorar o Sistema

- Configure TTS para narração
- Adicione templates personalizados
- Integre com LMS (Moodle, Canvas)
- Implemente watermarks
- Adicione legendas automáticas

### Deploy em Produção

```powershell
# Opção 1: Vercel (mais fácil)
npm run deploy

# Opção 2: Docker
docker-compose -f docker-compose.yml up -d

# Opção 3: Kubernetes
kubectl apply -f kubernetes/
```

---

## 🎉 Parabéns!

Você completou o tutorial e agora sabe:
- ✅ Instalar e configurar o sistema
- ✅ Criar projetos e upload de PPTX
- ✅ Editar slides visualmente
- ✅ Gerar vídeos automaticamente
- ✅ Usar recursos avançados
- ✅ Resolver problemas comuns

### Precisa de Ajuda?

- 📖 Leia a documentação completa
- 🐛 Reporte bugs no GitHub Issues
- 💬 Entre no Discord da comunidade
- 📧 Email: suporte@videotecnicocursos.com

---

**Bons vídeos! 🎬✨**

*Tutorial criado em: 11 de novembro de 2025*  
*Versão do sistema: 1.0.0*
