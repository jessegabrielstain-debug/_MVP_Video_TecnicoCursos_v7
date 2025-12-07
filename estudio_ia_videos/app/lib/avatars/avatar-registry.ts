/**
 * Avatar Registry
 * Central source of truth for available avatars in the system.
 * Defines MetaHumans (UE5) and Local (Canvas) avatars.
 */

export interface AvatarDefinition {
  id: string;
  name: string;
  type: '3d' | '2d' | 'video';
  engine: 'ue5' | 'local' | 'heygen';
  gender: 'male' | 'female';
  /** Short marketing sentence displayed across editors */
  description?: string;
  /** Visual style label used by selectors and filters */
  style?: 'professional' | 'casual' | 'industrial' | 'cartoon' | 'neutral' | string;
  /** Optional semantic tags for search/filters */
  tags?: string[];
  previewUrl?: string;
  metadata: Record<string, unknown>;
  heyGenConfig?: {
    avatarId: string;
  };
}

export const AVATAR_REGISTRY: AvatarDefinition[] = [
  // HeyGen Avatars (Hyper-Realistic)
  // Requires HEYGEN_API_KEY in .env.local
  {
    id: 'heygen_anna_news',
    name: 'Anna (News Anchor)',
    type: 'video',
    engine: 'heygen',
    gender: 'female',
    description: 'Apresentadora profissional ideal para comunicados oficiais e treinamentos corporativos.',
    style: 'professional',
    tags: ['news', 'formal', 'enterprise'],
    previewUrl: 'https://files.heygen.ai/avatar/v3/3f2583200c854a0397f129e60b811467/full/preview_target.webp',
    metadata: {
      style: 'professional',
      quality: 'high',
      tags: ['news', 'formal']
    },
    heyGenConfig: {
      avatarId: 'Anna_public_3_20240108'
    }
  },
  {
    id: 'heygen_josh_casual',
    name: 'Josh (Casual)',
    type: 'video',
    engine: 'heygen',
    gender: 'male',
    description: 'Especialista descontraído, ótimo para vídeos educacionais e comunicados internos.',
    style: 'casual',
    tags: ['explainer', 'friendly'],
    previewUrl: 'https://files.heygen.ai/avatar/v3/4a90e2/full/preview_target.webp',
    metadata: {
      style: 'casual',
      quality: 'high',
      tags: ['explainer', 'friendly']
    },
    heyGenConfig: {
      avatarId: 'Josh_public_2_20240108'
    }
  },
  // UE5 MetaHumans
  {
    id: 'mh_male_01',
    name: 'Professional Male (UE5)',
    type: '3d',
    engine: 'ue5',
    gender: 'male',
    description: 'MetaHuman masculino para renders imersivos em ambientes industriais.',
    style: 'professional',
    tags: ['ue5', 'metahuman'],
    metadata: {
      style: 'professional',
      age_range: '30-40',
      clothing_options: ['suit', 'casual'],
      expression_presets: ['neutral', 'smile', 'speak']
    }
  },
  {
    id: 'mh_female_01',
    name: 'Professional Female (UE5)',
    type: '3d',
    engine: 'ue5',
    gender: 'female',
    description: 'MetaHuman feminino indicado para aulas técnicas e conteúdos executivos.',
    style: 'professional',
    tags: ['ue5', 'metahuman'],
    metadata: {
      style: 'professional',
      age_range: '25-35',
      clothing_options: ['suit', 'casual'],
      expression_presets: ['neutral', 'smile', 'speak']
    }
  },
  // Local Canvas Avatars
  {
    id: 'local_male_01',
    name: 'Simple Male (2D)',
    type: '2d',
    engine: 'local',
    gender: 'male',
    description: 'Avatar 2D leve para pré-visualizações rápidas e animações simples.',
    style: 'cartoon',
    tags: ['2d', 'fast-render'],
    metadata: {
      style: 'cartoon',
      color: '#4a90e2'
    }
  },
  {
    id: 'local_female_01',
    name: 'Simple Female (2D)',
    type: '2d',
    engine: 'local',
    gender: 'female',
    description: 'Avatar 2D feminino otimizado para storyboards e protótipos.',
    style: 'cartoon',
    tags: ['2d', 'fast-render'],
    metadata: {
      style: 'cartoon',
      color: '#e24a90'
    }
  }
];

export class AvatarRegistry {
  getAll(): AvatarDefinition[] {
    return AVATAR_REGISTRY;
  }

  getById(id: string): AvatarDefinition | undefined {
    return AVATAR_REGISTRY.find(a => a.id === id);
  }

  getByEngine(engine: 'ue5' | 'local' | 'heygen'): AvatarDefinition[] {
    return AVATAR_REGISTRY.filter(a => a.engine === engine);
  }
}

export const avatarRegistry = new AvatarRegistry();
