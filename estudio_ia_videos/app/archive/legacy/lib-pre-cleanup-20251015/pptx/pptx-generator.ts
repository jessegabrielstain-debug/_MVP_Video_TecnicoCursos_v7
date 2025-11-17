/**
 * 📄 Gerador PPTX - Sistema de Criação de Apresentações
 * Criação automatizada usando PptxGenJS com templates
 */

import PptxGenJS from 'pptxgenjs';
import {
  PPTXDocument,
  PPTXSlide,
  PPTXElement,
  PPTXTemplate,
  PPTXTemplateVariable,
  PPTXToVideoSettings,
  PPTXTheme,
  PPTXProcessingSettings
} from '../../types/pptx-types';

export interface PPTXGenerationOptions {
  template?: PPTXTemplate;
  theme?: PPTXTheme;
  variables?: Record<string, unknown>;
  settings?: PPTXProcessingSettings;
  branding?: {
    logo?: string;
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
}

export class PPTXGenerator {
  private pptx: PptxGenJS;
  private options: PPTXGenerationOptions;

  constructor(options: PPTXGenerationOptions = {}) {
    this.pptx = new PptxGenJS();
    this.options = options;
    this.initializePresentation();
  }

  /**
   * Inicializar configurações da apresentação
   */
  private initializePresentation(): void {
    // Configurar layout padrão
    this.pptx.defineLayout({
      name: 'LAYOUT_16x9',
      width: 10,
      height: 5.625
    });

    // Configurar propriedades do documento
    this.pptx.author = 'Estúdio IA Vídeos';
    this.pptx.company = 'Estúdio IA';
    this.pptx.revision = '1';
    this.pptx.subject = 'Apresentação Gerada Automaticamente';
    this.pptx.title = 'Nova Apresentação';

    // Aplicar tema se fornecido
    if (this.options.theme) {
      this.applyTheme(this.options.theme);
    }
  }

  /**
   * Gerar apresentação a partir de dados estruturados
   */
  async generateFromData(data: {
    title: string;
    slides: Array<{
      type: 'title' | 'content' | 'image' | 'chart' | 'comparison';
      title?: string;
      content?: string | string[];
      image?: string;
      notes?: string;
    }>;
  }): Promise<Buffer> {
    
    console.log('[PPTX Generator] Generating presentation:', data.title);
    
    // Configurar título da apresentação
    this.pptx.title = data.title;

    // Gerar slides baseados nos dados
    for (let i = 0; i < data.slides.length; i++) {
      const slideData = data.slides[i];
      await this.generateSlide(slideData, i + 1);
    }

    // Gerar arquivo
    const buffer = (await this.pptx.write({ outputType: 'nodebuffer' })) as unknown as Buffer;
    console.log(`[PPTX Generator] Generated ${data.slides.length} slides successfully`);
    
    return buffer;
  }

  /**
   * Gerar apresentação a partir de template
   */
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<Buffer> {
    
    if (!this.options.template) {
      throw new Error('Template não fornecido');
    }

    const template = this.options.template;
    console.log(`[PPTX Generator] Using template: ${template.name}`);

    // Aplicar variáveis do template
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.defaultValue;
      if (variable.required && !value) {
        throw new Error(`Variável obrigatória não fornecida: ${variable.name}`);
      }
    }

    // Gerar slides do template
    for (let i = 0; i < template.sampleSlides.length; i++) {
      const slide = template.sampleSlides[i];
      await this.generateSlideFromTemplate(slide, variables, i + 1);
    }

    return (await this.pptx.write({ outputType: 'nodebuffer' })) as unknown as Buffer;
  }

  /**
   * Gerar slide individual
   */
  private async generateSlide(slideData: any, slideNumber: number): Promise<void> {
    const slide = this.pptx.addSlide();

    switch (slideData.type) {
      case 'title':
        await this.generateTitleSlide(slide, slideData);
        break;
      case 'content':
        await this.generateContentSlide(slide, slideData);
        break;
      case 'image':
        await this.generateImageSlide(slide, slideData);
        break;
      case 'chart':
        await this.generateChartSlide(slide, slideData);
        break;
      case 'comparison':
        await this.generateComparisonSlide(slide, slideData);
        break;
      default:
        await this.generateContentSlide(slide, slideData);
    }

    // Adicionar número do slide (desabilitado temporariamente)
    // if (this.options?.settings?.showSlideNumbers) {
    //   slide.addText(`${slideNumber}`, {
    //     x: 9.5,
    //     y: 5,
    //     w: 0.5,
    //     h: 0.3,
    //     fontSize: 10,
    //     color: '666666',
    //     align: 'right'
    //   });
    // }

    // Adicionar notas se fornecidas
    if (slideData.notes) {
      slide.addNotes(slideData.notes);
    }
  }

  /**
   * Gerar slide de título
   */
  private async generateTitleSlide(slide: any, data: any): Promise<void> {
    // Título principal
    slide.addText(data.title || 'Título da Apresentação', {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: this.getThemeColor('accent1'),
      align: 'center'
    });

    // Subtítulo
    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 1,
        y: 3,
        w: 8,
        h: 1,
        fontSize: 24,
        color: this.getThemeColor('text1'),
        align: 'center'
      });
    }

    // Logo da empresa se configurado
    if (this.options.branding?.logo) {
      slide.addImage({
        path: this.options.branding.logo,
        x: 8.5,
        y: 4.5,
        w: 1,
        h: 0.5
      });
    }

    // Data atual
    const currentDate = new Date().toLocaleDateString('pt-BR');
    slide.addText(currentDate, {
      x: 1,
      y: 4.5,
      w: 8,
      h: 0.5,
      fontSize: 14,
      color: this.getThemeColor('text2'),
      align: 'center'
    });
  }

  /**
   * Gerar slide de conteúdo
   */
  private async generateContentSlide(slide: any, data: any): Promise<void> {
    // Título do slide
    if (data.title) {
      slide.addText(data.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 32,
        bold: true,
        color: this.getThemeColor('accent1')
      });
    }

    // Conteúdo
    let content = '';
    if (Array.isArray(data.content)) {
      content = data.content.map(item => `• ${item}`).join('\n');
    } else {
      content = data.content || '';
    }

    slide.addText(content, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 3.5,
      fontSize: 18,
      color: this.getThemeColor('text1'),
      valign: 'top'
    });
  }

  /**
   * Gerar slide com imagem
   */
  private async generateImageSlide(slide: any, data: any): Promise<void> {
    // Título
    if (data.title) {
      slide.addText(data.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: this.getThemeColor('accent1')
      });
    }

    // Imagem
    if (data.image) {
      slide.addImage({
        path: data.image,
        x: 1,
        y: 1.5,
        w: 8,
        h: 3
      });
    }

    // Legenda da imagem
    if (data.caption) {
      slide.addText(data.caption, {
        x: 1,
        y: 4.7,
        w: 8,
        h: 0.5,
        fontSize: 14,
        color: this.getThemeColor('text2'),
        align: 'center',
        italic: true
      });
    }
  }

  /**
   * Gerar slide com gráfico
   */
  private async generateChartSlide(slide: any, data: any): Promise<void> {
    // Título
    if (data.title) {
      slide.addText(data.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: this.getThemeColor('accent1')
      });
    }

    // Gráfico simples
    if (data.chartData) {
      slide.addChart(this.pptx.ChartType.bar, data.chartData, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 3,
        showTitle: false,
        showLegend: true,
        legendPos: 'r'
      });
    }
  }

  /**
   * Gerar slide de comparação
   */
  private async generateComparisonSlide(slide: any, data: any): Promise<void> {
    // Título
    if (data.title) {
      slide.addText(data.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: this.getThemeColor('accent1')
      });
    }

    // Coluna esquerda
    if (data.leftColumn) {
      slide.addText(data.leftColumn.title || 'Antes', {
        x: 0.5,
        y: 1.5,
        w: 4,
        h: 0.5,
        fontSize: 20,
        bold: true,
        color: this.getThemeColor('accent2'),
        align: 'center'
      });

      slide.addText(data.leftColumn.content || '', {
        x: 0.5,
        y: 2,
        w: 4,
        h: 2.5,
        fontSize: 16,
        color: this.getThemeColor('text1'),
        valign: 'top'
      });
    }

    // Coluna direita
    if (data.rightColumn) {
      slide.addText(data.rightColumn.title || 'Depois', {
        x: 5.5,
        y: 1.5,
        w: 4,
        h: 0.5,
        fontSize: 20,
        bold: true,
        color: this.getThemeColor('accent1'),
        align: 'center'
      });

      slide.addText(data.rightColumn.content || '', {
        x: 5.5,
        y: 2,
        w: 4,
        h: 2.5,
        fontSize: 16,
        color: this.getThemeColor('text1'),
        valign: 'top'
      });
    }

    // Divisória central
    slide.addShape(this.pptx.ShapeType.line, {
      x: 5,
      y: 1.5,
      w: 0,
      h: 3,
      line: { color: this.getThemeColor('accent3'), width: 2 }
    });
  }

  /**
   * Gerar slide a partir de template
   */
  private async generateSlideFromTemplate(
    templateSlide: PPTXSlide,
    variables: Record<string, unknown>,
    slideNumber: number
  ): Promise<void> {
    const slide = this.pptx.addSlide();

    // Processar elementos do template
    for (const element of templateSlide.content) {
      await this.generateElementFromTemplate(slide, element, variables);
    }
  }

  /**
   * Gerar elemento a partir de template
   */
  private async generateElementFromTemplate(
    slide: any,
    element: PPTXElement,
    variables: Record<string, unknown>
  ): Promise<void> {
    let content = element.content;

    // Substituir variáveis no conteúdo
    if (typeof content === 'string') {
      content = this.replaceVariables(content, variables);
    }

    // Configurar posição
    const position = {
      x: element.position.x,
      y: element.position.y,
      w: element.position.w,
      h: element.position.h
    };

    // Configurar estilo
    const style = {
      fontSize: element.style.fontSize || 16,
      bold: element.style.bold || false,
      italic: element.style.italic || false,
      color: element.style.fontColor || this.getThemeColor('text1'),
      align: element.style.alignment || 'left'
    };

    // Adicionar elemento baseado no tipo
    switch (element.type) {
      case 'text':
        slide.addText(content, { ...position, ...style });
        break;
      case 'image':
        if (typeof content === 'object' && content.url) {
          slide.addImage({ path: content.url, ...position });
        }
        break;
      case 'shape':
        slide.addShape(this.pptx.ShapeType.rect, {
          ...position,
          fill: element.style.backgroundColor || this.getThemeColor('accent1')
        });
        break;
    }
  }

  /**
   * Substituir variáveis no texto
   */
  private replaceVariables(text: string, variables: Record<string, unknown>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value));
    }
    return result;
  }

  /**
   * Aplicar tema à apresentação
   */
  private applyTheme(theme: PPTXTheme): void {
    // Aplicar esquema de cores
    if (theme.colorScheme) {
      // PptxGenJS não tem API direta para temas, mas podemos usar as cores
      console.log(`[PPTX Geneartor] Applying theme: ${theme.name}`);
    }
  }

  /**
   * Obter cor do tema
   */
  private getThemeColor(colorName: string): string {
    if (this.options.theme?.colorScheme?.colors[colorName]) {
      return this.options.theme.colorScheme.colors[colorName];
    }

    // Cores padrão
    const defaultColors: Record<string, string> = {
      text1: '000000',
      text2: '333333',
      accent1: '4472C4',
      accent2: '5B9BD5',
      accent3: 'A5A5A5',
      background1: 'FFFFFF'
    };

    return defaultColors[colorName] || '000000';
  }

  /**
   * Configurar apresentação para conversão em vídeo
   */
  configureForVideo(settings: PPTXToVideoSettings): void {
    // Configurar tamanho baseado na resolução do vídeo
    const aspectRatio = settings.videoSettings.resolution.width / settings.videoSettings.resolution.height;
    
    if (aspectRatio > 1.7) {
      // 16:9 ou similar
      this.pptx.defineLayout({
        name: 'VIDEO_16x9',
        width: 10,
        height: 5.625
      });
    } else if (aspectRatio > 1.2) {
      // 4:3
      this.pptx.defineLayout({
        name: 'VIDEO_4x3',
        width: 10,
        height: 7.5
      });
    } else {
      // Vertical ou quadrado
      this.pptx.defineLayout({
        name: 'VIDEO_SQUARE',
        width: 7.5,
        height: 7.5
      });
    }

    console.log('[PPTX Generator] Configured for video conversion');
  }

  /**
   * Finalizar e obter arquivo
   */
  async finalize(): Promise<Buffer> {
    const buffer = (await this.pptx.write({ outputType: 'nodebuffer' })) as unknown as Buffer;
    console.log('[PPTX Generator] Presentation finalized');
    return buffer;
  }

  /**
   * Limpar recursos
   */
  dispose(): void {
    // PptxGenJS não requer cleanup específico
    console.log('[PPTX Generator] Resources disposed');
  }
}