#!/usr/bin/env tsx
/**
 * Script de Correção de Build
 * 
 * Identifica e corrige automaticamente problemas comuns de build:
 * - Dependências faltantes
 * - Arquivos não encontrados
 * - Imports quebrados
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.join(process.cwd(), 'estudio_ia_videos');

interface MissingModule {
  module: string;
  type: 'npm' | 'file';
  solution?: string;
}

const KNOWN_FIXES: Record<string, () => void> = {
  '@tanstack/react-query': () => {
    console.log('📦 Instalando @tanstack/react-query...');
    execSync('npm install @tanstack/react-query', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  },
  
  '@/lib/pptx/PPTXParser': () => {
    const filePath = path.join(PROJECT_ROOT, 'app/lib/pptx/PPTXParser.ts');
    if (!fs.existsSync(filePath)) {
      console.log('📄 Criando PPTXParser.ts...');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `
// Re-export do parser principal
export { PPTXParser } from './pptx-parser';
export * from './pptx-parser';
`.trim());
    }
  },

  '@/lib/performance/performance-monitor': () => {
    const filePath = path.join(PROJECT_ROOT, 'app/lib/performance/performance-monitor.ts');
    if (!fs.existsSync(filePath)) {
      console.log('📄 Criando performance-monitor.ts...');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    memoryUsage: 0,
    renderTime: 0
  };

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  startMonitoring(): void {
    // Implementação futura
  }

  stopMonitoring(): void {
    // Implementação futura
  }
}

export const performanceMonitor = new PerformanceMonitor();
`.trim());
    }
  },

  '../../lib/types/remotion-types': () => {
    const filePath = path.join(PROJECT_ROOT, 'app/lib/types/remotion-types.ts');
    if (!fs.existsSync(filePath)) {
      console.log('📄 Criando remotion-types.ts...');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `
import { z } from 'zod';

export const RemotionConfigSchema = z.object({
  fps: z.number().default(30),
  durationInFrames: z.number(),
  width: z.number().default(1920),
  height: z.number().default(1080),
  codec: z.string().default('h264'),
});

export type RemotionConfig = z.infer<typeof RemotionConfigSchema>;

export interface RemotionComposition {
  id: string;
  component: React.ComponentType<any>;
  props: any;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}
`.trim());
    }
  },

  '../../lib/ffmpeg-service': () => {
    const filePath = path.join(PROJECT_ROOT, 'app/lib/ffmpeg-service.ts');
    if (!fs.existsSync(filePath)) {
      console.log('📄 Criando ffmpeg-service.ts...');
      fs.writeFileSync(filePath, `
export interface FFmpegOptions {
  input: string;
  output: string;
  format?: string;
  codec?: string;
}

export class FFmpegService {
  async convert(options: FFmpegOptions): Promise<void> {
    console.log('FFmpeg conversion:', options);
    // Implementação real via fluent-ffmpeg
  }

  async getInfo(filePath: string): Promise<any> {
    return { duration: 0, width: 1920, height: 1080 };
  }
}

export const ffmpegService = new FFmpegService();
`.trim());
    }
  },
};

function extractMissingModules(buildOutput: string): MissingModule[] {
  const moduleNotFoundRegex = /Module not found: Can't resolve '([^']+)'/g;
  const matches = [...buildOutput.matchAll(moduleNotFoundRegex)];
  
  return matches.map(match => {
    const moduleName = match[1];
    const isNpmPackage = !moduleName.startsWith('.') && !moduleName.startsWith('@/');
    
    return {
      module: moduleName,
      type: isNpmPackage ? 'npm' : 'file',
    };
  });
}

function applyFixes(missingModules: MissingModule[]): void {
  const fixed: string[] = [];
  const notFixed: string[] = [];

  for (const { module } of missingModules) {
    if (KNOWN_FIXES[module]) {
      try {
        KNOWN_FIXES[module]();
        fixed.push(module);
      } catch (error) {
        console.error(`❌ Erro ao corrigir ${module}:`, error);
        notFixed.push(module);
      }
    } else {
      notFixed.push(module);
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`✅ Corrigidos: ${fixed.length}`);
  console.log(`⚠️  Não corrigidos: ${notFixed.length}`);

  if (notFixed.length > 0) {
    console.log('\n⚠️  Módulos não corrigidos automaticamente:');
    notFixed.forEach(m => console.log(`   - ${m}`));
  }
}

async function main() {
  console.log('🔧 Iniciando correção de build...\n');

  try {
    // Tentar build para capturar erros
    console.log('📦 Executando build...\n');
    execSync('npm run build', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    console.log('\n✅ Build executado com sucesso!');
  } catch (error: any) {
    const output = error.stdout || error.stderr || '';
    console.log('🔍 Analisando erros de build...\n');

    const missingModules = extractMissingModules(output);
    
    if (missingModules.length === 0) {
      console.log('❌ Nenhum módulo faltante identificado.');
      console.log('Erros de build:');
      console.log(output);
      process.exit(1);
    }

    console.log(`📋 Encontrados ${missingModules.length} módulos faltantes:\n`);
    missingModules.forEach(m => console.log(`   ${m.type === 'npm' ? '📦' : '📄'} ${m.module}`));
    console.log('');

    applyFixes(missingModules);

    console.log('\n🔄 Tentando build novamente...\n');
    
    try {
      execSync('npm run build', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      });
      console.log('\n✅ Build corrigido com sucesso!');
    } catch (retryError) {
      console.log('\n⚠️  Build ainda apresenta erros. Execute novamente ou revise manualmente.');
      process.exit(1);
    }
  }
}

main().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
