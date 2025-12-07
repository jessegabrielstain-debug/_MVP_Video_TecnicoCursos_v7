# 📋 NR Templates Features - Complete Guide

## 🎯 Overview

Sistema completo de templates de Normas Regulamentadoras (NR) com criação automática de projetos e slides, suportando modo offline (mock) e online (Supabase).

## ✨ Features Implementadas

### 1. Catálogo de NR Templates
- ✅ 10 NRs pré-configuradas (NR-01, NR-05, NR-06, NR-07, NR-09, NR-10, NR-12, NR-17, NR-18, NR-35)
- ✅ Cada template inclui:
  - Número da NR
  - Título completo
  - Descrição detalhada
  - Contagem de slides
  - Duração estimada (segundos)
  - Configuração de tema (cores, tipografia, tópicos)

### 2. APIs REST Completas

#### GET /app/api/nr-templates
Lista todos os templates de NR disponíveis.

**Query params opcionais:**
- `?q=termo` - Busca por texto em título/descrição
- `?nr=NR-XX` - Retorna template específico

**Resposta:**
```json
{
  "items": [
    {
      "id": "mock-NR-01",
      "nr_number": "NR-01",
      "title": "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
      "description": "...",
      "slide_count": 8,
      "duration_seconds": 480,
      "template_config": { ... }
    }
  ],
  "total": 10
}
```

#### GET /app/api/nr-templates/[nr]
Retorna um template específico (ex: `/app/api/nr-templates/NR-12`).

#### POST /app/api/projects/from-nr
Cria um projeto completo a partir de um template NR.

**Body:**
```json
{
  "nr_number": "NR-12",
  "title": "Meu Projeto NR-12 Customizado", // opcional
  "description": "Descrição personalizada" // opcional
}
```

**Headers:**
- `x-user-id: demo-user` (simulação, em produção usa auth real)

**Resposta:**
```json
{
  "project": {
    "id": "proj-xxx",
    "title": "NR-12 · Segurança no Trabalho em Máquinas e Equipamentos",
    "description": "...",
    "status": "draft",
    "settings": {
      "source": "nr_template",
      "nr_number": "NR-12",
      "slide_count": 12,
      "duration_seconds": 720,
      "template_config": { ... }
    },
    "created_at": "2025-11-18T...",
    "updated_at": "2025-11-18T..."
  }
}
```

**Ação automática:** Ao criar o projeto, slides iniciais são gerados automaticamente baseados nos tópicos do template.

#### GET /app/api/projects
Lista projetos do usuário.

**Headers:**
- `x-user-id: demo-user`

#### GET /app/api/projects/[id]
Retorna detalhes de um projeto específico.

#### GET /app/api/slides?projectId=xxx
Lista slides de um projeto (gerados automaticamente ao criar projeto de NR).

### 3. UI Pages

#### /app/nr-templates
Página de catálogo visual com:
- Grid de cards para cada NR
- Botão "Criar projeto" que:
  - Chama POST /app/api/projects/from-nr
  - Redireciona para /app/projects
- Link "Ver JSON" para inspecionar dados raw

#### /app/projects
Lista projetos criados (modo demo, sem auth):
- Exibe título, descrição, status, datas
- Links para "Ver JSON" e "Abrir no editor"

## 🏗️ Arquitetura

### Fallback Online/Offline

O sistema usa uma estratégia de fallback automático:

1. **Modo Online (Supabase)**
   - Quando `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados
   - Quando tabela `public.nr_templates` existe no banco
   - Lê dados em tempo real do Supabase

2. **Modo Offline (Mock)**
   - Fallback automático quando:
     - Variáveis de ambiente ausentes
     - Tabela `nr_templates` não existe (erro `PGRST205`)
     - Erros de conexão com Supabase
   - Usa catálogo em memória (`lib/nr/catalog.ts`)

### Arquivos Principais

```
estudio_ia_videos/app/
├── lib/
│   ├── nr/
│   │   └── catalog.ts              # Mock com 10 NRs
│   ├── projects/
│   │   └── mockStore.ts            # Store compartilhado de projetos
│   ├── slides/
│   │   └── mockStore.ts            # Store compartilhado de slides
│   └── services/
│       └── nr-templates-service.ts # Serviço unificado com fallback
├── app/
│   ├── nr-templates/
│   │   └── page.tsx                # UI catálogo
│   ├── projects/
│   │   └── page.tsx                # UI lista de projetos
│   └── api/
│       ├── nr-templates/
│       │   ├── route.ts            # GET lista/busca
│       │   └── [nr]/route.ts       # GET detalhe
│       ├── projects/
│       │   ├── route.ts            # GET/POST projetos
│       │   ├── [id]/route.ts       # GET projeto específico
│       │   └── from-nr/route.ts    # POST criar de NR
│       └── slides/
│           └── route.ts            # GET/POST slides
└── components/
    └── nr/
        └── NrCard.tsx              # Componente card com ação de criar
```

## 🚀 Quick Start

### 1. Instalar Dependências

```powershell
cd estudio_ia_videos/app
npm install
```

### 2. Configurar Ambiente (Opcional)

Para modo online (Supabase), crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Nota:** Sem essas variáveis, o sistema funciona em modo offline (mock).

### 3. Subir o Servidor

```powershell
npm run dev
```

Servidor iniciará em `http://localhost:3000`

### 4. Acessar Features

- Catálogo NR: http://localhost:3000/app/nr-templates
- Projetos: http://localhost:3000/app/projects

### 5. Criar Projeto de NR

**Via UI:**
1. Abra http://localhost:3000/app/nr-templates
2. Clique em "Criar projeto" em qualquer NR
3. Você será redirecionado para /app/projects

**Via API (PowerShell):**
```powershell
$body = @{ nr_number = 'NR-12' } | ConvertTo-Json
irm -Method Post -Uri http://localhost:3000/app/api/projects/from-nr `
  -Headers @{ 'Content-Type'='application/json'; 'x-user-id'='demo-user' } `
  -Body $body
```

### 6. Validar Slides Criados

```powershell
# Substituir PROJECT_ID pelo id retornado acima
irm "http://localhost:3000/app/api/slides?projectId=PROJECT_ID"
```

## 🧪 Testing

### Smoke Test Automatizado

Execute o script de validação completo:

```powershell
.\scripts\smoke-test-nr.ps1
```

O script valida:
- ✅ GET lista de NRs
- ✅ GET detalhe de NR específica
- ✅ POST criar projeto de NR
- ✅ GET lista de projetos
- ✅ GET slides do projeto criado

### Testes Manuais Rápidos

```powershell
# Health check
irm http://localhost:3000/app/api/health

# Lista NRs
irm http://localhost:3000/app/api/nr-templates

# Detalhe NR-12
irm http://localhost:3000/app/api/nr-templates/NR-12

# Buscar NRs com "segurança"
irm "http://localhost:3000/app/api/nr-templates?q=segurança"
```

## 🔄 Integração com Supabase

### Provisionar Tabela (Ação Manual)

1. Abra o Supabase Dashboard: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz

2. Vá para SQL Editor

3. Execute a migration:

```powershell
# Copiar SQL para clipboard
Get-Content "supabase\migrations\20251118000000_create_nr_templates_table.sql" | Set-Clipboard

# Colar no SQL Editor e executar (RUN)
```

4. Validar que a tabela foi criada:

```powershell
node scripts/validate-fase-9-final.js
```

### Após Provisionar

O sistema **automaticamente** passa a usar o Supabase (sem mudanças no código):

- ✅ `listNRTemplates()` lerá de `public.nr_templates`
- ✅ `getNRTemplate()` fará query no banco
- ✅ Mock é usado apenas como fallback em erros

## 📊 Dados dos Templates

### NRs Disponíveis

| NR | Título | Slides | Duração | Cor Principal |
|----|--------|--------|---------|---------------|
| NR-01 | Disposições Gerais | 8 | 8min | #2563EB |
| NR-05 | CIPA | 7 | 7min | #06B6D4 |
| NR-06 | EPI | 10 | 10min | #10B981 |
| NR-07 | PCMSO | 9 | 9min | #8B5CF6 |
| NR-09 | Agentes Nocivos | 11 | 11min | #F97316 |
| NR-10 | Eletricidade | 13 | 13min | #EAB308 |
| NR-12 | Máquinas | 12 | 12min | #DC2626 |
| NR-17 | Ergonomia | 8 | 8min | #14B8A6 |
| NR-18 | Construção Civil | 14 | 14min | #F59E0B |
| NR-35 | Trabalho em Altura | 10 | 10min | #EF4444 |

### Estrutura de Topics

Cada template possui `template_config.topics` com os títulos sugeridos para slides:

**Exemplo NR-12:**
```json
{
  "topics": [
    "Arranjo Físico",
    "Proteções",
    "Dispositivos de Segurança",
    "Operação",
    "Manutenção",
    "Inspeção",
    "Capacitação",
    "Manual",
    "Sinalização",
    "Anexo I",
    "Anexo XII",
    "Documentação"
  ]
}
```

Ao criar projeto, cada tópico vira um slide inicial.

## 🐛 Troubleshooting

### Porta 3000 já em uso

```powershell
# Identificar processo
Get-NetTCPConnection -LocalPort 3000 -State Listen

# Finalizar processo
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# Reiniciar
npm run dev
```

### Erro 404 nas páginas

Verifique o basePath no `next.config.js/mjs`:

```javascript
// Se basePath: '/app' está definido, acesse:
// http://localhost:3000/app/nr-templates

// Se NÃO tem basePath, acesse:
// http://localhost:3000/nr-templates
```

### API retorna erro 500

1. Verifique logs no terminal onde o `npm run dev` está rodando
2. Verifique se há erros de TypeScript:
   ```powershell
   npm run build
   ```
3. Limpe cache:
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

### Mock não está funcionando

O mock é **sempre** o fallback. Se ainda assim não funciona:

1. Verifique que `lib/nr/catalog.ts` existe
2. Confirme que a importação está correta:
   ```typescript
   import { listNrTemplates } from '@/lib/nr/catalog'
   ```
3. Reinicie o servidor

### Supabase não está conectando

1. Verifique `.env.local`:
   ```powershell
   Get-Content .env.local
   ```
2. Confirme que as variáveis estão exportadas
3. O sistema deve cair automaticamente para mock (verifique logs)

## 🔐 Segurança

### Headers de Autenticação

Atualmente usando `x-user-id: demo-user` para desenvolvimento.

**Em produção, substitua por:**

```typescript
// Supabase Auth
const { data: { user } } = await supabase.auth.getUser()
const userId = user?.id
```

### RLS (Row Level Security)

A migration `20251118000000_create_nr_templates_table.sql` já inclui:

- ✅ `SELECT` público (qualquer um pode listar NRs)
- ✅ `INSERT/UPDATE/DELETE` apenas para admins (função `is_admin()`)

## 📈 Próximos Passos

### Features Planejadas

1. **Editor de NRs (Admin)**
   - UI para criar/editar templates
   - Upload de imagens de exemplo
   - Preview em tempo real

2. **Customização de Projetos**
   - Editar cores do template
   - Ajustar duração de slides
   - Adicionar/remover slides

3. **Exportação de Vídeo**
   - Integração com render pipeline
   - Geração de MP4 a partir dos slides

4. **Analytics**
   - NRs mais usadas
   - Tempo médio de criação
   - Taxa de conclusão de projetos

### Migrações Pendentes

- Conectar `projects` mock ao Supabase `projects` table
- Conectar `slides` mock ao Supabase `slides` table
- Implementar sincronização bidirecional

## 📝 Changelog

### v1.0.0 (18 Nov 2025)

**Implementado:**
- ✅ Catálogo de 10 NRs em mock
- ✅ Serviço com fallback Supabase ↔ mock
- ✅ APIs REST completas (GET list, GET detail, POST create)
- ✅ Criação automática de slides ao criar projeto
- ✅ UI páginas de catálogo e projetos
- ✅ Smoke test automatizado
- ✅ Migration SQL para Supabase
- ✅ Documentação completa

**Bloqueios conhecidos:**
- ⏸️ Tabela `nr_templates` não criada (requer ação manual no Dashboard)
- ⏸️ Validação final pendente (após provisionar tabela)

## 🤝 Contribuindo

### Adicionar Nova NR

1. Edite `lib/nr/catalog.ts`
2. Adicione objeto ao array `NR_CATALOG`:
   ```typescript
   {
     nr_number: 'NR-XX',
     title: 'Nome da NR',
     description: 'Descrição detalhada...',
     slide_count: 10,
     duration_seconds: 600,
     template_config: {
       primary_color: '#HEXCODE',
       secondary_color: '#HEXCODE',
       font_family: 'Inter',
       topics: ['Topic 1', 'Topic 2', ...]
     }
   }
   ```
3. Se online (Supabase), insira também no banco:
   ```sql
   INSERT INTO public.nr_templates (nr_number, title, description, ...)
   VALUES ('NR-XX', '...', '...', ...);
   ```

### Reportar Bugs

Abra issue no repositório com:
- Descrição do problema
- Passos para reproduzir
- Logs relevantes
- Ambiente (Node version, OS, etc)

## 📚 Referências

- [Normas Regulamentadoras - MTE](https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/normas-regulamentadoras)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [Projeto GitHub](https://github.com/aline-jesse/_MVP_Video_TecnicoCursos)

## 📧 Suporte

Para dúvidas ou suporte:
- Consulte este README
- Verifique logs: `dev.out`, `dev.err`
- Execute validação: `.\scripts\smoke-test-nr.ps1`
- Documente o erro e reporte

---

**Status:** ✅ Feature completa e pronta para uso (modo offline). Aguardando provisionamento de tabela para modo online.
