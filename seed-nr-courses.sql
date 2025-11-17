-- ============================================
-- DADOS INICIAIS - CURSOS NR
-- ============================================
-- Script para popular cursos NR12, NR33, NR35
-- Data: 09/10/2025

-- ============================================
-- CURSO NR12 - Segurança em Máquinas e Equipamentos
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR12',
    'NR12 - Segurança em Máquinas e Equipamentos',
    'Curso completo sobre segurança no trabalho com máquinas e equipamentos de trabalho, abordando os principais riscos e medidas de proteção.',
    'nr12-thumb.jpg',
    480, -- 8 horas em minutos
    9,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Intermediário",
        "requirements": ["Ensino Fundamental Completo"],
        "certification": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    thumbnail_url = EXCLUDED.thumbnail_url,
    updated_at = NOW();

-- Módulos do NR12
INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    1,
    'Introdução à NR12',
    'Apresentação da norma regulamentadora NR12 e sua importância para a segurança do trabalho',
    'nr12-intro.jpg',
    45,
    '{
        "topics": [
            "O que é a NR12",
            "Histórico e evolução da norma",
            "Importância da segurança em máquinas",
            "Responsabilidades legais"
        ],
        "resources": ["vídeo", "slides", "quiz"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    2,
    'Objetivos e Campo de Aplicação',
    'Compreenda os objetivos da NR12 e onde ela deve ser aplicada',
    'nr12-objetivos.jpg',
    40,
    '{
        "topics": [
            "Objetivos da NR12",
            "Campo de aplicação",
            "Equipamentos abrangidos",
            "Exceções e casos especiais"
        ],
        "resources": ["vídeo", "slides", "exemplos práticos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    3,
    'Arranjo Físico e Instalações',
    'Requisitos de espaço e organização para operação segura',
    'nr12-arranjo.jpg',
    50,
    '{
        "topics": [
            "Espaços mínimos requeridos",
            "Circulação e vias de acesso",
            "Iluminação adequada",
            "Pisos e áreas de trabalho"
        ],
        "resources": ["vídeo", "slides", "plantas baixas exemplo"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    4,
    'Instalações Elétricas',
    'Segurança em instalações e dispositivos elétricos de máquinas',
    'nr12-eletrico.jpg',
    60,
    '{
        "topics": [
            "Quadros elétricos",
            "Dispositivos de segurança elétrica",
            "Aterramento",
            "Manutenção elétrica segura"
        ],
        "resources": ["vídeo", "slides", "diagramas elétricos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    5,
    'Dispositivos de Partida, Acionamento e Parada',
    'Sistemas de controle seguro de máquinas',
    'nr12-partida.jpg',
    55,
    '{
        "topics": [
            "Botões de emergência",
            "Sistemas de partida segura",
            "Dispositivos de parada",
            "Bloqueios e intertravamentos"
        ],
        "resources": ["vídeo", "slides", "demonstrações práticas"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    6,
    'Sistemas de Segurança',
    'Proteções e dispositivos de segurança em máquinas',
    'nr12-seguranca.jpg',
    70,
    '{
        "topics": [
            "Proteções fixas e móveis",
            "Cortinas de luz",
            "Sensores de presença",
            "Bloqueios mecânicos",
            "Válvulas de segurança"
        ],
        "resources": ["vídeo", "slides", "casos práticos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    7,
    'Procedimentos de Trabalho e Segurança',
    'Como trabalhar de forma segura com máquinas',
    'nr12-procedimentos.jpg',
    65,
    '{
        "topics": [
            "Análise de risco",
            "Procedimentos operacionais padrão",
            "Permissão de trabalho",
            "Check-list de segurança",
            "EPIs necessários"
        ],
        "resources": ["vídeo", "slides", "modelos de documentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    8,
    'Capacitação e Treinamento',
    'Requisitos de capacitação para operadores',
    'nr12-treinamento.jpg',
    50,
    '{
        "topics": [
            "Capacitação básica",
            "Capacitação específica",
            "Reciclagem periódica",
            "Certificação de operadores",
            "Registro de treinamentos"
        ],
        "resources": ["vídeo", "slides", "certificados modelo"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    9,
    'Manutenção e Inspeção',
    'Práticas seguras de manutenção de máquinas',
    'nr12-manutencao.jpg',
    45,
    '{
        "topics": [
            "Plano de manutenção",
            "Lock-out/Tag-out",
            "Inspeções periódicas",
            "Registros de manutenção",
            "Substituição de componentes"
        ],
        "resources": ["vídeo", "slides", "checklists"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR12'
ON CONFLICT DO NOTHING;

-- ============================================
-- CURSO NR33 - Segurança em Espaços Confinados
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR33',
    'NR33 - Segurança e Saúde em Espaços Confinados',
    'Curso sobre trabalho seguro em espaços confinados, identificação de riscos e procedimentos de emergência.',
    'nr33-thumb.jpg',
    960, -- 16 horas
    8,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Avançado",
        "requirements": ["NR35 ou experiência em segurança"],
        "certification": true,
        "mandatory_practical": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Módulos do NR33
INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    1,
    'Introdução à NR33',
    'Definições e conceitos fundamentais sobre espaços confinados',
    'nr33-intro.jpg',
    30,
    '{
        "topics": [
            "O que são espaços confinados",
            "Riscos associados",
            "Obrigações legais",
            "Responsabilidades"
        ],
        "resources": ["vídeo", "slides", "glossário"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    2,
    'Classificação de Riscos',
    'Como identificar e classificar os riscos em espaços confinados',
    'nr33-riscos.jpg',
    90,
    '{
        "topics": [
            "Riscos atmosféricos",
            "Riscos físicos",
            "Riscos comportamentais",
            "Análise quantitativa e qualitativa"
        ],
        "resources": ["vídeo", "slides", "fichas de risco"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    3,
    'Medição e Monitoramento',
    'Técnicas e equipamentos para monitoramento contínuo',
    'nr33-monitoramento.jpg',
    60,
    '{
        "topics": [
            "Monitores gás",
            "Técnicas de amostragem",
            "Frequência de monitoramento",
            "Procedimentos de calibração"
        ],
        "resources": ["vídeo", "slides", "manual equipamentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    4,
    'Ventilação e Purga',
    'Técnicas de ventilação e purga de espaços confinados',
    'nr33-ventilacao.jpg',
    60,
    '{
        "topics": [
            "Sistemas de ventilação",
            "Cálculo de ventilação",
            "Procedimentos de purga",
            "Condições seguras"
        ],
        "resources": ["vídeo", "slides", "tabelas"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    5,
    'Permissão de Entrada e Trabalho',
    'Procedimento PET - Permissão de Entrada e Trabalho',
    'nr33-pet.jpg',
    90,
    '{
        "topics": [
            "Emissão da PET",
            "Conteúdo obrigatório",
            "Responsáveis e validação",
            "Controle e arquivamento"
        ],
        "resources": ["vídeo", "slides", "modelo PET"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    6,
    'Procedimentos de Resgate',
    'Plano de resgate e emergência em espaços confinados',
    'nr33-resgate.jpg',
    120,
    '{
        "topics": [
            "Tipos de resgate",
            "Equipe de resgate",
            "Equipamentos",
            "Procedimentos de resgate"
        ],
        "resources": ["vídeo", "slides", "simulados"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    7,
    'Equipamentos de Proteção',
    'EPIs e EPCs específicos para espaços confinados',
    'nr33-equipamentos.jpg',
    60,
    '{
        "topics": [
            "EPIs obrigatórios",
            "EPCs",
            "Seleção e uso",
            "Manutenção e inspeção"
        ],
        "resources": ["vídeo", "slides", "fichas técnicas"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    8,
    'Responsabilidades e Competências',
    'Definição de papéis na equipe de trabalho em espaços confinados',
    'nr33-responsabilidades.jpg',
    45,
    '{
        "topics": [
            "Trabalhadores autorizados",
            "Supervisor",
            "Vigia",
            "Equipe de resgate"
        ],
        "resources": ["vídeo", "slides", "matrizes de responsabilidades"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR33'
ON CONFLICT DO NOTHING;

-- ============================================
-- CURSO NR35 - Trabalho em Altura
-- ============================================

INSERT INTO public.nr_courses (course_code, title, description, thumbnail_url, duration, modules_count, status, metadata)
VALUES (
    'NR35',
    'NR35 - Trabalho em Altura',
    'Treinamento completo para trabalho seguro em altura, com foco em prevenção de quedas e uso de EPIs.',
    'nr35-thumb.jpg',
    480, -- 8 horas
    10,
    'active',
    '{
        "category": "Segurança do Trabalho",
        "difficulty": "Intermediário",
        "requirements": ["Aptidão física", "Exame médico válido"],
        "certification": true,
        "validity_months": 24,
        "mandatory_practical": true
    }'::jsonb
) ON CONFLICT (course_code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Módulos do NR35
INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    1,
    'Introdução à NR35',
    'Definição de trabalho em altura e requisitos aplicáveis',
    'nr35-intro.jpg',
    30,
    '{
        "topics": [
            "O que é trabalho em altura",
            "Definições",
            "Aplicação da norma",
            "Responsabilidades"
        ],
        "resources": ["vídeo", "slides", "legislação"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    2,
    'Análise de Riscos',
    'Identificação, avaliação e controle de riscos de queda',
    'nr35-riscos.jpg',
    60,
    '{
        "topics": [
            "Identificação de riscos",
            "Avaliação de risco",
            "Análise Preliminar de Risco",
            "Controles de risco"
        ],
        "resources": ["vídeo", "slides", "formulários"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    3,
    'Planejamento do Trabalho',
    'Planejamento prévio, APR e liberação de trabalhos em altura',
    'nr35-planejamento.jpg',
    60,
    '{
        "topics": [
            "Planejamento prévio",
            "Análise de Risco",
            "Procedimento de trabalho",
            "Liberação de atividades"
        ],
        "resources": ["vídeo", "slides", "modelos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    4,
    'Sistemas de Proteção contra Quedas',
    'Tipos de sistemas e critérios de seleção e uso',
    'nr35-protecao.jpg',
    90,
    '{
        "topics": [
            "Sistemas de posicionamento",
            "Sistemas de contenção",
            "Sistemas de retenção",
            "Sistemas de resgate"
        ],
        "resources": ["vídeo", "slides", "especificações"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    5,
    'Equipamentos de Proteção Individual',
    'EPIs obrigatórios, inspeção e manutenção preventiva',
    'nr35-epis.jpg',
    60,
    '{
        "topics": [
            "Cinturões de segurança",
            "Conectores",
            "Absorvedores de energia",
            "Linhas de vida"
        ],
        "resources": ["vídeo", "slides", "manuais"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    6,
    'Procedimentos de Emergência',
    'Planos de emergência, atendimento e resgate em altura',
    'nr35-resgate.jpg',
    90,
    '{
        "topics": [
            "Plano de emergência",
            "Procedimentos de resgate",
            "Primeiros socorros",
            "Comunicação"
        ],
        "resources": ["vídeo", "slides", "procedimentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    7,
    'Inspeção de Equipamentos',
    'Critérios de verificação de EPIs e ancoragens',
    'nr35-inspecao.jpg',
    45,
    '{
        "topics": [
            "Critérios de inspeção",
            "Formulários de inspeção",
            "Critérios de descarte",
            "Documentação"
        ],
        "resources": ["vídeo", "slides", "checklists"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    8,
    'Técnicas de Acesso',
    'Métodos de acesso seguro em estruturas elevadas',
    'nr35-acesso.jpg',
    60,
    '{
        "topics": [
            "Acesso por escadas",
            "Acesso por sistemas de corda",
            "Acesso por plataformas",
            "Equipamentos de acesso"
        ],
        "resources": ["vídeo", "slides", "procedimentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    9,
    'Montagem de Estruturas',
    'Trabalhos de montagem em altura e segurança',
    'nr35-montagem.jpg',
    45,
    '{
        "topics": [
            "Planejamento de montagem",
            "Sistemas de proteção durante montagem",
            "Materiais e equipamentos",
            "Procedimentos específicos"
        ],
        "resources": ["vídeo", "slides", "procedimentos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

INSERT INTO public.nr_modules (course_id, order_index, title, description, thumbnail_url, duration, content)
SELECT
    c.id,
    10,
    'Responsabilidades e Capacitação',
    'Obrigações legais, reciclagem e registros de treinamento',
    'nr35-responsabilidades.jpg',
    45,
    '{
        "topics": [
            "Obrigações legais",
            "Capacitação inicial",
            "Reciclagem",
            "Documentação obrigatória"
        ],
        "resources": ["vídeo", "slides", "modelos"]
    }'::jsonb
FROM public.nr_courses c WHERE c.course_code = 'NR35'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================

-- Ver todos os cursos
SELECT
    course_code,
    title,
    modules_count,
    duration,
    status
FROM public.nr_courses
ORDER BY course_code;

-- Ver módulos por curso
SELECT
    c.course_code,
    m.order_index,
    m.title,
    m.duration
FROM public.nr_modules m
JOIN public.nr_courses c ON c.id = m.course_id
ORDER BY c.course_code, m.order_index;