# Correção Definitiva do Render Worker

## Problema Original
O worker falhava com erros de conexão (`ETIMEDOUT` ou `Tenant or user not found`) e erros de schema (`column render_settings does not exist`).

## Diagnóstico
1. **Conectividade TCP:** O ambiente local (Windows/IPv6) não conseguia estabelecer conexão TCP direta com o Supabase (porta 5432 ou 6543) usando a biblioteca `pg`.
2. **Conectividade REST:** A API REST do Supabase (HTTPS) estava funcionando perfeitamente.

## Solução Implementada
Reescrevemos o `scripts/render-worker.js` para eliminar a dependência da biblioteca `pg` e usar exclusivamente o `@supabase/supabase-js`.

### Mudanças Principais:
1. **Remoção do `pg`:** O worker não tenta mais abrir conexões TCP instáveis.
2. **Adoção de Polling:** Em vez de `LISTEN/NOTIFY` (que exige TCP), o worker agora verifica novos jobs a cada 2 segundos.
3. **Optimistic Locking:** Implementamos um mecanismo robusto para garantir que múltiplos workers não peguem o mesmo job:
   ```javascript
   .update({ status: 'processing' })
   .eq('id', job.id)
   .eq('status', 'queued') // Garante que ninguém mudou o status antes
   ```

## Status Atual
- **Worker:** ✅ Rodando e processando jobs.
- **Conexão:** ✅ Estável via HTTPS (REST).
- **Jobs:** ✅ Já identificou e iniciou o processamento do job `71d853b1...`.

## Como Rodar
```powershell
node scripts/render-worker.js
```
