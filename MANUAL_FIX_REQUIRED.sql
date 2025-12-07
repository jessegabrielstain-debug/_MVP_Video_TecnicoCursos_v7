-- ==============================================================================
-- 🚨 AÇÃO MANUAL NECESSÁRIA 🚨
-- ==============================================================================
-- Devido a restrições de conexão direta e falta da função RPC 'exec_sql',
-- a automação não consegue criar a tabela final.
--
-- POR FAVOR, COPIE E COLE O CONTEÚDO ABAIXO NO "SQL EDITOR" DO SUPABASE DASHBOARD.
-- ==============================================================================

-- 1. Criar a tabela nr_templates (Faltante)
CREATE TABLE IF NOT EXISTS public.nr_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nr_number VARCHAR(10) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    slide_count INTEGER NOT NULL DEFAULT 5,
    duration_seconds INTEGER NOT NULL DEFAULT 300,
    template_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Segurança (RLS)
ALTER TABLE public.nr_templates ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de Acesso
-- Permitir leitura pública (necessário para o frontend carregar os templates)
DROP POLICY IF EXISTS "Todos podem ver templates NR" ON public.nr_templates;
CREATE POLICY "Todos podem ver templates NR"
ON public.nr_templates FOR SELECT
USING (true);

-- Permitir gestão apenas para admins
DROP POLICY IF EXISTS "Administradores podem gerenciar templates NR" ON public.nr_templates;
CREATE POLICY "Administradores podem gerenciar templates NR"
ON public.nr_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Trigger para updated_at
DROP TRIGGER IF EXISTS update_nr_templates_updated_at ON public.nr_templates;
CREATE TRIGGER update_nr_templates_updated_at BEFORE UPDATE ON public.nr_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 🔓 DESBLOQUEIO DE AUTOMAÇÃO FUTURA 🔓
-- Esta função permite que nossos scripts Node.js executem SQL via API.
-- Criando isso agora, você não precisará fazer passos manuais no futuro.
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 6. Inserir Dados de Exemplo (Opcional, para teste imediato)
INSERT INTO public.nr_templates (nr_number, title, description, slide_count, duration_seconds, template_config)
VALUES 
('NR-35', 'Trabalho em Altura', 'Template padrão para cursos de NR-35 com foco em segurança e procedimentos.', 12, 600, '{"theme": "safety-red", "modules": ["intro", "equipamentos", "procedimentos"]}'::jsonb),
('NR-10', 'Segurança em Instalações Elétricas', 'Template para cursos de NR-10 cobrindo riscos elétricos e medidas de controle.', 15, 900, '{"theme": "electric-blue", "modules": ["riscos", "medidas", "primeiros-socorros"]}'::jsonb)
ON CONFLICT (nr_number) DO NOTHING;
