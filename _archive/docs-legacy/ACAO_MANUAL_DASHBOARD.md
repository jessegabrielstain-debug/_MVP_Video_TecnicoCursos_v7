# 🚨 AÇÃO MANUAL NECESSÁRIA - Criar Tabela nr_templates

## Status
❌ **Bloqueado**: Tabela `nr_templates` não existe no banco de dados
❌ **Conexões falharam**: PostgreSQL direto, Pooler (aws-0, aws-1), REST API (exec_sql inexistente)
✅ **Solução**: Executar SQL via Dashboard do Supabase (2 minutos)

---

## 📋 Instruções Passo-a-Passo

### 1. Acessar Dashboard Supabase
```
URL: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz
```

### 2. Navegar para SQL Editor
- Menu lateral esquerdo → **SQL Editor**
- Ou acesso direto: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/sql

### 3. Criar Nova Query
- Clicar em **"New Query"** (botão verde superior direito)

### 4. Copiar SQL Completo
Abrir arquivo: `supabase\migrations\20251118000000_create_nr_templates_table.sql`

**OU** copiar daqui:

```sql
-- Migration: Create nr_templates table
-- Created: 2025-11-18
-- Description: Add table for Norma Regulamentadora templates

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON nr_templates(nr_number);
CREATE INDEX IF NOT EXISTS idx_nr_templates_created_at ON nr_templates(created_at DESC);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_nr_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_nr_templates_updated_at ON nr_templates;
CREATE TRIGGER trigger_update_nr_templates_updated_at
  BEFORE UPDATE ON nr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nr_templates_updated_at();

-- Enable RLS
ALTER TABLE nr_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read access" ON nr_templates;
CREATE POLICY "Allow public read access" 
  ON nr_templates FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON nr_templates;
CREATE POLICY "Allow authenticated insert" 
  ON nr_templates FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update" ON nr_templates;
CREATE POLICY "Allow authenticated update" 
  ON nr_templates FOR UPDATE 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete" ON nr_templates;
CREATE POLICY "Allow authenticated delete" 
  ON nr_templates FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Seed data: 10 NR templates
INSERT INTO nr_templates (nr_number, title, description, slide_count, duration_seconds, template_config)
VALUES
  (
    'NR-01',
    'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    'Estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras.',
    8,
    480,
    '{"primary_color":"#2563EB","secondary_color":"#3B82F6","font_family":"Inter","topics":["Disposições Gerais","Campo de Aplicação","Termos e Definições","Direitos e Deveres","GRO","Equipamentos","Capacitação","Documentação"]}'::jsonb
  ),
  (
    'NR-05',
    'Comissão Interna de Prevenção de Acidentes (CIPA)',
    'Define as diretrizes para a constituição e funcionamento da CIPA.',
    7,
    420,
    '{"primary_color":"#06B6D4","secondary_color":"#0891B2","font_family":"Inter","topics":["Constituição","Atribuições","Processo Eleitoral","Treinamento","Reuniões","SIPAT","Documentação"]}'::jsonb
  ),
  (
    'NR-06',
    'Equipamentos de Proteção Individual (EPI)',
    'Estabelece as regras sobre fornecimento, uso e manutenção de EPIs.',
    10,
    600,
    '{"primary_color":"#10B981","secondary_color":"#059669","font_family":"Inter","topics":["Obrigações do Empregador","Obrigações do Empregado","CA","Fornecimento","Treinamento","Higienização","Tipos de EPI","Fiscalização","Penalidades","Documentação"]}'::jsonb
  ),
  (
    'NR-07',
    'Programa de Controle Médico de Saúde Ocupacional (PCMSO)',
    'Define as diretrizes para elaboração e implementação do PCMSO.',
    9,
    540,
    '{"primary_color":"#8B5CF6","secondary_color":"#7C3AED","font_family":"Inter","topics":["Objetivos","Responsabilidades","Exames","ASO","Riscos","Afastamentos","Prontuários","Relatórios","Integração"]}'::jsonb
  ),
  (
    'NR-09',
    'Avaliação e Controle das Exposições Ocupacionais',
    'Define os requisitos para avaliação e controle de agentes nocivos.',
    11,
    660,
    '{"primary_color":"#F97316","secondary_color":"#EA580C","font_family":"Inter","topics":["Reconhecimento","Avaliação","Agentes Físicos","Agentes Químicos","Agentes Biológicos","Limites de Exposição","Medidas de Controle","Monitoramento","Registros","Integração GRO","Documentação"]}'::jsonb
  ),
  (
    'NR-10',
    'Segurança em Instalações e Serviços em Eletricidade',
    'Estabelece as condições mínimas para segurança em eletricidade.',
    13,
    780,
    '{"primary_color":"#EAB308","secondary_color":"#CA8A04","font_family":"Inter","topics":["Medidas de Controle","Prontuário","Projetos","Procedimentos","Equipamentos","Treinamento Básico","Treinamento SEP","Habilitação","Desenergização","Aterramento","Sinalizações","Trabalho em Altura","EPI"]}'::jsonb
  ),
  (
    'NR-12',
    'Segurança no Trabalho em Máquinas e Equipamentos',
    'Define as medidas de proteção para máquinas e equipamentos.',
    12,
    720,
    '{"primary_color":"#DC2626","secondary_color":"#B91C1C","font_family":"Inter","topics":["Arranjo Físico","Proteções","Dispositivos de Segurança","Operação","Manutenção","Inspeção","Capacitação","Manual","Sinalização","Anexo I","Anexo XII","Documentação"]}'::jsonb
  ),
  (
    'NR-17',
    'Ergonomia',
    'Estabelece parâmetros para adaptação das condições de trabalho.',
    8,
    480,
    '{"primary_color":"#14B8A6","secondary_color":"#0D9488","font_family":"Inter","topics":["Análise Ergonômica","Mobiliário","Iluminação","Organização","Transporte de Cargas","Condições Ambientais","Trabalho com Computadores","Documentação"]}'::jsonb
  ),
  (
    'NR-18',
    'Condições de Segurança e Saúde no Trabalho na Indústria da Construção',
    'Define as diretrizes de segurança para construção civil.',
    14,
    840,
    '{"primary_color":"#F59E0B","secondary_color":"#D97706","font_family":"Inter","topics":["PCMAT","SESMT","CIPA","Áreas de Vivência","Escavações","Andaimes","Plataformas","Guindastes","Transporte Vertical","Proteção Contra Quedas","Máquinas","Equipamentos","Treinamento","Documentação"]}'::jsonb
  ),
  (
    'NR-35',
    'Trabalho em Altura',
    'Estabelece os requisitos mínimos para trabalho em altura.',
    10,
    600,
    '{"primary_color":"#EF4444","secondary_color":"#DC2626","font_family":"Inter","topics":["Requisitos Mínimos","Responsabilidades","Capacitação","Planejamento","Análise de Risco","Sistemas de Proteção","EPI","Emergência","PT","Documentação"]}'::jsonb
  )
ON CONFLICT (nr_number) DO NOTHING;
```

### 5. Executar Query
- Clicar em **"RUN"** (botão verde inferior direito)
- OU pressionar `Ctrl + Enter`

### 6. Verificar Sucesso
Você deve ver:
```
✅ Success. No rows returned
✅ 10 rows affected (para o INSERT)
```

---

## ✅ Após Execução Manual

Execute este comando para validar:
```powershell
node scripts/setup-nr-templates.js
```

**Saída esperada:**
```
✅ Tabela nr_templates já existe!
📊 10 templates encontrados
```

---

## 🔄 Próximos Passos Automáticos
Após tabela criada, execute:
```powershell
node scripts/provision-nr-templates.js
```

Isso irá:
1. ✅ Validar tabela existe
2. ✅ Verificar 10 templates inseridos
3. ✅ Atualizar status para 100%

---

## 📞 Problemas?
Se erro persistir, compartilhe:
1. Screenshot do erro no Dashboard
2. Output do comando `node scripts/setup-nr-templates.js`
