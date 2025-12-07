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

const TABLES = [
  'users', // public.users
  'project_categories',
  'project_tags',
  'projects',
  'project_versions',
  'project_collaborators',
  'project_analytics',
  'project_comments',
  'slides',
  'render_jobs',
  'analytics_events',
  'courses',
  'videos',
  'user_progress',
  'nr_courses',
  'nr_modules',
  'nr_templates',
  'timelines',
  'pptx_uploads',
  'pptx_slides',
  'project_history'
];

async function backupTable(tableName: string, backupDir: string) {
  console.log(`📦 Backing up ${tableName}...`);
  
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`❌ Error backing up ${tableName}:`, error.message);
      // Don't throw, just log error and continue to next table? Or fail?
      // For backup, we probably want to know if it failed.
      throw new Error(`Failed to backup ${tableName}: ${error.message}`);
    }

    if (data) {
      allData = allData.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }
  }

  const filePath = path.join(backupDir, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
  console.log(`✅ ${tableName}: ${allData.length} records saved.`);
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(rootDir, 'backups', timestamp);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`🚀 Starting backup to ${backupDir}...`);

  for (const table of TABLES) {
    try {
      await backupTable(table, backupDir);
    } catch (error) {
      console.error(error);
    }
  }

  console.log('✨ Backup completed!');
}

main().catch(console.error);
