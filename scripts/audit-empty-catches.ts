/**
 * 🔍 Script de Auditoria: Catches Vazios
 * 
 * Encontra e categoriza todos os `.catch(() => {})` no código
 * 
 * Execução: npx tsx scripts/audit-empty-catches.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECTORIES = [
  path.join(__dirname, '../estudio_ia_videos/app/api'),
  path.join(__dirname, '../estudio_ia_videos/app/lib'),
  path.join(__dirname, '../estudio_ia_videos/app/hooks'),
  path.join(__dirname, '../estudio_ia_videos/app/components'),
];

interface CatchInfo {
  file: string;
  line: number;
  code: string;
  context: string;
  category: 'cleanup' | 'silent_error' | 'critical' | 'unknown';
  recommendation: string;
}

// Padrões para identificar tipo de catch
const CLEANUP_PATTERNS = [
  /fs\.unlink/i,
  /\.unlink/i,
  /cleanup/i,
  /remove/i,
  /delete.*file/i,
  /temp.*file/i,
];

const CRITICAL_PATTERNS = [
  /upload/i,
  /save/i,
  /create/i,
  /update/i,
  /delete.*record/i,
  /api.*call/i,
  /fetch/i,
  /render/i,
  /generate/i,
];

/**
 * Categoriza um catch vazio baseado no contexto
 */
function categorizeCatch(code: string, context: string): CatchInfo['category'] {
  const lowerCode = code.toLowerCase();
  const lowerContext = context.toLowerCase();

  // Cleanup intencional
  if (CLEANUP_PATTERNS.some(pattern => pattern.test(lowerCode) || pattern.test(lowerContext))) {
    return 'cleanup';
  }

  // Operações críticas
  if (CRITICAL_PATTERNS.some(pattern => pattern.test(lowerCode) || pattern.test(lowerContext))) {
    return 'critical';
  }

  // Erro silencioso (padrão)
  return 'silent_error';
}

/**
 * Gera recomendação baseada na categoria
 */
function getRecommendation(category: CatchInfo['category'], code: string): string {
  switch (category) {
    case 'cleanup':
      return '✅ OK se documentado: Adicionar comentário explicando que cleanup failures são ignorados intencionalmente';
    
    case 'critical':
      return '❌ CRÍTICO: Adicionar logging e retry pattern. Exemplo:\n' +
             '  .catch((error) => {\n' +
             '    logger.error("Operation failed", error, { component: "..." });\n' +
             '    // Consider retry or alerting\n' +
             '  })';
    
    case 'silent_error':
      return '⚠️  Adicionar logging mínimo: logger.warn("Operation failed silently", { component: "..." })';
    
    default:
      return '🔍 Revisar manualmente';
  }
}

/**
 * Encontra catches vazios em um arquivo
 */
function findEmptyCatches(filePath: string): CatchInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const catches: CatchInfo[] = [];

  // Padrões para catch vazio
  const patterns = [
    /\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/g,           // .catch(() => {})
    /\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\/\/.*?\}\s*\)/g,     // .catch(() => { // comment })
    /\.catch\s*\(\s*\{\s*\}\s*\)/g,                        // .catch({})
    /catch\s*\(\s*\)\s*\{\s*\}\s*$/,                        // catch () {}
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1]?.trim() || '';
      
      // Buscar contexto (linhas anteriores)
      const contextStart = Math.max(0, lineNumber - 5);
      const contextEnd = Math.min(lines.length, lineNumber + 2);
      const context = lines.slice(contextStart, contextEnd).join('\n');

      const code = match[0];
      const category = categorizeCatch(code, context);

      catches.push({
        file: filePath,
        line: lineNumber,
        code: code.trim(),
        context: context.trim(),
        category,
        recommendation: getRecommendation(category, code),
      });
    }
  });

  return catches;
}

/**
 * Encontra todos os arquivos TypeScript/TSX
 */
async function findFiles(): Promise<string[]> {
  const files: string[] = [];

  for (const dir of DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Diretório não encontrado: ${dir}`);
      continue;
    }

    const tsFiles = await new Promise<string[]>((resolve, reject) => {
      glob('**/*.{ts,tsx}', {
        cwd: dir,
        absolute: true,
        ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/__tests__/**'],
      }, (err, matches) => {
        if (err) reject(err);
        else resolve(matches || []);
      });
    });

    files.push(...tsFiles);
  }

  return files;
}

/**
 * Gera relatório
 */
function generateReport(catches: CatchInfo[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 Relatório de Auditoria: Catches Vazios');
  console.log('='.repeat(80));
  console.log(`\nTotal encontrado: ${catches.length} catches vazios\n`);

  // Agrupar por categoria
  const byCategory = catches.reduce((acc, catchInfo) => {
    if (!acc[catchInfo.category]) {
      acc[catchInfo.category] = [];
    }
    acc[catchInfo.category].push(catchInfo);
    return acc;
  }, {} as Record<string, CatchInfo[]>);

  // Estatísticas
  console.log('📈 Estatísticas por Categoria:');
  Object.entries(byCategory).forEach(([category, items]) => {
    const emoji = category === 'cleanup' ? '✅' : category === 'critical' ? '❌' : '⚠️';
    console.log(`  ${emoji} ${category}: ${items.length} ocorrências`);
  });

  // Detalhes por categoria
  console.log('\n' + '='.repeat(80));
  console.log('📋 Detalhes por Categoria');
  console.log('='.repeat(80));

  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`\n## ${category.toUpperCase()} (${items.length} ocorrências)\n`);
    
    items.forEach((catchInfo, index) => {
      const relativePath = path.relative(process.cwd(), catchInfo.file);
      console.log(`${index + 1}. ${relativePath}:${catchInfo.line}`);
      console.log(`   Código: ${catchInfo.code.substring(0, 60)}...`);
      console.log(`   ${catchInfo.recommendation}`);
      console.log('');
    });
  });

  // Resumo de ações
  console.log('\n' + '='.repeat(80));
  console.log('🎯 Ações Recomendadas');
  console.log('='.repeat(80));
  
  const critical = byCategory.critical?.length || 0;
  const silent = byCategory.silent_error?.length || 0;
  const cleanup = byCategory.cleanup?.length || 0;

  if (critical > 0) {
    console.log(`\n❌ URGENTE: ${critical} catches críticos precisam de logging e retry`);
  }
  
  if (silent > 0) {
    console.log(`\n⚠️  RECOMENDADO: ${silent} catches silenciosos precisam de logging mínimo`);
  }
  
  if (cleanup > 0) {
    console.log(`\n✅ OK: ${cleanup} catches de cleanup podem ser documentados`);
  }

  // Salvar relatório JSON
  const reportPath = path.join(__dirname, '../evidencias/audit-empty-catches.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: catches.length,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([cat, items]) => [
        cat,
        items.map(({ file, line, code, category, recommendation }) => ({
          file: path.relative(process.cwd(), file),
          line,
          code,
          category,
          recommendation,
        })),
      ])
    ),
  }, null, 2));

  console.log(`\n💾 Relatório JSON salvo em: ${path.relative(process.cwd(), reportPath)}`);
}

/**
 * Executa auditoria
 */
async function main() {
  console.log('🔍 Iniciando auditoria de catches vazios...\n');

  const files = await findFiles();
  console.log(`📁 Encontrados ${files.length} arquivos para processar\n`);

  const allCatches: CatchInfo[] = [];

  for (const file of files) {
    try {
      const catches = findEmptyCatches(file);
      allCatches.push(...catches);
    } catch (error) {
      console.error(`❌ Erro ao processar ${file}:`, error);
    }
  }

  generateReport(allCatches);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

