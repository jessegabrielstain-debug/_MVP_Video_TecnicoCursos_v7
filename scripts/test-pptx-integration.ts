#!/usr/bin/env tsx
/**
 * Teste de Integração do Processador PPTX
 * 
 * Executa processamento real de arquivos PPTX de teste
 * validando todas as features avançadas implementadas.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processPPTXFile } from '../estudio_ia_videos/app/lib/pptx-processor.js';

const FIXTURES_DIR = 'estudio_ia_videos/app/__tests__/pptx/fixtures';
const TEST_FILES = [
  'multi-slide.pptx',
  'no-metadata.pptx',
];

interface TestResult {
  file: string;
  success: boolean;
  slidesFound: number;
  hasText: boolean;
  hasImages: boolean;
  hasNotes: boolean;
  hasFormatting: boolean;
  duration: number;
  error?: string;
}

function printHeader() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🧪 TESTE DE INTEGRAÇÃO - PROCESSADOR PPTX');
  console.log('═══════════════════════════════════════════════════\n');
}

function printTestResult(result: TestResult) {
  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} ${result.file}`);
  console.log(`   Slides: ${result.slidesFound}`);
  console.log(`   Texto: ${result.hasText ? '✅' : '⚠️'}`);
  console.log(`   Imagens: ${result.hasImages ? '✅' : '⚠️'}`);
  console.log(`   Notas: ${result.hasNotes ? '✅' : '⚠️'}`);
  console.log(`   Formatação: ${result.hasFormatting ? '✅' : '⚠️'}`);
  console.log(`   Tempo: ${result.duration}ms`);
  if (result.error) {
    console.log(`   Erro: ${result.error}`);
  }
  console.log('');
}

function printSummary(results: TestResult[]) {
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const totalSlides = results.reduce((sum, r) => sum + r.slidesFound, 0);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 SUMÁRIO DO TESTE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Arquivos testados: ${total}`);
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${total - successful}`);
  console.log(`📄 Total de slides: ${totalSlides}`);
  console.log(`⏱️  Tempo médio: ${avgDuration.toFixed(0)}ms`);
  
  const score = (successful / total) * 100;
  console.log(`\nScore: ${score.toFixed(1)}%\n`);

  if (score === 100) {
    console.log('✅ Todos os testes passaram!');
  } else if (score >= 80) {
    console.log('⚠️  Maioria dos testes passou, mas há falhas.');
  } else {
    console.log('❌ Muitos testes falharam. Verificar implementação.');
  }
  console.log('');
}

async function testPPTXFile(filePath: string): Promise<TestResult> {
  const fileName = path.basename(filePath);
  const startTime = Date.now();

  try {
    // Ler arquivo
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    // Processar com todas as opções avançadas
    const result = await processPPTXFile(file, 'test-project-id', {
      extractImages: true,
      extractNotes: true,
      extractFormatting: true,
      generateThumbnails: false, // Desabilitado por enquanto
    });

    const duration = Date.now() - startTime;

    // Validar resultado
    const hasText = result.slides.some(s => s.content && s.content.trim().length > 0);
    const hasImages = result.slides.some(s => (s as any).images && (s as any).images.length > 0);
    const hasNotes = result.slides.some(s => (s as any).notes && (s as any).notes.trim().length > 0);
    const hasFormatting = result.slides.some(s => (s as any).formatting);

    return {
      file: fileName,
      success: true,
      slidesFound: result.slides.length,
      hasText,
      hasImages,
      hasNotes,
      hasFormatting,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      file: fileName,
      success: false,
      slidesFound: 0,
      hasText: false,
      hasImages: false,
      hasNotes: false,
      hasFormatting: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  printHeader();

  const results: TestResult[] = [];

  console.log('🔍 Buscando arquivos de teste...\n');

  for (const fileName of TEST_FILES) {
    const filePath = path.join(process.cwd(), FIXTURES_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${fileName}\n`);
      continue;
    }

    console.log(`📄 Processando: ${fileName}`);
    const result = await testPPTXFile(filePath);
    results.push(result);
    printTestResult(result);
  }

  if (results.length === 0) {
    console.log('❌ Nenhum arquivo de teste encontrado!\n');
    process.exit(1);
  }

  printSummary(results);

  // Exit code baseado no resultado
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
