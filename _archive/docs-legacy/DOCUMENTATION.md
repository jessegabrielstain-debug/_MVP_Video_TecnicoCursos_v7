# 📚 Documentação do Sistema - MVP Vídeo Técnico Cursos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Uso](#uso)
6. [API](#api)
7. [Deploy](#deploy)
8. [Testes](#testes)
9. [Contribuindo](#contribuindo)
10. [Suporte](#suporte)

---

## 🎯 Visão Geral

Sistema automatizado para geração de vídeos técnicos a partir de apresentações PowerPoint (PPTX), utilizando:
- **Next.js 14** (App Router)
- **Remotion** (composição de vídeos)
- **FFmpeg** (processamento de mídia)
- **Supabase** (banco de dados + autenticação + storage)
- **TypeScript** (type-safe)
- **Tailwind CSS** (estilização)

### ✨ Funcionalidades Principais

- 📤 Upload de arquivos PPTX
- 🔄 Conversão automática de slides em cenas de vídeo
- 🎨 Editor visual de slides com drag-and-drop
- 🎬 Preview em tempo real
- 🗣️ Text-to-Speech (TTS) integrado
- 📊 Analytics e métricas de render
- 👥 Sistema multiusuário com RLS (Row Level Security)
- 🎓 Gestão de cursos e módulos

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
📁 _MVP_Video_TecnicoCursos_v7/
├── 📁 estudio_ia_videos/app/        # Aplicação Next.js
│   ├── 📁 app/                      # App Router
│   │   ├── 📁 (auth)/               # Rotas de autenticação
│   │   ├── 📁 (dashboard)/          # Dashboard principal
│   │   ├── 📁 api/                  # API Routes
│   │   └── 📁 lib/                  # Utilitários e helpers
│   ├── 📁 components/               # Componentes React
│   ├── 📁 hooks/                    # Custom hooks
│   ├── 📁 stores/                   # Zustand stores
│   ├── 📁 styles/                   # Estilos globais
│   └── 📁 __tests__/                # Testes unitários
├── 📁 scripts/                      # Scripts de automação
│   ├── setup-supabase.ps1           # Setup do banco
│   ├── test-project-complete.ps1    # Testes completos
│   └── deploy.ps1                   # Deploy automatizado
├── 📁 .github/workflows/            # CI/CD (GitHub Actions)
├── 📄 database-schema.sql           # Schema do banco
├── 📄 database-rls-policies.sql     # Políticas RLS
└── 📄 docker-compose.yml            # Orquestração Docker
```

### Stack Tecnológico

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, CVA |
| **State Management** | Zustand, React Query |
| **Backend** | Next.js API Routes, Supabase |
| **Database** | PostgreSQL (via Supabase) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth |
| **Video** | Remotion, FFmpeg |
| **Testing** | Jest, React Testing Library |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Loki, Jaeger |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 20+ (LTS)
- npm ou yarn
- PostgreSQL 15+ (ou conta Supabase)
- Git
- FFmpeg (para processamento de vídeo)

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone https://github.com/aline-jesse/_MVP_Video_TecnicoCursos.git
cd _MVP_Video_TecnicoCursos_v7
```

2. **Instale as dependências:**
```bash
cd estudio_ia_videos/app
npm install --legacy-peer-deps
```

3. **Configure o ambiente:**
```bash
cd ../../scripts
.\create-env.ps1
```

4. **Configure o banco de dados:**
```bash
npm run setup:supabase
```

5. **Inicie o servidor:**
```bash
cd ../estudio_ia_videos/app
npm run dev
```

Acesse: `http://localhost:3000`

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie `.env.local` em `estudio_ia_videos/app/`:

```env
# Supabase (Obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Storage (Opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# TTS (Opcional)
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=eastus
ELEVENLABS_API_KEY=

# IA (Opcional)
OPENAI_API_KEY=
```

### Buckets de Storage

O sistema usa 4 buckets no Supabase:
- `videos` - Vídeos finais renderizados
- `avatars` - Avatares de usuários
- `thumbnails` - Miniaturas de vídeos
- `assets` - Recursos adicionais (áudio, imagens)

Criados automaticamente via `npm run setup:supabase`.

---

## 💡 Uso

### 1. Criando um Projeto

1. Faça login no sistema
2. Clique em "Novo Projeto"
3. Preencha: nome, descrição, categoria
4. Upload do arquivo PPTX

### 2. Editando Slides

- **Reordenar:** Arraste e solte os slides
- **Editar texto:** Clique no slide > altere título/conteúdo
- **Configurar duração:** Ajuste segundos por slide
- **Preview:** Clique em "Visualizar" para ver como ficará

### 3. Gerando Vídeo

1. Configure opções de render (resolução, FPS)
2. Clique em "Gerar Vídeo"
3. Acompanhe progresso no dashboard
4. Download quando concluído

### 4. Gerenciando Cursos

- **Criar curso:** Admin pode criar cursos públicos
- **Adicionar módulos:** Organize conteúdo em módulos
- **Publicar:** Torne disponível para usuários

---

## 🔌 API

### Endpoints Principais

#### Projetos
```typescript
GET    /api/projects          // Listar projetos do usuário
POST   /api/projects          // Criar projeto
GET    /api/projects/:id      // Obter projeto
PATCH  /api/projects/:id      // Atualizar projeto
DELETE /api/projects/:id      // Deletar projeto
```

#### Slides
```typescript
GET    /api/slides?project_id=:id  // Listar slides
POST   /api/slides                 // Criar slide
PATCH  /api/slides/:id             // Atualizar slide
DELETE /api/slides/:id             // Deletar slide
```

#### Render
```typescript
POST   /api/render/start           // Iniciar render
GET    /api/render/status/:id      // Status do render
GET    /api/render/jobs            // Listar jobs
```

#### Analytics
```typescript
GET    /api/analytics/render-stats  // Métricas de render
POST   /api/analytics/events        // Registrar evento
```

### Exemplo de Requisição

```typescript
// Criar projeto
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Meu Curso',
    description: 'Curso de TypeScript',
    category: 'programming'
  })
});

const project = await response.json();
```

---

## 🚢 Deploy

### Opção 1: Vercel (Recomendado)

```bash
npm run deploy
```

ou manualmente:

1. Conecte repo ao Vercel
2. Configure env vars
3. Deploy automático

### Opção 2: Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f
```

### Opção 3: Kubernetes

```bash
kubectl apply -f kubernetes/
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
cd scripts
.\test-project-complete.ps1 -Verbose
```

### Testes Unitários

```bash
cd estudio_ia_videos/app
npm test
```

### Testes E2E

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test:coverage
```

---

## 🤝 Contribuindo

### Workflow

1. Fork o projeto
2. Crie branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra Pull Request

### Convenções de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

### Code Review

PRs precisam:
- ✅ Passar em todos os testes
- ✅ Seguir padrões de código (ESLint)
- ✅ Ter documentação atualizada
- ✅ Aprovação de 1 mantenedor

---

## 💬 Suporte

### Documentação Adicional

- [README.md](./README.md) - Introdução
- [CHANGELOG.md](./CHANGELOG.md) - Histórico de versões
- [CHECKLIST_DEPLOY.md](./CHECKLIST_DEPLOY.md) - Checklist de deploy
- [CONFIG_COMPLETA.md](./CONFIG_COMPLETA.md) - Configuração avançada

### Issues

Reporte bugs ou sugira features:
- GitHub Issues: https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/issues

### Contato

- Email: suporte@videotecnicocursos.com
- Discord: [Link do servidor]

---

## 📊 Status do Projeto

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-80%25-yellow)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Última atualização:** 11 de novembro de 2025

---

## 📝 Licença

MIT License - veja [LICENSE](./LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- Next.js Team
- Supabase Team
- Remotion Team
- Comunidade Open Source

---

**Desenvolvido com ❤️ por Aline Jesse**
