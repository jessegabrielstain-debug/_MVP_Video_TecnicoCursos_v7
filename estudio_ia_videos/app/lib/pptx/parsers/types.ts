/**
 * TypeScript interfaces for PPTX XML structures
 * Tipos seguros para parsear XML de arquivos PPTX
 */

// ================================================
// SLIDE DATA STRUCTURES
// ================================================

export interface PPTXSlideData {
  'p:sld'?: {
    'p:transition'?: PPTXTransition;
    'p:timing'?: PPTXTiming;
    'p:cSld'?: {
      'p:spTree'?: {
        'p:sp'?: PPTXShape | PPTXShape[];
        'p:pic'?: PPTXPicture | PPTXPicture[];
      };
    };
  };
}

// ================================================
// TRANSITION STRUCTURES
// ================================================

export interface PPTXTransition {
  'p:fade'?: Record<string, unknown>;
  'p:push'?: { '@_dir'?: string };
  'p:wipe'?: { '@_dir'?: string };
  'p:cut'?: Record<string, unknown>;
  'p:zoom'?: { '@_dir'?: string };
  '@_spd'?: string; // slow, medium, fast
  '@_advTm'?: number | string; // advance time in milliseconds
  '@_advClick'?: boolean | string; // advance on click
}

// ================================================
// ANIMATION STRUCTURES
// ================================================

export interface PPTXTiming {
  'p:tnLst'?: {
    'p:par'?: PPTXParallel | PPTXParallel[];
  };
}

export interface PPTXParallel {
  'p:cTn'?: {
    '@_id'?: string | number;
    '@_dur'?: string | number;
    '@_fill'?: string;
    'p:childTnLst'?: {
      'p:seq'?: PPTXSequence | PPTXSequence[];
      'p:par'?: PPTXParallel | PPTXParallel[];
    };
  };
}

export interface PPTXSequence {
  'p:cTn'?: {
    '@_id'?: string | number;
    'p:childTnLst'?: {
      'p:par'?: PPTXParallel | PPTXParallel[];
    };
  };
}

export interface PPTXAnimationNode {
  'p:cTn'?: {
    '@_id'?: string | number;
    '@_dur'?: string | number;
    '@_fill'?: string;
  };
  'p:set'?: {
    'p:cBhvr'?: PPTXCommonBehavior;
  };
  'p:animEffect'?: {
    '@_transition'?: string;
    '@_filter'?: string;
    'p:cBhvr'?: PPTXCommonBehavior;
  };
}

export interface PPTXCommonBehavior {
  'p:cTn'?: {
    '@_id'?: string | number;
    '@_dur'?: string | number;
    '@_delay'?: string | number;
  };
  'p:tgtEl'?: {
    'p:spTgt'?: {
      '@_spid'?: string;
    };
  };
}

// ================================================
// SHAPE STRUCTURES
// ================================================

export interface PPTXShape {
  'p:nvSpPr'?: {
    'p:cNvPr'?: {
      '@_id'?: string | number;
      '@_name'?: string;
    };
  };
  'p:spPr'?: {
    'a:xfrm'?: PPTXTransform;
  };
  'p:txBody'?: {
    'a:p'?: PPTXParagraph | PPTXParagraph[];
  };
}

export interface PPTXPicture {
  'p:nvPicPr'?: {
    'p:cNvPr'?: {
      '@_id'?: string | number;
      '@_name'?: string;
    };
  };
  'p:spPr'?: {
    'a:xfrm'?: PPTXTransform;
  };
  'p:blipFill'?: {
    'a:blip'?: {
      '@_r:embed'?: string;
    };
  };
}

export interface PPTXTransform {
  'a:off'?: {
    '@_x'?: string | number;
    '@_y'?: string | number;
  };
  'a:ext'?: {
    '@_cx'?: string | number;
    '@_cy'?: string | number;
  };
  '@_rot'?: string | number;
}

export interface PPTXParagraph {
  'a:r'?: PPTXRun | PPTXRun[];
  'a:pPr'?: {
    '@_algn'?: string; // l, ctr, r, just
    '@_lvl'?: string | number;
    'a:buFont'?: Record<string, unknown>;
    'a:buChar'?: Record<string, unknown>;
  };
}

export interface PPTXRun {
  'a:t'?: string;
  'a:rPr'?: {
    '@_b'?: string | boolean | number;
    '@_i'?: string | boolean | number;
    '@_u'?: string;
    '@_sz'?: string | number;
    'a:latin'?: { '@_typeface'?: string };
    'a:solidFill'?: {
      'a:srgbClr'?: { '@_val'?: string };
    };
    'a:hlinkClick'?: {
      '@_r:id'?: string;
      '@_tooltip'?: string;
    };
  };
}

// ================================================
// NOTES STRUCTURES
// ================================================

export interface PPTXNotesData {
  'p:notes'?: {
    'p:cSld'?: {
      'p:spTree'?: {
        'p:sp'?: PPTXShape | PPTXShape[];
      };
    };
  };
}

// ================================================
// LAYOUT STRUCTURES
// ================================================

export interface PPTXSlideLayoutData {
  'p:sldLayout'?: {
    '@_type'?: string;
    'p:cSld'?: {
      '@_name'?: string;
      'p:spTree'?: {
        'p:sp'?: PPTXShape | PPTXShape[];
      };
    };
  };
}

// ================================================
// RELATIONSHIPS STRUCTURES
// ================================================

export interface PPTXRelationships {
  Relationships?: {
    Relationship?: PPTXRelationship | PPTXRelationship[];
  };
}

export interface PPTXRelationship {
  '@_Id'?: string;
  '@_Type'?: string;
  '@_Target'?: string;
}

// ================================================
// TYPE GUARDS
// ================================================

export function isArray<T>(value: T | T[]): value is T[] {
  return Array.isArray(value);
}

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return isArray(value) ? value : [value];
}

export function getString(value: string | number | undefined): string {
  if (value === undefined) return '';
  return String(value);
}

export function getNumber(value: string | number | undefined): number {
  if (value === undefined) return 0;
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

export function getBoolean(value: string | boolean | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}
