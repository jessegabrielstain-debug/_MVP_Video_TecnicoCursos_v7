

/**
 * 🧠 Enhanced PPTX Analysis API
 * Análise Inteligente com IA Especializada em NRs
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
// Função simples para gerar UUID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Simulação de análise inteligente
interface PPTXAnalysisResult {
  slides: number;
  duration: number;
  content: {
    title: string;
    content: string;
    notes: string;
    images: number;
  }[];
  recommendations: {
    nr: string;
    compliance: number;
    suggestions: string[];
  };
  estimatedVideoTime: number;
  complexity: 'Básico' | 'Intermediário' | 'Avançado';
}

// Base de conhecimento NR simulada
const NR_KNOWLEDGE_BASE = {
  'NR-06': {
    keywords: ['epi', 'equipamento', 'proteção', 'individual', 'capacete', 'luva', 'bota', 'óculos'],
    suggestions: [
      'Adicionar demonstração prática do uso correto de EPIs',
      'Incluir cenário 3D de canteiro de obras',
      'Implementar quiz sobre tipos de EPIs por atividade',
      'Usar avatar demonstrando colocação de equipamentos'
    ]
  },
  'NR-10': {
    keywords: ['elétrica', 'eletricidade', 'voltagem', 'tensão', 'circuito', 'instalação', 'energia'],
    suggestions: [
      'Incluir simulação 3D de riscos elétricos',
      'Adicionar cenários de acidentes e prevenção',
      'Implementar demonstração de procedimentos de segurança',
      'Usar efeitos visuais para mostrar campos elétricos'
    ]
  },
  'NR-12': {
    keywords: ['máquina', 'equipamento', 'proteção', 'dispositivo', 'operação', 'manutenção'],
    suggestions: [
      'Demonstração 3D de dispositivos de segurança',
      'Cenários práticos de operação segura',
      'Quiz interativo sobre procedimentos',
      'Avatar demonstrando técnicas corretas'
    ]
  },
  'NR-17': {
    keywords: ['ergonomia', 'postura', 'movimento', 'repetitivo', 'mobiliário', 'conforto'],
    suggestions: [
      'Demonstração de posturas corretas e incorretas',
      'Simulação 3D de ambiente ergonômico',
      'Exercícios interativos de alongamento',
      'Análise comparativa de posições'
    ]
  },
  'NR-35': {
    keywords: ['altura', 'andaime', 'cinto', 'queda', 'proteção', 'coletiva', 'individual'],
    suggestions: [
      'Cenário 3D imersivo de trabalho em altura',
      'Demonstração de uso de equipamentos',
      'Simulação de procedimentos de resgate',
      'Quiz sobre análise de riscos'
    ]
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });
    }

    // Criar diretório temporário se não existir
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Salvar arquivo temporariamente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `temp_${generateId()}_${file.name}`;
    const filePath = join(tempDir, fileName);
    
    await writeFile(filePath, buffer);

    try {
      // Análise do conteúdo (simulada)
      const analysis = await analyzePresentation(file.name, buffer);
      
      // Limpar arquivo temporário
      await unlink(filePath);
      
      return NextResponse.json(analysis);
    } catch (error) {
      // Limpar arquivo em caso de erro
      try {
        await unlink(filePath);
      } catch {}
      
      throw error;
    }
  } catch (error) {
    console.error('Erro na análise PPTX:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

async function analyzePresentation(fileName: string, buffer: Buffer): Promise<PPTXAnalysisResult> {
  // Simular análise inteligente
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const slideCount = Math.floor(Math.random() * 25) + 15; // 15-40 slides
  const fileNameLower = fileName.toLowerCase();
  
  // Detectar NR baseado no nome do arquivo e conteúdo simulado
  let detectedNR = 'NR-06'; // padrão
  let nrScore = 0.7;
  
  for (const [nr, data] of Object.entries(NR_KNOWLEDGE_BASE)) {
    const matches = data.keywords.filter(keyword => 
      fileNameLower.includes(keyword)
    ).length;
    
    if (matches > 0) {
      const score = matches / data.keywords.length;
      if (score > nrScore) {
        detectedNR = nr;
        nrScore = score;
      }
    }
  }
  
  const compliance = Math.floor((nrScore * 30) + 70); // 70-100%
  const complexity = slideCount > 30 ? 'Avançado' : 
                    slideCount > 20 ? 'Intermediário' : 'Básico';
  
  return {
    slides: slideCount,
    duration: slideCount * 35, // 35 segundos por slide
    content: generateMockSlides(slideCount),
    recommendations: {
      nr: detectedNR,
      compliance,
      suggestions: NR_KNOWLEDGE_BASE[detectedNR as keyof typeof NR_KNOWLEDGE_BASE]?.suggestions || []
    },
    estimatedVideoTime: Math.ceil(slideCount * 1.8), // 1.8 minutos por slide
    complexity
  };
}

function generateMockSlides(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Slide ${i + 1}: ${generateSlideTitle()}`,
    content: 'Conteúdo educativo detalhado sobre normas de segurança...',
    notes: 'Notas do palestrante para narração e explicações adicionais.',
    images: Math.floor(Math.random() * 4) // 0-3 imagens
  }));
}

function generateSlideTitle(): string {
  const titles = [
    'Introdução à Segurança',
    'Conceitos Fundamentais',
    'Identificação de Riscos',
    'Procedimentos de Segurança',
    'Equipamentos de Proteção',
    'Casos Práticos',
    'Legislação Aplicável',
    'Boas Práticas',
    'Prevenção de Acidentes',
    'Responsabilidades'
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}


