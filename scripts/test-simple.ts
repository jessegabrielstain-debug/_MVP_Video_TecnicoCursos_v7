console.log('🚀 Starting simple test...');

import fs from 'fs/promises';
import path from 'path';

console.log('📁 Creating docs directory...');

const docsDir = path.resolve(process.cwd(), 'docs');

async function main() {
  try {
    console.log(`Creating directory: ${docsDir}`);
    await fs.mkdir(docsDir, { recursive: true });
    
    console.log('📝 Creating test file...');
    const testFile = path.join(docsDir, 'test.json');
    await fs.writeFile(testFile, JSON.stringify({ test: true }, null, 2));
    
    console.log('✅ Success!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();