# 📋 PRD - Product Requirements Document
## Estúdio IA de Vídeos | MVP TécnicoCursos v7

**Versão:** 7.0  
**Data:** 02 de Dezembro de 2025  
**Status:** ✅ Production Ready  
**Repository:** github.com/aline-jesse/_MVP_Video_TecnicoCursos

---

## 📑 Índice

1. [Executive Summary](#1-executive-summary)
2. [Visão e Missão](#2-visão-e-missão)
3. [Problema e Oportunidade](#3-problema-e-oportunidade)
4. [Público-Alvo e Personas](#4-público-alvo-e-personas)
5. [Funcionalidades do Produto](#5-funcionalidades-do-produto)
6. [Arquitetura Técnica](#6-arquitetura-técnica)
7. [Stack Tecnológico](#7-stack-tecnológico)
8. [Fluxos de Uso](#8-fluxos-de-uso)
9. [Requisitos Funcionais](#9-requisitos-funcionais)
10. [Requisitos Não-Funcionais](#10-requisitos-não-funcionais)
11. [Métricas e KPIs](#11-métricas-e-kpis)
12. [Roadmap](#12-roadmap)
13. [Riscos e Mitigações](#13-riscos-e-mitigações)

---

## 1. Executive Summary

### 1.1 O Que É

O **Estúdio IA de Vídeos** é uma plataforma SaaS brasileira que automatiza a criação de vídeos de treinamento de segurança do trabalho (Normas Regulamentadoras - NRs) utilizando inteligência artificial, avatares, síntese de voz (TTS) e processamento automatizado de apresentações PowerPoint.

### 1.2 Proposta de Valor

| Aspecto | Método Tradicional | Estúdio IA | Economia |
|---------|-------------------|------------|----------|
| **Custo por vídeo** | R$ 5.000 - R$ 50.000 | R$ 299/mês (ilimitado) | **-98%** |
| **Tempo de produção** | 30-90 dias | 1-3 dias | **-95%** |
| **Expertise necessária** | Equipe técnica | Nenhuma | **Zero barreira** |
| **Atualização de conteúdo** | R$ 3.000 | Incluso | **-100%** |
| **Compliance NR** | Manual | Automático | **Garantido** |

### 1.3 Status Atual do Projeto

```
████████████████████████████████ 100% IMPLEMENTADO

✅ 9 Fases completas (0-8)
✅ 142+ testes automatizados (87% coverage)
✅ 40 testes E2E (RBAC + Video Flow)
✅ 15,450+ linhas de código
✅ Health Score: 82/100
✅ Production-Ready: SIM
```

### 1.4 Números-Chave

| Métrica | Valor |
|---------|-------|
| Tabelas no Database | 7 + RBAC |
| Storage Buckets | 4 (videos, avatars, thumbnails, assets) |
| Políticas RLS | ~30 |
| Parsers PPTX | 8 (~1,850 linhas) |
| Módulos Video Render | 5 (~2,200 linhas) |
| APIs Funcionais | 60+ rotas |

---

## 2. Visão e Missão

### 2.1 Visão

Ser a plataforma líder no Brasil para criação automatizada de vídeos de treinamento corporativo, democratizando o acesso à produção de conteúdo audiovisual de alta qualidade.

### 2.2 Missão

Permitir que profissionais de RH, segurança do trabalho e educadores corporativos criem vídeos profissionais de treinamento em minutos, sem necessidade de conhecimento técnico, garantindo compliance com as Normas Regulamentadoras brasileiras.

### 2.3 Valores do Produto

- **Simplicidade:** Interface intuitiva que qualquer pessoa pode usar
- **Qualidade:** Vídeos profissionais com avatares e narração de alta qualidade
- **Compliance:** Validação automática dos requisitos legais das NRs
- **Velocidade:** De apresentação PPTX a vídeo finalizado em minutos
- **Escalabilidade:** Produza dezenas de vídeos sem escalar custos

---

## 3. Problema e Oportunidade

### 3.1 O Problema

#### Desafios das Empresas Brasileiras

**Financeiros:**
- Custo médio de produção de vídeo corporativo: R$ 5.000 - R$ 50.000
- Empresas médias gastam R$ 200.000/ano em treinamentos
- ROI negativo em 70% dos casos (conteúdo desatualizado rapidamente)

**Operacionais:**
- Tempo de produção: 30-90 dias por vídeo
- Atualizações custam 60% do valor original
- Dificuldade de personalização para contextos específicos
- Falta de expertise técnica interna

**Legais:**
- Multas por irregularidade: R$ 671,51 a R$ 6.708,08
- Acidentes de trabalho custam R$ 15 bilhões/ano ao Brasil
- 30% das empresas não conseguem comprovar treinamentos

**Pedagógicos:**
- Vídeos genéricos têm baixo engajamento (35% conclusão)
- Falta de personalização setorial
- Ausência de interatividade

### 3.2 A Oportunidade

**Mercado Brasileiro:**
- 210 milhões de habitantes
- 48 milhões de trabalhadores formais (CLT)
- Todas as empresas com funcionários devem cumprir NRs
- Mercado de EdTech corporativo: R$ 5 bilhões/ano

**Tendências Favoráveis:**
- Crescimento do trabalho remoto → treinamentos digitais
- Inteligência Artificial generativa → custos reduzidos
- Regulamentação mais rígida → compliance obrigatório
- Digital transformation → empresas buscando eficiência

---

## 4. Público-Alvo e Personas

### 4.1 Segmentos de Mercado

| Segmento | Descrição | Tamanho |
|----------|-----------|---------|
| **PMEs** | Pequenas e médias empresas (10-500 func.) | 70% do mercado |
| **Grandes Empresas** | Corporações (+500 func.) | 20% do mercado |
| **Consultorias** | Empresas de SST e RH | 10% do mercado |

### 4.2 Personas

#### Persona 1: Maria - Analista de RH

**Perfil:**
- Idade: 32 anos
- Cargo: Analista de RH Sênior
- Empresa: Indústria metalúrgica (350 funcionários)
- Habilidade técnica: Básica (Word, Excel, PowerPoint)

**Dores:**
- Precisa produzir 15 treinamentos de NR por ano
- Orçamento limitado (R$ 30.000/ano total)
- Pressão para garantir compliance
- Não sabe editar vídeo

**Jobs to be Done:**
- Transformar apresentações existentes em vídeos engajadores
- Comprovar treinamentos em auditorias
- Atualizar conteúdo rapidamente quando NR muda

#### Persona 2: Carlos - Técnico de Segurança

**Perfil:**
- Idade: 45 anos
- Cargo: Técnico de Segurança do Trabalho
- Empresa: Construtora (800 funcionários)
- Habilidade técnica: Básica

**Dores:**
- Treinamentos presenciais consomem muito tempo
- Alta rotatividade de funcionários exige repetir treinamentos
- Precisa de evidências para CIPA

**Jobs to be Done:**
- Criar biblioteca de treinamentos digitais
- Gerar certificados de conclusão
- Monitorar quem completou cada treinamento

#### Persona 3: Paula - Consultora de SST

**Perfil:**
- Idade: 38 anos
- Cargo: Sócia-fundadora de consultoria SST
- Clientes: 50+ empresas
- Habilidade técnica: Intermediária

**Dores:**
- Cada cliente quer conteúdo personalizado
- Não consegue escalar produção de vídeos
- Concorrência com preços baixos

**Jobs to be Done:**
- Produzir vídeos personalizados para cada cliente
- Diferenciar seu serviço com tecnologia
- Aumentar margem reduzindo custo de produção

---

## 5. Funcionalidades do Produto

### 5.1 Funcionalidades Core (Implementadas ✅)

#### 📤 Upload e Processamento de PPTX
- Upload de arquivos PowerPoint
- Parsing automático com 8 parsers especializados
- Extração de texto, imagens, layouts, notas e animações
- Detecção de 12+ tipos de layout
- Processamento em <5 segundos para arquivos médios

#### 🎨 Editor Visual de Slides
- Interface drag & drop (@dnd-kit)
- Reordenação de slides com persistência
- Preview em tempo real
- Canvas Editor Pro com 60 FPS
- WebGL-accelerated (Fabric.js)

#### 🎙️ Text-to-Speech (TTS) Multi-Provider
- **ElevenLabs:** 29 vozes premium
- **Azure:** 50+ vozes neurais
- **Google TTS:** Backup econômico
- **Edge TTS:** Vozes em português BR
- Geração em 3-12 segundos

#### 🎬 Pipeline de Renderização de Vídeo
- BullMQ para gerenciamento de filas
- Geração de frames via Canvas
- FFmpeg encoding (H.264/H.265/VP9)
- Suporte a 720p/1080p/4K
- Progresso em tempo real via SSE
- Upload automático para Supabase Storage

#### 📊 Analytics e Métricas
- Dashboard de estatísticas de render
- Métricas de performance (P50/P90/P95)
- Categorização semântica de erros
- Cache in-memory com TTL 30s

#### 🔐 Sistema RBAC
- 4 roles (admin, editor, viewer, user)
- 14 permissions granulares
- Hooks React (usePermission, useRole)
- Middleware de autenticação com RLS
- UI administrativa completa

#### ✅ Templates de Compliance NR
- 12 templates de Normas Regulamentadoras
- NR12 - Segurança em Máquinas
- NR33 - Espaços Confinados
- NR35 - Trabalho em Altura
- Validação automática de requisitos

### 5.2 Funcionalidades Avançadas (Em Desenvolvimento)

#### 🤖 Avatares 3D
- Pipeline de avatares hiper-realistas
- Lip-sync com áudio TTS
- Integração com HeyGen/Vidnoz

#### 📱 App Mobile
- Visualização de vídeos
- Progresso de treinamentos
- Notificações push

#### 🔗 Integrações LMS
- SCORM export
- xAPI tracking
- Integração com principais LMS

---

## 6. Arquitetura Técnica

### 6.1 Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │  Editor  │ │Templates │ │Analytics │ │  Admin   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │            │            │            │            │         │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴────┐   │
│  │                     Zustand State Management                 │   │
│  └──────────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API ROUTES (Next.js)                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ /pptx  │ │/render │ │  /tts  │ │/avatar │ │/analytics           │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘            │
└──────┼──────────┼──────────┼──────────┼──────────┼──────────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LOGIC (lib/)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │pptx-parser  │ │render-core  │ │  tts-core   │ │analytics-core   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Supabase   │ │    Redis    │ │  BullMQ     │ │   Storage   │   │
│  │  (Postgres) │ │   (Queue)   │ │  (Workers)  │ │ (S3-compat) │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Pipeline de Vídeo

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  PPTX   │───▶│  Parse  │───▶│  State  │───▶│ Editor  │───▶│  Queue  │
│ Upload  │    │ (JSZip) │    │(Zustand)│    │ Visual  │    │(BullMQ) │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                  │
                                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Storage │◀───│ Upload  │◀───│ FFmpeg  │◀───│  Frames │◀───│ Worker  │
│Supabase │    │         │    │ Encode  │    │ (Canvas)│    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 6.3 Estrutura de Diretórios

```
MVP_Video_TecnicoCursos_v7/
├── estudio_ia_videos/               # Aplicação Next.js principal
│   ├── app/
│   │   ├── api/                     # 60+ rotas API
│   │   │   ├── render/              # Jobs, export, queue, stats
│   │   │   ├── pptx/                # Upload, parse, preview
│   │   │   ├── tts/                 # Geração de áudio
│   │   │   └── analytics/           # Métricas e dashboards
│   │   ├── lib/
│   │   │   ├── analytics/           # render-core.ts (lógica pura)
│   │   │   ├── pptx-processor.ts    # Parser PPTX
│   │   │   ├── queue/               # BullMQ setup + workers
│   │   │   └── stores/              # Zustand stores
│   │   ├── components/
│   │   │   ├── ui/                  # Radix UI + Tailwind
│   │   │   └── pptx/                # Upload, preview, editor
│   │   └── __tests__/               # Jest unit tests
│   └── types/                       # Interfaces TypeScript
│
├── scripts/                         # Automação
│   ├── setup-supabase-auto.ts       # Setup DB (~15s)
│   ├── health-check.ts              # Verificação do sistema
│   └── test-supabase-integration.ts # 19 testes integração
│
├── database-schema.sql              # Schema PostgreSQL
├── database-rls-policies.sql        # Políticas RLS
└── docker-compose.yml               # Redis + Postgres local
```

---

## 7. Stack Tecnológico

### 7.1 Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14 | Framework React com App Router |
| React | 18.3 | Biblioteca de UI |
| TypeScript | 5.6 | Tipagem estática |
| Tailwind CSS | 3.4 | Estilos utilitários |
| Radix UI | Latest | Componentes acessíveis |
| Zustand | 5.0 | Gerenciamento de estado |
| React Query | 5.x | Server state |
| @dnd-kit | 6.x | Drag and drop |
| Framer Motion | 11.x | Animações |

### 7.2 Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js API Routes | 14 | Endpoints REST |
| Supabase | 2.x | Auth + Database + Storage |
| PostgreSQL | 15+ | Banco de dados |
| Redis | 7+ | Cache e filas |
| BullMQ | 5.x | Job queue |
| Zod | 3.x | Validação de schemas |

### 7.3 Processamento de Mídia

| Tecnologia | Uso |
|------------|-----|
| Remotion | Composição de vídeo |
| FFmpeg | Encoding (H.264/H.265/VP9) |
| Canvas | Geração de frames |
| JSZip | Parse de PPTX |
| fast-xml-parser | Parse de XML |
| Sharp | Processamento de imagens |

### 7.4 Integrações Externas

| Serviço | Uso |
|---------|-----|
| ElevenLabs | TTS Premium (29 vozes) |
| Azure Speech | TTS Alternativo (50+ vozes) |
| HeyGen | Avatares (planejado) |
| Sentry | Monitoramento de erros |

### 7.5 DevOps e Qualidade

| Ferramenta | Uso |
|------------|-----|
| Jest | Testes unitários |
| Playwright | Testes E2E |
| ESLint | Linting |
| Prettier | Formatação |
| GitHub Actions | CI/CD |
| Docker | Containerização |

---

## 8. Fluxos de Uso

### 8.1 Fluxo Principal: PPTX → Vídeo

```
┌────────────────────────────────────────────────────────────────┐
│                    JORNADA DO USUÁRIO                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. LOGIN                                                      │
│  ┌─────────┐                                                   │
│  │ Usuário │───▶ Login via Supabase Auth                       │
│  └─────────┘                                                   │
│       │                                                        │
│       ▼                                                        │
│  2. DASHBOARD                                                  │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Meus Projetos                         │                   │
│  │ • Templates NR                          │                   │
│  │ • Novo Projeto (+)                      │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                        │
│       ▼                                                        │
│  3. UPLOAD PPTX                                                │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Drag & drop do arquivo                │                   │
│  │ • Parsing automático (<5s)              │                   │
│  │ • Preview dos slides                    │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                        │
│       ▼                                                        │
│  4. EDITOR VISUAL                                              │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Reordenar slides (drag & drop)        │                   │
│  │ • Editar textos                         │                   │
│  │ • Adicionar/remover slides              │                   │
│  │ • Configurar narração por slide         │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                        │
│       ▼                                                        │
│  5. CONFIGURAÇÃO TTS                                           │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Escolher voz (76 opções)              │                   │
│  │ • Ajustar velocidade                    │                   │
│  │ • Preview de áudio                      │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                        │
│       ▼                                                        │
│  6. RENDERIZAÇÃO                                               │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Iniciar render                        │                   │
│  │ • Progresso em tempo real (SSE)         │                   │
│  │ • Notificação ao concluir               │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                        │
│       ▼                                                        │
│  7. DOWNLOAD/SHARE                                             │
│  ┌─────────────────────────────────────────┐                   │
│  │ • Download MP4                          │                   │
│  │ • Link público                          │                   │
│  │ • Embed em LMS                          │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Fluxo de Template NR

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  1. Selecionar NR (ex: NR12)                                   │
│       │                                                        │
│       ▼                                                        │
│  2. Visualizar módulos obrigatórios                            │
│       │                                                        │
│       ▼                                                        │
│  3. Customizar com dados da empresa                            │
│       │                                                        │
│       ▼                                                        │
│  4. Gerar vídeo com compliance automático                      │
│       │                                                        │
│       ▼                                                        │
│  5. Obter certificado de conformidade                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Requisitos Funcionais

### 9.1 Autenticação e Autorização

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-01 | Login com email/senha | Alta | ✅ |
| RF-02 | Login social (Google, Microsoft) | Média | ✅ |
| RF-03 | Recuperação de senha | Alta | ✅ |
| RF-04 | RBAC com 4 roles | Alta | ✅ |
| RF-05 | Permissões granulares (14) | Alta | ✅ |
| RF-06 | Audit log de ações | Média | ✅ |

### 9.2 Gerenciamento de Projetos

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-10 | Criar projeto | Alta | ✅ |
| RF-11 | Listar projetos do usuário | Alta | ✅ |
| RF-12 | Editar projeto | Alta | ✅ |
| RF-13 | Excluir projeto | Alta | ✅ |
| RF-14 | Duplicar projeto | Média | ✅ |
| RF-15 | Compartilhar projeto | Média | ✅ |
| RF-16 | Versionamento de projeto | Baixa | ⏳ |

### 9.3 Processamento de PPTX

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-20 | Upload de arquivo PPTX | Alta | ✅ |
| RF-21 | Extração de texto | Alta | ✅ |
| RF-22 | Extração de imagens | Alta | ✅ |
| RF-23 | Detecção de layouts | Alta | ✅ |
| RF-24 | Extração de notas do apresentador | Média | ✅ |
| RF-25 | Extração de animações | Baixa | ✅ |
| RF-26 | Preview de slides | Alta | ✅ |

### 9.4 Editor Visual

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-30 | Visualizar slides | Alta | ✅ |
| RF-31 | Reordenar slides (drag & drop) | Alta | ✅ |
| RF-32 | Editar texto de slides | Alta | ✅ |
| RF-33 | Adicionar/remover slides | Alta | ✅ |
| RF-34 | Timeline de vídeo | Média | ✅ |
| RF-35 | Configurar duração por slide | Média | ✅ |
| RF-36 | Preview de vídeo | Média | ✅ |

### 9.5 Text-to-Speech (TTS)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-40 | Selecionar voz | Alta | ✅ |
| RF-41 | Múltiplos providers (ElevenLabs, Azure, Google) | Alta | ✅ |
| RF-42 | Preview de áudio | Alta | ✅ |
| RF-43 | Ajustar velocidade | Média | ✅ |
| RF-44 | Ajustar pitch | Baixa | ⏳ |
| RF-45 | SSML suporte | Baixa | ⏳ |

### 9.6 Renderização de Vídeo

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-50 | Iniciar render | Alta | ✅ |
| RF-51 | Fila de processamento (BullMQ) | Alta | ✅ |
| RF-52 | Progresso em tempo real (SSE) | Alta | ✅ |
| RF-53 | Cancelar render | Alta | ✅ |
| RF-54 | Retry automático | Média | ✅ |
| RF-55 | Múltiplas resoluções (720p/1080p/4K) | Média | ✅ |
| RF-56 | Múltiplos codecs (H.264/H.265/VP9) | Baixa | ✅ |

### 9.7 Storage e Export

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-60 | Upload de vídeo para storage | Alta | ✅ |
| RF-61 | Download de vídeo MP4 | Alta | ✅ |
| RF-62 | Geração de thumbnail | Média | ✅ |
| RF-63 | Link público compartilhável | Média | ✅ |
| RF-64 | Export SCORM | Baixa | ⏳ |

### 9.8 Templates NR

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-70 | Catálogo de templates NR | Alta | ✅ |
| RF-71 | Customização de template | Alta | ✅ |
| RF-72 | Validação de compliance | Média | ✅ |
| RF-73 | Certificado de conclusão | Média | ⏳ |

---

## 10. Requisitos Não-Funcionais

### 10.1 Performance

| ID | Requisito | Meta | Status |
|----|-----------|------|--------|
| RNF-01 | Tempo de resposta API | < 500ms | ✅ |
| RNF-02 | Processamento PPTX | < 5s (médio) | ✅ |
| RNF-03 | Geração TTS | < 12s | ✅ |
| RNF-04 | Render de vídeo | 2.3x tempo real | ✅ |
| RNF-05 | FPS do Canvas Editor | 60 FPS | ✅ |
| RNF-06 | LCP (Largest Contentful Paint) | < 2.5s | ✅ |
| RNF-07 | CLS (Cumulative Layout Shift) | < 0.1 | ✅ |

### 10.2 Escalabilidade

| ID | Requisito | Meta | Status |
|----|-----------|------|--------|
| RNF-10 | Usuários simultâneos | 1.000+ | ✅ |
| RNF-11 | Jobs de render em paralelo | 50+ | ✅ |
| RNF-12 | Tamanho máximo PPTX | 100MB | ✅ |
| RNF-13 | Duração máxima de vídeo | 60min | ✅ |

### 10.3 Disponibilidade

| ID | Requisito | Meta | Status |
|----|-----------|------|--------|
| RNF-20 | Uptime | 99.5% | ✅ |
| RNF-21 | Tempo de recuperação (RTO) | < 4h | ✅ |
| RNF-22 | Backup de dados | Diário | ✅ |

### 10.4 Segurança

| ID | Requisito | Meta | Status |
|----|-----------|------|--------|
| RNF-30 | Autenticação JWT | Sim | ✅ |
| RNF-31 | Row Level Security (RLS) | 100% tabelas | ✅ |
| RNF-32 | HTTPS obrigatório | Sim | ✅ |
| RNF-33 | Rate limiting | 9 rotas | ✅ |
| RNF-34 | Validação de input (Zod) | 100% APIs | ✅ |
| RNF-35 | Sanitização XSS | Sim | ✅ |

### 10.5 Manutenibilidade

| ID | Requisito | Meta | Status |
|----|-----------|------|--------|
| RNF-40 | Cobertura de testes | > 85% | ✅ (87%) |
| RNF-41 | Documentação de código | JSDoc | ✅ |
| RNF-42 | TypeScript strict | 0 any | ⏳ |
| RNF-43 | Linting | 0 warnings | ✅ |

---

## 11. Métricas e KPIs

### 11.1 KPIs de Produto

| Métrica | Meta | Atual |
|---------|------|-------|
| Usuários ativos mensais (MAU) | 500+ | - |
| Projetos criados/mês | 2.000+ | - |
| Vídeos renderizados/mês | 5.000+ | - |
| Tempo médio até 1º vídeo | < 30min | - |
| NPS | > 50 | - |

### 11.2 KPIs Técnicos

| Métrica | Meta | Atual |
|---------|------|-------|
| Cobertura de testes | > 85% | 87% |
| Health score | > 80/100 | 82/100 |
| Uptime | > 99.5% | - |
| P95 latência API | < 1s | - |
| Taxa de erros | < 1% | - |

### 11.3 KPIs de Negócio

| Métrica | Meta | Atual |
|---------|------|-------|
| MRR (Monthly Recurring Revenue) | - | - |
| Churn mensal | < 5% | - |
| CAC (Customer Acquisition Cost) | - | - |
| LTV (Lifetime Value) | - | - |
| LTV:CAC ratio | > 3:1 | - |

---

## 12. Roadmap

### 12.1 Fases Completas ✅

| Fase | Descrição | Status | Data |
|------|-----------|--------|------|
| 0 | Diagnóstico completo | ✅ | 13/11/2025 |
| 1 | Fundação técnica | ✅ | 16/11/2025 |
| 2 | Qualidade e observabilidade | ✅ | 16/11/2025 |
| 3 | Experiência e operação | ✅ | 16/11/2025 |
| 4 | Evolução contínua | ✅ | 16/11/2025 |
| 5 | RBAC e administração | ✅ | 17/11/2025 |
| 6 | Testes E2E e monitoramento | ✅ | 17/11/2025 |
| 7 | PPTX real | ✅ | 17/11/2025 |
| 8 | Renderização real FFmpeg | ✅ | 17/11/2025 |

### 12.2 Próximas Fases (Planejadas)

| Fase | Descrição | Estimativa |
|------|-----------|------------|
| 9 | Avatares 3D integração | Q1 2026 |
| 10 | Mobile app | Q2 2026 |
| 11 | LMS integrations | Q2 2026 |
| 12 | Multi-tenancy enterprise | Q3 2026 |

### 12.3 Backlog Priorizado

**Alta Prioridade:**
- [ ] Integração com HeyGen para avatares
- [ ] Export SCORM para LMS
- [ ] Certificados digitais de conclusão
- [ ] Dashboard analytics avançado

**Média Prioridade:**
- [ ] App mobile (React Native)
- [ ] Integração com Moodle/Blackboard
- [ ] Voice cloning personalizado
- [ ] Tradução automática

**Baixa Prioridade:**
- [ ] Edição colaborativa real-time
- [ ] Quiz interativo no vídeo
- [ ] Relatórios de engajamento
- [ ] White-label para consultorias

---

## 13. Riscos e Mitigações

### 13.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Instabilidade de APIs de TTS externas | Média | Alto | Multi-provider fallback implementado |
| Performance de render em escala | Baixa | Alto | BullMQ com workers escaláveis |
| Custo de APIs de TTS | Alta | Médio | Caching agressivo + provider econômico |
| Compatibilidade de PPTX | Média | Médio | 8 parsers + graceful degradation |

### 13.2 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Baixa adoção inicial | Média | Alto | Plano freemium + onboarding guiado |
| Concorrência internacional | Alta | Médio | Foco em compliance NR (nicho BR) |
| Mudanças nas NRs | Média | Baixo | Templates atualizáveis rapidamente |
| Churn alto | Média | Alto | Customer success proativo |

### 13.3 Riscos de Compliance

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| LGPD | Baixa | Alto | RLS + dados mínimos + DPO |
| Direitos autorais | Baixa | Médio | Verificação de assets + termos claros |

---

## 📎 Anexos

### A. Glossário

| Termo | Definição |
|-------|-----------|
| **NR** | Norma Regulamentadora - regulamento brasileiro de segurança do trabalho |
| **TTS** | Text-to-Speech - síntese de voz a partir de texto |
| **PPTX** | Formato de arquivo PowerPoint |
| **RLS** | Row Level Security - segurança em nível de linha no PostgreSQL |
| **SSE** | Server-Sent Events - comunicação unidirecional servidor→cliente |
| **BullMQ** | Biblioteca de filas de jobs para Node.js |
| **RBAC** | Role-Based Access Control - controle de acesso baseado em funções |

### B. Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Remotion Documentation](https://www.remotion.dev/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Normas Regulamentadoras - MTE](https://www.gov.br/trabalho-e-previdencia/pt-br/composicao/orgaos-especificos/secretaria-de-trabalho/inspecao/seguranca-e-saude-no-trabalho/normas-regulamentadoras)

---

**Documento gerado em:** 02 de Dezembro de 2025  
**Autor:** Equipe de Produto - Estúdio IA  
**Versão:** 7.0  
**Status:** ✅ Production Ready
