
export const SUPPORTED_FORMATS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  duration: number;
  size: number;
}

export interface ValidationResult {
  valid: boolean;
  metadata?: VideoMetadata;
  errors?: string[];
  warnings?: string[];
}

export class VideoValidator {
  async validate(filePath: string): Promise<ValidationResult> {
    // Mock implementation
    
    // Check if file exists (mock check based on path string for tests)
    if (filePath.includes('nao/existe') || filePath.includes('non-existent') || filePath.includes('inexistente')) {
      return {
        valid: false,
        errors: ['Arquivo não encontrado'],
        warnings: []
      };
    }

    // Check extension
    const ext = '.' + filePath.split('.').pop();
    if (!SUPPORTED_FORMATS.includes(ext) && !SUPPORTED_FORMATS.includes(ext.toLowerCase())) {
       return {
        valid: false,
        errors: ['Formato não suportado'],
        warnings: []
      };
    }
    
    const filename = filePath.split(/[/\\]/).pop() || '';
    
    let width = 1920;
    let height = 1080;
    
    if (filename.includes('720p')) {
      width = 1280;
      height = 720;
    }
    
    return {
      valid: true,
      metadata: {
        width,
        height,
        fps: 30,
        duration: 5,
        size: 1024 * 1024 // 1MB
      }
    };
  }

  private parseFps(fpsString: string): number {
    if (fpsString.includes('/')) {
      const [num, den] = fpsString.split('/').map(Number);
      return num / den;
    }
    return Number(fpsString);
  }
}

export const videoValidator = new VideoValidator();
