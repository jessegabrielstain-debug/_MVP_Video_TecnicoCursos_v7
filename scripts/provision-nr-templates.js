#!/usr/bin/env node

/**
 * Provisiona templates NR usando Supabase JavaScript Client
 * Alternativa quando PostgreSQL direct connection falha
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🚀 PROVISIONING NR TEMPLATES - VIA SUPABASE CLIENT');
console.log('═══════════════════════════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 10 Templates NR
const templates = [
    {
        nr_number: 'NR-01',
        title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
        description: 'Estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras.',
        slide_count: 8,
        duration_seconds: 480,
        template_config: {
            primary_color: '#2563EB',
            secondary_color: '#3B82F6',
            font_family: 'Inter',
            topics: ['Disposições Gerais', 'Campo de Aplicação', 'Termos e Definições', 'Direitos e Deveres', 'GRO', 'Equipamentos', 'Capacitação', 'Documentação']
        }
    },
    {
        nr_number: 'NR-05',
        title: 'Comissão Interna de Prevenção de Acidentes (CIPA)',
        description: 'Define as diretrizes para a constituição e funcionamento da CIPA.',
        slide_count: 7,
        duration_seconds: 420,
        template_config: {
            primary_color: '#06B6D4',
            secondary_color: '#0891B2',
            font_family: 'Inter',
            topics: ['Constituição', 'Atribuições', 'Processo Eleitoral', 'Treinamento', 'Reuniões', 'SIPAT', 'Documentação']
        }
    },
    {
        nr_number: 'NR-06',
        title: 'Equipamentos de Proteção Individual (EPI)',
        description: 'Estabelece as regras sobre fornecimento, uso e manutenção de EPIs.',
        slide_count: 10,
        duration_seconds: 600,
        template_config: {
            primary_color: '#10B981',
            secondary_color: '#059669',
            font_family: 'Inter',
            topics: ['Obrigações do Empregador', 'Obrigações do Empregado', 'CA', 'Fornecimento', 'Treinamento', 'Higienização', 'Tipos de EPI', 'Fiscalização', 'Penalidades', 'Documentação']
        }
    },
    {
        nr_number: 'NR-07',
        title: 'Programa de Controle Médico de Saúde Ocupacional (PCMSO)',
        description: 'Define as diretrizes para elaboração e implementação do PCMSO.',
        slide_count: 9,
        duration_seconds: 540,
        template_config: {
            primary_color: '#8B5CF6',
            secondary_color: '#7C3AED',
            font_family: 'Inter',
            topics: ['Objetivos', 'Responsabilidades', 'Exames', 'ASO', 'Riscos', 'Afastamentos', 'Prontuários', 'Relatórios', 'Integração']
        }
    },
    {
        nr_number: 'NR-09',
        title: 'Avaliação e Controle das Exposições Ocupacionais',
        description: 'Define os requisitos para avaliação e controle de agentes nocivos.',
        slide_count: 11,
        duration_seconds: 660,
        template_config: {
            primary_color: '#F97316',
            secondary_color: '#EA580C',
            font_family: 'Inter',
            topics: ['Reconhecimento', 'Avaliação', 'Agentes Físicos', 'Agentes Químicos', 'Agentes Biológicos', 'Limites de Exposição', 'Medidas de Controle', 'Monitoramento', 'Registros', 'Integração GRO', 'Documentação']
        }
    },
    {
        nr_number: 'NR-10',
        title: 'Segurança em Instalações e Serviços em Eletricidade',
        description: 'Estabelece as condições mínimas para segurança em eletricidade.',
        slide_count: 13,
        duration_seconds: 780,
        template_config: {
            primary_color: '#EAB308',
            secondary_color: '#CA8A04',
            font_family: 'Inter',
            topics: ['Medidas de Controle', 'Prontuário', 'Projetos', 'Procedimentos', 'Equipamentos', 'Treinamento Básico', 'Treinamento SEP', 'Habilitação', 'Desenergização', 'Aterramento', 'Sinalizações', 'Trabalho em Altura', 'EPI']
        }
    },
    {
        nr_number: 'NR-12',
        title: 'Segurança no Trabalho em Máquinas e Equipamentos',
        description: 'Define as medidas de proteção para máquinas e equipamentos.',
        slide_count: 12,
        duration_seconds: 720,
        template_config: {
            primary_color: '#DC2626',
            secondary_color: '#B91C1C',
            font_family: 'Inter',
            topics: ['Arranjo Físico', 'Proteções', 'Dispositivos de Segurança', 'Operação', 'Manutenção', 'Inspeção', 'Capacitação', 'Manual', 'Sinalização', 'Anexo I', 'Anexo XII', 'Documentação']
        }
    },
    {
        nr_number: 'NR-17',
        title: 'Ergonomia',
        description: 'Estabelece parâmetros para adaptação das condições de trabalho.',
        slide_count: 8,
        duration_seconds: 480,
        template_config: {
            primary_color: '#14B8A6',
            secondary_color: '#0D9488',
            font_family: 'Inter',
            topics: ['Análise Ergonômica', 'Mobiliário', 'Iluminação', 'Organização', 'Transporte de Cargas', 'Condições Ambientais', 'Trabalho com Computadores', 'Documentação']
        }
    },
    {
        nr_number: 'NR-18',
        title: 'Condições de Segurança e Saúde no Trabalho na Indústria da Construção',
        description: 'Define as diretrizes de segurança para construção civil.',
        slide_count: 14,
        duration_seconds: 840,
        template_config: {
            primary_color: '#F59E0B',
            secondary_color: '#D97706',
            font_family: 'Inter',
            topics: ['PCMAT', 'SESMT', 'CIPA', 'Áreas de Vivência', 'Escavações', 'Andaimes', 'Plataformas', 'Guindastes', 'Transporte Vertical', 'Proteção Contra Quedas', 'Máquinas', 'Equipamentos', 'Treinamento', 'Documentação']
        }
    },
    {
        nr_number: 'NR-35',
        title: 'Trabalho em Altura',
        description: 'Estabelece os requisitos mínimos para trabalho em altura.',
        slide_count: 10,
        duration_seconds: 600,
        template_config: {
            primary_color: '#EF4444',
            secondary_color: '#DC2626',
            font_family: 'Inter',
            topics: ['Requisitos Mínimos', 'Responsabilidades', 'Capacitação', 'Planejamento', 'Análise de Risco', 'Sistemas de Proteção', 'EPI', 'Emergência', 'PT', 'Documentação']
        }
    }
];

async function provisionTemplates() {
    console.log('📋 Provisionando 10 templates NR...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
        try {
            const { data, error } = await supabase
                .from('nr_templates')
                .upsert(template, { 
                    onConflict: 'nr_number',
                    ignoreDuplicates: false 
                });

            if (error) {
                // Se a tabela não existir, o erro será aqui
                if (error.code === '42P01') { // relation does not exist
                    console.log(`⚠️ Tabela 'nr_templates' não existe. Criando...`);
                    console.log(`⚠️ Por favor, execute primeiro:`);
                    console.log(`   node scripts/execute-supabase-sql.js database-schema.sql\n`);
                    process.exit(1);
                }
                console.error(`❌ ${template.nr_number}: ${error.message}`);
                errorCount++;
            } else {
                console.log(`✅ ${template.nr_number} - ${template.title}`);
                successCount++;
            }
        } catch (err) {
            console.error(`❌ ${template.nr_number}: ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`📊 RESULTADO: ${successCount} sucesso, ${errorCount} erros`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (errorCount === 0) {
        console.log('✅ Todos os templates foram provisionados com sucesso!');
        console.log('\n🚀 Próximos passos:');
        console.log('   1. Acessar: http://localhost:3000/dashboard/admin/nr-templates');
        console.log('   2. Testar API: curl http://localhost:3000/api/nr-templates\n');
        process.exit(0);
    } else {
        console.log('⚠️ Alguns templates falharam. Verifique os erros acima.\n');
        process.exit(1);
    }
}

provisionTemplates().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
