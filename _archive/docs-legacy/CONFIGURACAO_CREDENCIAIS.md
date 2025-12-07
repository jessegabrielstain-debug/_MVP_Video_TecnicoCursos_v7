# 🔧 CONFIGURAÇÃO DE CREDENCIAIS - FASE 9

## ⚠️ Ação Necessária

Para ativar todas as funcionalidades da Fase 9, configure as seguintes variáveis de ambiente:

---

## 📝 Arquivo: `.env` (raiz do projeto)

### 1. Supabase (Obrigatório)

```env
# Obter em: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://ofhzrdiadxigrvmrhaiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Substituir
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Substituir

# Obter em: https://supabase.com/dashboard/project/_/settings/database
DIRECT_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.ofhzrdiadxigrvmrhaiz.supabase.co:5432/postgres
```

### 2. ElevenLabs (TTS + Voice Cloning)

```env
# Obter em: https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=sk_...
```

### 3. D-ID (Talking Heads)

```env
# Obter em: https://studio.d-id.com/account-settings
DID_API_KEY=...
```

### 4. Synthesia (AI Avatars)

```env
# Obter em: https://app.synthesia.io/#/settings/api-keys
SYNTHESIA_API_KEY=...
```

### 5. Redis (Queue BullMQ)

```env
# Obter em: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 🚀 Comandos Após Configuração

### 1. Provisionar Database
```bash
node scripts/execute-supabase-sql.js database-nr-templates.sql
```

### 2. Validar Configuração
```bash
curl http://localhost:3000/api/lip-sync/validate
```

### 3. Testar TTS
```bash
curl -X POST http://localhost:3000/api/tts/test \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, bem-vindo!"}'
```

---

## 📋 Checklist de Validação

- [ ] Supabase URL/Keys configuradas
- [ ] Database URL configurada
- [ ] Executar `database-nr-templates.sql` com sucesso
- [ ] ElevenLabs API key configurada (opcional para TTS)
- [ ] D-ID API key configurada (opcional para avatares)
- [ ] Synthesia API key configurada (opcional para avatares)
- [ ] Redis configurado (opcional para filas)

---

## 🎯 Status Atual

### ✅ Implementado (não requer credenciais)
- Todos os serviços e APIs criados
- Interfaces admin completas
- Lógica de negócio implementada
- Logs e error handling

### ⚠️ Requer Credenciais (para funcionar)
- Conexão com banco Supabase
- Chamadas à API ElevenLabs
- Chamadas à API D-ID/Synthesia
- Filas Redis (BullMQ)

---

## 💡 Modo de Desenvolvimento

Para desenvolvimento sem credenciais externas:
1. Configure apenas Supabase (mínimo)
2. Use mocks para TTS/Avatares (comentar integrações)
3. Execute testes unitários (não requerem APIs externas)

---

## 📞 Suporte

Se precisar de ajuda para obter credenciais:
- Supabase: https://supabase.com/docs/guides/api
- ElevenLabs: https://elevenlabs.io/docs/api-reference
- D-ID: https://docs.d-id.com/reference/getting-started
- Synthesia: https://help.synthesia.io/en/articles/api-documentation
