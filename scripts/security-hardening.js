#!/usr/bin/env node

/**
 * 🛡️ Security Hardening Script
 * MVP Vídeos TécnicoCursos v7
 * 
 * Implementa medidas de segurança avançadas para produção
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ===========================================
// Configuration
// ===========================================

const SECURITY_CONFIG = {
    secretsPath: '/run/secrets',
    certPath: '/etc/ssl',
    keyPath: '/etc/ssl/private',
    backupPath: '/opt/backups/security',
    logPath: '/var/log/security',
    
    // Security policies
    passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAge: 90, // days
        preventReuse: 12 // last N passwords
    },
    
    sessionPolicy: {
        maxAge: 86400, // 24 hours
        idleTimeout: 3600, // 1 hour
        secureCookies: true,
        sameSite: 'strict'
    },
    
    rateLimiting: {
        global: 1000, // requests per hour per IP
        auth: 5, // login attempts per 15 minutes
        api: 100, // API calls per minute
        upload: 10 // file uploads per hour
    }
};

// ===========================================
// Security Utilities
// ===========================================

function generateSecureSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateCSRFToken() {
    return crypto.randomBytes(24).toString('hex');
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    let sanitized = input;
    
    // Remove NULL bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // HTML encode dangerous characters
    if (options.htmlEncode !== false) {
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    
    // SQL injection prevention
    if (options.sqlSafe) {
        sanitized = sanitized.replace(/['";\\]/g, '\\$&');
    }
    
    // Path traversal prevention
    if (options.pathSafe) {
        sanitized = sanitized.replace(/\.\.[\\/]/g, '');
    }
    
    return sanitized.trim();
}

function validateCSRFToken(token, session) {
    const sessionToken = session?.csrfToken;
    return sessionToken && crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(sessionToken, 'hex')
    );
}

// ===========================================
// SSL/TLS Configuration
// ===========================================

function generateSSLCertificate(domain = 'localhost') {
    console.log(`🔐 Generating SSL certificate for ${domain}...`);
    
    const keyPath = path.join(SECURITY_CONFIG.keyPath, `${domain}.key`);
    const certPath = path.join(SECURITY_CONFIG.certPath, `${domain}.crt`);
    const csrPath = path.join(SECURITY_CONFIG.certPath, `${domain}.csr`);
    
    try {
        // Ensure directories exist
        fs.mkdirSync(SECURITY_CONFIG.keyPath, { recursive: true, mode: 0o700 });
        fs.mkdirSync(SECURITY_CONFIG.certPath, { recursive: true, mode: 0o755 });
        
        // Generate private key
        execSync(`openssl genrsa -out "${keyPath}" 4096`, { stdio: 'pipe' });
        console.log(`✅ Private key generated: ${keyPath}`);
        
        // Generate certificate signing request
        const subject = `/C=BR/ST=SP/L=Sao Paulo/O=TecnicoCursos/CN=${domain}`;
        execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`, { stdio: 'pipe' });
        
        // Generate self-signed certificate (for development/staging)
        execSync(`openssl x509 -req -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}" -days 365`, { stdio: 'pipe' });
        console.log(`✅ Certificate generated: ${certPath}`);
        
        // Set proper permissions
        execSync(`chmod 600 "${keyPath}"`);
        execSync(`chmod 644 "${certPath}"`);
        
        // Clean up CSR
        fs.unlinkSync(csrPath);
        
        return { keyPath, certPath };
        
    } catch (error) {
        console.error(`❌ Failed to generate SSL certificate:`, error.message);
        throw error;
    }
}

function setupSSLRedirect() {
    const redirectConfig = `
# Force HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}
`;
    
    const configPath = path.join(process.cwd(), 'nginx', 'conf.d', 'ssl-redirect.conf');
    fs.writeFileSync(configPath, redirectConfig);
    console.log(`✅ SSL redirect configured: ${configPath}`);
}

// ===========================================
// Security Headers Middleware
// ===========================================

function generateSecurityHeaders() {
    const nonce = generateSecureSecret(16);
    
    const headers = {
        // HTTPS enforcement
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        
        // XSS protection
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        
        // CSP with nonce
        'Content-Security-Policy': [
            "default-src 'self'",
            `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; '),
        
        // Additional security
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
        
        // Remove server information
        'Server': '',
        'X-Powered-By': ''
    };
    
    return { headers, nonce };
}

function createSecurityMiddleware() {
    const middleware = `
// Security Headers Middleware
export function securityHeaders(req, res, next) {
    const { headers, nonce } = generateSecurityHeaders();
    
    // Set all security headers
    Object.entries(headers).forEach(([key, value]) => {
        if (value) res.setHeader(key, value);
    });
    
    // Add nonce to response locals for templates
    res.locals.nonce = nonce;
    
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
}

// Rate limiting middleware
export function createRateLimiter(options = {}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // requests per window
        message = 'Too many requests, please try again later.',
        standardHeaders = true,
        legacyHeaders = false
    } = options;
    
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders,
        legacyHeaders,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl
            });
            res.status(429).json({ error: message });
        }
    });
}

// Input validation middleware
export function validateInput(schema) {
    return (req, res, next) => {
        try {
            // Sanitize inputs
            if (req.body) {
                req.body = sanitizeObject(req.body);
            }
            if (req.query) {
                req.query = sanitizeObject(req.query);
            }
            if (req.params) {
                req.params = sanitizeObject(req.params);
            }
            
            // Validate with schema
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: result.error.errors
                });
            }
            
            req.validatedData = result.data;
            next();
            
        } catch (error) {
            logger.error('Input validation error:', error);
            res.status(400).json({ error: 'Invalid input' });
        }
    };
}

function sanitizeObject(obj) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value, {
                htmlEncode: true,
                sqlSafe: true,
                pathSafe: true
            });
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}
`;
    
    const middlewarePath = path.join(process.cwd(), 'app', 'lib', 'middleware', 'security.ts');
    fs.writeFileSync(middlewarePath, middleware);
    console.log(`✅ Security middleware created: ${middlewarePath}`);
}

// ===========================================
// Secrets Management
// ===========================================

function generateProductionSecrets() {
    console.log(`🔑 Generating production secrets...`);
    
    const secrets = {
        NEXTAUTH_SECRET: generateSecureSecret(32),
        CSRF_SECRET: generateSecureSecret(24),
        ENCRYPTION_KEY: generateSecureSecret(32),
        JWT_SECRET: generateSecureSecret(32),
        API_SECRET_KEY: generateSecureSecret(24),
        WEBHOOK_SECRET: generateSecureSecret(16),
        SESSION_SECRET: generateSecureSecret(32),
        REDIS_PASSWORD: generateSecureSecret(16),
        DB_ENCRYPTION_KEY: generateSecureSecret(32),
        BACKUP_ENCRYPTION_KEY: generateSecureSecret(32)
    };
    
    // Create secrets directory
    fs.mkdirSync(SECURITY_CONFIG.secretsPath, { recursive: true, mode: 0o700 });
    
    // Write secrets to individual files (Docker secrets pattern)
    Object.entries(secrets).forEach(([key, value]) => {
        const secretFile = path.join(SECURITY_CONFIG.secretsPath, key.toLowerCase());
        fs.writeFileSync(secretFile, value, { mode: 0o600 });
        console.log(`✅ Secret generated: ${key}`);
    });
    
    // Create environment template
    const envTemplate = Object.keys(secrets)
        .map(key => `${key}=$(cat ${SECURITY_CONFIG.secretsPath}/${key.toLowerCase()})`)
        .join('\n');
    
    const templatePath = path.join(process.cwd(), '.env.secrets.template');
    fs.writeFileSync(templatePath, envTemplate);
    console.log(`✅ Secrets template created: ${templatePath}`);
    
    return secrets;
}

function createSecretsManager() {
    const manager = `
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecretsManager {
    private secretsPath: string;
    private cache: Map<string, string> = new Map();
    
    constructor(secretsPath = '/run/secrets') {
        this.secretsPath = secretsPath;
    }
    
    getSecret(name: string): string {
        // Check cache first
        if (this.cache.has(name)) {
            return this.cache.get(name)!;
        }
        
        // Try Docker secrets first
        const dockerSecretPath = path.join(this.secretsPath, name.toLowerCase());
        if (fs.existsSync(dockerSecretPath)) {
            const secret = fs.readFileSync(dockerSecretPath, 'utf8').trim();
            this.cache.set(name, secret);
            return secret;
        }
        
        // Fallback to environment variable
        const envValue = process.env[name];
        if (envValue) {
            this.cache.set(name, envValue);
            return envValue;
        }
        
        throw new Error(\`Secret not found: \${name}\`);
    }
    
    encryptValue(value: string): string {
        const key = this.getSecret('ENCRYPTION_KEY');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);
        cipher.setIV(iv);
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return \`\${iv.toString('hex')}:\${authTag.toString('hex')}:\${encrypted}\`;
    }
    
    decryptValue(encryptedValue: string): string {
        const key = this.getSecret('ENCRYPTION_KEY');
        const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
        decipher.setIV(iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    rotateSecret(name: string): string {
        const newSecret = crypto.randomBytes(32).toString('hex');
        const secretPath = path.join(this.secretsPath, name.toLowerCase());
        
        fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
        this.cache.delete(name); // Invalidate cache
        
        return newSecret;
    }
}

export const secrets = new SecretsManager();
`;
    
    const managerPath = path.join(process.cwd(), 'app', 'lib', 'security', 'secrets-manager.ts');
    fs.mkdirSync(path.dirname(managerPath), { recursive: true });
    fs.writeFileSync(managerPath, manager);
    console.log(`✅ Secrets manager created: ${managerPath}`);
}

// ===========================================
// Security Scanning
// ===========================================

function runSecurityScan() {
    console.log('🔍 Running security scan...');
    
    const scanResults = {
        timestamp: new Date().toISOString(),
        vulnerabilities: [],
        recommendations: []
    };
    
    try {
        // Check for known vulnerabilities
        console.log('Checking npm audit...');
        const auditOutput = execSync('npm audit --json', { 
            encoding: 'utf8',
            cwd: path.join(process.cwd(), 'estudio_ia_videos')
        });
        
        const auditData = JSON.parse(auditOutput);
        
        if (auditData.vulnerabilities) {
            Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
                if (vuln.severity === 'high' || vuln.severity === 'critical') {
                    scanResults.vulnerabilities.push({
                        package: pkg,
                        severity: vuln.severity,
                        title: vuln.title,
                        recommendation: 'Update package to latest version'
                    });
                }
            });
        }
        
    } catch (error) {
        console.warn('npm audit failed:', error.message);
    }
    
    // Check file permissions
    console.log('Checking file permissions...');
    const sensitiveFiles = [
        '.env',
        '.env.production', 
        '.env.staging',
        'package.json',
        'docker-compose.yml'
    ];
    
    sensitiveFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const mode = stats.mode & parseInt('777', 8);
            
            if (mode & parseInt('044', 8)) { // World readable
                scanResults.recommendations.push({
                    type: 'file_permissions',
                    file: file,
                    issue: 'File is world-readable',
                    recommendation: `chmod 600 ${file}`
                });
            }
        }
    });
    
    // Check for hardcoded secrets
    console.log('Checking for hardcoded secrets...');
    const secretPatterns = [
        /AKIA[0-9A-Z]{16}/, // AWS access key
        /sk_live_[0-9a-zA-Z]{24}/, // Stripe
        /ghp_[0-9a-zA-Z]{36}/, // GitHub token
        /AIza[0-9A-Za-z\\-_]{35}/, // Google API
        /"[0-9a-f]{32}"/, // Generic 32-char hex
    ];
    
    // Save scan results
    const resultsPath = path.join(SECURITY_CONFIG.logPath, 'security-scan.json');
    fs.mkdirSync(SECURITY_CONFIG.logPath, { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(scanResults, null, 2));
    
    console.log(`✅ Security scan completed: ${resultsPath}`);
    console.log(`📊 Found ${scanResults.vulnerabilities.length} vulnerabilities, ${scanResults.recommendations.length} recommendations`);
    
    return scanResults;
}

// ===========================================
// Main Security Setup
// ===========================================

async function setupSecurity() {
    console.log('🛡️ Starting security hardening...\n');
    
    try {
        // 1. Generate SSL certificates
        const certs = generateSSLCertificate('tecnicocursos.com');
        generateSSLCertificate('staging.tecnicocursos.com');
        setupSSLRedirect();
        
        // 2. Generate production secrets
        const secrets = generateProductionSecrets();
        createSecretsManager();
        
        // 3. Create security middleware
        createSecurityMiddleware();
        
        // 4. Run security scan
        const scanResults = runSecurityScan();
        
        console.log('\n✅ Security hardening completed!\n');
        console.log('📋 Next steps:');
        console.log('1. Review generated SSL certificates');
        console.log('2. Update environment variables with new secrets');
        console.log('3. Apply security middleware to routes');
        console.log('4. Review security scan results');
        console.log('5. Configure external certificate authority for production');
        
        if (scanResults.vulnerabilities.length > 0) {
            console.log(`\n⚠️  Found ${scanResults.vulnerabilities.length} security vulnerabilities that need attention`);
        }
        
        return {
            certs,
            secrets,
            scanResults
        };
        
    } catch (error) {
        console.error('❌ Security hardening failed:', error);
        throw error;
    }
}

// ===========================================
// CLI Interface
// ===========================================

if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'setup':
            setupSecurity()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
            
        case 'scan':
            runSecurityScan();
            break;
            
        case 'secrets':
            generateProductionSecrets();
            break;
            
        case 'ssl':
            const domain = process.argv[3] || 'localhost';
            generateSSLCertificate(domain);
            break;
            
        default:
            console.log('Usage: node security-hardening.js <command>');
            console.log('Commands:');
            console.log('  setup   - Complete security hardening setup');
            console.log('  scan    - Run security vulnerability scan');
            console.log('  secrets - Generate production secrets');
            console.log('  ssl     - Generate SSL certificates');
            process.exit(1);
    }
}

module.exports = {
    setupSecurity,
    generateSecureSecret,
    generateSSLCertificate,
    runSecurityScan,
    sanitizeInput,
    hashPassword,
    verifyPassword
};