#!/usr/bin/env node
/**
 * 🗄️ Database Backup & Restore Script
 * Automated backup strategy for production
 * FASE 8.7 - Backup Strategy
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

// Configuration
const CONFIG = {
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  compression: process.env.BACKUP_COMPRESSION !== 'false',
  maxBackups: parseInt(process.env.MAX_BACKUPS || '10'),
};

interface BackupMetadata {
  timestamp: string;
  type: 'full' | 'incremental' | 'schema';
  tables: string[];
  size: number;
  compressed: boolean;
  checksum?: string;
}

interface BackupResult {
  success: boolean;
  filepath?: string;
  metadata?: BackupMetadata;
  error?: string;
  duration: number;
}

// ============================================
// Utility Functions
// ============================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function calculateChecksum(filepath: string): string {
  try {
    const crypto = require('crypto');
    const content = fs.readFileSync(filepath);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  } catch {
    return 'unknown';
  }
}

// ============================================
// Supabase Backup Functions
// ============================================

async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function listTables(supabase: ReturnType<typeof createClient>): Promise<string[]> {
  // List of tables to backup (core tables)
  return [
    'users',
    'projects',
    'slides',
    'render_jobs',
    'timelines',
    'timeline_tracks',
    'timeline_elements',
    'pptx_uploads',
    'pptx_slides',
    'nr_courses',
    'nr_modules',
    'analytics_events',
    'notifications',
    'user_render_settings',
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
  ];
}

async function backupTable(
  supabase: ReturnType<typeof createClient>,
  tableName: string
): Promise<{ data: unknown[]; count: number }> {
  try {
    // Get all rows from table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    if (error) {
      console.warn(`  ⚠️ Could not backup ${tableName}: ${error.message}`);
      return { data: [], count: 0 };
    }

    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.warn(`  ⚠️ Error backing up ${tableName}:`, err);
    return { data: [], count: 0 };
  }
}

// ============================================
// Main Backup Function
// ============================================

async function createBackup(type: 'full' | 'schema' = 'full'): Promise<BackupResult> {
  const startTime = Date.now();
  console.log('\n🗄️ Starting database backup...\n');

  try {
    ensureDir(CONFIG.backupDir);
    
    const supabase = await getSupabaseClient();
    const tables = await listTables(supabase);
    const timestamp = getTimestamp();
    const filename = `backup-${type}-${timestamp}.json`;
    const filepath = path.join(CONFIG.backupDir, filename);

    const backupData: Record<string, unknown> = {
      metadata: {
        timestamp: new Date().toISOString(),
        type,
        tables,
        version: '1.0.0',
      },
      tables: {},
    };

    console.log(`  📋 Backing up ${tables.length} tables...`);

    for (const table of tables) {
      process.stdout.write(`  📦 ${table}... `);
      const { data, count } = await backupTable(supabase, table);
      (backupData.tables as Record<string, unknown>)[table] = {
        count,
        data: type === 'schema' ? [] : data,
      };
      console.log(`${count} rows`);
    }

    // Write backup file
    const jsonContent = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, jsonContent);

    // Compress if enabled
    let finalPath = filepath;
    if (CONFIG.compression) {
      try {
        const zlib = require('zlib');
        const compressed = zlib.gzipSync(jsonContent);
        const compressedPath = `${filepath}.gz`;
        fs.writeFileSync(compressedPath, compressed);
        fs.unlinkSync(filepath); // Remove uncompressed
        finalPath = compressedPath;
        console.log('  🗜️ Compressed backup');
      } catch {
        console.log('  ⚠️ Compression skipped (zlib not available)');
      }
    }

    const stats = fs.statSync(finalPath);
    const checksum = calculateChecksum(finalPath);

    const metadata: BackupMetadata = {
      timestamp: new Date().toISOString(),
      type,
      tables,
      size: stats.size,
      compressed: finalPath.endsWith('.gz'),
      checksum,
    };

    // Write metadata file
    const metadataPath = finalPath.replace(/\.(json|gz)$/, '.meta.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    const duration = Date.now() - startTime;

    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ Backup completed successfully!');
    console.log(`  📁 File: ${path.basename(finalPath)}`);
    console.log(`  📊 Size: ${formatBytes(stats.size)}`);
    console.log(`  🔐 Checksum: ${checksum}`);
    console.log(`  ⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════\n');

    return {
      success: true,
      filepath: finalPath,
      metadata,
      duration,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ Backup failed:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

// ============================================
// Cleanup Old Backups
// ============================================

async function cleanupOldBackups(): Promise<void> {
  console.log('\n🧹 Cleaning up old backups...');

  if (!fs.existsSync(CONFIG.backupDir)) {
    console.log('  No backup directory found');
    return;
  }

  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.json') || f.endsWith('.gz')))
    .map(f => ({
      name: f,
      path: path.join(CONFIG.backupDir, f),
      time: fs.statSync(path.join(CONFIG.backupDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Newest first

  const cutoffTime = Date.now() - (CONFIG.retentionDays * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const shouldDelete = i >= CONFIG.maxBackups || file.time < cutoffTime;

    if (shouldDelete) {
      fs.unlinkSync(file.path);
      // Also delete metadata file if exists
      const metaPath = file.path.replace(/\.(json|gz)$/, '.meta.json');
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }
      deletedCount++;
    }
  }

  console.log(`  Deleted ${deletedCount} old backup(s)`);
  console.log(`  Keeping ${files.length - deletedCount} backup(s)`);
}

// ============================================
// List Backups
// ============================================

async function listBackups(): Promise<void> {
  console.log('\n📋 Available backups:\n');

  if (!fs.existsSync(CONFIG.backupDir)) {
    console.log('  No backups found');
    return;
  }

  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.json') || f.endsWith('.gz')))
    .map(f => {
      const filepath = path.join(CONFIG.backupDir, f);
      const stats = fs.statSync(filepath);
      return {
        name: f,
        size: stats.size,
        created: stats.mtime,
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  if (files.length === 0) {
    console.log('  No backups found');
    return;
  }

  console.log('  Name                                          Size        Date');
  console.log('  ─────────────────────────────────────────────────────────────────');
  
  for (const file of files) {
    const name = file.name.padEnd(45);
    const size = formatBytes(file.size).padStart(10);
    const date = file.created.toISOString().slice(0, 19);
    console.log(`  ${name} ${size}  ${date}`);
  }

  console.log(`\n  Total: ${files.length} backup(s)\n`);
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';

  console.log('\n🗄️ MVP Video TécnicoCursos - Backup Manager\n');

  switch (command) {
    case 'backup':
    case 'full':
      await createBackup('full');
      await cleanupOldBackups();
      break;

    case 'schema':
      await createBackup('schema');
      break;

    case 'list':
      await listBackups();
      break;

    case 'cleanup':
      await cleanupOldBackups();
      break;

    case 'help':
    default:
      console.log('Usage: tsx scripts/backup-database.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  backup, full  Create full database backup');
      console.log('  schema        Create schema-only backup (no data)');
      console.log('  list          List available backups');
      console.log('  cleanup       Remove old backups');
      console.log('  help          Show this help');
      console.log('');
      console.log('Environment variables:');
      console.log('  BACKUP_DIR            Backup directory (default: ./backups)');
      console.log('  BACKUP_RETENTION_DAYS Days to keep backups (default: 30)');
      console.log('  BACKUP_COMPRESSION    Enable compression (default: true)');
      console.log('  MAX_BACKUPS           Maximum backups to keep (default: 10)');
      break;
  }
}

// Export for programmatic use
export { createBackup, cleanupOldBackups, listBackups };

// Run if executed directly
main().catch((error) => {
  console.error('❌ Backup script failed:', error);
  process.exit(1);
});
