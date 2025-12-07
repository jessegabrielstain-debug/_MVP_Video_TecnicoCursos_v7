-- ============================================
-- FUNÇÃO: exec_sql
-- ============================================
-- Permite executar SQL dinâmico via RPC (Remote Procedure Call)
-- Necessário para scripts de automação via SDK
-- ============================================

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
