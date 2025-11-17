/**
 * 🔌 Template Library + Template Engine Integration Examples
 * 
 * Exemplos práticos de integração entre:
 * - VideoTemplateLibrary (gerenciamento de templates)
 * - VideoTemplateEngine (renderização de vídeos)
 * 
 * @module VideoTemplateIntegration
 */

import { VideoTemplateLibrary } from './video/template-library';
import { VideoTemplateEngine, RenderConfig } from './video/template-engine';

// =============================================================================
// EXEMPLO 1: Criar vídeo a partir de template da biblioteca
// =============================================================================

/**
 * Busca um template na biblioteca e cria um vídeo
 */
export async function createVideoFromLibraryTemplate() {
  // 1. Inicializar sistemas
  const library = new VideoTemplateLibrary();
  const engine = new VideoTemplateEngine();

  // 2. Buscar templates de YouTube
  const results = library.search('tutorial', {
    category: 'educational',
    size: 'youtube',
    minRating: 4.0,
  });

  if (results.total === 0) {
    throw new Error('Nenhum template encontrado');
  }

  // 3. Selecionar template
  const libraryTemplate = results.templates[0];

  // 4. Importar template para o engine
  const templateJson = JSON.stringify(libraryTemplate.template);
  const templateId = engine.importTemplate(templateJson);

  if (!templateId) {
    throw new Error('Erro ao importar template para o engine');
  }

  // 5. Preparar dados do vídeo
  const data = {
    title: 'Como Programar em TypeScript',
    subtitle: 'Guia Completo para Iniciantes',
    author: 'Tech Academy',
    date: new Date().toISOString(),
  };

  // 6. Configurar renderização
  const config: RenderConfig = {
    format: 'mp4',
    quality: 'high',
    outputPath: './output/tutorial-typescript.mp4',
    includeAudio: true,
    metadata: {
      libraryTemplateId: libraryTemplate.id,
      libraryTemplateName: libraryTemplate.name,
    },
  };

  // 7. Renderizar vídeo
  const result = await engine.renderTemplate(templateId, data, config);

  // 8. Atualizar estatísticas da biblioteca
  if (result.success) {
    library.incrementTemplateUsage(libraryTemplate.id);
    library.addRating(libraryTemplate.id, 5, 'Template funcionou perfeitamente!');
  }

  return {
    success: result.success,
    videoPath: result.outputPath,
    templateUsed: libraryTemplate.name,
    renderTime: result.renderTime,
  };
}

// =============================================================================
// EXEMPLO 2: Criação em lote (batch) a partir de favoritos
// =============================================================================

/**
 * Cria múltiplos vídeos usando templates favoritos
 */
export async function createVideosFromFavorites(videosData: Array<{ title: string; subtitle: string }>) {
  const library = new VideoTemplateLibrary();
  const engine = new VideoTemplateEngine();

  // 1. Obter templates favoritos
  const favorites = library.getFavorites();

  if (favorites.length === 0) {
    throw new Error('Nenhum template favorito encontrado');
  }

  // 2. Processar cada vídeo
  const results = [];

  for (let i = 0; i < videosData.length; i++) {
    const videoData = videosData[i];
    const libraryTemplate = favorites[i % favorites.length]; // Rotação de templates

    // Importar template
    const templateJson = JSON.stringify(libraryTemplate.template);
    const templateId = engine.importTemplate(templateJson);

    if (!templateId) continue;

    // Renderizar
    const config: RenderConfig = {
      format: 'mp4',
      quality: 'medium',
      outputPath: `./output/batch-video-${i + 1}.mp4`,
      includeAudio: true,
    };

    const result = await engine.renderTemplate(templateId, videoData, config);

    if (result.success) {
      library.incrementTemplateUsage(libraryTemplate.id);
      results.push({
        index: i + 1,
        title: videoData.title,
        template: libraryTemplate.name,
        outputPath: result.outputPath,
      });
    }
  }

  return {
    totalProcessed: results.length,
    videos: results,
  };
}

// =============================================================================
// EXEMPLO 3: Recomendação inteligente de templates
// =============================================================================

/**
 * Encontra e usa o melhor template para determinado tipo de vídeo
 */
export async function createVideoWithRecommendation(
  videoType: 'tutorial' | 'promo' | 'social' | 'corporate',
  data: Record<string, unknown>
) {
  const library = new VideoTemplateLibrary();
  const engine = new VideoTemplateEngine();

  // 1. Mapear tipo para filtros
  const filterMap = {
    tutorial: { category: 'educational', tags: ['tutorial', 'aula'] },
    promo: { category: 'promotion', featured: true },
    social: { size: 'instagram', category: 'social' },
    corporate: { category: 'corporate', minRating: 4.5 },
  };

  const filters = filterMap[videoType];

  // 2. Buscar templates recomendados
  const results = library.search('', filters);

  if (results.total === 0) {
    throw new Error(`Nenhum template recomendado para ${videoType}`);
  }

  // 3. Selecionar template com maior rating
  const bestTemplate = results.templates.reduce((best, current) =>
    current.averageRating > best.averageRating ? current : best
  );

  // 4. Criar vídeo
  const templateJson = JSON.stringify(bestTemplate.template);
  const templateId = engine.importTemplate(templateJson);

  if (!templateId) {
    throw new Error('Erro ao importar template recomendado');
  }

  const config: RenderConfig = {
    format: 'mp4',
    quality: 'high',
    outputPath: `./output/${videoType}-video.mp4`,
    includeAudio: true,
  };

  const result = await engine.renderTemplate(templateId, data, config);

  if (result.success) {
    library.incrementTemplateUsage(bestTemplate.id);
  }

  return {
    success: result.success,
    recommendedTemplate: {
      name: bestTemplate.name,
      category: bestTemplate.category,
      rating: bestTemplate.averageRating,
      usageCount: bestTemplate.usageCount,
    },
    outputPath: result.outputPath,
  };
}

// =============================================================================
// EXEMPLO 4: Workflow completo com analytics
// =============================================================================

/**
 * Workflow completo: busca, criação, análise e backup
 */
export async function completeVideoCreationWorkflow() {
  const library = new VideoTemplateLibrary();
  const engine = new VideoTemplateEngine();

  console.log('📊 Iniciando workflow completo...\n');

  // PASSO 1: Análise da biblioteca
  console.log('1️⃣ Analisando biblioteca de templates...');
  const stats = library.getAnalytics();
  console.log(`   - Total de templates: ${stats.totalTemplates}`);
  console.log(`   - Templates mais usados: ${stats.topTemplates.slice(0, 3).map(t => t.name).join(', ')}`);
  console.log(`   - Categorias: ${stats.categoriesCoverage.map(c => c.category).join(', ')}\n`);

  // PASSO 2: Seleção inteligente
  console.log('2️⃣ Selecionando template com base em histórico...');
  const topTemplate = stats.topTemplates[0];
  const libraryTemplate = library.getTemplateById(topTemplate.id);

  if (!libraryTemplate) {
    throw new Error('Template não encontrado');
  }

  console.log(`   ✓ Selecionado: "${libraryTemplate.name}" (${libraryTemplate.usageCount} usos)\n`);

  // PASSO 3: Criação do vídeo
  console.log('3️⃣ Criando vídeo...');
  const templateJson = JSON.stringify(libraryTemplate.template);
  const templateId = engine.importTemplate(templateJson);

  if (!templateId) {
    throw new Error('Erro ao importar template');
  }

  const videoData = {
    title: 'Vídeo de Demonstração',
    subtitle: 'Criado com workflow automatizado',
    author: 'Sistema IA de Vídeos',
    date: new Date().toLocaleDateString('pt-BR'),
  };

  const config: RenderConfig = {
    format: 'mp4',
    quality: 'ultra',
    outputPath: './output/workflow-demo.mp4',
    includeAudio: true,
    metadata: {
      workflow: 'complete',
      libraryTemplate: libraryTemplate.id,
      timestamp: Date.now(),
    },
  };

  const result = await engine.renderTemplate(templateId, videoData, config);

  if (!result.success) {
    throw new Error(`Erro ao renderizar: ${result.error}`);
  }

  console.log(`   ✓ Vídeo criado: ${result.outputPath}\n`);

  // PASSO 4: Atualização de métricas
  console.log('4️⃣ Atualizando métricas...');
  library.incrementTemplateUsage(libraryTemplate.id);
  library.addRating(libraryTemplate.id, 5, 'Workflow completo executado com sucesso');
  library.markAsUsed(libraryTemplate.id);
  console.log('   ✓ Métricas atualizadas\n');

  // PASSO 5: Backup
  console.log('5️⃣ Criando backup da biblioteca...');
  const backup = library.exportLibrary();
  console.log(`   ✓ Backup criado (${backup.totalTemplates} templates)\n`);

  // PASSO 6: Relatório final
  const finalStats = library.getAnalytics();

  return {
    success: true,
    video: {
      path: result.outputPath,
      renderTime: result.renderTime,
      size: result.outputSize,
    },
    template: {
      id: libraryTemplate.id,
      name: libraryTemplate.name,
      category: libraryTemplate.category,
      newUsageCount: libraryTemplate.usageCount + 1,
    },
    analytics: {
      totalTemplates: finalStats.totalTemplates,
      totalUsage: finalStats.totalUsage,
      averageRating: finalStats.averageRating,
    },
    backup: {
      timestamp: backup.exportedAt,
      templatesCount: backup.totalTemplates,
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Valida se um template da biblioteca é compatível com o engine
 */
export function validateTemplateCompatibility(libraryTemplate: any): boolean {
  try {
    const template = libraryTemplate.template;

    // Verificações básicas
    if (!template.id || !template.name) return false;
    if (!template.width || !template.height) return false;
    if (!template.fps || !template.duration) return false;
    if (!Array.isArray(template.placeholders)) return false;

    // Template é válido
    return true;
  } catch {
    return false;
  }
}

/**
 * Prepara configuração padrão de renderização
 */
export function createDefaultRenderConfig(outputName: string): RenderConfig {
  return {
    format: 'mp4',
    quality: 'high',
    outputPath: `./output/${outputName}.mp4`,
    includeAudio: true,
    metadata: {
      createdBy: 'Video Template System',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Busca templates com filtros comuns pré-configurados
 */
export function quickSearch(
  library: VideoTemplateLibrary,
  preset: 'youtube' | 'instagram' | 'education' | 'business' | 'popular'
) {
  const presets = {
    youtube: { size: 'youtube', minRating: 4.0 },
    instagram: { size: 'instagram', featured: true },
    education: { category: 'educational', minRating: 4.5 },
    business: { category: 'corporate', featured: true },
    popular: { minUsage: 10, sortBy: 'usage' as const },
  };

  return library.search('', presets[preset]);
}
