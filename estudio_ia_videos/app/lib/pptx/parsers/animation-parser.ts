import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SlideTransition {
  type: string; // fade, push, wipe, etc
  duration?: number; // em milissegundos
  direction?: 'left' | 'right' | 'up' | 'down';
  advanceOnClick?: boolean;
  advanceAfterTime?: number; // em milissegundos
}

export interface AnimationEffect {
  id: string;
  targetElementId?: string;
  effectType: 'entrance' | 'emphasis' | 'exit' | 'motion';
  effectName: string; // appear, fade, fly, etc
  duration?: number; // em milissegundos
  delay?: number; // em milissegundos
  order?: number; // ordem de execução
}

export interface SlideAnimationResult {
  success: boolean;
  transition?: SlideTransition;
  animations?: AnimationEffect[];
  totalAnimationDuration?: number; // duração total de todas animações
  error?: string;
}

export class PPTXAnimationParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  async extractAnimations(zip: JSZip, slideNumber: number): Promise<SlideAnimationResult> {
    try {
      const slidePath = `ppt/slides/slide${slideNumber}.xml`;
      const slideFile = zip.file(slidePath);

      if (!slideFile) {
        return { success: false, error: 'Slide não encontrado' };
      }

      const slideXml = await slideFile.async('string');
      const slideData = this.xmlParser.parse(slideXml);

      // Extrair transição
      const transition = this.extractTransition(slideData);

      // Extrair animações
      const animations = this.extractAnimationEffects(slideData);

      // Calcular duração total das animações
      const totalAnimationDuration = this.calculateTotalAnimationDuration(animations);

      return {
        success: true,
        transition,
        animations,
        totalAnimationDuration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  private extractTransition(slideData: any): SlideTransition | undefined {
    try {
      const transition = slideData?.['p:sld']?.['p:transition'];
      
      if (!transition) return undefined;

      const result: SlideTransition = {
        type: 'none',
        advanceOnClick: true,
      };

      // Detectar tipo de transição
      if (transition['p:fade']) {
        result.type = 'fade';
      } else if (transition['p:push']) {
        result.type = 'push';
        const dir = transition['p:push']?.['@_dir'];
        if (dir) result.direction = this.normalizeDirection(dir);
      } else if (transition['p:wipe']) {
        result.type = 'wipe';
        const dir = transition['p:wipe']?.['@_dir'];
        if (dir) result.direction = this.normalizeDirection(dir);
      } else if (transition['p:cut']) {
        result.type = 'cut';
      } else if (transition['p:zoom']) {
        result.type = 'zoom';
      }

      // Duração da transição (em milissegundos)
      if (transition['@_spd']) {
        const speed = transition['@_spd'];
        result.duration = this.speedToDuration(speed);
      }

      // Avanço automático
      if (transition['@_advClick'] !== undefined) {
        result.advanceOnClick = transition['@_advClick'] === '1' || transition['@_advClick'] === true;
      }

      if (transition['@_advTm']) {
        result.advanceAfterTime = parseInt(transition['@_advTm'], 10);
      }

      return result;
    } catch {
      return undefined;
    }
  }

  private extractAnimationEffects(slideData: any): AnimationEffect[] {
    try {
      const animations: AnimationEffect[] = [];
      const timing = slideData?.['p:sld']?.['p:timing'];

      if (!timing) return [];

      const tnLst = timing['p:tnLst'];
      if (!tnLst) return [];

      const par = tnLst['p:par'];
      if (!par) return [];

      const cTn = par['p:cTn'];
      if (!cTn) return [];

      const childTnLst = cTn['p:childTnLst'];
      if (!childTnLst) return [];

      const sequences = this.toArray(childTnLst['p:seq']);

      for (const seq of sequences) {
        const seqCTn = seq?.['p:cTn'];
        if (!seqCTn) continue;

        const seqChildTnLst = seqCTn['p:childTnLst'];
        if (!seqChildTnLst) continue;

        const pars = this.toArray(seqChildTnLst['p:par']);

        for (let i = 0; i < pars.length; i++) {
          const animation = this.parseAnimationNode(pars[i], i);
          if (animation) {
            animations.push(animation);
          }
        }
      }

      return animations;
    } catch {
      return [];
    }
  }

  private parseAnimationNode(parNode: any, index: number): AnimationEffect | null {
    try {
      const animation: AnimationEffect = {
        id: `anim-${index}`,
        effectType: 'entrance',
        effectName: 'appear',
        order: index,
      };

      const cTn = parNode?.['p:cTn'];
      if (!cTn) return null;

      // Duração
      if (cTn['@_dur']) {
        const dur = cTn['@_dur'];
        animation.duration = dur === 'indefinite' ? 1000 : parseInt(dur, 10);
      }

      // Delay
      if (cTn['@_delay']) {
        animation.delay = parseInt(cTn['@_delay'], 10);
      }

      // Identificar target
      const stCondLst = cTn['p:stCondLst'];
      if (stCondLst) {
        const cond = this.toArray(stCondLst['p:cond'])[0];
        if (cond) {
          const tgtEl = cond['p:tgtEl'];
          if (tgtEl?.['p:spTgt']?.['@_spid']) {
            animation.targetElementId = tgtEl['p:spTgt']['@_spid'];
          }
        }
      }

      // Identificar tipo e efeito
      const childTnLst = cTn['p:childTnLst'];
      if (childTnLst) {
        const set = childTnLst['p:set'];
        const animEffect = childTnLst['p:animEffect'];

        if (animEffect) {
          const filter = animEffect['@_filter'];
          if (filter) {
            animation.effectName = this.normalizeEffectName(filter);
            animation.effectType = this.determineEffectType(filter);
          }
        } else if (set) {
          animation.effectName = 'appear';
          animation.effectType = 'entrance';
        }
      }

      return animation;
    } catch {
      return null;
    }
  }

  private normalizeDirection(dir: string): 'left' | 'right' | 'up' | 'down' {
    const lower = dir.toLowerCase();
    if (lower.includes('l')) return 'left';
    if (lower.includes('r')) return 'right';
    if (lower.includes('u')) return 'up';
    if (lower.includes('d')) return 'down';
    return 'right'; // default
  }

  private speedToDuration(speed: string): number {
    const speedMap: Record<string, number> = {
      slow: 2000,
      med: 1000,
      fast: 500,
    };
    return speedMap[speed] || 1000;
  }

  private normalizeEffectName(filter: string): string {
    const effectMap: Record<string, string> = {
      fade: 'fade',
      wipe: 'wipe',
      fly: 'fly',
      'box': 'box',
      checkerboard: 'checkerboard',
      blinds: 'blinds',
      dissolve: 'dissolve',
      appear: 'appear',
    };

    const lower = filter.toLowerCase();
    for (const [key, value] of Object.entries(effectMap)) {
      if (lower.includes(key)) return value;
    }

    return 'fade'; // default
  }

  private determineEffectType(filter: string): 'entrance' | 'emphasis' | 'exit' | 'motion' {
    // Heurística simples - em produção, seria mais complexo
    const lower = filter.toLowerCase();
    
    if (lower.includes('exit') || lower.includes('disappear')) {
      return 'exit';
    }
    if (lower.includes('emphasis') || lower.includes('pulse')) {
      return 'emphasis';
    }
    if (lower.includes('path') || lower.includes('motion')) {
      return 'motion';
    }

    return 'entrance'; // default
  }

  private calculateTotalAnimationDuration(animations: AnimationEffect[]): number {
    if (animations.length === 0) return 0;

    let maxEnd = 0;

    for (const anim of animations) {
      const delay = anim.delay || 0;
      const duration = anim.duration || 1000;
      const end = delay + duration;
      
      if (end > maxEnd) {
        maxEnd = end;
      }
    }

    return maxEnd;
  }

  private toArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Extrai animações de todos os slides
   */
  async extractAllAnimations(zip: JSZip): Promise<Map<number, SlideAnimationResult>> {
    const animationsMap = new Map<number, SlideAnimationResult>();

    const slideFiles = Object.keys(zip.files).filter(
      (filename) => filename.match(/ppt\/slides\/slide\d+\.xml/)
    );

    for (const slideFile of slideFiles) {
      const match = slideFile.match(/slide(\d+)\.xml/);
      if (match) {
        const slideNumber = parseInt(match[1], 10);
        const result = await this.extractAnimations(zip, slideNumber);
        animationsMap.set(slideNumber, result);
      }
    }

    return animationsMap;
  }
}

export async function extractSlideAnimations(
  zip: JSZip,
  slideNumber: number
): Promise<SlideAnimationResult> {
  const parser = new PPTXAnimationParser();
  return parser.extractAnimations(zip, slideNumber);
}

export async function extractAllSlideAnimations(
  zip: JSZip
): Promise<Map<number, SlideAnimationResult>> {
  const parser = new PPTXAnimationParser();
  return parser.extractAllAnimations(zip);
}
