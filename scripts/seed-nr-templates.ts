import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = [
  {
    nr_number: 'NR-01',
    title: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
    description: 'Norma que estabelece disposições gerais, campo de aplicação, termos e definições comuns às Normas Regulamentadoras - NR relativas à segurança e saúde no trabalho e as diretrizes e os requisitos para o gerenciamento de riscos ocupacionais e as medidas de prevenção em Segurança e Saúde no Trabalho - SST.',
    slide_count: 8,
    duration_seconds: 480,
    template_config: {
      themeColor: "#1e3a8a",
      fontFamily: "Inter",
      transitionType: "fade",
      avatarEnabled: true,
      avatarPosition: "bottom-right",
      audioEnabled: true,
      subtitlesEnabled: true
    }
  },
  {
    nr_number: 'NR-06',
    title: 'Equipamento de Proteção Individual - EPI',
    description: 'Esta Norma Regulamentadora - NR estabelece os requisitos para a comercialização, a disponibilização, o uso e a fiscalização de Equipamentos de Proteção Individual - EPI, a serem observados em todos os locais de trabalho onde se aplica a legislação trabalhista.',
    slide_count: 10,
    duration_seconds: 600,
    template_config: {
      themeColor: "#047857",
      fontFamily: "Inter",
      transitionType: "slide",
      avatarEnabled: true,
      avatarPosition: "bottom-left",
      audioEnabled: true,
      subtitlesEnabled: true,
      exampleImages: ["epi-capacete.jpg", "epi-luvas.jpg", "epi-oculos.jpg"]
    }
  },
  {
    nr_number: 'NR-12',
    title: 'Segurança no Trabalho em Máquinas e Equipamentos',
    description: 'Define referências técnicas, princípios fundamentais e medidas de proteção para resguardar a saúde e a integridade física dos trabalhadores e estabelece requisitos mínimos para a prevenção de acidentes e doenças do trabalho nas fases de projeto e de utilização de máquinas e equipamentos.',
    slide_count: 12,
    duration_seconds: 720,
    template_config: {
      themeColor: "#dc2626",
      fontFamily: "Inter",
      transitionType: "zoom",
      avatarEnabled: true,
      avatarPosition: "center-bottom",
      audioEnabled: true,
      subtitlesEnabled: true,
      warningLevel: "high"
    }
  }
];

async function seed() {
  console.log('Seeding nr_templates...');
  
  for (const template of templates) {
    const { error } = await supabase
      .from('nr_templates')
      .upsert(template, { onConflict: 'nr_number' });
      
    if (error) {
      console.error(`Error inserting ${template.nr_number}:`, error);
      if (error.message.includes('relation "nr_templates" does not exist')) {
          console.log("Table does not exist. Please run the migration script first.");
      }
    } else {
      console.log(`Inserted/Updated ${template.nr_number}`);
    }
  }
  
  console.log('Done.');
}

seed();
