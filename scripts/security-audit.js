#!/usr/bin/env node

/**
 * 🔒 Security Audit Script
 * MVP Vídeos TécnicoCursos v7
 * 
 * Executa auditorias de segurança automatizadas
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ===========================================
// Security Audit Configuration
// ===========================================

const AUDIT_CONFIG = {
    scanTypes: {
        dependencies: true,
        containers: true,
        files: true,
        network: true,
        configs: true
    },
    
    severity: {
        critical: { threshold: 0, action: 'fail' },
        high: { threshold: 5, action: 'warn' },
        medium: { threshold: 20, action: 'info' },
        low: { threshold: 50, action: 'ignore' }
    },
    
    reportPath: '/var/log/security',
    maxReportAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    sensitiveFiles: [
        '.env', '.env.production', '.env.staging',
        'package.json', 'docker-compose.yml',
        'nginx.conf', 'ssl/*', 'secrets/*'
    ],
    
    vulnerabilityDatabases: [
        'npm-audit',
        'trivy-db',
        'cve-db'
    ]
};

// ===========================================
// Audit Result Types
// ===========================================

class AuditFinding {
    constructor(type, severity, title, description, remediation, affected = []) {
        this.id = crypto.randomUUID();
        this.type = type;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.remediation = remediation;
        this.affected = affected;
        this.timestamp = new Date().toISOString();
        this.status = 'open';
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            severity: this.severity,
            title: this.title,
            description: this.description,
            remediation: this.remediation,
            affected: this.affected,
            timestamp: this.timestamp,
            status: this.status
        };
    }
}

class AuditReport {
    constructor() {
        this.id = crypto.randomUUID();
        this.timestamp = new Date().toISOString();
        this.findings = [];
        this.summary = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        };
        this.scanDuration = 0;
        this.scannedComponents = [];
    }
    
    addFinding(finding) {
        this.findings.push(finding);
        this.summary[finding.severity]++;
    }
    
    setScanDuration(duration) {
        this.scanDuration = duration;
    }
    
    addScannedComponent(component) {
        this.scannedComponents.push(component);
    }
    
    getScore() {
        const { critical, high, medium, low } = this.summary;
        const totalFindings = critical + high + medium + low;
        
        if (totalFindings === 0) return 100;
        
        // Weighted scoring
        const weightedIssues = (critical * 10) + (high * 5) + (medium * 2) + (low * 1);
        const maxScore = 100;
        const penalty = Math.min(weightedIssues * 2, maxScore);
        
        return Math.max(0, maxScore - penalty);
    }
    
    shouldFail() {
        return this.summary.critical > AUDIT_CONFIG.severity.critical.threshold ||
               this.summary.high > AUDIT_CONFIG.severity.high.threshold;
    }
    
    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            findings: this.findings.map(f => f.toJSON()),
            summary: this.summary,
            scanDuration: this.scanDuration,
            scannedComponents: this.scannedComponents,
            score: this.getScore(),
            shouldFail: this.shouldFail()
        };
    }
}

// ===========================================
// Dependency Security Audit
// ===========================================

function auditDependencies(report) {
    console.log('🔍 Scanning dependencies for vulnerabilities...');
    
    try {
        // NPM Audit
        const npmAuditPath = path.join(process.cwd(), 'estudio_ia_videos');
        if (fs.existsSync(path.join(npmAuditPath, 'package.json'))) {
            try {
                const auditOutput = execSync('npm audit --json', {
                    cwd: npmAuditPath,
                    encoding: 'utf8',
                    timeout: 30000
                });
                
                const auditData = JSON.parse(auditOutput);
                report.addScannedComponent('npm-dependencies');
                
                if (auditData.vulnerabilities) {
                    Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
                        const severity = vuln.severity;
                        
                        if (['critical', 'high', 'moderate'].includes(severity)) {
                            const finding = new AuditFinding(
                                'dependency',
                                severity === 'moderate' ? 'medium' : severity,
                                `${vuln.title || 'Vulnerability'} in ${pkg}`,
                                vuln.range || 'Unknown version range affected',
                                vuln.fixAvailable ? 'Run npm audit fix' : 'Update package manually',
                                [pkg]
                            );
                            
                            report.addFinding(finding);
                        }
                    });
                }
                
            } catch (error) {
                console.warn('NPM audit failed:', error.message);
            }
        }
        
        // Python requirements (if exists)
        const reqPath = path.join(process.cwd(), 'requirements.txt');
        if (fs.existsSync(reqPath)) {
            try {
                execSync('pip-audit --format=json --output=/tmp/pip-audit.json', {
                    timeout: 30000
                });
                
                const pipAuditPath = '/tmp/pip-audit.json';
                if (fs.existsSync(pipAuditPath)) {
                    const pipAuditData = JSON.parse(fs.readFileSync(pipAuditPath, 'utf8'));
                    report.addScannedComponent('python-dependencies');
                    
                    pipAuditData.vulnerabilities?.forEach(vuln => {
                        const finding = new AuditFinding(
                            'dependency',
                            'high',
                            `Python vulnerability: ${vuln.id}`,
                            vuln.description,
                            'Update package to fixed version',
                            [vuln.package]
                        );
                        
                        report.addFinding(finding);
                    });
                }
                
            } catch (error) {
                console.warn('pip-audit failed:', error.message);
            }
        }
        
    } catch (error) {
        console.error('Dependency audit failed:', error);
    }
}

// ===========================================
// Container Security Audit
// ===========================================

function auditContainers(report) {
    console.log('🐳 Scanning container images for vulnerabilities...');
    
    try {
        // Get list of images
        const images = execSync('docker images --format "{{.Repository}}:{{.Tag}}"', {
            encoding: 'utf8',
            timeout: 10000
        }).trim().split('\n').filter(img => img && !img.includes('<none>'));
        
        report.addScannedComponent('container-images');
        
        for (const image of images.slice(0, 5)) { // Limit to first 5 images
            try {
                console.log(`Scanning ${image}...`);
                
                const scanOutput = execSync(`trivy image --format json ${image}`, {
                    encoding: 'utf8',
                    timeout: 60000
                });
                
                const scanData = JSON.parse(scanOutput);
                
                scanData.Results?.forEach(result => {
                    result.Vulnerabilities?.forEach(vuln => {
                        if (['CRITICAL', 'HIGH'].includes(vuln.Severity)) {
                            const finding = new AuditFinding(
                                'container',
                                vuln.Severity.toLowerCase(),
                                `Container vulnerability: ${vuln.VulnerabilityID}`,
                                `${vuln.Description || vuln.Title}`,
                                vuln.FixedVersion ? 
                                    `Update to ${vuln.FixedVersion}` : 
                                    'No fix available',
                                [image, vuln.PkgName]
                            );
                            
                            report.addFinding(finding);
                        }
                    });
                });
                
            } catch (error) {
                console.warn(`Failed to scan image ${image}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error('Container audit failed:', error);
    }
}

// ===========================================
// File Security Audit
// ===========================================

function auditFiles(report) {
    console.log('📁 Scanning files for security issues...');
    
    try {
        report.addScannedComponent('file-permissions');
        
        // Check sensitive file permissions
        AUDIT_CONFIG.sensitiveFiles.forEach(filePattern => {
            const files = execSync(`find . -name "${filePattern}" 2>/dev/null || true`, {
                encoding: 'utf8',
                cwd: process.cwd()
            }).trim().split('\n').filter(f => f);
            
            files.forEach(file => {
                try {
                    const stats = fs.statSync(file);
                    const mode = stats.mode & parseInt('777', 8);
                    
                    // Check if world-readable
                    if (mode & parseInt('044', 8)) {
                        const finding = new AuditFinding(
                            'file-permission',
                            'medium',
                            `Sensitive file is world-readable: ${file}`,
                            'File contains sensitive information but is readable by all users',
                            `chmod 600 ${file}`,
                            [file]
                        );
                        
                        report.addFinding(finding);
                    }
                    
                    // Check if world-writable
                    if (mode & parseInt('022', 8)) {
                        const finding = new AuditFinding(
                            'file-permission',
                            'high',
                            `Sensitive file is world-writable: ${file}`,
                            'File can be modified by any user',
                            `chmod 600 ${file}`,
                            [file]
                        );
                        
                        report.addFinding(finding);
                    }
                    
                } catch (error) {
                    // File doesn't exist or no permission
                }
            });
        });
        
        // Scan for hardcoded secrets
        const secretPatterns = [
            { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
            { pattern: /sk_live_[0-9a-zA-Z]{24}/, name: 'Stripe Secret Key' },
            { pattern: /ghp_[0-9a-zA-Z]{36}/, name: 'GitHub Token' },
            { pattern: /AIza[0-9A-Za-z\\-_]{35}/, name: 'Google API Key' },
            { pattern: /"[0-9a-f]{32}"/, name: 'Generic 32-char hex secret' },
            { pattern: /password\s*=\s*['"]\w+['"]/, name: 'Hardcoded password' }
        ];
        
        const codeFiles = execSync(`find . -name "*.js" -o -name "*.ts" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" | grep -v node_modules | head -100`, {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim().split('\n').filter(f => f);
        
        codeFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                secretPatterns.forEach(({ pattern, name }) => {
                    if (pattern.test(content)) {
                        const finding = new AuditFinding(
                            'hardcoded-secret',
                            'critical',
                            `Hardcoded secret detected: ${name}`,
                            `Potential ${name} found in source code`,
                            'Move secrets to environment variables or secure vault',
                            [file]
                        );
                        
                        report.addFinding(finding);
                    }
                });
                
            } catch (error) {
                // Skip unreadable files
            }
        });
        
    } catch (error) {
        console.error('File audit failed:', error);
    }
}

// ===========================================
// Network Security Audit
// ===========================================

function auditNetwork(report) {
    console.log('🌐 Scanning network configuration...');
    
    try {
        report.addScannedComponent('network-config');
        
        // Check for services running on all interfaces
        const openPorts = execSync(`netstat -tuln 2>/dev/null || ss -tuln`, {
            encoding: 'utf8',
            timeout: 10000
        });
        
        const lines = openPorts.split('\n');
        const exposedServices = lines.filter(line => 
            line.includes('0.0.0.0:') && !line.includes(':80 ') && !line.includes(':443 ')
        );
        
        if (exposedServices.length > 0) {
            exposedServices.forEach(service => {
                const match = service.match(/0\.0\.0\.0:(\d+)/);
                if (match) {
                    const port = match[1];
                    
                    const finding = new AuditFinding(
                        'network',
                        'medium',
                        `Service exposed on all interfaces: port ${port}`,
                        'Service is accessible from any network interface',
                        'Bind service to specific interface or use firewall rules',
                        [`port:${port}`]
                    );
                    
                    report.addFinding(finding);
                }
            });
        }
        
        // Check SSL/TLS configuration
        const nginxConfigs = execSync(`find . -name "*.conf" -path "*/nginx/*" 2>/dev/null || true`, {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim().split('\n').filter(f => f);
        
        nginxConfigs.forEach(configFile => {
            try {
                const content = fs.readFileSync(configFile, 'utf8');
                
                // Check for weak SSL protocols
                if (content.includes('SSLv2') || content.includes('SSLv3') || content.includes('TLSv1;')) {
                    const finding = new AuditFinding(
                        'ssl-config',
                        'high',
                        `Weak SSL/TLS protocols enabled: ${configFile}`,
                        'Configuration allows deprecated SSL/TLS versions',
                        'Disable SSLv2, SSLv3, TLSv1.0 and TLSv1.1',
                        [configFile]
                    );
                    
                    report.addFinding(finding);
                }
                
                // Check for missing security headers
                const securityHeaders = [
                    'Strict-Transport-Security',
                    'X-Frame-Options',
                    'X-Content-Type-Options'
                ];
                
                securityHeaders.forEach(header => {
                    if (!content.includes(header)) {
                        const finding = new AuditFinding(
                            'security-header',
                            'low',
                            `Missing security header: ${header}`,
                            `${header} header not configured in ${configFile}`,
                            `Add ${header} header to configuration`,
                            [configFile]
                        );
                        
                        report.addFinding(finding);
                    }
                });
                
            } catch (error) {
                // Skip unreadable files
            }
        });
        
    } catch (error) {
        console.error('Network audit failed:', error);
    }
}

// ===========================================
// Configuration Security Audit
// ===========================================

function auditConfigs(report) {
    console.log('⚙️ Scanning configuration files...');
    
    try {
        report.addScannedComponent('configurations');
        
        // Check Docker configurations
        const dockerFiles = execSync(`find . -name "Dockerfile*" -o -name "docker-compose*.yml" 2>/dev/null || true`, {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim().split('\n').filter(f => f);
        
        dockerFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for running as root
                if (!content.includes('USER ') && file.includes('Dockerfile')) {
                    const finding = new AuditFinding(
                        'docker-config',
                        'medium',
                        `Container runs as root: ${file}`,
                        'Container does not specify non-root user',
                        'Add USER directive to Dockerfile',
                        [file]
                    );
                    
                    report.addFinding(finding);
                }
                
                // Check for privileged containers
                if (content.includes('privileged: true')) {
                    const finding = new AuditFinding(
                        'docker-config',
                        'high',
                        `Privileged container: ${file}`,
                        'Container runs in privileged mode',
                        'Remove privileged flag and use capabilities instead',
                        [file]
                    );
                    
                    report.addFinding(finding);
                }
                
                // Check for missing security options
                if (!content.includes('security_opt') && file.includes('docker-compose')) {
                    const finding = new AuditFinding(
                        'docker-config',
                        'low',
                        `Missing security options: ${file}`,
                        'Container does not specify security options',
                        'Add security_opt with no-new-privileges',
                        [file]
                    );
                    
                    report.addFinding(finding);
                }
                
            } catch (error) {
                // Skip unreadable files
            }
        });
        
        // Check environment files
        const envFiles = ['.env', '.env.production', '.env.staging'];
        envFiles.forEach(envFile => {
            const fullPath = path.join(process.cwd(), envFile);
            
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
                    // Check for weak passwords
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.includes('PASSWORD') && line.includes('=')) {
                            const password = line.split('=')[1]?.trim();
                            
                            if (password && password.length < 12) {
                                const finding = new AuditFinding(
                                    'config',
                                    'medium',
                                    `Weak password in ${envFile}`,
                                    `Password on line ${index + 1} is too short`,
                                    'Use strong passwords (12+ characters)',
                                    [envFile]
                                );
                                
                                report.addFinding(finding);
                            }
                        }
                    });
                    
                } catch (error) {
                    // Skip unreadable files
                }
            }
        });
        
    } catch (error) {
        console.error('Configuration audit failed:', error);
    }
}

// ===========================================
// Main Audit Function
// ===========================================

function runSecurityAudit(options = {}) {
    const startTime = Date.now();
    const report = new AuditReport();
    
    console.log('🔒 Starting comprehensive security audit...\n');
    
    try {
        // Run individual audit components
        if (AUDIT_CONFIG.scanTypes.dependencies && options.dependencies !== false) {
            auditDependencies(report);
        }
        
        if (AUDIT_CONFIG.scanTypes.containers && options.containers !== false) {
            auditContainers(report);
        }
        
        if (AUDIT_CONFIG.scanTypes.files && options.files !== false) {
            auditFiles(report);
        }
        
        if (AUDIT_CONFIG.scanTypes.network && options.network !== false) {
            auditNetwork(report);
        }
        
        if (AUDIT_CONFIG.scanTypes.configs && options.configs !== false) {
            auditConfigs(report);
        }
        
        const endTime = Date.now();
        report.setScanDuration(endTime - startTime);
        
        // Generate report
        const reportData = report.toJSON();
        
        // Save report
        fs.mkdirSync(AUDIT_CONFIG.reportPath, { recursive: true });
        const reportFile = path.join(AUDIT_CONFIG.reportPath, `security-audit-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
        
        // Generate summary
        console.log('\n📊 Security Audit Summary:');
        console.log(`Score: ${reportData.score}/100`);
        console.log(`Critical: ${reportData.summary.critical}`);
        console.log(`High: ${reportData.summary.high}`);
        console.log(`Medium: ${reportData.summary.medium}`);
        console.log(`Low: ${reportData.summary.low}`);
        console.log(`Scan Duration: ${Math.round(reportData.scanDuration / 1000)}s`);
        console.log(`Report saved: ${reportFile}\n`);
        
        // Display critical findings
        if (reportData.summary.critical > 0) {
            console.log('🚨 Critical Findings:');
            reportData.findings
                .filter(f => f.severity === 'critical')
                .slice(0, 5)
                .forEach(finding => {
                    console.log(`  - ${finding.title}`);
                    console.log(`    ${finding.remediation}\n`);
                });
        }
        
        return {
            success: !report.shouldFail(),
            report: reportData,
            reportFile
        };
        
    } catch (error) {
        console.error('Security audit failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===========================================
// CLI Interface
// ===========================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg.startsWith('--no-')) {
            const component = arg.replace('--no-', '');
            options[component] = false;
        } else if (arg.startsWith('--')) {
            const component = arg.replace('--', '');
            options[component] = true;
        }
    });
    
    runSecurityAudit(options)
        .then(result => {
            if (result.success) {
                console.log('✅ Security audit completed successfully');
                process.exit(0);
            } else {
                console.log('❌ Security audit failed - critical issues found');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Security audit error:', error);
            process.exit(1);
        });
}

module.exports = {
    runSecurityAudit,
    AuditReport,
    AuditFinding,
    AUDIT_CONFIG
};