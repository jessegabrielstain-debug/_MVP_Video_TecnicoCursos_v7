import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';
import { ProcessedPDF, PDFPage, PDFElement } from './pdf-processor';
import { GeneratedNarration, NarrationScript, TransitionConfig } from './ai-narrator';

const execAsync = promisify(exec);

export interface VideoGenerationOptions {
  resolution?: '720p' | '1080p' | '4K';
  frameRate?: number;
  videoCodec?: 'h264' | 'h265' | 'vp9';
  audioCodec?: 'aac' | 'mp3' | 'opus';
  outputFormat?: 'mp4' | 'webm' | 'mov';
  enableTransitions?: boolean;
  transitionDuration?: number;
  backgroundMusic?: string;
  musicVolume?: number;
  slideDuration?: number;
  enableAnimations?: boolean;
  animationStyle?: 'fade' | 'slide' | 'zoom' | 'ken_burns';
}

export interface VideoScene {
  id: string;
  pageNumber: number;
  duration: number;
  imagePath: string;
  narrationPath?: string;
  transitions: {
    in: TransitionConfig;
    out: TransitionConfig;
  };
  textOverlays: TextOverlay[];
}

export interface TextOverlay {
  text: string;
  position: {
    x: number;
    y: number;
  };
  style: {
    fontSize: number;
    fontColor: string;
    fontFamily: string;
    backgroundColor?: string;
    opacity: number;
  };
  timing: {
    start: number;
    end: number;
  };
}

export interface GeneratedVideo {
  videoPath: string;
  thumbnailPath: string;
  duration: number;
  fileSize: number;
  resolution: string;
  scenes: VideoScene[];
  metadata: {
    title: string;
    description: string;
    tags: string[];
    createdAt: string;
  };
}

export class VideoGenerator {
  private static instance: VideoGenerator;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'video-generation');
    this.ensureTempDir();
  }

  static getInstance(): VideoGenerator {
    if (!VideoGenerator.instance) {
      VideoGenerator.instance = new VideoGenerator();
    }
    return VideoGenerator.instance;
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating temp directory:', error instanceof Error ? error : new Error(String(error)), { component: 'VideoGenerator' });
    }
  }

  async generateVideoFromPDF(
    processedPDF: ProcessedPDF,
    narration: GeneratedNarration,
    options: VideoGenerationOptions = {}
  ): Promise<GeneratedVideo> {
    const {
      resolution = '1080p',
      frameRate = 30,
      videoCodec = 'h264',
      audioCodec = 'aac',
      outputFormat = 'mp4',
      enableTransitions = true,
      transitionDuration = 1.0,
      backgroundMusic,
      musicVolume = 0.3,
      enableAnimations = true,
      animationStyle = 'fade'
    } = options;

    try {
      // Create video scenes from PDF pages
      const scenes = await this.createScenes(processedPDF, narration, options);

      // Generate video segments for each scene
      const videoSegments = await this.generateVideoSegments(scenes, options);

      // Combine video segments
      const finalVideoPath = await this.combineVideoSegments(
        videoSegments,
        narration,
        options
      );

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(finalVideoPath);

      // Get video metadata
      const metadata = await this.getVideoMetadata(finalVideoPath);

      // Clean up temporary files
      await this.cleanupTempFiles(videoSegments);

      return {
        videoPath: finalVideoPath,
        thumbnailPath,
        duration: metadata.duration,
        fileSize: metadata.fileSize,
        resolution: metadata.resolution,
        scenes,
        metadata: {
          title: processedPDF.metadata.title || 'PDF to Video',
          description: processedPDF.summary,
          tags: processedPDF.keyTopics,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Video generation error:', error instanceof Error ? error : new Error(String(error)), { component: 'VideoGenerator' });
      throw new Error(`Failed to generate video: ${(error as Error).message}`);
    }
  }

  private async createScenes(
    processedPDF: ProcessedPDF,
    narration: GeneratedNarration,
    options: VideoGenerationOptions
  ): Promise<VideoScene[]> {
    const scenes: VideoScene[] = [];

    for (let i = 0; i < processedPDF.pages.length; i++) {
      const page = processedPDF.pages[i];
      const narrationScript = narration.scripts.find(s => s.pageNumber === i + 1);

      // Create slide image from PDF page
      const slideImagePath = await this.createSlideImage(page, options);

      // Create text overlays
      const textOverlays = this.createTextOverlays(page, narrationScript, options);

      const scene: VideoScene = {
        id: `scene_${i + 1}`,
        pageNumber: i + 1,
        duration: narrationScript?.duration || 5,
        imagePath: slideImagePath,
        narrationPath: narration.audioFiles.find(f => f.includes(`page_${i + 1}`)),
        transitions: {
          in: narration.transitions[i] || { type: 'fade', duration: 1.0 },
          out: narration.transitions[i + 1] || { type: 'fade', duration: 1.0 }
        },
        textOverlays
      };

      scenes.push(scene);
    }

    return scenes;
  }

  private async createSlideImage(
    page: PDFPage,
    options: VideoGenerationOptions
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `slide_${page.pageNumber}.png`);

    // Create slide image with proper resolution
    const resolution = this.getResolutionDimensions(options.resolution || '1080p');
    
    // Create base slide with background
    await this.createSlideBackground(outputPath, resolution, page);
    
    // Add text content
    await this.addTextToSlide(outputPath, page);
    
    // Add images if available
    if (page.images.length > 0) {
      await this.addImagesToSlide(outputPath, page.images);
    }

    return outputPath;
  }

  private getResolutionDimensions(resolution: string): { width: number; height: number } {
    const dimensions: { [key: string]: { width: number; height: number } } = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4K': { width: 3840, height: 2160 }
    };

    return dimensions[resolution] || dimensions['1080p'];
  }

  private async createSlideBackground(
    outputPath: string,
    dimensions: { width: number; height: number },
    page: PDFPage
  ): Promise<void> {
    // Create gradient background based on page complexity
    const gradient = this.generateGradientBackground(page);
    
    const command = `magick convert -size ${dimensions.width}x${dimensions.height} gradient:${gradient.start}-${gradient.end} "${outputPath}"`;
    await execAsync(command);
  }

  private generateGradientBackground(page: PDFPage): { start: string; end: string } {
    // Generate gradient colors based on page content
    const hasImages = page.images.length > 0;
    const elementCount = page.layout.elements.length;

    if (hasImages) {
      return { start: '#1a1a2e', end: '#16213e' }; // Dark gradient for image-heavy slides
    } else if (elementCount > 20) {
      return { start: '#2c3e50', end: '#34495e' }; // Medium gradient for text-heavy slides
    } else {
      return { start: '#3498db', end: '#2980b9' }; // Light gradient for simple slides
    }
  }

  private async addTextToSlide(outputPath: string, page: PDFPage): Promise<void> {
    const elements = page.layout.elements;
    let command = `magick convert "${outputPath}"`;

    elements.forEach((element, index) => {
      const position = this.calculateTextPosition(element, page.layout);
      const style = this.getTextStyle(element);
      
      command += ` -font ${style.fontFamily} -pointsize ${style.fontSize} -fill "${style.color}"`;
      command += ` -annotate +${position.x}+${position.y} "${this.escapeText(element.content)}"`;
    });

    command += ` "${outputPath}"`;
    await execAsync(command);
  }

  private calculateTextPosition(element: PDFElement, layout: PDFPage['layout']): { x: number; y: number } {
    // Scale PDF coordinates to video resolution
    const scaleX = 1920 / layout.width;
    const scaleY = 1080 / layout.height;

    return {
      x: Math.round(element.position.x * scaleX),
      y: Math.round(element.position.y * scaleY)
    };
  }

  private getTextStyle(element: PDFElement): {
    fontFamily: string;
    fontSize: number;
    color: string;
  } {
    const baseFontSize = 24;
    const style = element.style || {};

    let fontSize = baseFontSize;
    if (style.fontSize) {
      fontSize = Math.round(style.fontSize * 1.5); // Scale up for video
    }

    // Adjust font size based on element type
    if (element.type === 'heading') {
      fontSize = Math.round(fontSize * 1.5);
    } else if (element.type === 'list') {
      fontSize = Math.round(fontSize * 0.9);
    }

    return {
      fontFamily: 'Arial',
      fontSize,
      color: style.color || '#ffffff'
    };
  }

  private escapeText(text: string): string {
    return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
  }

  private async addImagesToSlide(outputPath: string, images: string[]): Promise<void> {
    // For now, we'll skip adding actual images to avoid complexity
    // In production, you would decode base64 images and overlay them
    logger.info(`Skipping image addition for ${images.length} images`, { component: 'VideoGenerator' });
  }

  private createTextOverlays(
    page: PDFPage,
    narrationScript: NarrationScript | undefined,
    options: VideoGenerationOptions
  ): TextOverlay[] {
    const overlays: TextOverlay[] = [];

    if (!narrationScript) return overlays;

    // Add narration text as subtitle
    overlays.push({
      text: narrationScript.text,
      position: { x: 50, y: 900 }, // Bottom of screen
      style: {
        fontSize: 28,
        fontColor: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#000000',
        opacity: 0.8
      },
      timing: {
        start: 0,
        end: narrationScript.duration
      }
    });

    return overlays;
  }

  private async generateVideoSegments(
    scenes: VideoScene[],
    options: VideoGenerationOptions
  ): Promise<string[]> {
    const videoSegments: string[] = [];

    for (const scene of scenes) {
      const segmentPath = await this.generateVideoSegment(scene, options);
      videoSegments.push(segmentPath);
    }

    return videoSegments;
  }

  private async generateVideoSegment(
    scene: VideoScene,
    options: VideoGenerationOptions
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `segment_${scene.id}.mp4`);

    let command = `ffmpeg -loop 1 -i "${scene.imagePath}"`;

    // Add narration audio if available
    if (scene.narrationPath) {
      command += ` -i "${scene.narrationPath}"`;
    }

    // Set duration
    command += ` -t ${scene.duration}`;

    // Set video codec and quality
    command += ` -c:v libx264 -preset medium -crf 23`;

    // Set audio codec if narration is present
    if (scene.narrationPath) {
      command += ` -c:a aac -b:a 128k`;
    } else {
      command += ` -an`; // No audio
    }

    // Set frame rate
    command += ` -r ${options.frameRate || 30}`;

    // Set resolution
    const resolution = this.getResolutionDimensions(options.resolution || '1080p');
    command += ` -s ${resolution.width}x${resolution.height}`;

    // Add text overlays
    scene.textOverlays.forEach((overlay, index) => {
      const fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; // Default font path
      command += ` -vf "drawtext=text='${this.escapeText(overlay.text)}':x=${overlay.position.x}:y=${overlay.position.y}:`;
      command += `fontsize=${overlay.style.fontSize}:fontcolor=${overlay.style.fontColor}:fontfile=${fontFile}`;
      if (overlay.style.backgroundColor) {
        command += `:box=1:boxcolor=${overlay.style.backgroundColor}@0.8:boxborderw=10`;
      }
      command += `"`;
    });

    // Output file
    command += ` -y "${outputPath}"`;

    await execAsync(command);

    return outputPath;
  }

  private async combineVideoSegments(
    segments: string[],
    narration: GeneratedNarration,
    options: VideoGenerationOptions
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `final_video_${Date.now()}.mp4`);

    // Create concat list file
    const concatListPath = path.join(this.tempDir, 'concat_list.txt');
    const concatContent = segments.map(seg => `file '${seg}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);

    // Combine segments
    let command = `ffmpeg -f concat -safe 0 -i "${concatListPath}"`;

    // Add background music if provided
    if (options.backgroundMusic) {
      command += ` -i "${options.backgroundMusic}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2"`;
    }

    // Set output codec and quality
    command += ` -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k`;

    // Output file
    command += ` -y "${outputPath}"`;

    await execAsync(command);

    // Clean up concat list
    await fs.unlink(concatListPath);

    return outputPath;
  }

  private async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace(/\.[^/.]+$/, '_thumbnail.jpg');
    
    // Extract frame at 10% of video duration
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:02 -vframes 1 -q:v 2 "${thumbnailPath}"`;
    await execAsync(command);

    return thumbnailPath;
  }

  private async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    fileSize: number;
    resolution: string;
  }> {
    // Get video duration
    const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout: durationOutput } = await execAsync(durationCommand);
    const duration = parseFloat(durationOutput.trim());

    // Get file size
    const stats = await fs.stat(videoPath);
    const fileSize = stats.size;

    // Get resolution
    const resolutionCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`;
    const { stdout: resolutionOutput } = await execAsync(resolutionCommand);
    const resolution = resolutionOutput.trim();

    return {
      duration,
      fileSize,
      resolution
    };
  }

  private async cleanupTempFiles(files: string[]): Promise<void> {
    await Promise.all(files.map(file => 
      fs.unlink(file).catch(error => 
        logger.warn(`Failed to delete temp file ${file}`, { component: 'VideoGenerator', error })
      )
    ));
  }

  async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(files.map(file => 
        fs.unlink(path.join(this.tempDir, file)).catch(() => {})
      ));
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', { component: 'VideoGenerator', error });
    }
  }
}