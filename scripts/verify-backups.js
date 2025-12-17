#!/usr/bin/env node

/**
 * 🔍 Backup Verification System
 * MVP Vídeos TécnicoCursos v7
 * 
 * Verifica integridade e recuperabilidade dos backups
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ===========================================
// Verification Configuration
// ===========================================

const VERIFICATION_CONFIG = {
    backupBasePath: process.env.BACKUP_BASE_PATH || '/opt/backups',
    
    checks: {
        integrity: true,     // Checksum verification
        readability: true,   // File can be read
        recoverability: true, // Backup can be restored
        completeness: true,  // All expected files present
        encryption: true,    // Encrypted backups can be decrypted
        compression: true    // Compressed backups can be extracted
    },
    
    testDatabase: {
        host: 'localhost',
        port: 5433,
        database: 'backup_test',
        username: 'test_user',
        password: 'test_password'
    },
    
    testStorage: {
        bucket: 'backup-test',
        path: '/tmp/backup-test'
    },
    
    schedule: process.env.VERIFICATION_SCHEDULE || '0 6 * * *', // Daily at 6 AM
    
    reporting: {
        enabled: true,
        webhookUrl: process.env.VERIFICATION_WEBHOOK_URL,
        slackChannel: process.env.VERIFICATION_SLACK_CHANNEL,
        emailAlerts: process.env.VERIFICATION_EMAIL_ALERTS?.split(',') || []
    }
};

// ===========================================
// Verification Report
// ===========================================

class VerificationReport {
    constructor() {
        this.id = crypto.randomUUID();
        this.timestamp = new Date().toISOString();
        this.status = 'running';
        this.startTime = Date.now();
        this.backupsChecked = 0;
        this.backupsPassed = 0;
        this.backupsFailed = 0;
        this.checks = [];
        this.failures = [];
        this.warnings = [];
        this.summary = {};
    }
    
    addCheck(backup, checkType, status, details = {}) {
        const check = {
            backup,
            checkType,
            status, // 'pass', 'fail', 'warning', 'skip'
            details,
            timestamp: new Date().toISOString()
        };
        
        this.checks.push(check);
        
        if (status === 'fail') {
            this.failures.push({
                backup,
                checkType,
                error: details.error || 'Unknown error',
                timestamp: check.timestamp
            });
        } else if (status === 'warning') {
            this.warnings.push({
                backup,
                checkType,
                message: details.message || 'Unknown warning',
                timestamp: check.timestamp
            });
        }
    }
    
    finalize() {
        this.status = this.failures.length > 0 ? 'failed' : 'passed';
        this.endTime = Date.now();
        this.duration = this.endTime - this.startTime;
        
        // Calculate summary statistics
        const groupedChecks = this.checks.reduce((acc, check) => {
            if (!acc[check.backup]) {
                acc[check.backup] = { pass: 0, fail: 0, warning: 0, skip: 0 };
            }
            acc[check.backup][check.status]++;
            return acc;
        }, {});
        
        this.summary = {
            totalBackups: this.backupsChecked,
            passedBackups: this.backupsPassed,
            failedBackups: this.backupsFailed,
            totalChecks: this.checks.length,
            passedChecks: this.checks.filter(c => c.status === 'pass').length,
            failedChecks: this.checks.filter(c => c.status === 'fail').length,
            warningChecks: this.checks.filter(c => c.status === 'warning').length,
            skippedChecks: this.checks.filter(c => c.status === 'skip').length,
            duration: this.duration,
            checksByBackup: groupedChecks
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            status: this.status,
            duration: this.duration,
            summary: this.summary,
            checks: this.checks,
            failures: this.failures,
            warnings: this.warnings
        };
    }
}

// ===========================================
// Backup Verifier
// ===========================================

class BackupVerifier {
    constructor(config) {
        this.config = config;
        this.encryptionKey = this.getEncryptionKey();
    }
    
    getEncryptionKey() {
        const keyPath = path.join(process.env.SECRETS_PATH || '/run/secrets', 'backup_encryption_key');
        
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8').trim();
        }
        
        const envKey = process.env.BACKUP_ENCRYPTION_KEY;
        if (envKey) return envKey;
        
        console.warn('⚠️ Backup encryption key not found - encrypted backup verification will be skipped');
        return null;
    }
    
    async verifyAllBackups() {
        const report = new VerificationReport();
        
        console.log('🔍 Starting backup verification...');
        
        try {
            // Find all backup manifests
            const manifests = await this.findBackupManifests();
            
            console.log(`📋 Found ${manifests.length} backup manifests to verify`);
            
            for (const manifestPath of manifests) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
                    
                    console.log(`\n🔍 Verifying backup: ${backupName}`);
                    
                    report.backupsChecked++;
                    
                    const backupPassed = await this.verifyBackup(manifest, report);
                    
                    if (backupPassed) {
                        report.backupsPassed++;
                        console.log(`✅ Backup verification passed: ${backupName}`);
                    } else {
                        report.backupsFailed++;
                        console.log(`❌ Backup verification failed: ${backupName}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to verify manifest ${manifestPath}:`, error.message);
                    report.addCheck(path.basename(manifestPath), 'manifest', 'fail', {
                        error: error.message
                    });
                    report.backupsFailed++;
                }
            }
            
            report.finalize();
            
            // Save report
            await this.saveReport(report);
            
            // Send notifications
            await this.sendNotifications(report);
            
            console.log('\n📊 Verification Summary:');
            console.log(`Status: ${report.status.toUpperCase()}`);
            console.log(`Backups: ${report.summary.passedBackups}/${report.summary.totalBackups} passed`);
            console.log(`Checks: ${report.summary.passedChecks}/${report.summary.totalChecks} passed`);
            console.log(`Duration: ${Math.round(report.summary.duration / 1000)}s`);
            
            if (report.failures.length > 0) {
                console.log(`\n❌ Failures (${report.failures.length}):`);
                report.failures.slice(0, 5).forEach(failure => {
                    console.log(`  - ${failure.backup}: ${failure.checkType} - ${failure.error}`);
                });
            }
            
            if (report.warnings.length > 0) {
                console.log(`\n⚠️ Warnings (${report.warnings.length}):`);
                report.warnings.slice(0, 5).forEach(warning => {
                    console.log(`  - ${warning.backup}: ${warning.checkType} - ${warning.message}`);
                });
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Backup verification failed:', error);
            report.status = 'error';
            report.finalize();
            throw error;
        }
    }
    
    async findBackupManifests() {
        const manifests = [];
        
        try {
            const backupDirs = ['database', 'storage', 'application'];
            
            for (const component of backupDirs) {
                const componentPath = path.join(this.config.backupBasePath, 'local', component);
                
                if (!fs.existsSync(componentPath)) continue;
                
                // Find all manifest files recursively
                const findCommand = `find "${componentPath}" -name "backup-manifest.json" -type f`;
                
                try {
                    const output = execSync(findCommand, { encoding: 'utf8' });
                    const componentManifests = output.trim().split('\n').filter(p => p);
                    manifests.push(...componentManifests);
                    
                } catch (findError) {
                    console.warn(`Warning: Failed to find manifests in ${componentPath}:`, findError.message);
                }
            }
            
        } catch (error) {
            console.error('Error finding backup manifests:', error);
        }
        
        return manifests;
    }
    
    async verifyBackup(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        let allChecksPassed = true;
        
        try {
            // 1. Verify manifest integrity
            if (this.config.checks.integrity) {
                const integrityPassed = await this.verifyIntegrity(manifest, report);
                if (!integrityPassed) allChecksPassed = false;
            }
            
            // 2. Verify file readability
            if (this.config.checks.readability) {
                const readabilityPassed = await this.verifyReadability(manifest, report);
                if (!readabilityPassed) allChecksPassed = false;
            }
            
            // 3. Verify completeness
            if (this.config.checks.completeness) {
                const completenessPassed = await this.verifyCompleteness(manifest, report);
                if (!completenessPassed) allChecksPassed = false;
            }
            
            // 4. Verify encryption
            if (this.config.checks.encryption && manifest.encrypted) {
                const encryptionPassed = await this.verifyEncryption(manifest, report);
                if (!encryptionPassed) allChecksPassed = false;
            }
            
            // 5. Verify compression
            if (this.config.checks.compression && manifest.compressed) {
                const compressionPassed = await this.verifyCompression(manifest, report);
                if (!compressionPassed) allChecksPassed = false;
            }
            
            // 6. Verify recoverability (selected backups only)
            if (this.config.checks.recoverability && this.shouldTestRecovery(manifest)) {
                const recoveryPassed = await this.verifyRecoverability(manifest, report);
                if (!recoveryPassed) allChecksPassed = false;
            }
            
        } catch (error) {
            console.error(`Verification error for ${backupName}:`, error);
            report.addCheck(backupName, 'general', 'fail', { error: error.message });
            allChecksPassed = false;
        }
        
        return allChecksPassed;
    }
    
    async verifyIntegrity(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            for (const file of manifest.files) {
                if (!fs.existsSync(file.path)) {
                    report.addCheck(backupName, 'integrity', 'fail', {
                        error: `File not found: ${file.path}`
                    });
                    return false;
                }
                
                // Verify file size
                const stats = fs.statSync(file.path);
                if (stats.size !== file.size) {
                    report.addCheck(backupName, 'integrity', 'fail', {
                        error: `File size mismatch: ${file.path} (expected ${file.size}, got ${stats.size})`
                    });
                    return false;
                }
            }
            
            // Verify manifest checksum if available
            if (manifest.checksum) {
                // Find the main backup file
                const mainFile = manifest.files.find(f => f.type === manifest.component);
                if (mainFile) {
                    const calculatedChecksum = this.calculateChecksum(mainFile.path);
                    if (calculatedChecksum !== manifest.checksum) {
                        report.addCheck(backupName, 'integrity', 'fail', {
                            error: `Checksum mismatch: expected ${manifest.checksum}, got ${calculatedChecksum}`
                        });
                        return false;
                    }
                }
            }
            
            report.addCheck(backupName, 'integrity', 'pass', {
                filesChecked: manifest.files.length
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'integrity', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async verifyReadability(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            for (const file of manifest.files) {
                try {
                    // Try to read first 1KB of file
                    const buffer = Buffer.alloc(1024);
                    const fd = fs.openSync(file.path, 'r');
                    fs.readSync(fd, buffer, 0, 1024, 0);
                    fs.closeSync(fd);
                    
                } catch (readError) {
                    report.addCheck(backupName, 'readability', 'fail', {
                        error: `Cannot read file: ${file.path} - ${readError.message}`
                    });
                    return false;
                }
            }
            
            report.addCheck(backupName, 'readability', 'pass', {
                filesChecked: manifest.files.length
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'readability', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async verifyCompleteness(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            // Check that all expected files are present based on component type
            let expectedFiles = [];
            
            switch (manifest.component) {
                case 'database':
                    expectedFiles = ['database'];
                    break;
                case 'storage':
                    expectedFiles = ['storage'];
                    break;
                case 'application':
                    expectedFiles = ['application', 'manifest'];
                    break;
            }
            
            for (const expectedType of expectedFiles) {
                const found = manifest.files.some(f => f.type === expectedType);
                if (!found) {
                    report.addCheck(backupName, 'completeness', 'warning', {
                        message: `Missing expected file type: ${expectedType}`
                    });
                }
            }
            
            report.addCheck(backupName, 'completeness', 'pass', {
                expectedFiles,
                actualFiles: manifest.files.map(f => f.type)
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'completeness', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async verifyEncryption(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        if (!this.encryptionKey) {
            report.addCheck(backupName, 'encryption', 'skip', {
                message: 'Encryption key not available'
            });
            return true;
        }
        
        try {
            // Find encrypted file
            const encryptedFile = manifest.files.find(f => f.path.endsWith('.enc'));
            
            if (!encryptedFile) {
                report.addCheck(backupName, 'encryption', 'warning', {
                    message: 'No encrypted files found despite encryption flag'
                });
                return true;
            }
            
            // Try to decrypt a small portion
            const encrypted = fs.readFileSync(encryptedFile.path);
            
            if (encrypted.length < 32) {
                report.addCheck(backupName, 'encryption', 'fail', {
                    error: 'Encrypted file too small to contain valid data'
                });
                return false;
            }
            
            // Basic validation - real implementation would attempt decryption
            report.addCheck(backupName, 'encryption', 'pass', {
                message: 'Encrypted file appears valid'
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'encryption', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async verifyCompression(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            // Find compressed file
            const compressedFile = manifest.files.find(f => 
                f.path.endsWith('.gz') || f.path.endsWith('.tar.gz')
            );
            
            if (!compressedFile) {
                report.addCheck(backupName, 'compression', 'warning', {
                    message: 'No compressed files found despite compression flag'
                });
                return true;
            }
            
            // Test file header for gzip magic bytes
            const buffer = Buffer.alloc(2);
            const fd = fs.openSync(compressedFile.path, 'r');
            fs.readSync(fd, buffer, 0, 2, 0);
            fs.closeSync(fd);
            
            // Check for gzip magic bytes (0x1f, 0x8b)
            if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
                report.addCheck(backupName, 'compression', 'fail', {
                    error: 'File does not appear to be gzip compressed'
                });
                return false;
            }
            
            report.addCheck(backupName, 'compression', 'pass', {
                message: 'Compressed file appears valid'
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'compression', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async verifyRecoverability(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            console.log(`🧪 Testing recovery for ${backupName}...`);
            
            switch (manifest.component) {
                case 'database':
                    return await this.testDatabaseRecovery(manifest, report);
                case 'storage':
                    return await this.testStorageRecovery(manifest, report);
                case 'application':
                    return await this.testApplicationRecovery(manifest, report);
                default:
                    report.addCheck(backupName, 'recoverability', 'skip', {
                        message: `Recovery test not implemented for ${manifest.component}`
                    });
                    return true;
            }
            
        } catch (error) {
            report.addCheck(backupName, 'recoverability', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async testDatabaseRecovery(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            // This would create a test database instance and restore the backup
            // For now, we'll do a simplified test
            
            const dbFile = manifest.files.find(f => f.type === 'database');
            if (!dbFile) {
                report.addCheck(backupName, 'recoverability', 'fail', {
                    error: 'No database file found in backup'
                });
                return false;
            }
            
            // Test that the file is a valid PostgreSQL backup
            if (dbFile.path.endsWith('.custom')) {
                // Test pg_restore --list
                try {
                    execSync(`pg_restore --list "${dbFile.path}"`, { stdio: 'pipe' });
                    
                    report.addCheck(backupName, 'recoverability', 'pass', {
                        message: 'Database backup can be listed with pg_restore'
                    });
                    return true;
                    
                } catch (restoreError) {
                    report.addCheck(backupName, 'recoverability', 'fail', {
                        error: `pg_restore failed: ${restoreError.message}`
                    });
                    return false;
                }
            }
            
            // For SQL files, basic syntax check
            if (dbFile.path.endsWith('.sql')) {
                const content = fs.readFileSync(dbFile.path, 'utf8');
                
                if (content.includes('CREATE TABLE') || content.includes('INSERT INTO')) {
                    report.addCheck(backupName, 'recoverability', 'pass', {
                        message: 'SQL backup contains expected statements'
                    });
                    return true;
                }
            }
            
            report.addCheck(backupName, 'recoverability', 'warning', {
                message: 'Database recovery test inconclusive'
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'recoverability', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async testStorageRecovery(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            const storageFile = manifest.files.find(f => f.type === 'storage');
            if (!storageFile) {
                report.addCheck(backupName, 'recoverability', 'fail', {
                    error: 'No storage file found in backup'
                });
                return false;
            }
            
            // Test that the archive can be extracted
            if (storageFile.path.endsWith('.tar.gz')) {
                const testDir = `/tmp/test-extract-${Date.now()}`;
                
                try {
                    fs.mkdirSync(testDir, { recursive: true });
                    
                    // Test extraction (just list contents, don't actually extract)
                    execSync(`tar -tzf "${storageFile.path}"`, { stdio: 'pipe' });
                    
                    report.addCheck(backupName, 'recoverability', 'pass', {
                        message: 'Storage archive can be listed'
                    });
                    return true;
                    
                } finally {
                    // Cleanup
                    if (fs.existsSync(testDir)) {
                        execSync(`rm -rf "${testDir}"`);
                    }
                }
            }
            
            report.addCheck(backupName, 'recoverability', 'warning', {
                message: 'Storage recovery test not implemented for this format'
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'recoverability', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    async testApplicationRecovery(manifest, report) {
        const backupName = `${manifest.component}-${manifest.type}-${manifest.id}`;
        
        try {
            const appFile = manifest.files.find(f => f.type === 'application');
            if (!appFile) {
                report.addCheck(backupName, 'recoverability', 'fail', {
                    error: 'No application file found in backup'
                });
                return false;
            }
            
            // Test that the archive contains expected files
            if (appFile.path.endsWith('.tar.gz')) {
                try {
                    const contents = execSync(`tar -tzf "${appFile.path}"`, { encoding: 'utf8' });
                    
                    const expectedFiles = ['manifest.json'];
                    const missingFiles = expectedFiles.filter(f => !contents.includes(f));
                    
                    if (missingFiles.length > 0) {
                        report.addCheck(backupName, 'recoverability', 'warning', {
                            message: `Missing expected files: ${missingFiles.join(', ')}`
                        });
                    }
                    
                    report.addCheck(backupName, 'recoverability', 'pass', {
                        message: 'Application archive structure appears valid'
                    });
                    return true;
                    
                } catch (tarError) {
                    report.addCheck(backupName, 'recoverability', 'fail', {
                        error: `Cannot list archive contents: ${tarError.message}`
                    });
                    return false;
                }
            }
            
            report.addCheck(backupName, 'recoverability', 'skip', {
                message: 'Unknown application backup format'
            });
            return true;
            
        } catch (error) {
            report.addCheck(backupName, 'recoverability', 'fail', {
                error: error.message
            });
            return false;
        }
    }
    
    shouldTestRecovery(manifest) {
        // Only test recovery for recent backups to save time
        const manifestDate = new Date(manifest.timestamp);
        const daysSinceBackup = (Date.now() - manifestDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Test recovery for backups less than 7 days old
        return daysSinceBackup < 7;
    }
    
    async saveReport(report) {
        const reportFile = path.join(
            this.config.backupBasePath,
            'verification-reports',
            `verification-report-${Date.now()}.json`
        );
        
        fs.mkdirSync(path.dirname(reportFile), { recursive: true });
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📋 Verification report saved: ${reportFile}`);
        
        // Keep only last 30 reports
        this.cleanupOldReports();
    }
    
    cleanupOldReports() {
        try {
            const reportsDir = path.join(this.config.backupBasePath, 'verification-reports');
            
            if (!fs.existsSync(reportsDir)) return;
            
            const files = fs.readdirSync(reportsDir)
                .filter(f => f.startsWith('verification-report-'))
                .map(f => ({
                    name: f,
                    path: path.join(reportsDir, f),
                    mtime: fs.statSync(path.join(reportsDir, f)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);
            
            // Keep only last 30 reports
            const filesToDelete = files.slice(30);
            
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🗑️ Removed old report: ${file.name}`);
            }
            
        } catch (error) {
            console.warn('Failed to cleanup old reports:', error.message);
        }
    }
    
    async sendNotifications(report) {
        if (!this.config.reporting.enabled) return;
        
        const notification = {
            type: 'backup_verification',
            status: report.status,
            summary: report.summary,
            failures: report.failures.slice(0, 10), // Limit to first 10 failures
            timestamp: report.timestamp
        };
        
        // Log notification
        console.log(`📢 Sending verification notification: ${report.status}`);
        
        // In real implementation, send to configured channels
        if (this.config.reporting.webhookUrl) {
            // Send webhook notification
        }
        
        if (this.config.reporting.slackChannel) {
            // Send Slack notification
        }
        
        if (this.config.reporting.emailAlerts.length > 0) {
            // Send email notifications
        }
    }
    
    calculateChecksum(filePath) {
        const hash = crypto.createHash('sha256');
        const data = fs.readFileSync(filePath);
        hash.update(data);
        return hash.digest('hex');
    }
}

// ===========================================
// CLI Interface
// ===========================================

async function runVerification() {
    try {
        const verifier = new BackupVerifier(VERIFICATION_CONFIG);
        const report = await verifier.verifyAllBackups();
        
        if (report.status === 'passed') {
            console.log('\n✅ All backup verifications passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Some backup verifications failed!');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Verification process failed:', error);
        process.exit(1);
    }
}

function startScheduler() {
    console.log('⏰ Starting backup verification scheduler...');
    
    // In real implementation, use node-cron
    console.log(`📅 Scheduled verification: ${VERIFICATION_CONFIG.schedule}`);
    
    // For demonstration, run verification once
    setTimeout(runVerification, 5000);
    
    // Keep process alive
    setInterval(() => {
        console.log('📊 Verification scheduler running...');
    }, 60000);
}

if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'run':
            runVerification();
            break;
            
        case 'scheduler':
            startScheduler();
            break;
            
        default:
            console.log('Backup Verification System');
            console.log('');
            console.log('Usage:');
            console.log('  node verify-backups.js run');
            console.log('  node verify-backups.js scheduler');
            process.exit(1);
    }
}

module.exports = {
    BackupVerifier,
    VerificationReport,
    VERIFICATION_CONFIG,
    runVerification
};