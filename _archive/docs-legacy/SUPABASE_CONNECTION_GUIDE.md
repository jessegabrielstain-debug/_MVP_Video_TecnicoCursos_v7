# Guia de Conexão Supabase

## Status Atual ✅
- WSL2 configurado e funcionando
- Docker Desktop iniciado (com limitações de API)
- Supabase CLI instalado e funcional

## Problema Identificado
Docker Desktop apresenta erro de API version mismatch (500 Internal Server Error), impedindo containers locais.

## Soluções Disponíveis

### 1. Conectar ao Projeto Supabase Remoto (Recomendado)
```powershell
# Login no Supabase (use o browser para autenticar)
supabase login

# Link ao projeto existente
supabase link --project-ref SEU_PROJECT_REF

# Verificar status
supabase status
```

### 2. Usar Configuração Manual
```powershell
# Definir variáveis de ambiente
$env:SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_ANON_KEY="sua-chave-anonima"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

### 3. Corrigir Docker (Reinicialização Necessária)
```powershell
# Atualizar Docker Desktop para versão mais recente
# Reiniciar o computador
# Tentar: supabase start
```

## Próximos Passos
1. **Obter credenciais do projeto Supabase** (URL, chaves)
2. **Executar `supabase login`** via browser
3. **Fazer link com `supabase link --project-ref`**
4. **Testar conexão com `supabase status`**

## Arquivos de Configuração
- `supabase/config.toml` - Configuração local (pronto)
- `.env` - Variáveis de ambiente (criar se necessário)