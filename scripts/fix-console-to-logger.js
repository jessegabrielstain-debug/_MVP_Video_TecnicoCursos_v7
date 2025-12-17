const fs = require('fs');
const path = require('path');

const files = [
  'estudio_ia_videos/app/lib/assets-manager.ts',
  'estudio_ia_videos/app/lib/batch-processing-system.ts',
  'estudio_ia_videos/app/lib/local-avatar-renderer.ts',
  'estudio_ia_videos/app/lib/auth/auth-options.ts',
  'estudio_ia_videos/app/lib/cache/redis-optimized.ts',
  'estudio_ia_videos/app/lib/collab/review-workflow.ts',
  'estudio_ia_videos/app/lib/engines/heygen-avatar-engine.ts',
  'estudio_ia_videos/app/lib/export/rendering-pipeline.ts',
  'estudio_ia_videos/app/lib/monitoring/real-time-monitor.ts',
  'estudio_ia_videos/app/lib/orchestrator/avatar-3d-hyperreal-orchestrator.ts',
  'estudio_ia_videos/app/lib/pipeline/integrated-pipeline.ts',
  'estudio_ia_videos/app/lib/projects/index.ts',
  'estudio_ia_videos/app/lib/slides/index.ts',
  'estudio_ia_videos/app/lib/tts/manager.ts',
  'estudio_ia_videos/app/lib/utils/rate-limit.ts'
];

let fixed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Check if logger is already imported
  const hasLoggerImport = content.includes("import { logger }") || content.includes("from '@/lib/logger'");
  
  // Add logger import if needed and file has console.*
  if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn'))) {
    // Find first import statement and add after
    const importMatch = content.match(/^(import .+?['"];?\n)/m);
    if (importMatch) {
      content = content.replace(importMatch[0], importMatch[0] + "import { logger } from '@/lib/logger';\n");
    }
  }
  
  // Replace console.log with logger.debug
  content = content.replace(/console\.log\(/g, 'logger.debug(');
  
  // Replace console.warn with logger.warn  
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  
  // Replace console.error with logger.error
  content = content.replace(/console\.error\(/g, 'logger.error(');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    fixed++;
    console.log('Fixed: ' + file);
  }
}
console.log('\nTotal files fixed: ' + fixed);
