// @ts-ignore
import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';
import path from 'path';

export interface VariableDataRow {
  [key: string]: string | number | boolean;
}

export interface VariableDataTemplate {
  id: string;
  name: string;
  description: string;
  baseVideoPath: string;
  templateText: string;
  variables: VariableDefinition[];
  outputSettings: OutputSettings;
}

export interface VariableDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'video' | 'color' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface OutputSettings {
  format: 'mp4' | 'mov' | 'avi';
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  bitrate: string;
  audioBitrate: string;
}

export interface VideoVariation {
  id: string;
  templateId: string;
  rowData: VariableDataRow;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    duration: number;
    fileSize: number;
    thumbnailPath?: string;
  };
}

export interface VariableDataJob {
  id: string;
  templateId: string;
  csvFilePath: string;
  totalRows: number;
  processedRows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  variations: VideoVariation[];
  outputDirectory: string;
  settings: ProcessingSettings;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface ProcessingSettings {
  maxConcurrentJobs: number;
  retryFailedVariations: boolean;
  generateThumbnails: boolean;
  createZipArchive: boolean;
  notificationEmail?: string;
  webhookUrl?: string;
}

export class VariableDataEngine {
  private jobs: Map<string, VariableDataJob> = new Map();
  private templates: Map<string, VariableDataTemplate> = new Map();

  constructor(private tempDir: string = '/tmp/variable-data') {
    this.ensureTempDirectory();
  }

  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async createTemplate(
    name: string,
    description: string,
    baseVideoPath: string,
    templateText: string,
    variables: VariableDefinition[],
    outputSettings: OutputSettings
  ): Promise<VariableDataTemplate> {
    const template: VariableDataTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      baseVideoPath,
      templateText,
      variables,
      outputSettings,
    };

    this.templates.set(template.id, template);
    return template;
  }

  async validateCSV(csvContent: string, templateId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    rows: VariableDataRow[];
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: [`Template with ID ${templateId} not found`],
        warnings: [],
        rows: [],
      };
    }

    try {
      // Parse CSV
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as VariableDataRow[];

      const errors: string[] = [];
      const warnings: string[] = [];

      if (rows.length === 0) {
        errors.push('CSV file is empty or contains no valid rows');
        return { isValid: false, errors, warnings, rows: [] };
      }

      // Validate headers
      const csvHeaders = Object.keys(rows[0]);
      const templateVariableNames = template.variables.map(v => v.name);
      const missingHeaders = templateVariableNames.filter(name => !csvHeaders.includes(name));
      const extraHeaders = csvHeaders.filter(name => !templateVariableNames.includes(name));

      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      if (extraHeaders.length > 0) {
        warnings.push(`Extra columns found: ${extraHeaders.join(', ')}`);
      }

      // Validate each row
      rows.forEach((row, index) => {
        template.variables.forEach(variable => {
          const value = row[variable.name];
          
          if (variable.required && (value === undefined || value === null || value === '')) {
            errors.push(`Row ${index + 1}: Missing required field '${variable.name}'`);
            return;
          }

          if (value !== undefined && value !== null && value !== '') {
            const validation = this.validateVariableValue(value, variable);
            if (!validation.isValid) {
              errors.push(`Row ${index + 1}: ${validation.error}`);
            }
          }
        });
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        rows,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        rows: [],
      };
    }
  }

  private validateVariableValue(value: unknown, variable: VariableDefinition): {
    isValid: boolean;
    error?: string;
  } {
    switch (variable.type) {
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: `'${variable.name}' must be a number` };
        }
        if (variable.validation?.min !== undefined && numValue < variable.validation.min) {
          return { isValid: false, error: `'${variable.name}' must be at least ${variable.validation.min}` };
        }
        if (variable.validation?.max !== undefined && numValue > variable.validation.max) {
          return { isValid: false, error: `'${variable.name}' must be at most ${variable.validation.max}` };
        }
        break;

      case 'text':
        if (typeof value !== 'string') {
          return { isValid: false, error: `'${variable.name}' must be text` };
        }
        if (variable.validation?.pattern && !new RegExp(variable.validation.pattern).test(value)) {
          return { isValid: false, error: `'${variable.name}' does not match required pattern` };
        }
        if (variable.validation?.options && !variable.validation.options.includes(value)) {
          return { isValid: false, error: `'${variable.name}' must be one of: ${variable.validation.options.join(', ')}` };
        }
        break;

      case 'date':
        const dateValue = new Date(value as string);
        if (isNaN(dateValue.getTime())) {
          return { isValid: false, error: `'${variable.name}' must be a valid date` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          return { isValid: false, error: `'${variable.name}' must be true or false` };
        }
        break;

      case 'color':
        if (!/^#[0-9A-F]{6}$/i.test(value as string) && !/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value as string)) {
          return { isValid: false, error: `'${variable.name}' must be a valid color (hex or rgb)` };
        }
        break;

      case 'image':
      case 'video':
        // Basic validation for file paths or URLs
        if (typeof value !== 'string' || value.length === 0) {
          return { isValid: false, error: `'${variable.name}' must be a valid file path or URL` };
        }
        break;
    }

    return { isValid: true };
  }

  async createVariableDataJob(
    templateId: string,
    csvFilePath: string,
    outputDirectory: string,
    settings: ProcessingSettings
  ): Promise<VariableDataJob> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    // Read and validate CSV
    const csvContent = await fs.readFile(csvFilePath, 'utf-8');
    const validation = await this.validateCSV(csvContent, templateId);
    
    if (!validation.isValid) {
      throw new Error(`CSV validation failed: ${validation.errors.join(', ')}`);
    }

    const job: VariableDataJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      csvFilePath,
      totalRows: validation.rows.length,
      processedRows: 0,
      status: 'pending',
      progress: 0,
      variations: [],
      outputDirectory,
      settings,
      createdAt: new Date(),
    };

    // Create variations for each row
    for (let i = 0; i < validation.rows.length; i++) {
      const row = validation.rows[i];
      const variation: VideoVariation = {
        id: `variation_${job.id}_${i}`,
        templateId,
        rowData: row,
        outputPath: path.join(outputDirectory, `variation_${i + 1}_${Date.now()}.mp4`),
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
      };
      job.variations.push(variation);
    }

    this.jobs.set(job.id, job);
    return job;
  }

  async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Job ${jobId} is already ${job.status}`);
    }

    job.status = 'processing';
    job.startedAt = new Date();

    try {
      const template = this.templates.get(job.templateId);
      if (!template) {
        throw new Error(`Template ${job.templateId} not found`);
      }

      // Process variations in batches based on maxConcurrentJobs
      const batchSize = job.settings.maxConcurrentJobs;
      for (let i = 0; i < job.variations.length; i += batchSize) {
        const batch = job.variations.slice(i, i + batchSize);
        
        // Process batch
        await Promise.all(
          batch.map(variation => this.processVariation(variation, template, job))
        );

        // Update progress
        job.processedRows = Math.min(i + batchSize, job.variations.length);
        job.progress = (job.processedRows / job.totalRows) * 100;
      }

      job.status = 'completed';
      job.completedAt = new Date();

      // Generate thumbnails if requested
      if (job.settings.generateThumbnails) {
        await this.generateThumbnails(job);
      }

      // Create zip archive if requested
      if (job.settings.createZipArchive) {
        await this.createZipArchive(job);
      }

      // Send notifications
      await this.sendNotifications(job);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      throw error;
    }
  }

  private async processVariation(
    variation: VideoVariation,
    template: VariableDataTemplate,
    job: VariableDataJob
  ): Promise<void> {
    variation.status = 'processing';
    variation.progress = 10;

    try {
      // Create output directory
      await fs.mkdir(path.dirname(variation.outputPath), { recursive: true });

      // Generate video with variable data
      const result = await this.generateVideoWithVariables(
        template.baseVideoPath,
        template.templateText,
        variation.rowData,
        template.outputSettings,
        variation.outputPath
      );

      variation.metadata = result;
      variation.status = 'completed';
      variation.progress = 100;
      variation.completedAt = new Date();

    } catch (error) {
      variation.status = 'failed';
      variation.error = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry if enabled
      if (job.settings.retryFailedVariations) {
        console.log(`Retrying variation ${variation.id}...`);
        variation.status = 'pending';
        variation.error = undefined;
        // Implement retry logic here
      }
    }
  }

  private async generateVideoWithVariables(
    baseVideoPath: string,
    templateText: string,
    variables: VariableDataRow,
    outputSettings: OutputSettings,
    outputPath: string
  ): Promise<{ duration: number; fileSize: number }> {
    // This is a placeholder implementation
    // In a real implementation, you would use FFmpeg to:
    // 1. Overlay text with variable data
    // 2. Replace images/videos
    // 3. Apply color changes
    // 4. Generate the final video

    console.log(`Generating video with variables:`, variables);
    console.log(`Template text:`, templateText);
    console.log(`Output settings:`, outputSettings);
    console.log(`Output path:`, outputPath);

    // Simulate video generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a dummy file for now
    await fs.writeFile(outputPath, Buffer.from('dummy video content'));

    return {
      duration: 60, // seconds
      fileSize: 1024 * 1024, // 1MB
    };
  }

  private async generateThumbnails(job: VariableDataJob): Promise<void> {
    // Generate thumbnails for completed variations
    for (const variation of job.variations.filter(v => v.status === 'completed')) {
      try {
        // Generate thumbnail from video
        const thumbnailPath = variation.outputPath.replace(/\.[^/.]+$/, '_thumbnail.jpg');
        
        // This would use FFmpeg to extract a frame from the video
        console.log(`Generating thumbnail for ${variation.id}...`);
        
        if (variation.metadata) {
          variation.metadata.thumbnailPath = thumbnailPath;
        }
      } catch (error) {
        console.error(`Error generating thumbnail for ${variation.id}:`, error);
      }
    }
  }

  private async createZipArchive(job: VariableDataJob): Promise<void> {
    // Create a zip archive of all generated videos
    const zipPath = path.join(job.outputDirectory, `variations_${job.id}.zip`);
    console.log(`Creating zip archive: ${zipPath}`);
    
    // This would use a library like archiver to create the zip file
    // For now, we'll just log the action
  }

  private async sendNotifications(job: VariableDataJob): Promise<void> {
    // Send email notification if configured
    if (job.settings.notificationEmail) {
      console.log(`Sending notification email to ${job.settings.notificationEmail}`);
      // Implement email sending logic
    }

    // Send webhook notification if configured
    if (job.settings.webhookUrl) {
      console.log(`Sending webhook notification to ${job.settings.webhookUrl}`);
      // Implement webhook sending logic
    }
  }

  getJob(jobId: string): VariableDataJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): VariableDataJob[] {
    return Array.from(this.jobs.values());
  }

  getTemplate(templateId: string): VariableDataTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): VariableDataTemplate[] {
    return Array.from(this.templates.values());
  }

  async deleteJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      // Clean up files
      try {
        for (const variation of job.variations) {
          if (variation.outputPath) {
            await fs.unlink(variation.outputPath).catch(() => {});
          }
          if (variation.metadata?.thumbnailPath) {
            await fs.unlink(variation.metadata.thumbnailPath).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Error cleaning up job files:', error);
      }
      
      this.jobs.delete(jobId);
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }

  getJobStats(): {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalVariations: number;
    completedVariations: number;
  } {
    const jobs = this.getAllJobs();
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      totalVariations: jobs.reduce((sum, job) => sum + job.totalRows, 0),
      completedVariations: jobs.reduce((sum, job) => sum + job.variations.filter(v => v.status === 'completed').length, 0),
    };
  }
}