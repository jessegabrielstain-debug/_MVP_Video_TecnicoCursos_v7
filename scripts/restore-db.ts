import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Order matters for foreign keys!
const RESTORE_ORDER = [
  'users', // Depends on auth.users (must exist!)
  'project_categories',
  'project_tags',
  'courses',
  'nr_courses',
  'nr_templates',
  'projects', // Depends on users
  'nr_modules', // Depends on nr_courses
  'videos', // Depends on courses
  'user_progress', // Depends on users, videos
  'project_versions',
  'project_collaborators',
  'project_analytics',
  'project_comments',
  'slides',
  'render_jobs',
  'timelines',
  'pptx_uploads',
  'pptx_slides', // Depends on pptx_uploads
  'project_history',
  'analytics_events'
];

async function restoreTable(tableName: string, backupDir: string) {
  const filePath = path.join(backupDir, `${tableName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Backup file for ${tableName} not found. Skipping.`);
    return;
  }

  console.log(`♻️ Restoring ${tableName}...`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = JSON.parse(fileContent);

  if (records.length === 0) {
    console.log(`   No records to restore for ${tableName}.`);
    return;
  }

  // Upsert in chunks to avoid payload limits
  const chunkSize = 100;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(chunk, { onConflict: 'id' }); // Assuming 'id' is PK for all tables

    if (error) {
      console.error(`❌ Error restoring chunk ${i/chunkSize + 1} of ${tableName}:`, error.message);
      // Continue or abort? Aborting might be safer to avoid partial state.
      // But for now, let's log and try next chunk.
    }
  }

  console.log(`✅ ${tableName}: Processed ${records.length} records.`);
}

async function main() {
  const args = process.argv.slice(2);
  const backupName = args[0];

  if (!backupName) {
    console.error('❌ Please provide the backup folder name (e.g., 2025-11-30T12-00-00-000Z)');
    console.log('Usage: npx tsx scripts/restore-db.ts <backup-folder-name>');
    
    // List available backups
    const backupsDir = path.join(rootDir, 'backups');
    if (fs.existsSync(backupsDir)) {
      console.log('\nAvailable backups:');
      const backups = fs.readdirSync(backupsDir).filter(f => fs.statSync(path.join(backupsDir, f)).isDirectory());
      backups.forEach(b => console.log(` - ${b}`));
    }
    process.exit(1);
  }

  const backupDir = path.join(rootDir, 'backups', backupName);
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  console.log(`🚀 Starting restore from ${backupName}...`);
  console.log('⚠️  WARNING: This will overwrite existing records with the same ID.');
  console.log('⚠️  Ensure auth.users exist for the users being restored.');
  
  // Wait 3 seconds for user to cancel if needed
  await new Promise(resolve => setTimeout(resolve, 3000));

  for (const table of RESTORE_ORDER) {
    try {
      await restoreTable(table, backupDir);
    } catch (error) {
      console.error(error);
    }
  }

  console.log('✨ Restore completed!');
}

main().catch(console.error);
