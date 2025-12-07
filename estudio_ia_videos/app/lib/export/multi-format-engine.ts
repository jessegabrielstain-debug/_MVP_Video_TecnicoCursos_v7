export interface ExportConfiguration {
  project_id: string;
  export_format: 'mp4' | 'webm' | 'scorm' | 'html5' | 'gif';
  quality_settings: {
    resolution: '720p' | '1080p' | '4k';
    bitrate: number;
    fps: number;
    audio_quality: 'standard' | 'high' | 'lossless';
  };
  advanced_options: {
    include_captions: boolean;
    include_transcripts: boolean;
    include_interactive_elements: boolean;
    brand_watermark: boolean;
  };
}

export interface ExportJob {
  id: string;
  project_id: string;
  configuration: ExportConfiguration;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  output_files: Array<{
    format: string;
    url: string;
    size_bytes: number;
    duration_seconds: number;
  }>;
  metadata: {
    total_scenes: number;
    total_duration: number;
    file_size_estimate: number;
    processing_time_estimate: number;
  };
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  popular?: boolean;
  configuration: Partial<ExportConfiguration>;
}

export const MultiFormatExportEngine = {
  EXPORT_TEMPLATES: [
    {
      id: 'social-media',
      name: 'Redes Sociais',
      description: 'Otimizado para Instagram, TikTok e Shorts',
      popular: true,
      configuration: {
        export_format: 'mp4',
        quality_settings: {
          resolution: '1080p',
          bitrate: 3500,
          fps: 30,
          audio_quality: 'high'
        }
      }
    },
    {
      id: 'lms-scorm',
      name: 'Pacote LMS (SCORM)',
      description: 'Pacote completo para plataformas de ensino',
      configuration: {
        export_format: 'scorm',
        quality_settings: {
          resolution: '720p',
          bitrate: 2500,
          fps: 30,
          audio_quality: 'standard'
        },
        advanced_options: {
          include_captions: true,
          include_transcripts: true,
          include_interactive_elements: true,
          brand_watermark: false
        }
      }
    },
    {
      id: 'high-quality',
      name: 'Alta Qualidade (4K)',
      description: 'Máxima qualidade para arquivamento e YouTube',
      configuration: {
        export_format: 'mp4',
        quality_settings: {
          resolution: '4k',
          bitrate: 15000,
          fps: 60,
          audio_quality: 'lossless'
        }
      }
    },
    {
      id: 'web-optimized',
      name: 'Web Otimizado',
      description: 'Leve e rápido para sites e landing pages',
      configuration: {
        export_format: 'webm',
        quality_settings: {
          resolution: '720p',
          bitrate: 1500,
          fps: 30,
          audio_quality: 'standard'
        }
      }
    }
  ] as ExportTemplate[],

  startExport: async (config: ExportConfiguration): Promise<ExportJob> => {
    // Mock implementation
    return {
      id: `job-${Date.now()}`,
      project_id: config.project_id,
      configuration: config,
      status: 'processing',
      progress: 0,
      started_at: new Date().toISOString(),
      output_files: [],
      metadata: {
        total_scenes: 0,
        total_duration: 0,
        file_size_estimate: 0,
        processing_time_estimate: 0
      }
    };
  },

  getExportStatus: async (jobId: string): Promise<ExportJob> => {
    // Mock implementation
    return {
      id: jobId,
      project_id: 'mock',
      configuration: {} as unknown as ExportConfiguration,
      status: 'completed',
      progress: 100,
      started_at: new Date().toISOString(),
      output_files: [],
      metadata: {
        total_scenes: 0,
        total_duration: 0,
        file_size_estimate: 0,
        processing_time_estimate: 0
      }
    };
  },

  optimizeConfiguration: (config: ExportConfiguration, target: 'speed' | 'quality' | 'size' | 'compatibility'): ExportConfiguration => {
    const optimized = { ...config };
    // Mock optimization logic
    if (target === 'speed') {
      optimized.quality_settings = { ...optimized.quality_settings, resolution: '720p', bitrate: 2000 };
    } else if (target === 'quality') {
      optimized.quality_settings = { ...optimized.quality_settings, resolution: '4k', bitrate: 10000 };
    }
    return optimized;
  }
};
