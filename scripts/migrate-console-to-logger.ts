/**
 * 🔧 Script de Migração: Console.* → Logger Profissional
 * 
 * Substitui console.log, console.error, console.warn, console.info por logger estruturado
 * 
 * Execução: npx tsx scripts/migrate-console-to-logger.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

// Diretórios para processar
const DIRECTORIES = [
  path.join(__dirname, '../estudio_ia_videos/app/api'),
  path.join(__dirname, '../estudio_ia_videos/app/lib'),
  path.join(__dirname, '../estudio_ia_videos/app/hooks'),
];

// Padrões de console.* para substituir
const CONSOLE_PATTERNS = [
  {
    name: 'console.log',
    logger: 'logger.info',
    level: 'info',
  },
  {
    name: 'console.error',
    logger: 'logger.error',
    level: 'error',
  },
  {
    name: 'console.warn',
    logger: 'logger.warn',
    level: 'warn',
  },
  {
    name: 'console.info',
    logger: 'logger.info',
    level: 'info',
  },
  {
    name: 'console.debug',
    logger: 'logger.debug',
    level: 'debug',
  },
];

interface MigrationResult {
  file: string;
  replacements: number;
  errors: string[];
  warnings: string[];
}

interface Replacement {
  original: string;
  replacement: string;
  line: number;
}

/**
 * Extrai o nome do componente do caminho do arquivo
 */
function extractComponentName(filePath: string): string {
  const fileName = path.basename(filePath, path.extname(filePath));
  // Converte kebab-case para PascalCase
  return fileName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Detecta se o arquivo já importa o logger
 */
function hasLoggerImport(content: string): boolean {
  return /import.*logger.*from.*['"]@\/lib\/logger['"]/.test(content);
}

/**
 * Adiciona import do logger se necessário
 */
function ensureLoggerImport(content: string, filePath: string): string {
  if (hasLoggerImport(content)) {
    return content;
  }

  // Encontra a última linha de import
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    } else if (lastImportIndex >= 0 && importLines[i].trim() === '') {
      break;
    }
  }

  const loggerImport = "import { logger } from '@/lib/logger';";
  
  if (lastImportIndex >= 0) {
    importLines.splice(lastImportIndex + 1, 0, loggerImport);
  } else {
    importLines.unshift(loggerImport);
  }

  return importLines.join('\n');
}

/**
 * Converte console.* para logger estruturado
 */
function convertConsoleToLogger(
  content: string,
  filePath: string
): { converted: string; replacements: Replacement[] } {
  const componentName = extractComponentName(filePath);
  const replacements: Replacement[] = [];
  let converted = content;
  const lines = content.split('\n');

  CONSOLE_PATTERNS.forEach(pattern => {
    const regex = new RegExp(
      `(${pattern.name.replace('.', '\\.')})\\s*\\(([^)]+)\\)`,
      'g'
    );

    converted = converted.replace(regex, (match, consoleMethod, args) => {
      const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
      
      // Limpa os argumentos
      const cleanArgs = args.trim();
      
      // Detecta se há múltiplos argumentos (mensagem + objeto)
      const argsMatch = cleanArgs.match(/^(['"`][^'"`]*['"`])\s*,\s*(.+)$/);
      
      let replacement: string;
      
      if (argsMatch) {
        // Padrão: console.log('message', { data })
        const message = argsMatch[1];
        const context = argsMatch[2];
        replacement = `${pattern.logger}(${message}, { component: '${componentName}', ...${context} })`;
      } else if (cleanArgs.match(/^['"`]/)) {
        // Padrão: console.log('message')
        replacement = `${pattern.logger}(${cleanArgs}, { component: '${componentName}' })`;
      } else {
        // Padrão: console.log(variable)
        replacement = `${pattern.logger}('${componentName}:', ${cleanArgs}, { component: '${componentName}' })`;
      }

      replacements.push({
        original: match,
        replacement,
        line: lineNumber,
      });

      return replacement;
    });
  });

  return { converted, replacements };
}

/**
 * Processa um arquivo
 */
function processFile(filePath: string): MigrationResult {
  const result: MigrationResult = {
    file: filePath,
    replacements: 0,
    errors: [],
    warnings: [],
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Ignora arquivos de teste
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      result.warnings.push('Arquivo de teste ignorado');
      return result;
    }

    // Converte console.* para logger
    const { converted, replacements } = convertConsoleToLogger(content, filePath);

    if (replacements.length > 0) {
      // Adiciona import do logger se necessário
      const withImport = ensureLoggerImport(converted, filePath);
      
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, withImport, 'utf-8');
      }

      result.replacements = replacements.length;
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
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

    const tsFiles = await glob('**/*.{ts,tsx}', {
      cwd: dir,
      absolute: true,
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
    });

    files.push(...tsFiles);
  }

  return files;
}

/**
 * Executa a migração
 */
async function main() {
  console.log('🚀 Iniciando migração console.* → logger...\n');

  if (DRY_RUN) {
    console.log('🔍 Modo DRY-RUN: nenhuma alteração será feita\n');
  }

  const files = await findFiles();
  console.log(`📁 Encontrados ${files.length} arquivos para processar\n`);

  const results: MigrationResult[] = [];
  let totalReplacements = 0;

  for (const file of files) {
    const result = processFile(file);
    results.push(result);
    totalReplacements += result.replacements;

    if (result.replacements > 0) {
      const status = DRY_RUN ? '🔍' : '✅';
      console.log(
        `${status} ${path.relative(process.cwd(), file)}: ${result.replacements} substituições`
      );
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumo da Migração');
  console.log('='.repeat(60));
  console.log(`Total de arquivos processados: ${files.length}`);
  console.log(`Total de substituições: ${totalReplacements}`);
  console.log(`Arquivos modificados: ${results.filter(r => r.replacements > 0).length}`);

  const errors = results.filter(r => r.errors.length > 0);
  if (errors.length > 0) {
    console.log(`\n❌ Erros encontrados: ${errors.length}`);
    errors.forEach(r => {
      console.log(`  - ${r.file}: ${r.errors.join(', ')}`);
    });
  }

  const warnings = results.filter(r => r.warnings.length > 0);
  if (warnings.length > 0) {
    console.log(`\n⚠️  Avisos: ${warnings.length}`);
    warnings.forEach(r => {
      console.log(`  - ${r.file}: ${r.warnings.join(', ')}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n💡 Execute sem --dry-run para aplicar as alterações');
  } else {
    console.log('\n✅ Migração concluída!');
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

