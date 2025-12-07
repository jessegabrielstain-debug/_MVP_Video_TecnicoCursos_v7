/**
 * DocSync – Processa documentos em .trae/documents e gera:
 * - implementation_plan.json (tarefas estruturadas)
 * - IMPLEMENTACAO_RESUMO.md (resumo executivo)
 *
 * Saídas são gravadas em _Fases_REAL.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT, '.trae', 'documents');
const OUTPUT_DIR = path.join(ROOT, '_Fases_REAL');

// Palavras-chave para identificar tarefas (PT-BR)
const TASK_KEYWORDS = [
  'implementar', 'configurar', 'integrar', 'adicionar', 'criar', 'corrigir',
  'otimizar', 'validar', 'testar', 'migrar', 'atualizar', 'padronizar',
  'documentar', 'provisionar', 'securizar', 'monitorar'
];

const REQUIRED_DOCS = [
  'PRD_SISTEMA_INTEGRADO_UNIFICADO.md',
  'ARQUITETURA_TECNICA_IMPLEMENTACAO.md',
  'ESPECIFICACOES_TECNICAS_DETALHADAS.md',
  'Plano_Implementacao_Funcionalidades_Reais.md'
];

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function listMarkdownFiles(dir) {
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.md'));
  return files.map(f => ({ name: f, fullPath: path.join(dir, f) }));
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
}

function lineLooksLikeTask(line) {
  const trimmed = line.trim();
  if (!/^[-*•]/.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  return TASK_KEYWORDS.some(k => lower.includes(k));
}

function derivePriority(text) {
  const t = text.toLowerCase();
  if (/(crítico|segurança|auth|autenticação|compliance|deploy|produção)/.test(t)) return 'alta';
  if (/(integração|banco|api|storage|render|fila|cache)/.test(t)) return 'media';
  return 'baixa';
}

function parseDocs() {
  const files = listMarkdownFiles(DOCS_DIR);
  const tasks = [];
  const headings = [];

  files.forEach((file, fileIdx) => {
    const raw = readFileSafe(file.fullPath);
    const text = normalizeText(raw);
    if (!text) return;

    // Coleta headings
    const hMatches = text.match(/^#{1,3}\s+.*$/gm) || [];
    hMatches.forEach(h => headings.push({ doc: file.name, heading: h.replace(/^#+\s+/, '').trim() }));

    // Coleta linhas de possíveis tarefas
    const lines = text.split('\n');
    lines.forEach((line, lineIdx) => {
      if (lineLooksLikeTask(line)) {
        const title = line.replace(/^[-*•]\s*/, '').trim();
        tasks.push({
          id: `DOC${fileIdx + 1}_T${lineIdx + 1}`,
          title,
          source_doc: file.name,
          priority: derivePriority(title)
        });
      }
    });
  });

  return { tasks, headings, files: files.map(f => f.name) };
}

function validateRequiredDocs() {
  const missing = [];
  REQUIRED_DOCS.forEach(name => {
    const full = path.join(DOCS_DIR, name);
    const content = readFileSafe(full);
    if (!content || content.trim().length < 20) {
      missing.push(name);
    }
  });
  return { ok: missing.length === 0, missing };
}

function generatePlan(parsed) {
  const { tasks, files } = parsed;
  const summary = {
    total_docs: files.length,
    total_tasks: tasks.length,
    by_priority: {
      alta: tasks.filter(t => t.priority === 'alta').length,
      media: tasks.filter(t => t.priority === 'media').length,
      baixa: tasks.filter(t => t.priority === 'baixa').length,
    },
    generated_at: new Date().toISOString()
  };

  return { summary, tasks };
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeOutputs(plan, parsed) {
  ensureOutputDir();
  const jsonPath = path.join(OUTPUT_DIR, 'implementation_plan.json');
  const mdPath = path.join(OUTPUT_DIR, 'IMPLEMENTACAO_RESUMO.md');

  fs.writeFileSync(jsonPath, JSON.stringify(plan, null, 2), 'utf8');

  const lines = [];
  lines.push(`# ✅ Plano de Implementação – Saída Automatizada`);
  lines.push('');
  lines.push(`- Documentos analisados: ${plan.summary.total_docs}`);
  lines.push(`- Tarefas extraídas: ${plan.summary.total_tasks}`);
  lines.push(`- Prioridade alta: ${plan.summary.by_priority.alta}`);
  lines.push(`- Prioridade média: ${plan.summary.by_priority.media}`);
  lines.push(`- Prioridade baixa: ${plan.summary.by_priority.baixa}`);
  lines.push('');
  lines.push('## Tarefas');
  plan.tasks.slice(0, 200).forEach(t => {
    lines.push(`- [${t.priority}] ${t.title} (fonte: ${t.source_doc})`);
  });
  lines.push('');
  lines.push('## Documentos Considerados');
  parsed.files.forEach(f => lines.push(`- ${f}`));

  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

  return { jsonPath, mdPath };
}

async function run() {
  const validation = validateRequiredDocs();
  if (!validation.ok) {
    throw new Error(`Documentos obrigatórios ausentes ou incompletos: ${validation.missing.join(', ')}`);
  }
  const parsed = parseDocs();
  const plan = generatePlan(parsed);
  const outputs = writeOutputs(plan, parsed);
  return { outputs, plan, parsed };
}

if (require.main === module) {
  const shouldRun = process.argv.includes('--run');
  if (shouldRun) {
    run()
      .then(({ outputs, plan }) => {
        console.log('✅ Saídas geradas com sucesso:');
        console.log('   -', outputs.jsonPath);
        console.log('   -', outputs.mdPath);
        console.log('📊 Tarefas:', plan.summary.total_tasks);
      })
      .catch(err => {
        console.error('❌ Falha na geração de saídas:', err.message);
        process.exit(1);
      });
  } else {
    console.log('Use: node .trae/tools/doc_sync.js --run');
  }
}

module.exports = {
  parseDocs,
  validateRequiredDocs,
  generatePlan,
  writeOutputs,
  run,
};