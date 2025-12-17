const fs = require('fs');
const path = require('path');

const basePath = 'c:/xampp/htdocs/_MVP_Video_TecnicoCursos_v7/estudio_ia_videos';

const files = [
  'app/api/analytics/metrics/route.ts',
  'app/api/analytics/performance/route.ts',
  'app/api/analytics/realtime/route.ts',
  'app/api/analytics/render-stats/route.ts',
  'app/api/analytics/system/route.ts',
  'app/api/compliance/report/[id]/route.ts',
  'app/api/dashboard/unified-stats/route.ts',
  'app/api/export/quick/route.ts',
  'app/api/heygen/avatars/route.ts',
  'app/api/heygen/credits/route.ts',
  'app/api/heygen/voices/route.ts',
  'app/api/import/pptx-to-timeline/route.ts',
  'app/api/media/watermark/route.ts',
  'app/api/notifications/upload/route.ts',
  'app/api/org/[orgId]/alerts/route.ts',
  'app/api/org/[orgId]/alerts/statistics/route.ts',
  'app/api/org/[orgId]/audit-logs/export/route.ts',
  'app/api/org/[orgId]/audit-logs/route.ts',
  'app/api/recommendations/track/route.ts',
  'app/api/redis/health/route.ts',
  'app/api/render-status/[id]/route.ts',
  'app/api/render/jobs/[jobId]/cancel/route.ts',
  'app/api/render/jobs/[jobId]/retry/route.ts',
  'app/api/templates/[id]/duplicate/route.ts',
  'app/api/templates/[id]/export/route.ts',
  'app/api/templates/[id]/favorite/route.ts',
  'app/api/templates/import/route.ts',
  'app/api/timeline/prepare-composition/route.ts',
  'app/api/tts/elevenlabs/clone/route.ts',
  'app/api/tts/elevenlabs/user/route.ts',
  'app/api/tts/elevenlabs/voices/route.ts',
  'app/api/tts/route.ts',
  'app/api/timeline/elements/route.ts',
  'app/api/v1/analytics/content-analysis/route.ts',
  'app/api/v1/canvas/export-scene/route.ts',
  'app/api/v1/export/queue/status/route.ts',
  'app/api/v1/layout/auto-generate/route.ts',
  'app/api/v1/timeline/multi-track/analytics/route.ts'
];

let totalFixed = 0;

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) {
    console.log('Not found: ' + file);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  
  // Pattern multi-line: logger.error('msg', { \n component: '...', \n error: ... \n })
  // → logger.error('msg', error, { component: '...' })
  content = content.replace(
    /logger\.error\(\s*(['"`][^'"`]+['"`])\s*,\s*\{\s*\n?\s*component:\s*(['"`][^'"`]+['"`])\s*,\s*\n?\s*error:\s*([^\n}]+)\s*\n?\s*\}\s*\)/gs,
    'logger.error($1, $3, { component: $2 })'
  );
  
  // Also try reverse order: error first, then component
  content = content.replace(
    /logger\.error\(\s*(['"`][^'"`]+['"`])\s*,\s*\{\s*\n?\s*error:\s*([^\n,}]+)\s*,?\s*\n?\s*component:\s*(['"`][^'"`]+['"`])\s*\n?\s*\}\s*\)/gs,
    'logger.error($1, $2, { component: $3 })'
  );
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    totalFixed++;
    console.log('Fixed: ' + file);
  }
});

console.log('\nTotal files fixed: ' + totalFixed);
