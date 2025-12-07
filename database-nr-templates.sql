-- ============================================================================
-- SCRIPT: Criação de Tabela e Seed de Templates NR
-- Descrição: Migra templates de NRs (Normas Regulamentadoras) para o banco
-- Autor: Estúdio IA Vídeos
-- Data: 2025-01-19
-- ============================================================================

-- Cria tabela nr_templates se não existir
CREATE TABLE IF NOT EXISTS nr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nr_number VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  slide_count INTEGER NOT NULL DEFAULT 5,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON nr_templates(nr_number);
CREATE INDEX IF NOT EXISTS idx_nr_templates_created_at ON nr_templates(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_nr_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nr_templates_updated_at ON nr_templates;
CREATE TRIGGER trigger_update_nr_templates_updated_at
  BEFORE UPDATE ON nr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nr_templates_updated_at();

-- ============================================================================
-- SEED: Templates de NRs Existentes
-- ============================================================================

-- Limpa dados antigos (apenas para desenvolvimento)
-- TRUNCATE TABLE nr_templates RESTART IDENTITY CASCADE;

-- Insere templates base (INSERT ... ON CONFLICT para idempotência)
INSERT INTO nr_templates (nr_number, title, description, slide_count, duration_seconds, template_config)
VALUES
  (
    'NR-01',
    'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    'Norma que estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras - NR relativas à segurança e saúde no trabalho e as diretrizes e os requisitos para o gerenciamento de riscos ocupacionais e as medidas de prevenção em Segurança e Saúde no Trabalho - SST.',
    8,
    480,
    '{
      "themeColor": "#1e3a8a",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-06',
    'Equipamento de Proteção Individual - EPI',
    'Esta Norma Regulamentadora - NR estabelece os requisitos para a comercialização, a disponibilização, o uso e a fiscalização de Equipamentos de Proteção Individual - EPI, a serem observados em todos os locais de trabalho onde se aplica a legislação trabalhista.',
    10,
    600,
    '{
      "themeColor": "#047857",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "exampleImages": ["epi-capacete.jpg", "epi-luvas.jpg", "epi-oculos.jpg"]
    }'::jsonb
  ),
  (
    'NR-12',
    'Segurança no Trabalho em Máquinas e Equipamentos',
    'Define referências técnicas, princípios fundamentais e medidas de proteção para resguardar a saúde e a integridade física dos trabalhadores e estabelece requisitos mínimos para a prevenção de acidentes e doenças do trabalho nas fases de projeto e de utilização de máquinas e equipamentos, e ainda à sua fabricação, importação, comercialização, exposição e cessão a qualquer título.',
    12,
    720,
    '{
      "themeColor": "#dc2626",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "high"
    }'::jsonb
  ),
  (
    'NR-05',
    'Comissão Interna de Prevenção de Acidentes - CIPA',
    'Estabelece os parâmetros e os requisitos para a constituição, funcionamento e treinamento da Comissão Interna de Prevenção de Acidentes e Assédio - CIPA.',
    7,
    420,
    '{
      "themeColor": "#0369a1",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-07',
    'Programa de Controle Médico de Saúde Ocupacional - PCMSO',
    'Estabelece a obrigatoriedade da elaboração e implementação do Programa de Controle Médico de Saúde Ocupacional - PCMSO, com o objetivo de promoção e preservação da saúde dos trabalhadores.',
    9,
    540,
    '{
      "themeColor": "#7c3aed",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-09',
    'Avaliação e Controle das Exposições Ocupacionais',
    'Estabelece os requisitos para a avaliação das exposições ocupacionais a agentes físicos, químicos e biológicos quando identificados no Programa de Gerenciamento de Riscos - PGR, e subsidiá-lo quanto às medidas de prevenção para os riscos ocupacionais.',
    11,
    660,
    '{
      "themeColor": "#ea580c",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-10',
    'Segurança em Instalações e Serviços em Eletricidade',
    'Estabelece os requisitos e condições mínimas objetivando a implementação de medidas de controle e sistemas preventivos, de forma a garantir a segurança e a saúde dos trabalhadores que, direta ou indiretamente, interajam em instalações elétricas e serviços com eletricidade.',
    13,
    780,
    '{
      "themeColor": "#facc15",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "critical"
    }'::jsonb
  ),
  (
    'NR-17',
    'Ergonomia',
    'Visa estabelecer as diretrizes e os requisitos que permitam a adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, de modo a proporcionar conforto, segurança, saúde e desempenho eficiente no trabalho.',
    8,
    480,
    '{
      "themeColor": "#10b981",
      "fontFamily": "Inter",
      "transitionType": "slide",
      "avatarEnabled": true,
      "avatarPosition": "bottom-left",
      "audioEnabled": true,
      "subtitlesEnabled": true
    }'::jsonb
  ),
  (
    'NR-18',
    'Condições de Segurança e Saúde no Trabalho na Indústria da Construção',
    'Estabelece diretrizes de ordem administrativa, de planejamento e de organização, que objetivam a implementação de medidas de controle e sistemas preventivos de segurança nos processos, nas condições e no meio ambiente de trabalho na Indústria da Construção.',
    14,
    840,
    '{
      "themeColor": "#f59e0b",
      "fontFamily": "Inter",
      "transitionType": "zoom",
      "avatarEnabled": true,
      "avatarPosition": "center-bottom",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "high"
    }'::jsonb
  ),
  (
    'NR-35',
    'Trabalho em Altura',
    'Estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura, envolvendo o planejamento, a organização e a execução, de forma a garantir a segurança e a saúde dos trabalhadores envolvidos direta ou indiretamente com esta atividade.',
    10,
    600,
    '{
      "themeColor": "#ef4444",
      "fontFamily": "Inter",
      "transitionType": "fade",
      "avatarEnabled": true,
      "avatarPosition": "bottom-right",
      "audioEnabled": true,
      "subtitlesEnabled": true,
      "warningLevel": "critical"
    }'::jsonb
  )
ON CONFLICT (nr_number) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    slide_count = EXCLUDED.slide_count,
    duration_seconds = EXCLUDED.duration_seconds,
    template_config = EXCLUDED.template_config,
    updated_at = NOW();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilita RLS
ALTER TABLE nr_templates ENABLE ROW LEVEL SECURITY;

-- Políticas: Leitura pública, escrita apenas para admins
DROP POLICY IF EXISTS "nr_templates_select_public" ON nr_templates;
CREATE POLICY "nr_templates_select_public"
  ON nr_templates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "nr_templates_insert_admin" ON nr_templates;
CREATE POLICY "nr_templates_insert_admin"
  ON nr_templates
  FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "nr_templates_update_admin" ON nr_templates;
CREATE POLICY "nr_templates_update_admin"
  ON nr_templates
  FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "nr_templates_delete_admin" ON nr_templates;
CREATE POLICY "nr_templates_delete_admin"
  ON nr_templates
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Conta quantos templates foram inseridos
SELECT COUNT(*) AS total_templates FROM nr_templates;

-- Lista todos os templates
SELECT nr_number, title, slide_count, duration_seconds 
FROM nr_templates 
ORDER BY nr_number;
