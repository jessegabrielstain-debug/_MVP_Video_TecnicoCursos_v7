/**
 * Bundle Analysis Script
 * 
 * Analisa o bundle do Next.js e gera relatório de otimização.
 * Uso: npx ts-node scripts/analyze-bundle.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface BundleInfo {
  name: string;
  size: number;
  sizeKb: string;
  type: 'shared' | 'page' | 'chunk';
}

interface BundleAnalysis {
  timestamp: string;
  totalSize: number;
  totalSizeFormatted: string;
  chunks: BundleInfo[];
  largestChunks: BundleInfo[];
  recommendations: string[];
  treeshakingOpportunities: string[];
}

const BUILD_DIR = path.join(__dirname, '..', 'estudio_ia_videos', '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static', 'chunks');

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getChunkType(filename: string): 'shared' | 'page' | 'chunk' {
  if (filename.includes('pages/') || filename.includes('app/')) return 'page';
  if (filename.includes('framework') || filename.includes('main')) return 'shared';
  return 'chunk';
}

function scanDirectory(dir: string, basePath: string = ''): BundleInfo[] {
  const results: BundleInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return results;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...scanDirectory(fullPath, relativePath));
    } else if (item.endsWith('.js')) {
      results.push({
        name: relativePath,
        size: stat.size,
        sizeKb: formatBytes(stat.size),
        type: getChunkType(relativePath),
      });
    }
  }
  
  return results;
}

function findLargeImports(chunk: BundleInfo): string[] {
  const warnings: string[] = [];
  const content = fs.readFileSync(path.join(STATIC_DIR, chunk.name), 'utf8');
  
  // Check for common large libraries that might not be tree-shaken
  const largeLibs = [
    { name: 'lodash', pattern: /lodash(?!-es)/, recommendation: 'Use lodash-es or specific imports like lodash/get' },
    { name: 'moment', pattern: /moment/, recommendation: 'Consider using dayjs or date-fns' },
    { name: 'axios', pattern: /axios/, recommendation: 'Consider using fetch API' },
    { name: '@material-ui/core', pattern: /@material-ui\/core"/, recommendation: 'Use specific component imports' },
    { name: 'react-icons (full)', pattern: /react-icons\/all/, recommendation: 'Import specific icon sets' },
  ];
  
  for (const lib of largeLibs) {
    if (lib.pattern.test(content)) {
      warnings.push(`${lib.name}: ${lib.recommendation}`);
    }
  }
  
  return warnings;
}

function generateRecommendations(chunks: BundleInfo[]): string[] {
  const recommendations: string[] = [];
  const totalSize = chunks.reduce((acc, c) => acc + c.size, 0);
  
  // Large total bundle
  if (totalSize > 500 * 1024) {
    recommendations.push('Total bundle size exceeds 500KB - consider code splitting');
  }
  
  // Large individual chunks
  const largeChunks = chunks.filter(c => c.size > 100 * 1024);
  if (largeChunks.length > 0) {
    recommendations.push(`${largeChunks.length} chunks exceed 100KB - review for optimization`);
  }
  
  // Too many chunks
  if (chunks.length > 50) {
    recommendations.push('High number of chunks detected - consider consolidating small modules');
  }
  
  // Shared chunks analysis
  const sharedChunks = chunks.filter(c => c.type === 'shared');
  const sharedSize = sharedChunks.reduce((acc, c) => acc + c.size, 0);
  if (sharedSize > totalSize * 0.6) {
    recommendations.push('Shared chunks represent >60% of bundle - review framework dependencies');
  }
  
  return recommendations;
}

function analyzeBuildManifest(): { routes: string[]; dynamicImports: string[] } {
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    return { routes: [], dynamicImports: [] };
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const routes = Object.keys(manifest.pages || {});
  const dynamicImports: string[] = [];
  
  // Check for dynamic imports
  for (const [route, chunks] of Object.entries(manifest.pages || {})) {
    if (Array.isArray(chunks) && chunks.length > 3) {
      dynamicImports.push(`${route}: ${chunks.length} chunks`);
    }
  }
  
  return { routes, dynamicImports };
}

async function main() {
  console.log('🔍 Analyzing Next.js bundle...\n');
  
  // Check if build exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  // Scan chunks
  const chunks = scanDirectory(STATIC_DIR);
  
  if (chunks.length === 0) {
    console.error('❌ No chunks found. Build may be incomplete.');
    process.exit(1);
  }
  
  // Sort by size
  chunks.sort((a, b) => b.size - a.size);
  
  const totalSize = chunks.reduce((acc, c) => acc + c.size, 0);
  const largestChunks = chunks.slice(0, 10);
  
  // Analyze build manifest
  const { routes, dynamicImports } = analyzeBuildManifest();
  
  // Generate recommendations
  const recommendations = generateRecommendations(chunks);
  
  // Check for tree-shaking opportunities
  const treeshakingOpportunities: string[] = [];
  for (const chunk of largestChunks) {
    try {
      const warnings = findLargeImports(chunk);
      treeshakingOpportunities.push(...warnings);
    } catch {
      // Ignore read errors
    }
  }
  
  // Build analysis report
  const analysis: BundleAnalysis = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    chunks,
    largestChunks,
    recommendations: [...new Set(recommendations)],
    treeshakingOpportunities: [...new Set(treeshakingOpportunities)],
  };
  
  // Output report
  console.log('📊 Bundle Analysis Report');
  console.log('========================\n');
  
  console.log(`📦 Total Size: ${analysis.totalSizeFormatted}`);
  console.log(`📄 Total Chunks: ${chunks.length}`);
  console.log(`🛤️  Routes: ${routes.length}\n`);
  
  console.log('🔝 Top 10 Largest Chunks:');
  console.log('--------------------------');
  for (const chunk of largestChunks) {
    const bar = '█'.repeat(Math.ceil(chunk.size / 10240));
    console.log(`  ${chunk.sizeKb.padEnd(10)} ${chunk.name}`);
    console.log(`             ${bar}`);
  }
  
  console.log('\n📈 Chunk Distribution:');
  console.log('-----------------------');
  const shared = chunks.filter(c => c.type === 'shared');
  const pages = chunks.filter(c => c.type === 'page');
  const other = chunks.filter(c => c.type === 'chunk');
  console.log(`  Shared (framework): ${shared.length} chunks, ${formatBytes(shared.reduce((a, c) => a + c.size, 0))}`);
  console.log(`  Pages: ${pages.length} chunks, ${formatBytes(pages.reduce((a, c) => a + c.size, 0))}`);
  console.log(`  Other: ${other.length} chunks, ${formatBytes(other.reduce((a, c) => a + c.size, 0))}`);
  
  if (analysis.recommendations.length > 0) {
    console.log('\n⚠️  Recommendations:');
    console.log('--------------------');
    for (const rec of analysis.recommendations) {
      console.log(`  • ${rec}`);
    }
  }
  
  if (analysis.treeshakingOpportunities.length > 0) {
    console.log('\n🌳 Tree-shaking Opportunities:');
    console.log('------------------------------');
    for (const opp of analysis.treeshakingOpportunities) {
      console.log(`  • ${opp}`);
    }
  }
  
  if (dynamicImports.length > 0) {
    console.log('\n🔄 Routes with many chunks (consider lazy loading):');
    console.log('---------------------------------------------------');
    for (const di of dynamicImports) {
      console.log(`  • ${di}`);
    }
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'bundle-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n✅ Report saved to: ${reportPath}`);
  
  // Exit with error if bundle is too large
  if (totalSize > 2 * 1024 * 1024) {
    console.log('\n❌ Bundle exceeds 2MB threshold!');
    process.exit(1);
  }
  
  console.log('\n✅ Analysis complete!');
}

main().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
