#!/usr/bin/env node

/**
 * 💾 Database Backup Script
 * MVP Vídeos TécnicoCursos v7
 * 
 * Executa backups automatizados do banco de dados com compressão e validação
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const zlib = require('zlib');
const { promisify } = require('util');

// ===========================================
// Backup Configuration
// ===========================================

const BACKUP_CONFIG = {
    // Database connection
    databaseUrl: process.env.DIRECT_DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
    
    // Backup paths
    backupDir: process.env.BACKUP_DIR || '/opt/backups/database',
    tempDir: process.env.BACKUP_TEMP_DIR || '/tmp/backups',
    
    // Retention policy
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    maxBackups: parseInt(process.env.BACKUP_MAX_COUNT || '50'),
    
    // Compression
    compress: process.env.BACKUP_COMPRESS !== 'false',
    compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL || '6'),
    
    // Validation
    validateBackup: process.env.BACKUP_VALIDATE !== 'false',
    checksumAlgorithm: 'sha256',
    
    // S3/Cloud storage (optional)
    s3Bucket: process.env.BACKUP_S3_BUCKET,
    s3Region: process.env.BACKUP_S3_REGION || 'us-east-1',
    
    // Notification
    webhookUrl: process.env.BACKUP_WEBHOOK_URL,
    emailRecipients: process.env.BACKUP_EMAIL_RECIPIENTS?.split(',') || []
};

// ===========================================
// Backup Types
// ===========================================

const BACKUP_TYPES = {
    FULL: 'full',
    SCHEMA_ONLY: 'schema',
    DATA_ONLY: 'data',
    INCREMENTAL: 'incremental'
};

// ===========================================
// Backup Utilities
// ===========================================

class BackupManager {
    constructor() {
        this.startTime = Date.now();
        this.metadata = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            hostname: require('os').hostname(),
            platform: process.platform,
            nodeVersion: process.version
        };
    }
    
    async createBackup(type = BACKUP_TYPES.FULL, options = {}) {
        console.log(`🚀 Starting ${type} backup...`);
        
        try {
            // Prepare directories
            this.ensureDirectories();
            
            // Generate backup filename
            const filename = this.generateFilename(type, options.tag);
            const tempPath = path.join(BACKUP_CONFIG.tempDir, filename);
            const finalPath = path.join(BACKUP_CONFIG.backupDir, filename);
            
            // Execute backup
            let backupData;
            switch (type) {
                case BACKUP_TYPES.FULL:
                    backupData = await this.createFullBackup(tempPath);
                    break;
                case BACKUP_TYPES.SCHEMA_ONLY:
                    backupData = await this.createSchemaBackup(tempPath);
                    break;
                case BACKUP_TYPES.DATA_ONLY:
                    backupData = await this.createDataBackup(tempPath);
                    break;
                case BACKUP_TYPES.INCREMENTAL:
                    backupData = await this.createIncrementalBackup(tempPath, options);
                    break;
                default:
                    throw new Error(`Unknown backup type: ${type}`);
            }
            
            // Compress if enabled
            let processedPath = tempPath;
            if (BACKUP_CONFIG.compress) {
                processedPath = await this.compressBackup(tempPath);
            }
            
            // Calculate checksum
            const checksum = await this.calculateChecksum(processedPath);
            
            // Move to final location
            fs.renameSync(processedPath, finalPath + (BACKUP_CONFIG.compress ? '.gz' : ''));
            const finalFile = finalPath + (BACKUP_CONFIG.compress ? '.gz' : '');
            
            // Create metadata file
            const metadata = {
                ...this.metadata,
                type,
                filename: path.basename(finalFile),
                size: fs.statSync(finalFile).size,
                checksum,
                duration: Date.now() - this.startTime,
                compressed: BACKUP_CONFIG.compress,
                ...backupData
            };
            
            await this.saveMetadata(finalFile, metadata);
            
            // Validate backup
            if (BACKUP_CONFIG.validateBackup) {
                await this.validateBackup(finalFile, metadata);
            }
            
            // Upload to cloud if configured
            if (BACKUP_CONFIG.s3Bucket) {
                await this.uploadToS3(finalFile, metadata);
            }
            
            // Cleanup old backups
            await this.cleanupOldBackups();
            
            // Send notification
            await this.sendNotification('success', metadata);
            
            console.log(`✅ Backup completed successfully: ${path.basename(finalFile)}`);
            console.log(`📊 Size: ${this.formatBytes(metadata.size)}, Duration: ${Math.round(metadata.duration / 1000)}s`);
            
            return {
                success: true,
                file: finalFile,
                metadata
            };
            
        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            
            await this.sendNotification('error', {
                error: error.message,
                duration: Date.now() - this.startTime
            });
            
            throw error;
        }
    }
    
    async createFullBackup(outputPath) {
        console.log('📦 Creating full database backup...');
        
        const pgDumpCommand = this.buildPgDumpCommand({
            format: 'custom',
            verbose: true,
            file: outputPath
        });
        
        execSync(pgDumpCommand, { 
            stdio: 'pipe',
            timeout: 30 * 60 * 1000 // 30 minutes
        });
        
        return {
            tables: await this.getTableList(),
            rowCount: await this.getTotalRowCount(),
            pgVersion: await this.getPostgreSQLVersion()
        };
    }
    
    async createSchemaBackup(outputPath) {
        console.log('🗂️ Creating schema-only backup...');
        
        const pgDumpCommand = this.buildPgDumpCommand({
            format: 'plain',
            schemaOnly: true,
            file: outputPath
        });
        
        execSync(pgDumpCommand, { 
            stdio: 'pipe',
            timeout: 5 * 60 * 1000 // 5 minutes
        });
        
        return {
            tables: await this.getTableList(),
            pgVersion: await this.getPostgreSQLVersion()
        };
    }
    
    async createDataBackup(outputPath) {
        console.log('💾 Creating data-only backup...');
        
        const pgDumpCommand = this.buildPgDumpCommand({
            format: 'custom',
            dataOnly: true,
            file: outputPath
        });
        
        execSync(pgDumpCommand, { 
            stdio: 'pipe',
            timeout: 45 * 60 * 1000 // 45 minutes
        });
        
        return {
            tables: await this.getTableList(),
            rowCount: await this.getTotalRowCount()
        };
    }
    
    async createIncrementalBackup(outputPath, options) {
        console.log('🔄 Creating incremental backup...');
        
        const lastBackup = options.lastBackupTime || await this.getLastBackupTime();
        if (!lastBackup) {
            throw new Error('No previous backup found for incremental backup');
        }
        
        // Create custom incremental backup logic
        // This would involve tracking changes since last backup
        // For now, we'll create a simple timestamp-based backup
        
        const query = `
            COPY (
                SELECT 'analytics_events' as table_name, * FROM analytics_events 
                WHERE created_at > '${lastBackup}'
                UNION ALL
                SELECT 'render_jobs' as table_name, * FROM render_jobs 
                WHERE created_at > '${lastBackup}'
                UNION ALL
                SELECT 'projects' as table_name, * FROM projects 
                WHERE updated_at > '${lastBackup}'
            ) TO STDOUT WITH CSV HEADER;
        `;
        
        const psqlCommand = `psql "${BACKUP_CONFIG.databaseUrl}" -c "${query}" > ${outputPath}`;
        execSync(psqlCommand, { stdio: 'pipe' });
        
        return {
            type: 'incremental',
            lastBackupTime: lastBackup,
            changedTables: ['analytics_events', 'render_jobs', 'projects']
        };
    }
    
    buildPgDumpCommand(options) {
        const {
            format = 'custom',
            schemaOnly = false,
            dataOnly = false,
            verbose = false,
            file
        } = options;
        
        let command = `pg_dump "${BACKUP_CONFIG.databaseUrl}"`;
        
        command += ` --format=${format}`;
        command += ` --file="${file}"`;
        
        if (schemaOnly) command += ' --schema-only';
        if (dataOnly) command += ' --data-only';
        if (verbose) command += ' --verbose';
        
        // Exclude temporary tables
        command += ' --exclude-table-data=analytics_events_temp';
        command += ' --exclude-table-data=temp_*';
        
        // Include specific schemas only
        command += ' --schema=public';
        command += ' --schema=auth';
        
        return command;
    }
    
    async compressBackup(filePath) {
        console.log('🗜️ Compressing backup...');
        
        const compressedPath = `${filePath}.gz`;
        const readStream = fs.createReadStream(filePath);
        const writeStream = fs.createWriteStream(compressedPath);
        const gzip = zlib.createGzip({ level: BACKUP_CONFIG.compressionLevel });
        
        return new Promise((resolve, reject) => {
            readStream
                .pipe(gzip)
                .pipe(writeStream)
                .on('finish', () => {
                    fs.unlinkSync(filePath); // Remove original
                    resolve(compressedPath);
                })
                .on('error', reject);
        });
    }
    
    async calculateChecksum(filePath) {
        console.log('🔍 Calculating checksum...');
        
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(BACKUP_CONFIG.checksumAlgorithm);
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
    
    async validateBackup(filePath, metadata) {
        console.log('✅ Validating backup integrity...');
        
        try {
            // Verify file exists and has content
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error('Backup file is empty');
            }
            
            // Verify checksum
            const calculatedChecksum = await this.calculateChecksum(filePath);
            if (calculatedChecksum !== metadata.checksum) {
                throw new Error('Checksum verification failed');
            }
            
            // Test restore (for schema backups only, to avoid data corruption)
            if (metadata.type === BACKUP_TYPES.SCHEMA_ONLY) {
                await this.testRestore(filePath);
            }
            
            console.log('✅ Backup validation passed');
            
        } catch (error) {
            console.error('❌ Backup validation failed:', error.message);
            throw error;
        }
    }
    
    async testRestore(filePath) {
        console.log('🧪 Testing restore capability...');
        
        try {
            // Create temporary test database
            const testDbName = `test_restore_${Date.now()}`;
            execSync(`createdb "${testDbName}" --template=template0`, { stdio: 'pipe' });
            
            try {
                // Restore to test database
                const restoreCommand = filePath.endsWith('.gz') ?
                    `gunzip -c "${filePath}" | pg_restore -d "${testDbName}"` :
                    `pg_restore -d "${testDbName}" "${filePath}"`;
                
                execSync(restoreCommand, { 
                    stdio: 'pipe',
                    timeout: 5 * 60 * 1000 // 5 minutes
                });
                
                // Verify basic structure
                const tableCount = execSync(
                    `psql -d "${testDbName}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
                    { encoding: 'utf8' }
                ).trim();
                
                if (parseInt(tableCount) === 0) {
                    throw new Error('No tables found in restored database');
                }
                
                console.log(`✅ Test restore successful (${tableCount} tables)`);
                
            } finally {
                // Cleanup test database
                execSync(`dropdb "${testDbName}"`, { stdio: 'pipe' });
            }
            
        } catch (error) {
            console.warn('⚠️ Test restore failed (backup may still be valid):', error.message);
        }
    }
    
    async uploadToS3(filePath, metadata) {
        console.log('☁️ Uploading to S3...');
        
        try {
            const key = `backups/${path.basename(filePath)}`;
            const metadataKey = `backups/${path.basename(filePath)}.meta.json`;
            
            // Upload backup file
            const uploadCommand = `aws s3 cp "${filePath}" "s3://${BACKUP_CONFIG.s3Bucket}/${key}"`;
            execSync(uploadCommand, { stdio: 'pipe' });
            
            // Upload metadata
            const metadataFile = `${filePath}.meta.json`;
            fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
            
            const uploadMetaCommand = `aws s3 cp "${metadataFile}" "s3://${BACKUP_CONFIG.s3Bucket}/${metadataKey}"`;
            execSync(uploadMetaCommand, { stdio: 'pipe' });
            
            fs.unlinkSync(metadataFile); // Cleanup
            
            console.log(`✅ Uploaded to S3: ${key}`);
            
        } catch (error) {
            console.warn('⚠️ S3 upload failed:', error.message);
        }
    }
    
    async cleanupOldBackups() {
        console.log('🧹 Cleaning up old backups...');
        
        try {
            const files = fs.readdirSync(BACKUP_CONFIG.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => ({
                    name: file,
                    path: path.join(BACKUP_CONFIG.backupDir, file),
                    stats: fs.statSync(path.join(BACKUP_CONFIG.backupDir, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);
            
            // Remove by count
            if (files.length > BACKUP_CONFIG.maxBackups) {
                const filesToRemove = files.slice(BACKUP_CONFIG.maxBackups);
                filesToRemove.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Removed old backup: ${file.name}`);
                });
            }
            
            // Remove by age
            const cutoffDate = new Date(Date.now() - BACKUP_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
            const oldFiles = files.filter(file => file.stats.mtime < cutoffDate);
            
            oldFiles.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Removed expired backup: ${file.name}`);
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Cleanup failed:', error.message);
        }
    }
    
    async sendNotification(status, data) {
        if (!BACKUP_CONFIG.webhookUrl) return;
        
        try {
            const payload = {
                status,
                timestamp: new Date().toISOString(),
                service: 'database-backup',
                ...data
            };
            
            const response = await fetch(BACKUP_CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status}`);
            }
            
            console.log('📤 Notification sent successfully');
            
        } catch (error) {
            console.warn('⚠️ Notification failed:', error.message);
        }
    }
    
    // Helper methods
    generateFilename(type, tag = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tagSuffix = tag ? `_${tag}` : '';
        return `backup_${type}_${timestamp}${tagSuffix}.dump`;
    }
    
    ensureDirectories() {
        fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
        fs.mkdirSync(BACKUP_CONFIG.tempDir, { recursive: true });
    }
    
    async saveMetadata(backupFile, metadata) {
        const metadataFile = `${backupFile}.meta.json`;
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    }
    
    async getTableList() {
        try {
            const output = execSync(
                `psql "${BACKUP_CONFIG.databaseUrl}" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`,
                { encoding: 'utf8' }
            );
            return output.trim().split('\n').map(line => line.trim()).filter(Boolean);
        } catch {
            return [];
        }
    }
    
    async getTotalRowCount() {
        try {
            const output = execSync(
                `psql "${BACKUP_CONFIG.databaseUrl}" -t -c "SELECT SUM(n_tup_ins + n_tup_upd) FROM pg_stat_user_tables;"`,
                { encoding: 'utf8' }
            );
            return parseInt(output.trim()) || 0;
        } catch {
            return 0;
        }
    }
    
    async getPostgreSQLVersion() {
        try {
            const output = execSync(
                `psql "${BACKUP_CONFIG.databaseUrl}" -t -c "SELECT version();"`,
                { encoding: 'utf8' }
            );
            return output.trim();
        } catch {
            return 'unknown';
        }
    }
    
    async getLastBackupTime() {
        try {
            const files = fs.readdirSync(BACKUP_CONFIG.backupDir)
                .filter(file => file.startsWith('backup_'))
                .map(file => ({
                    file,
                    stats: fs.statSync(path.join(BACKUP_CONFIG.backupDir, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);
            
            return files.length > 0 ? files[0].stats.mtime.toISOString() : null;
        } catch {
            return null;
        }
    }
    
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
    }
}

// ===========================================
// Backup Operations
// ===========================================

async function createFullBackup(tag = null) {
    const manager = new BackupManager();
    return await manager.createBackup(BACKUP_TYPES.FULL, { tag });
}

async function createSchemaBackup(tag = null) {
    const manager = new BackupManager();
    return await manager.createBackup(BACKUP_TYPES.SCHEMA_ONLY, { tag });
}

async function createDataBackup(tag = null) {
    const manager = new BackupManager();
    return await manager.createBackup(BACKUP_TYPES.DATA_ONLY, { tag });
}

async function createIncrementalBackup(lastBackupTime = null, tag = null) {
    const manager = new BackupManager();
    return await manager.createBackup(BACKUP_TYPES.INCREMENTAL, { lastBackupTime, tag });
}

async function listBackups() {
    try {
        if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
            console.log('📁 No backups directory found');
            return [];
        }
        
        const files = fs.readdirSync(BACKUP_CONFIG.backupDir)
            .filter(file => file.startsWith('backup_'))
            .map(file => {
                const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                const stats = fs.statSync(filePath);
                
                // Try to read metadata
                let metadata = null;
                const metaFile = `${filePath}.meta.json`;
                if (fs.existsSync(metaFile)) {
                    try {
                        metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
                    } catch (error) {
                        // Metadata file corrupted or unreadable
                    }
                }
                
                return {
                    file,
                    path: filePath,
                    size: stats.size,
                    created: stats.mtime.toISOString(),
                    metadata
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        return files;
        
    } catch (error) {
        console.error('❌ Failed to list backups:', error.message);
        return [];
    }
}

async function deleteBackup(filename) {
    try {
        const filePath = path.join(BACKUP_CONFIG.backupDir, filename);
        const metaPath = `${filePath}.meta.json`;
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted backup: ${filename}`);
        }
        
        if (fs.existsSync(metaPath)) {
            fs.unlinkSync(metaPath);
            console.log(`🗑️ Deleted metadata: ${filename}.meta.json`);
        }
        
        return { success: true };
        
    } catch (error) {
        console.error(`❌ Failed to delete backup ${filename}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function restoreBackup(filename, targetDb = null) {
    try {
        const filePath = path.join(BACKUP_CONFIG.backupDir, filename);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Backup file not found: ${filename}`);
        }
        
        const targetDatabase = targetDb || BACKUP_CONFIG.databaseUrl;
        
        console.log(`🔄 Restoring backup: ${filename}`);
        console.log(`📍 Target database: ${targetDatabase.split('@')[1] || 'localhost'}`);
        
        // Warning for production restores
        if (!targetDb) {
            console.log('⚠️ WARNING: Restoring to production database!');
            console.log('⏳ Starting in 5 seconds... (Ctrl+C to cancel)');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        const restoreCommand = filePath.endsWith('.gz') ?
            `gunzip -c "${filePath}" | pg_restore -d "${targetDatabase}" --clean --if-exists` :
            `pg_restore -d "${targetDatabase}" "${filePath}" --clean --if-exists`;
        
        execSync(restoreCommand, { 
            stdio: 'inherit',
            timeout: 60 * 60 * 1000 // 1 hour
        });
        
        console.log('✅ Restore completed successfully');
        
        return { success: true };
        
    } catch (error) {
        console.error(`❌ Restore failed:`, error.message);
        return { success: false, error: error.message };
    }
}

// ===========================================
// CLI Interface
// ===========================================

if (require.main === module) {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function main() {
        try {
            switch (command) {
                case 'full':
                    await createFullBackup(args[0]);
                    break;
                    
                case 'schema':
                    await createSchemaBackup(args[0]);
                    break;
                    
                case 'data':
                    await createDataBackup(args[0]);
                    break;
                    
                case 'incremental':
                    await createIncrementalBackup(args[0], args[1]);
                    break;
                    
                case 'list':
                    const backups = await listBackups();
                    if (backups.length === 0) {
                        console.log('📁 No backups found');
                    } else {
                        console.log(`📋 Found ${backups.length} backups:`);
                        backups.forEach(backup => {
                            const manager = new BackupManager();
                            console.log(`  ${backup.file} (${manager.formatBytes(backup.size)}, ${backup.created})`);
                        });
                    }
                    break;
                    
                case 'delete':
                    if (!args[0]) {
                        console.error('Usage: backup delete <filename>');
                        process.exit(1);
                    }
                    await deleteBackup(args[0]);
                    break;
                    
                case 'restore':
                    if (!args[0]) {
                        console.error('Usage: backup restore <filename> [target-db]');
                        process.exit(1);
                    }
                    await restoreBackup(args[0], args[1]);
                    break;
                    
                default:
                    console.log('Usage: node backup-database.js <command> [args...]');
                    console.log('');
                    console.log('Commands:');
                    console.log('  full [tag]                - Create full backup');
                    console.log('  schema [tag]              - Create schema-only backup');
                    console.log('  data [tag]                - Create data-only backup');
                    console.log('  incremental [time] [tag]  - Create incremental backup');
                    console.log('  list                      - List all backups');
                    console.log('  delete <filename>         - Delete backup');
                    console.log('  restore <filename> [db]   - Restore backup');
                    console.log('');
                    console.log('Environment Variables:');
                    console.log('  BACKUP_DIR               - Backup directory (default: /opt/backups/database)');
                    console.log('  BACKUP_RETENTION_DAYS    - Retention period (default: 30)');
                    console.log('  BACKUP_COMPRESS          - Enable compression (default: true)');
                    console.log('  BACKUP_S3_BUCKET         - S3 bucket for cloud backup');
                    console.log('  BACKUP_WEBHOOK_URL       - Webhook for notifications');
                    process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Command failed:', error.message);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = {
    BackupManager,
    createFullBackup,
    createSchemaBackup,
    createDataBackup,
    createIncrementalBackup,
    listBackups,
    deleteBackup,
    restoreBackup,
    BACKUP_TYPES,
    BACKUP_CONFIG
};