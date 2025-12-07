export interface Environment3D {
  id: string
  name: string
  description: string
  category: 'industrial' | 'office' | 'outdoor' | 'construction' | 'medical' | 'laboratory' | 'educational'
  environment_type: string
  complexity_level: 'simple' | 'moderate' | 'detailed' | 'ultra_realistic'
  visual_properties: {
    lighting: {
      type: string
      intensity: number
      shadows_enabled: boolean
    }
    materials: {
      pbr_enabled: boolean
      texture_quality: string
      reflections_quality: string
    }
  }
  interactive_elements: Array<{
    id: string
    metadata: {
      name: string
    }
    interactive: boolean
  }>
  camera_settings: Record<string, unknown>
  performance_optimization: {
    target_fps: number
    lod_enabled: boolean
    occlusion_culling: boolean
  }
  nr_compliance: {
    applicable_nrs: string[]
    safety_zones_marked: boolean
    emergency_exits_visible: boolean
  }
}

export interface ImmersiveScenario {
  id: string
  name: string
  description: string
  environmentId: string
  steps: Record<string, unknown>[]
}

export class ImmersiveEnvironmentEngine {
  static ENVIRONMENT_LIBRARY: Environment3D[] = [
    {
      id: 'env_industrial_01',
      name: 'Fábrica Automotiva',
      description: 'Linha de montagem completa com robôs industriais',
      category: 'industrial',
      environment_type: 'realistic',
      complexity_level: 'detailed',
      visual_properties: {
        lighting: {
          type: 'dynamic',
          intensity: 85,
          shadows_enabled: true
        },
        materials: {
          pbr_enabled: true,
          texture_quality: 'high',
          reflections_quality: 'medium'
        }
      },
      interactive_elements: [
        { id: 'el_01', metadata: { name: 'Braço Robótico A' }, interactive: true },
        { id: 'el_02', metadata: { name: 'Painel de Controle' }, interactive: true },
        { id: 'el_03', metadata: { name: 'Esteira Transportadora' }, interactive: true }
      ],
      camera_settings: {},
      performance_optimization: {
        target_fps: 60,
        lod_enabled: true,
        occlusion_culling: true
      },
      nr_compliance: {
        applicable_nrs: ['NR-12', 'NR-10'],
        safety_zones_marked: true,
        emergency_exits_visible: true
      }
    },
    {
      id: 'env_construction_01',
      name: 'Canteiro de Obras',
      description: 'Edifício em construção com andaimes e guindastes',
      category: 'construction',
      environment_type: 'realistic',
      complexity_level: 'moderate',
      visual_properties: {
        lighting: {
          type: 'sunlight',
          intensity: 100,
          shadows_enabled: true
        },
        materials: {
          pbr_enabled: true,
          texture_quality: 'medium',
          reflections_quality: 'low'
        }
      },
      interactive_elements: [
        { id: 'el_04', metadata: { name: 'Andaime' }, interactive: true },
        { id: 'el_05', metadata: { name: 'Betoneira' }, interactive: true }
      ],
      camera_settings: {},
      performance_optimization: {
        target_fps: 60,
        lod_enabled: true,
        occlusion_culling: true
      },
      nr_compliance: {
        applicable_nrs: ['NR-18', 'NR-35'],
        safety_zones_marked: true,
        emergency_exits_visible: false
      }
    }
  ]

  static async createCustomEnvironment(params: {
    name: string
    category: string
    complexity_level: string
    requirements: Record<string, unknown>
  }): Promise<{ environment_id: string }> {
    // Simulação de criação
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ environment_id: `env_custom_${Date.now()}` })
      }, 1000)
    })
  }
}
