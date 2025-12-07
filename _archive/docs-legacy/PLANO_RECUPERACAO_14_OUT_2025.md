# 🚨 PLANO DE RECUPERAÇÃO - 14/10/2025 16:45

## 📊 STATUS ATUAL

**Score de Saúde:** 24/100 (CRÍTICO)
**Problemas Críticos:**
- ❌ Conexão com banco instável
- ❌ 6/7 tabelas ausentes
- ❌ Função `get_policies` não encontrada
- ❌ Dados iniciais não encontrados
- ✅ Storage buckets OK (4/4)

## 🔄 PLANO DE RECUPERAÇÃO

### 1️⃣ FASE IMEDIATA (16:45-17:00)

1. **Limpeza do Schema**
```sql
-- Executar no SQL Editor do Supabase
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
```

2. **Criação de Tabelas**
```sql
-- Executar database-schema.sql completo
-- Ordem: users → projects → slides → render_jobs → analytics_events → nr_courses → nr_modules
```

3. **Criação de Funções**
```sql
-- Criar função get_policies
CREATE OR REPLACE FUNCTION public.get_policies()
RETURNS TABLE (
  schema_name text,
  table_name text,
  policy_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.nspname::text, c.relname::text, pol.polname::text
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função exec_sql
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2️⃣ FASE DE ESTRUTURAÇÃO (17:00-17:15)

1. **Aplicar RLS**
   - Executar `database-rls-policies.sql`
   - Validar cada política individualmente
   - Testar com usuário anônimo/autenticado

2. **Configurar Storage**
   - Verificar políticas de bucket
   - Ajustar limites de tamanho
   - Testar upload/download

3. **Popular Dados**
   - Inserir 3 cursos NR iniciais
   - Validar integridade referencial
   - Verificar relações entre tabelas

### 3️⃣ FASE DE VALIDAÇÃO (17:15-17:30)

1. **Testes Unitários**
   ```bash
   cd scripts
   npm run test:supabase
   ```

2. **Verificação de Saúde**
   ```bash
   tsx check-system-health.ts
   ```

3. **Validação Manual**
   - [ ] SELECT em cada tabela
   - [ ] Teste de cada política RLS
   - [ ] Upload em cada bucket
   - [ ] Queries complexas de joins

### 4️⃣ DOCUMENTAÇÃO (17:30-17:45)

1. **Atualizar Logs**
   - Registrar todas as ações executadas
   - Documentar erros encontrados
   - Registrar soluções aplicadas

2. **Atualizar Status**
   - [ ] Gerar relatório final
   - [ ] Atualizar score geral
   - [ ] Documentar melhorias

## 🎯 CRITÉRIOS DE SUCESSO

1. **Banco de Dados**
   - [ ] 7/7 tabelas criadas
   - [ ] Todas as funções disponíveis
   - [ ] Queries funcionais

2. **Segurança**
   - [ ] RLS ativo em todas as tabelas
   - [ ] Políticas testadas
   - [ ] Funções seguras

3. **Dados**
   - [ ] 3+ cursos NR
   - [ ] Relacionamentos OK
   - [ ] Integridade mantida

4. **Score Final**
   - [ ] > 90/100 no health check
   - [ ] 19/19 testes passando
   - [ ] Sem erros críticos

## ⚠️ AVISOS

1. **Backups**
   - Fazer backup antes de DROP SCHEMA
   - Manter SQL em arquivo local
   - Documentar estado atual

2. **Monitoramento**
   - Observar logs durante execução
   - Verificar performance
   - Monitorar conexões

3. **Rollback**
   - Manter scripts de reversão
   - Documentar cada alteração
   - Planejar contingência

## 📝 NOTAS ADICIONAIS

1. **Não executar em produção** sem validação completa
2. **Manter backup** de todos os dados existentes
3. **Documentar** cada passo executado
4. Em caso de falha, **reverter imediatamente**
5. **Comunicar** status em cada fase

## 🔍 PRÓXIMOS PASSOS

1. Iniciar execução do plano
2. Monitorar progresso
3. Validar cada fase
4. Documentar resultados
5. Atualizar status final