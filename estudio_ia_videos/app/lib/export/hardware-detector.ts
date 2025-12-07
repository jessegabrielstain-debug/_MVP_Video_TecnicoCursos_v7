
import * as os from 'os';

export enum PerformanceTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface CPUInfo {
  model: string;
  cores: number;
  threads: number;
  speed: number;
}

export interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  available: number;
}

export interface GPUInfo {
  model: string;
  vram: number;
  name: string;
  vendor: string;
  available: boolean;
}

export interface HardwareInfo {
  cpu: CPUInfo;
  memory: MemoryInfo;
  gpu: GPUInfo[];
  tier: PerformanceTier;
  platform: string;
  arch: string;
}

export interface QualityPreset {
  maxResolution: string;
  maxFPS: number;
  maxBitrate: number;
  preset: string;
  tier: PerformanceTier;
  threads: number;
  enableGPU: boolean;
}

export interface SystemStatus {
  load: number;
  memoryUsage: number;
  temperature?: number;
  tier: PerformanceTier;
  preset: QualityPreset;
  memoryPressure: number;
  capabilities: HardwareInfo;
}

export class HardwareDetector {
  private static instance: HardwareDetector;
  private cachedInfo: HardwareInfo | null = null;

  private constructor() {}

  public static getInstance(): HardwareDetector {
    if (!HardwareDetector.instance) {
      HardwareDetector.instance = new HardwareDetector();
    }
    return HardwareDetector.instance;
  }

  async detect(): Promise<HardwareInfo> {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    // Mock detection for now, but structure it correctly
    this.cachedInfo = {
      cpu: {
        model: 'Intel Core i7',
        cores: 8,
        threads: 16,
        speed: 3.2
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024,
        free: 8 * 1024 * 1024 * 1024,
        used: 8 * 1024 * 1024 * 1024,
        available: 8 * 1024 * 1024 * 1024
      },
      gpu: [
        {
          model: 'NVIDIA GeForce RTX 3060',
          vram: 12 * 1024 * 1024 * 1024,
          name: 'NVIDIA GeForce RTX 3060',
          vendor: 'NVIDIA',
          available: true
        }
      ],
      tier: PerformanceTier.HIGH,
      platform: 'win32',
      arch: 'x64'
    };

    return this.cachedInfo;
  }

  async getPerformanceTier(): Promise<PerformanceTier> {
    const info = await this.detect();
    return info.tier;
  }

  async getQualityPreset(tier?: PerformanceTier): Promise<QualityPreset> {
    const currentTier = tier || await this.getPerformanceTier();
    
    switch (currentTier) {
      case PerformanceTier.ULTRA:
        return { maxResolution: '4k', maxFPS: 60, maxBitrate: 50000000, preset: 'slow', tier: currentTier, threads: 16, enableGPU: true };
      case PerformanceTier.HIGH:
        return { maxResolution: '1080p', maxFPS: 60, maxBitrate: 15000000, preset: 'medium', tier: currentTier, threads: 8, enableGPU: true };
      case PerformanceTier.MEDIUM:
        return { maxResolution: '1080p', maxFPS: 30, maxBitrate: 8000000, preset: 'fast', tier: currentTier, threads: 4, enableGPU: false };
      case PerformanceTier.LOW:
      default:
        return { maxResolution: '720p', maxFPS: 30, maxBitrate: 4000000, preset: 'veryfast', tier: currentTier, threads: 2, enableGPU: false };
    }
  }

  async getMemoryPressure(): Promise<number> {
    return 0.5; // Mock 50% pressure
  }

  async canHandle(resolution: string, bitrate: number, fps: number): Promise<boolean> {
    const preset = await this.getQualityPreset();
    
    // Simple mock logic
    if (resolution === '4k' && preset.maxResolution !== '4k') return false;
    if (fps > preset.maxFPS * 1.5) return false; // Allow some headroom but not too much
    if (bitrate > preset.maxBitrate * 2) return false;

    return true;
  }

  async getStatus(): Promise<SystemStatus> {
    const tier = await this.getPerformanceTier();
    const preset = await this.getQualityPreset(tier);
    const capabilities = await this.detect();
    
    return {
      load: 0.4,
      memoryUsage: 0.5,
      tier,
      preset: preset,
      memoryPressure: 0.5,
      capabilities
    };
  }

  getRecommendedConcurrency(): number {
    return 2;
  }
}

export const hardwareDetector = HardwareDetector.getInstance();
