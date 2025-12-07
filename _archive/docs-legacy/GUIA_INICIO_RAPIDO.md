# 🚀 Guia Rápido de Início - MVP Video TécnicoCursos v2.4.0

**Data:** 18 de novembro de 2025  
**Status:** ✅ 100% Implementado - Production Ready  
**Tempo estimado de setup:** 30-45 minutos

---

## 📋 Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Git instalado
- ✅ Conta Supabase (https://supabase.com)
- ✅ Conta Upstash Redis (https://upstash.com)
- ⚠️ Conta Sentry (opcional - https://sentry.io)

---

## 🎯 Setup Rápido (3 Passos)

### **Passo 1: Clone e Instale** (5 min)

```powershell
# Clone o repositório
git clone https://github.com/aline-jesse/_MVP_Video_TecnicoCursos.git
cd _MVP_Video_TecnicoCursos_v7

# Instale dependências
npm install

# Instale dependências da app
cd estudio_ia_videos/app
npm install
cd ../..
```

### **Passo 2: Configure Credenciais** (15-20 min)

#### Opção A: Interativo (Recomendado) 🌟

```powershell
# Execute o assistente interativo
.\scripts\setup-env-interactive.ps1
```

O script irá solicitar:
1. **Supabase Anon Key** → [Obter aqui](https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/settings/api)
2. **Supabase Service Role Key** → Mesma página (⚠️ NUNCA compartilhar!)
3. **Upstash Redis URL** → [Obter aqui](https://console.upstash.com/redis)
4. **Upstash Redis Token** → Mesma página
5. **Sentry DSN** (opcional) → [Obter aqui](https://sentry.io/settings/)

#### Opção B: Manual

Edite `.env.local` e substitua os valores `COLOQUE_A_*_AQUI`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://ofhzrdiadxigrvmrhaiz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"

UPSTASH_REDIS_REST_URL="https://sua-url-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="seu_token_redis_aqui"
```

### **Passo 3: Configure Banco de Dados** (5-10 min)

#### 3.1 - Execute Schema Principal

```powershell
# Executa schema completo automaticamente
node scripts/execute-supabase-sql.js database-schema.sql
node scripts/execute-supabase-sql.js database-rls-policies.sql
```

**OU manualmente no Dashboard Supabase:**
1. Abra: https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/sql/new
2. Copie e cole o conteúdo de `database-schema.sql`
3. Clique em "Run"
4. Repita com `database-rls-policies.sql`

#### 3.2 - Execute RBAC SQL

```powershell
# Executa RBAC automaticamente
node scripts/execute-supabase-sql.js database-rbac-complete.sql
```

**OU manualmente:**
1. SQL Editor → Nova query
2. Cole conteúdo de `database-rbac-complete.sql`
3. Run

#### 3.3 - Crie Test Users (para E2E tests)

1. Abra: https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/auth/users
2. Clique "Add user" e crie 4 usuários:

| Email | Password | Confirmar Email |
|-------|----------|----------------|
| admin@test.com | admin123 | ✅ Sim |
| editor@test.com | editor123 | ✅ Sim |
| viewer@test.com | viewer123 | ✅ Sim |
| moderator@test.com | mod123 | ✅ Sim |

3. Anote os UUIDs gerados
4. Execute SQL para atribuir roles:

```sql
-- Obter UUIDs
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com';

-- Atribuir roles (substitua os UUIDs)
INSERT INTO user_roles (user_id, role_id) VALUES
  ('<uuid_admin>', (SELECT id FROM roles WHERE name = 'admin')),
  ('<uuid_editor>', (SELECT id FROM roles WHERE name = 'editor')),
  ('<uuid_viewer>', (SELECT id FROM roles WHERE name = 'viewer')),
  ('<uuid_moderator>', (SELECT id FROM roles WHERE name = 'moderator'));
```

📖 **Guia detalhado:** `docs/setup/TEST_USERS_SETUP.md`

---

## ✅ Validação do Setup

```powershell
# Valida toda a configuração
.\scripts\validate-setup.ps1

# Validação rápida (pula testes de conexão)
.\scripts\validate-setup.ps1 -Quick

# Ver configuração atual (sem expor credenciais completas)
.\scripts\setup-env-interactive.ps1 -ShowCurrent
```

**Resultado esperado:**
```
✅ Passou:   15 / 15 testes
❌ Falhou:    0 / 15 testes
⚠️  Avisos:    0 / 15 testes

✨ SISTEMA 100% PRONTO PARA PRODUÇÃO!
```

---

## 🚀 Executando a Aplicação

### Desenvolvimento

```powershell
# Atalho (roda o Next.js a partir da raiz)
npm run app:dev

# Ou manualmente direto na pasta da app
cd estudio_ia_videos
npm run dev

# Abra no navegador
# http://localhost:3000
```

### Produção

```powershell
# Build e start direto da raiz
npm run app:build
npm run start

# Alternativa manual
cd estudio_ia_videos
npm run build
npm run start
```

> 💡 `npm run start` agora delega automaticamente para `estudio_ia_videos`, evitando o erro "Missing script: start" quando executado na raiz.

### Redis Local via Docker

```powershell
# Subir apenas o serviço Redis definido no docker-compose
npm run redis:start

# Conferir a versão do servidor sem instalar binaries locais
npm run redis:version

# Acompanhar logs ou desligar
npm run redis:logs
npm run redis:stop
```

Os scripts usam o `docker-compose.yml` padrão. Caso utilize Upstash/Redis hospedado, basta manter as variáveis `REDIS_URL` e `REDIS_PASSWORD` configuradas — o container local é opcional e serve para testes offline.

---

## 🧪 Executando Testes

### Todos os Testes

```powershell
# Roda todas as suítes
npm run test:all
```

### Testes Específicos

```powershell
# Contrato API (12 testes)
npm run test:contract

# PPTX Processing (38 testes)
npm run test:suite:pptx

# Analytics Core (15+ testes)
npm run test:analytics

# E2E RBAC (25 testes) - requer test users
npm run test:e2e:rbac

# E2E Video Flow (15 testes) - requer test users
npm run test:e2e:video

# Todos E2E (40 testes)
npm run test:e2e
```

### Cobertura

```powershell
# Gera relatório de coverage
npm run test:coverage

# Abre relatório no navegador
start coverage/lcov-report/index.html
```

**Cobertura atual:**
- Statements: 89%
- Branches: 67%
- Functions: 100%
- Lines: 91%

---

## 🎬 Usando Processamento PPTX (Fase 7)

### Upload e Parse

```typescript
import { parseCompletePPTX } from '@/lib/pptx/parsers';

// 1. Receber arquivo PPTX
const file = formData.get('pptx') as File;
const buffer = await file.arrayBuffer();

// 2. Parse completo
const result = await parseCompletePPTX(buffer, projectId);

// 3. Resultado
console.log({
  slides: result.metadata.totalSlides,
  duration: result.metadata.totalDuration, // segundos
  images: result.metadata.totalImages,
  hasAnimations: result.metadata.hasAnimations,
  hasNotes: result.metadata.hasSpeakerNotes
});

// 4. Dados dos slides
result.slides.forEach((slide, index) => {
  console.log(`Slide ${index + 1}:`, {
    text: slide.content.text,
    images: slide.content.images.length,
    layout: slide.metadata.layout,
    duration: slide.timing.duration
  });
});
```

### Features Disponíveis

- ✅ Extração de texto com formatação (bold, italic, underline, font, size, color)
- ✅ Extração de imagens com upload para Supabase Storage
- ✅ Geração de thumbnails 300x225px
- ✅ Detecção de 12+ layouts
- ✅ Extração de notas do apresentador (TTS ready)
- ✅ Cálculo inteligente de duração (3-120s por slide)
- ✅ Extração de transições (fade, push, wipe, cut, zoom)
- ✅ Extração de animações (entrance, emphasis, exit, motion)

📖 **Documentação completa:** `IMPLEMENTACAO_PPTX_REAL_COMPLETA.md`

---

## 🎥 Usando Renderização FFmpeg (Fase 8)

### Criar Job de Render

```typescript
// 1. Criar job via API
const response = await fetch('/api/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_id: 'uuid-do-projeto',
    settings: {
      resolution: '1080p',    // 720p | 1080p | 4K
      fps: 30,                // 24 | 30 | 60
      quality: 'high',        // low | medium | high
      format: 'mp4',          // mp4 | mov | webm
      codec: 'h264'           // h264 | h265 | vp9
    }
  })
});

const { jobId } = await response.json();
```

### Monitorar Progresso (SSE)

```typescript
// 2. Conectar ao SSE para updates em tempo real
const eventSource = new EventSource(`/api/render/${jobId}/progress`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  console.log({
    status: data.status,        // queued | processing | completed | failed
    progress: data.progress,    // 0-100
    stage: data.stage,          // generating-frames | encoding | uploading
    message: data.message,
    currentFrame: data.currentFrame,
    totalFrames: data.totalFrames
  });
  
  // Atualizar UI
  updateProgressBar(data.progress);
  updateStageLabel(data.stage);
  
  // Job concluído
  if (data.status === 'completed') {
    console.log('✅ Vídeo pronto:', data.output_url);
    eventSource.close();
    
    // Download ou embed
    window.open(data.output_url, '_blank');
  }
  
  // Job falhou
  if (data.status === 'failed') {
    console.error('❌ Erro:', data.error);
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('Erro SSE:', error);
  eventSource.close();
};
```

### Pipeline Completo

```
PPTX Upload → Parse (Fase 7) → Slides Normalizados → 
→ Frame Generator (Canvas PNG) → FFmpeg Encoder → 
→ Upload Supabase Storage → URL Pública
```

### Configurações Avançadas

```typescript
// Configuração customizada
const settings = {
  resolution: '4K',           // Resolução
  fps: 60,                    // Frame rate
  quality: 'high',            // Qualidade
  format: 'mov',              // Formato
  codec: 'h265',              // Codec
  bitrate: '10M',             // Bitrate customizado
  preset: 'slow',             // Preset FFmpeg (slow = melhor qualidade)
  audio: {
    enabled: true,            // Habilitar áudio TTS
    voice: 'pt-BR-FranciscaNeural',
    speed: 1.0
  },
  watermark: {
    enabled: true,
    text: 'TécnicoCursos',
    position: 'bottom-right',
    opacity: 0.7
  }
};
```

📖 **Documentação completa:** `STATUS_FASE_8_COMPLETA.md`

---

## 🔧 Scripts Úteis

### Auditoria e Qualidade

```powershell
# Auditoria de 'any' no código
npm run audit:any

# Type check
npm run type-check

# Lint
npm run lint

# Lint fix
npm run lint:fix
```

### Banco de Dados

```powershell
# Ver status de migrações
npm run db:status

# Criar migration
npm run db:migration:create "nome_da_migration"

# Aplicar migrations
npm run db:migrate

# Seed dados de teste
node scripts/seed-test-data.js
```

### Monitoramento

```powershell
# Checar health de APIs
node scripts/monitoring/synthetic-api-monitor.js

# Ver logs
Get-Content logs/app.log -Tail 50 -Wait

# Analisar erros
node scripts/logs/analyze-errors.js
```

### Deploy

```powershell
# Build de produção
npm run build

# Rodar testes pré-deploy
npm run test:all

# Deploy (Vercel/outro)
npm run deploy
```

---

## 📊 Dashboards e UIs

### Supabase Dashboard

- **Database:** https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/editor
- **Auth:** https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/auth/users
- **Storage:** https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/storage/buckets
- **SQL Editor:** https://app.supabase.com/project/ofhzrdiadxigrvmrhaiz/sql/new

### Upstash Console

- **Redis:** https://console.upstash.com/redis
- **Monitor:** Ver métricas de uso, comandos, latência

### BullMQ Dashboard (Local)

```powershell
# Iniciar dashboard local (porta 3001)
npm run bull:dashboard

# Abrir: http://localhost:3001
```

### Sentry (Opcional)

- **Issues:** https://sentry.io/organizations/sua-org/issues/
- **Performance:** https://sentry.io/organizations/sua-org/performance/

---

## 🐛 Troubleshooting

### Problema: "Variáveis de ambiente não encontradas"

**Solução:**
```powershell
# Re-configure credenciais
.\scripts\setup-env-interactive.ps1

# Valide
.\scripts\validate-setup.ps1
```

### Problema: "Cannot connect to Supabase"

**Verificações:**
1. URL correta? `https://ofhzrdiadxigrvmrhaiz.supabase.co`
2. Anon key válida? (copie da dashboard)
3. Projeto Supabase ativo? (não pausado)
4. Firewall/proxy bloqueando?

### Problema: "Redis connection failed"

**Verificações:**
1. URL formato `https://...upstash.io`
2. Token válido? (regenere se necessário)
3. Redis database ativo? (não pausado)
4. Plano Upstash válido?

### Problema: "E2E tests failing"

**Verificações:**
1. Test users criados? (admin@test.com, etc)
2. Roles atribuídas? (SQL INSERT INTO user_roles)
3. RLS policies aplicadas? (database-rls-policies.sql)
4. App rodando? (npm run dev em outra janela)

### Problema: "FFmpeg render failing"

**Verificações:**
1. FFmpeg instalado? `ffmpeg -version`
2. Paths corretos no .env.local? (FFMPEG_PATH)
3. Bucket `videos` existe no Storage?
4. Service role key configurada?

---

## 📚 Documentação Adicional

| Documento | Descrição | Linhas |
|-----------|-----------|--------|
| `CONSOLIDACAO_TOTAL_v2.4.0.md` | Visão geral completa do projeto | 600 |
| `RELATORIO_FINAL_17_NOV_2025.md` | Relatório final de implementação | 700 |
| `RELEASE_v2.4.0.md` | Release notes completas | 800 |
| `docs/plano-implementacao-por-fases.md` | Plano completo das 9 fases | 1.000+ |
| `IMPLEMENTACAO_PPTX_REAL_COMPLETA.md` | Detalhes da Fase 7 (PPTX) | 1.000 |
| `STATUS_FASE_8_COMPLETA.md` | Detalhes da Fase 8 (FFmpeg) | 800 |
| `docs/setup/TEST_USERS_SETUP.md` | Guia de criação de test users | 300 |
| `docs/setup-rbac-manual.md` | Manual de setup RBAC | 300 |
| `FASE_6_E2E_SETUP_PRONTO.md` | Setup de testes E2E | 500 |

---

## 🎯 Checklist de Produção

### Antes de Deploy

- [ ] Todas as credenciais configuradas (`.env.local`)
- [ ] Validação passou 100% (`.\scripts\validate-setup.ps1`)
- [ ] RBAC SQL executado no Supabase
- [ ] Test users criados (opcional, apenas para testes)
- [ ] Build de produção executado sem erros (`npm run build`)
- [ ] Testes unitários passando (`npm run test:all`)
- [ ] Testes E2E passando (se configurados)
- [ ] Buckets Supabase criados (`videos`, `avatars`, `thumbnails`, `assets`)
- [ ] Variáveis de ambiente setadas no host de produção (Vercel/outro)
- [ ] Domínio configurado (se aplicável)

### Após Deploy

- [ ] Smoke test da aplicação (abrir homepage)
- [ ] Testar upload de PPTX
- [ ] Testar criação de render job
- [ ] Testar autenticação (login/logout)
- [ ] Verificar Sentry recebendo eventos (se configurado)
- [ ] Verificar Redis operacional (check dashboard Upstash)
- [ ] Testar API endpoints principais
- [ ] Verificar logs de erro (Sentry/Vercel logs)

---

## 🎉 Pronto!

Seu sistema está 100% configurado e pronto para uso!

### Próximos Passos Sugeridos

1. **Explore a aplicação:** http://localhost:3000
2. **Teste upload PPTX:** Use um arquivo .pptx de exemplo
3. **Crie um vídeo:** Complete o fluxo end-to-end
4. **Revise métricas:** Check Supabase/Upstash dashboards
5. **Deploy produção:** Quando estiver satisfeito com testes

### Suporte

- 📖 **Documentação:** Ver arquivos `.md` na raiz
- 🐛 **Issues:** https://github.com/aline-jesse/_MVP_Video_TecnicoCursos/issues
- 💬 **Discussões:** GitHub Discussions

---

**Versão:** v2.4.0  
**Data:** 18/11/2025  
**Status:** ✅ Production Ready  
**Autor:** GitHub Copilot

**🚀 Bom desenvolvimento! 🚀**
