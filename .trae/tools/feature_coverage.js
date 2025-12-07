/**
 * FeatureCoverage – Audita cobertura das features do PRD contra o código:
 * - feature_coverage_report.json
 * - FEATURE_COVERAGE_RESUMO.md
 * Saídas são gravadas em _Fases_REAL
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT, '_Fases_REAL');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function existsPath(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function buildPath(...segments) {
  return path.join(ROOT, ...segments);
}

function evaluateModule(name, paths) {
  const checks = paths.map(p => ({ path: p, exists: existsPath(buildPath(...p)) }));
  const score = Math.round((checks.filter(c => c.exists).length / checks.length) * 100);
  return { name, score, checks };
}

function run() {
  const modules = [
    { name: 'Dashboard Unificado', paths: [ ['estudio_ia_videos','app','dashboard'], ['estudio_ia_videos','app','page.tsx'] ] },
    { name: 'Studio Integrado', paths: [ ['estudio_ia_videos','app','components'], ['estudio_ia_videos','app','lib'] ] },
    { name: 'Biblioteca de Assets', paths: [ ['estudio_ia_videos','app','components'], ['estudio_ia_videos','app','public'] ] },
    { name: 'Centro de Renderização', paths: [ ['estudio_ia_videos','app','workers'], ['estudio_ia_videos','app','server'] ] },
    { name: 'Analytics e Relatórios', paths: [ ['estudio_ia_videos','app','dashboard'], ['estudio_ia_videos','app','compliance'] ] },
    { name: 'Compliance NR', paths: [ ['estudio_ia_videos','app','compliance'], ['estudio_ia_videos','app','components','nr'] ] },
    { name: 'Avatares 3D', paths: [ ['estudio_ia_videos','app','components','avatars'], ['avatar-pipeline','services','a2f'] ] },
    { name: 'TTS e Voice Cloning', paths: [ ['avatar-pipeline','services','tts'], ['estudio_ia_videos','app','services'] ] },
  ];

  const items = modules.map(m => evaluateModule(m.name, m.paths));
  const coverage_total = Math.round(items.reduce((acc, i) => acc + i.score, 0) / items.length);

  ensureOutputDir();
  const jsonPath = path.join(OUTPUT_DIR, 'feature_coverage_report.json');
  const mdPath = path.join(OUTPUT_DIR, 'FEATURE_COVERAGE_RESUMO.md');
  fs.writeFileSync(jsonPath, JSON.stringify({ generated_at: new Date().toISOString(), coverage_total, items }, null, 2), 'utf8');

  const lines = [];
  lines.push('# 📊 Cobertura de Features (PRD vs Código)');
  lines.push(`- Cobertura total: ${coverage_total}%`);
  lines.push('');
  lines.push('## Módulos');
  items.forEach(i => lines.push(`- ${i.name}: ${i.score}%`));
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

  return { jsonPath, mdPath, coverage_total, items };
}

if (require.main === module) {
  const result = run();
  console.log(`✅ FeatureCoverage: cobertura total ${result.coverage_total}% (artefatos em _Fases_REAL)`);
}

module.exports = { run };