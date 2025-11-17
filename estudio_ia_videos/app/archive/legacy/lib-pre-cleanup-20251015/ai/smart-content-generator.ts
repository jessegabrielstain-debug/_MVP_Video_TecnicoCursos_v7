
/**
 * SPRINT 34 - SMART CONTENT GENERATION
 * AI-powered content generation for training materials
 */

export interface ContentGenerationRequest {
  topic: string;
  nr?: string;
  targetAudience: string;
  duration?: number; // minutes
  language?: string;
  tone?: 'formal' | 'conversational' | 'technical';
}

export interface GeneratedContent {
  slides: GeneratedSlide[];
  script: string;
  duration: number;
  metadata: {
    wordCount: number;
    readingLevel: string;
    keyPoints: string[];
  };
}

export interface GeneratedSlide {
  title: string;
  content: string[];
  speakerNotes: string;
  suggestedVisuals: string[];
  duration: number;
}

/**
 * Generate complete training content using AI
 */
export async function generateTrainingContent(
  request: ContentGenerationRequest
): Promise<GeneratedContent> {
  // In production, this would call GPT-4 or similar
  // For now, we'll use template-based generation

  const slideCount = Math.ceil((request.duration || 10) / 2); // ~2 min per slide
  const slides: GeneratedSlide[] = [];

  // Generate introduction
  slides.push({
    title: `Introdução: ${request.topic}`,
    content: [
      `Bem-vindo ao treinamento sobre ${request.topic}`,
      'Objetivos do treinamento',
      'O que você irá aprender',
    ],
    speakerNotes: `Apresentar o tema ${request.topic} e criar expectativa positiva para o treinamento.`,
    suggestedVisuals: ['logo empresa', 'imagem representativa do tema'],
    duration: 120,
  });

  // Generate main content slides
  const mainTopics = await generateMainTopics(request.topic, slideCount - 2);
  
  for (const topic of mainTopics) {
    slides.push({
      title: topic.title,
      content: topic.points,
      speakerNotes: topic.notes,
      suggestedVisuals: topic.visuals,
      duration: 120,
    });
  }

  // Generate conclusion
  slides.push({
    title: 'Conclusão e Próximos Passos',
    content: [
      'Revisão dos pontos principais',
      'Aplicação prática no dia a dia',
      'Certificação e avaliação',
    ],
    speakerNotes: 'Reforçar os principais aprendizados e motivar a aplicação prática.',
    suggestedVisuals: ['certificado', 'checklist'],
    duration: 120,
  });

  // Generate full script
  const script = slides
    .map((slide, index) => {
      return `Slide ${index + 1}: ${slide.title}\n\n${slide.speakerNotes}\n\n`;
    })
    .join('---\n\n');

  return {
    slides,
    script,
    duration: slides.reduce((sum, slide) => sum + slide.duration, 0),
    metadata: {
      wordCount: script.split(' ').length,
      readingLevel: 'intermediário',
      keyPoints: slides.slice(1, -1).map((s) => s.title),
    },
  };
}

/**
 * Generate summary of existing content
 */
export async function generateContentSummary(content: string): Promise<string> {
  // In production, this would use GPT-4 for summarization
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const keyPoints = sentences.slice(0, 3).map((s) => s.trim());
  
  return keyPoints.join('. ') + '.';
}

/**
 * Generate script from bullet points
 */
export async function generateScriptFromPoints(points: string[]): Promise<string> {
  // In production, this would use GPT-4 to expand points into natural speech
  return points
    .map((point, index) => {
      if (index === 0) {
        return `Vamos falar sobre ${point.toLowerCase()}. `;
      } else if (index === points.length - 1) {
        return `E por fim, ${point.toLowerCase()}. `;
      } else {
        return `Em seguida, ${point.toLowerCase()}. `;
      }
    })
    .join('');
}

/**
 * Enhance existing content with AI suggestions
 */
export async function enhanceContent(
  content: string,
  suggestions: string[]
): Promise<string> {
  // Add suggestions as additional paragraphs
  const enhanced = content + '\n\n' + suggestions.join('\n\n');
  return enhanced;
}

// Helper functions
async function generateMainTopics(
  topic: string,
  count: number
): Promise<Array<{
  title: string;
  points: string[];
  notes: string;
  visuals: string[];
}>> {
  // Topic-specific content generation
  const nrTopics: Record<string, unknown> = {
    NR12: [
      {
        title: 'Identificação de Riscos',
        points: [
          'Tipos de riscos em máquinas',
          'Zonas de perigo',
          'Pontos de esmagamento e corte',
        ],
        notes: 'Explicar como identificar cada tipo de risco com exemplos práticos.',
        visuals: ['diagrama máquina', 'sinalização perigo'],
      },
      {
        title: 'Dispositivos de Proteção',
        points: [
          'Proteções fixas e móveis',
          'Dispositivos de intertravamento',
          'Comandos bimanuais',
        ],
        notes: 'Demonstrar o funcionamento de cada dispositivo de proteção.',
        visuals: ['foto proteções', 'esquema dispositivos'],
      },
    ],
    NR33: [
      {
        title: 'Caracterização de Espaços Confinados',
        points: [
          'Definição técnica',
          'Exemplos comuns na indústria',
          'Critérios de identificação',
        ],
        notes: 'Apresentar casos reais de espaços confinados no ambiente de trabalho.',
        visuals: ['fotos espaços confinados', 'diagrama ventilação'],
      },
      {
        title: 'Procedimentos de Entrada',
        points: [
          'Permissão de Entrada e Trabalho (PET)',
          'Testes atmosféricos',
          'Equipamentos obrigatórios',
        ],
        notes: 'Detalhar cada etapa do procedimento de entrada segura.',
        visuals: ['formulário PET', 'medidor gases'],
      },
    ],
  };

  // Return NR-specific topics or generic ones
  const nr = topic.match(/NR\d+/i)?.[0].toUpperCase();
  const topics = nr && nrTopics[nr] ? nrTopics[nr] : generateGenericTopics(topic, count);

  return topics.slice(0, count);
}

function generateGenericTopics(
  topic: string,
  count: number
): Array<{
  title: string;
  points: string[];
  notes: string;
  visuals: string[];
}> {
  const genericTemplates = [
    {
      title: 'Conceitos Fundamentais',
      points: [`Definição de ${topic}`, 'Importância e aplicações', 'Legislação aplicável'],
      notes: `Apresentar os conceitos básicos de ${topic}.`,
      visuals: ['infográfico conceitos'],
    },
    {
      title: 'Boas Práticas',
      points: [
        'Procedimentos recomendados',
        'Erros comuns a evitar',
        'Checklist de verificação',
      ],
      notes: 'Demonstrar as melhores práticas com exemplos.',
      visuals: ['checklist', 'comparação certo/errado'],
    },
    {
      title: 'Casos Práticos',
      points: ['Estudo de caso real', 'Análise de situação', 'Lições aprendidas'],
      notes: 'Analisar um caso real relacionado ao tema.',
      visuals: ['fotos caso real', 'gráfico análise'],
    },
  ];

  return genericTemplates.slice(0, count);
}
