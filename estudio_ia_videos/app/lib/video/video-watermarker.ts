import { EventEmitter } from 'events';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import { WatermarkPosition } from '../../types/watermark.types';

export { WatermarkPosition };

export interface TextWatermark {
  type: 'text';
  text: string;
  fontSize?: number;
  fontColor?: string;
  font?: string;
  opacity?: number;
}

export interface ImageWatermark {
  type: 'image';
  imagePath: string;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  opacity?: number;
}

export interface WatermarkConfig {
  watermark: TextWatermark | ImageWatermark;
  position: WatermarkPosition | 'custom' | string;
  margin?: number;
  customPosition?: { x: number; y: number; unit: 'px' | '%' };
  animation?: string;
  animationDuration?: number;
}

export interface WatermarkResult {
  success: boolean;
  outputPath?: string;
  processingTime?: number;
  inputSize?: number;
  outputSize?: number;
  errors?: string[];
  effectsApplied?: string[];
}

export interface ProcessingOptions {
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: number;
  preserveQuality?: boolean;
}

export default class VideoWatermarker extends EventEmitter {
  constructor() {
    super();
  }

  async addWatermark(
    inputPath: string,
    outputPath: string,
    config: WatermarkConfig,
    options: ProcessingOptions = {}
  ): Promise<WatermarkResult> {
    const startTime = Date.now();
    this.emit('start', { inputPath, outputPath });

    try {
      // Validate input
      try {
        await fs.access(inputPath);
      } catch (e) {
        const error = new Error('Input file not found');
        if (this.listenerCount('error') > 0) {
          this.emit('error', error);
        }
        return { success: false, errors: [error.message] };
      }

      // Validate config
      if (config.watermark.type === 'text' && !config.watermark.text) {
        return { success: false, errors: ['Text watermark requires non-empty text'] };
      }
      if (config.watermark.type === 'image') {
        try {
          await fs.access(config.watermark.imagePath);
        } catch (e) {
          return { success: false, errors: ['Watermark image not found'] };
        }
      }
      if (config.position === 'custom' && !config.customPosition) {
        return { success: false, errors: ['Custom position requires customPosition property'] };
      }

      const inputStats = await fs.stat(inputPath);

      return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath);

        // Apply watermark
        if (config.watermark.type === 'text') {
          const wm = config.watermark;
          const fontSize = wm.fontSize || 24;
          const fontColor = wm.fontColor || 'white';
          const font = wm.font || 'Arial';
          const opacity = wm.opacity || 1.0;
          
          // Escape text
          const text = wm.text
            .replace(/'/g, "\\'")
            .replace(/:/g, "\\:")
            .replace(/\\/g, "\\\\");

          let x = '10', y = '10';
          const margin = config.margin || 10;

          if (config.position === 'custom' && config.customPosition) {
             const { x: cx, y: cy, unit } = config.customPosition;
             if (unit === '%') {
               x = `W*${cx/100}`;
               y = `H*${cy/100}`;
             } else {
               x = `${cx}`;
               y = `${cy}`;
             }
          } else {
             switch(config.position) {
               case WatermarkPosition.TOP_LEFT: x = `${margin}`; y = `${margin}`; break;
               case WatermarkPosition.TOP_CENTER: x = `(W-tw)/2`; y = `${margin}`; break;
               case WatermarkPosition.TOP_RIGHT: x = `W-tw-${margin}`; y = `${margin}`; break;
               case WatermarkPosition.CENTER_LEFT: x = `${margin}`; y = `(H-th)/2`; break;
               case WatermarkPosition.CENTER: x = `(W-tw)/2`; y = `(H-th)/2`; break;
               case WatermarkPosition.CENTER_RIGHT: x = `W-tw-${margin}`; y = `(H-th)/2`; break;
               case WatermarkPosition.BOTTOM_LEFT: x = `${margin}`; y = `H-th-${margin}`; break;
               case WatermarkPosition.BOTTOM_CENTER: x = `(W-tw)/2`; y = `H-th-${margin}`; break;
               case WatermarkPosition.BOTTOM_RIGHT: x = `W-tw-${margin}`; y = `H-th-${margin}`; break;
               case 'bottom-right': x = `W-tw-${margin}`; y = `H-th-${margin}`; break;
               case 'top-right': x = `W-tw-${margin}`; y = `${margin}`; break;
               case 'top-center': x = `(W-tw)/2`; y = `${margin}`; break;
               case 'bottom-left': x = `${margin}`; y = `H-th-${margin}`; break;
               case 'center': x = `(W-tw)/2`; y = `(H-th)/2`; break;
             }
          }

          const filterString = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:font='${font}':alpha=${opacity}:x=${x}:y=${y}`;
          
          command.videoFilters(filterString);

        } else if (config.watermark.type === 'image') {
          const wm = config.watermark;
          command.input(wm.imagePath);
          
          let scaleFilter = '';
          if (wm.width || wm.height) {
             const w = wm.width || -1;
             const h = wm.height || -1;
             scaleFilter = `scale=${w}:${h}`;
             if (wm.maintainAspectRatio && wm.width && !wm.height) {
                scaleFilter = `scale=${wm.width}:-1`;
             }
          }

          let x = '10', y = '10';
          const margin = config.margin || 10;
          
          if (config.position === 'custom' && config.customPosition) {
             const { x: cx, y: cy, unit } = config.customPosition;
             if (unit === '%') {
               x = `W*${cx/100}`;
               y = `H*${cy/100}`;
             } else {
               x = `${cx}`;
               y = `${cy}`;
             }
          } else {
             switch(config.position) {
               case WatermarkPosition.TOP_LEFT: x = `${margin}`; y = `${margin}`; break;
               case WatermarkPosition.TOP_CENTER: x = `(W-w)/2`; y = `${margin}`; break;
               case WatermarkPosition.TOP_RIGHT: x = `W-w-${margin}`; y = `${margin}`; break;
               case WatermarkPosition.CENTER_LEFT: x = `${margin}`; y = `(H-h)/2`; break;
               case WatermarkPosition.CENTER: x = `(W-w)/2`; y = `(H-h)/2`; break;
               case WatermarkPosition.CENTER_RIGHT: x = `W-w-${margin}`; y = `(H-h)/2`; break;
               case WatermarkPosition.BOTTOM_LEFT: x = `${margin}`; y = `H-h-${margin}`; break;
               case WatermarkPosition.BOTTOM_CENTER: x = `(W-w)/2`; y = `H-h-${margin}`; break;
               case WatermarkPosition.BOTTOM_RIGHT: x = `W-w-${margin}`; y = `H-h-${margin}`; break;
               case 'bottom-right': x = `W-w-${margin}`; y = `H-h-${margin}`; break;
               case 'top-right': x = `W-w-${margin}`; y = `${margin}`; break;
               case 'bottom-left': x = `${margin}`; y = `H-h-${margin}`; break;
               case 'center': x = `(W-w)/2`; y = `(H-h)/2`; break;
             }
          }

          const overlayFilter = `overlay=${x}:${y}`;
          
          if (scaleFilter) {
            command.complexFilter(`[1:v]${scaleFilter}[scaled];[0:v][scaled]${overlayFilter}`);
          } else {
            command.complexFilter(`overlay=${x}:${y}`);
          }
        }

        // Options
        if (options.videoCodec) command.videoCodec(options.videoCodec);
        if (options.audioCodec) command.audioCodec(options.audioCodec);
        if (options.preset || options.crf) {
          const opts: string[] = [];
          if (options.preset) opts.push(`-preset ${options.preset}`);
          if (options.crf) opts.push(`-crf ${options.crf}`);
          command.outputOptions(opts);
        }

        if (options.preserveQuality) {
          command.outputOptions(['-q:v 1']);
        }

        command
          .on('start', () => {})
          .on('progress', (progress) => {
            this.emit('progress', progress);
          })
          .on('end', async () => {
            const processingTime = Date.now() - startTime;
            const outputSize = inputStats.size; 
            
            const result: WatermarkResult = {
              success: true,
              outputPath,
              processingTime,
              inputSize: inputStats.size,
              outputSize
            };
            this.emit('complete', result);
            resolve(result);
          })
          .on('error', (err) => {
            this.emit('error', err);
            resolve({ success: false, errors: [err.message] });
          })
          .save(outputPath);
      });

    } catch (error) {
      if (this.listenerCount('error') > 0) {
        this.emit('error', error);
      }
      return { success: false, errors: [(error as Error).message] };
    }
  }

  async addWatermarkBatch(
    inputs: { inputPath: string; outputPath: string }[],
    config: WatermarkConfig
  ): Promise<Map<string, WatermarkResult>> {
    const results = new Map<string, WatermarkResult>();
    this.emit('batch-start', { total: inputs.length });

    let completed = 0;

    for (const input of inputs) {
      try {
        const result = await this.addWatermark(input.inputPath, input.outputPath, config);
        results.set(input.inputPath, result);
      } catch (error) {
        results.set(input.inputPath, { success: false, errors: [(error as Error).message] });
      }
      completed++;
      this.emit('batch-progress', { completed, total: inputs.length });
    }

    this.emit('batch-complete', { 
      total: inputs.length, 
      successful: Array.from(results.values()).filter(r => r.success).length 
    });
    
    return results;
  }

  async removeWatermark(
    inputPath: string,
    outputPath: string,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<WatermarkResult> {
    return new Promise((resolve) => {
      ffmpeg(inputPath)
        .videoFilters(`delogo=x=${region.x}:y=${region.y}:w=${region.width}:h=${region.height}`)
        .on('end', () => {
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          resolve({ success: false, errors: [err.message] });
        })
        .save(outputPath);
    });
  }
}

export function createBasicWatermarker() {
  return new VideoWatermarker();
}

export function createTextWatermarker(text: string, position: string) {
  const watermarker = new VideoWatermarker();
  const config: WatermarkConfig = {
    watermark: { type: 'text', text },
    position
  };
  return { watermarker, config };
}

export function createLogoWatermarker(imagePath: string, position: string, width: number) {
  const watermarker = new VideoWatermarker();
  const config: WatermarkConfig = {
    watermark: { type: 'image', imagePath, width },
    position
  };
  return { watermarker, config };
}

export function createCopyrightWatermarker(text: string) {
  const watermarker = new VideoWatermarker();
  const config: WatermarkConfig = {
    watermark: { type: 'text', text },
    position: 'bottom-center'
  };
  return { watermarker, config };
}

export function createAnimatedWatermarker(text: string, animation: string) {
  const watermarker = new VideoWatermarker();
  const config: WatermarkConfig = {
    watermark: { type: 'text', text },
    position: 'center',
    animation,
    animationDuration: 2000
  };
  return { watermarker, config };
}
