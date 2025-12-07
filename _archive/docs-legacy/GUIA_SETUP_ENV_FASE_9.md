# 🔐 Guia de Setup - Variáveis de Ambiente (Fase 9)

## 📋 Pré-requisitos

Para executar a Fase 9 completa, você precisa configurar as seguintes variáveis de ambiente:

---

## 1. Supabase (Obrigatório)

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DIRECT_DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres
```

### Como obter:
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
5. Vá em **Settings** → **Database** → **Connection String** (URI)
   - Copie a string completa → `DIRECT_DATABASE_URL`

---

## 2. ElevenLabs (TTS + Voice Cloning)

```env
ELEVENLABS_API_KEY=sk_xxx
```

### Como obter:
1. Acesse https://elevenlabs.io/
2. Crie uma conta (free tier disponível)
3. Vá em **Profile** → **API Keys**
4. Clique em **Create API Key**
5. Copie a chave gerada

### Features habilitadas:
- ✅ Geração de áudio TTS real
- ✅ Clone de vozes com amostras
- ✅ Upload de áudio para Storage

---

## 3. D-ID (Talking Heads)

```env
DID_API_KEY=xxx
```

### Como obter:
1. Acesse https://www.d-id.com/
2. Crie uma conta (trial disponível)
3. Vá em **API** → **API Keys**
4. Clique em **Create API Key**
5. Copie a chave gerada

### Features habilitadas:
- ✅ Avatares falantes com lip sync
- ✅ Sincronização com áudio TTS
- ✅ Pipeline automatizado TTS → Avatar → Storage

---

## 4. Synthesia (Opcional - AI Avatars)

```env
SYNTHESIA_API_KEY=xxx
```

### Como obter:
1. Acesse https://www.synthesia.io/
2. Solicite acesso à API (empresarial)
3. Após aprovação, gere uma API key no dashboard

### Features habilitadas:
- ✅ Avatares AI profissionais
- ✅ Múltiplos avatares e vozes
- ✅ Vídeos em alta qualidade

---

## 5. Redis (Opcional - BullMQ)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Setup local:
```bash
# Windows (via Chocolatey)
choco install redis-64

# Linux/Mac
brew install redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### Features habilitadas:
- ✅ Fila de renderização
- ✅ Dashboard de monitoramento
- ✅ Jobs em background

---

## 📁 Estrutura de Arquivos

Coloque as variáveis em:

```
_MVP_Video_TecnicoCursos_v7/
├── .env                          # Raiz (para scripts)
└── estudio_ia_videos/app/
    └── .env.local                # App Next.js
```

---

## ✅ Validação

Execute o script de validação:

```bash
cd c:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7
node scripts/validate-env.js
```

Ou manualmente via API:

```bash
curl http://localhost:3000/api/lip-sync/validate
```

Resposta esperada:
```json
{
  "valid": true,
  "errors": []
}
```

---

## 🚀 Provisionamento do Banco

Após configurar Supabase, execute:

```bash
node scripts/execute-supabase-sql.js database-nr-templates.sql
```

Isso criará:
- ✅ Tabela `nr_templates`
- ✅ 10 NRs seed (NR-01, 05, 06, 07, 09, 10, 12, 17, 18, 35)
- ✅ Políticas RLS (leitura pública, escrita admin)
- ✅ Índices de performance
- ✅ Triggers de updated_at

---

## 🧪 Testes Funcionais

### 1. TTS + Voice Cloning
```bash
curl -X POST http://localhost:3000/api/test-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, este é um teste de TTS"}'
```

### 2. Lip Sync
```bash
curl -X POST http://localhost:3000/api/lip-sync \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bem-vindo ao curso de NR-06",
    "avatarImageUrl": "https://example.com/avatar.jpg"
  }'
```

### 3. Templates NR
```bash
curl http://localhost:3000/api/nr-templates?q=segurança
```

### 4. Queue Dashboard
```bash
curl http://localhost:3000/api/queues
```

---

## ⚠️ Sem Credenciais?

A aplicação funcionará parcialmente:

### ✅ Funciona sem credenciais:
- Upload de PPTX
- Editor de slides
- Ordenação de slides
- Interface admin

### ❌ Não funciona sem credenciais:
- Geração de áudio TTS
- Clone de vozes
- Avatares com lip sync
- Renderização de vídeo com avatar
- Fila de jobs (sem Redis)

---

## 📊 Custos Estimados (Free Tiers)

| Serviço    | Free Tier                     | Limite Mensal |
|------------|-------------------------------|---------------|
| Supabase   | 500MB DB, 1GB Storage         | Ilimitado     |
| ElevenLabs | 10.000 caracteres             | ~20 minutos   |
| D-ID       | 20 créditos (20 vídeos de 1min)| ~20 vídeos   |
| Synthesia  | N/A (apenas pago)             | -             |
| Redis      | Local (sem custo)             | Ilimitado     |

**Total**: Gratuito para desenvolvimento e testes

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `scripts/logs/combined.log`
2. Execute `npm run health` (se disponível)
3. Consulte documentação: `FASE_9_FINAL_COMPLETO.md`
4. Reporte issues no repositório

---

**Última atualização**: 19/01/2025
