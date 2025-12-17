#!/usr/bin/env node

/**
 * 🩺 Health Check System
 * MVP Vídeos TécnicoCursos v7
 * 
 * Sistema abrangente de verificação de saúde para produção
 * Monitora todos os subsistemas críticos
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// ===========================================
// Configuration
// ===========================================

const config = {
    app: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        timeout: 10000
    },
    database: {
        url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
        timeout: 5000
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        timeout: 3000
    },
    storage: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timeout: 8000
    },
    worker: {
        healthUrl: process.env.WORKER_HEALTH_URL || 'http://localhost:3001/health',
        timeout: 5000
    }
};

// ===========================================
// Health Check Results
// ===========================================

class HealthCheck {
    constructor() {
        this.results = {
            overall: 'unknown',
            score: 0,
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                total: 0,
                healthy: 0,
                warning: 0,
                critical: 0
            }
        };
    }

    addCheck(name, status, details = {}) {
        this.results.checks[name] = {
            status,
            timestamp: new Date().toISOString(),
            ...details
        };
        
        this.results.summary.total++;
        
        switch (status) {
            case 'healthy':
                this.results.summary.healthy++;
                break;
            case 'warning':
                this.results.summary.warning++;
                break;
            case 'critical':
                this.results.summary.critical++;
                break;
        }
    }

    calculateScore() {
        if (this.results.summary.total === 0) return 0;
        
        const healthyWeight = 10;
        const warningWeight = 5;
        const criticalWeight = 0;
        
        const totalScore = (
            this.results.summary.healthy * healthyWeight +
            this.results.summary.warning * warningWeight +
            this.results.summary.critical * criticalWeight
        );
        
        const maxScore = this.results.summary.total * healthyWeight;
        this.results.score = Math.round((totalScore / maxScore) * 100);
        
        // Determine overall status
        if (this.results.score >= 90) {
            this.results.overall = 'healthy';
        } else if (this.results.score >= 70) {
            this.results.overall = 'warning';
        } else {
            this.results.overall = 'critical';
        }
        
        return this.results.score;
    }

    getResults() {
        this.calculateScore();
        return this.results;
    }
}

// ===========================================
// Individual Health Checks
// ===========================================

async function checkApplication(healthCheck) {
    console.log('🔍 Checking application health...');
    
    try {
        const startTime = Date.now();
        const url = `${config.app.url}/api/health`;
        
        const response = await makeHttpRequest(url, config.app.timeout);
        const responseTime = Date.now() - startTime;
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.body);
            
            healthCheck.addCheck('application', 'healthy', {
                responseTime: `${responseTime}ms`,
                version: data.version,
                uptime: data.uptime,
                url: url
            });
        } else {
            healthCheck.addCheck('application', 'critical', {
                error: `HTTP ${response.statusCode}`,
                responseTime: `${responseTime}ms`,
                url: url
            });
        }
    } catch (error) {
        healthCheck.addCheck('application', 'critical', {
            error: error.message,
            url: config.app.url
        });
    }
}

async function checkDatabase(healthCheck) {
    console.log('🔍 Checking database connectivity...');
    
    if (!config.database.url) {
        healthCheck.addCheck('database', 'warning', {
            error: 'Database URL not configured'
        });
        return;
    }
    
    try {
        // Try connecting with pg client
        const startTime = Date.now();
        
        // For now, we'll check if the database script works
        const testScript = path.join(process.cwd(), 'scripts', 'test-database-connection.js');
        
        if (fs.existsSync(testScript)) {
            execSync(`node "${testScript}"`, { 
                stdio: 'pipe', 
                timeout: config.database.timeout 
            });
        }
        
        const responseTime = Date.now() - startTime;
        
        healthCheck.addCheck('database', 'healthy', {
            responseTime: `${responseTime}ms`,
            url: config.database.url.replace(/\/\/.*@/, '//***:***@') // Hide credentials
        });
        
    } catch (error) {
        healthCheck.addCheck('database', 'critical', {
            error: error.message.substring(0, 200),
            url: config.database.url ? '***configured***' : 'not configured'
        });
    }
}

async function checkRedis(healthCheck) {
    console.log('🔍 Checking Redis connectivity...');
    
    let redis;
    try {
        const startTime = Date.now();
        
        redis = new Redis(config.redis.url, {
            connectTimeout: config.redis.timeout,
            lazyConnect: true,
            maxRetriesPerRequest: 1
        });
        
        await redis.ping();
        const responseTime = Date.now() - startTime;
        
        // Get Redis info
        const info = await redis.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
        
        healthCheck.addCheck('redis', 'healthy', {
            responseTime: `${responseTime}ms`,
            version: version,
            url: config.redis.url
        });
        
    } catch (error) {
        healthCheck.addCheck('redis', 'critical', {
            error: error.message,
            url: config.redis.url
        });
    } finally {
        if (redis) {
            redis.disconnect();
        }
    }
}

async function checkStorage(healthCheck) {
    console.log('🔍 Checking Supabase storage...');
    
    if (!config.storage.supabaseUrl) {
        healthCheck.addCheck('storage', 'warning', {
            error: 'Supabase URL not configured'
        });
        return;
    }
    
    try {
        const startTime = Date.now();
        const url = `${config.storage.supabaseUrl}/rest/v1/`;
        
        const response = await makeHttpRequest(url, config.storage.timeout);
        const responseTime = Date.now() - startTime;
        
        if (response.statusCode === 200 || response.statusCode === 401) {
            // 401 is expected without auth, means service is up
            healthCheck.addCheck('storage', 'healthy', {
                responseTime: `${responseTime}ms`,
                url: config.storage.supabaseUrl
            });
        } else {
            healthCheck.addCheck('storage', 'warning', {
                error: `HTTP ${response.statusCode}`,
                responseTime: `${responseTime}ms`,
                url: config.storage.supabaseUrl
            });
        }
        
    } catch (error) {
        healthCheck.addCheck('storage', 'critical', {
            error: error.message,
            url: config.storage.supabaseUrl
        });
    }
}

async function checkWorker(healthCheck) {
    console.log('🔍 Checking render worker...');
    
    try {
        const startTime = Date.now();
        
        const response = await makeHttpRequest(config.worker.healthUrl, config.worker.timeout);
        const responseTime = Date.now() - startTime;
        
        if (response.statusCode === 200) {
            const data = JSON.parse(response.body);
            
            healthCheck.addCheck('worker', 'healthy', {
                responseTime: `${responseTime}ms`,
                status: data.status,
                concurrency: data.concurrency,
                url: config.worker.healthUrl
            });
        } else {
            healthCheck.addCheck('worker', 'warning', {
                error: `HTTP ${response.statusCode}`,
                responseTime: `${responseTime}ms`,
                url: config.worker.healthUrl
            });
        }
        
    } catch (error) {
        healthCheck.addCheck('worker', 'warning', {
            error: error.message,
            url: config.worker.healthUrl
        });
    }
}

async function checkSystemResources(healthCheck) {
    console.log('🔍 Checking system resources...');
    
    try {
        // Check disk space
        const diskUsage = execSync('df -h /', { encoding: 'utf8' });
        const diskLine = diskUsage.split('\n')[1];
        const diskUsagePercent = parseInt(diskLine.split(/\s+/)[4]);
        
        // Check memory usage
        const memInfo = execSync('free', { encoding: 'utf8' });
        const memLine = memInfo.split('\n')[1];
        const memParts = memLine.split(/\s+/);
        const memTotal = parseInt(memParts[1]);
        const memUsed = parseInt(memParts[2]);
        const memUsagePercent = Math.round((memUsed / memTotal) * 100);
        
        // Check load average
        const loadAvg = execSync('uptime', { encoding: 'utf8' });
        const loadMatch = loadAvg.match(/load average: ([\d.]+)/);
        const load = loadMatch ? parseFloat(loadMatch[1]) : 0;
        
        let resourceStatus = 'healthy';
        const warnings = [];
        
        if (diskUsagePercent > 80) {
            resourceStatus = 'warning';
            warnings.push(`High disk usage: ${diskUsagePercent}%`);
        }
        
        if (memUsagePercent > 85) {
            resourceStatus = 'warning';
            warnings.push(`High memory usage: ${memUsagePercent}%`);
        }
        
        if (load > 2) {
            resourceStatus = 'warning';
            warnings.push(`High load average: ${load}`);
        }
        
        healthCheck.addCheck('resources', resourceStatus, {
            diskUsage: `${diskUsagePercent}%`,
            memoryUsage: `${memUsagePercent}%`,
            loadAverage: load.toString(),
            warnings: warnings.length > 0 ? warnings : undefined
        });
        
    } catch (error) {
        healthCheck.addCheck('resources', 'warning', {
            error: 'Unable to check system resources',
            details: error.message
        });
    }
}

// ===========================================
// HTTP Request Helper
// ===========================================

function makeHttpRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.get(url, {
            timeout: timeout,
            headers: {
                'User-Agent': 'HealthCheck/1.0'
            }
        }, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });
        
        req.on('timeout', () => {
            req.abort();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        req.on('error', (err) => {
            reject(err);
        });
    });
}

// ===========================================
// Main Health Check Function
// ===========================================

async function runHealthCheck() {
    console.log('🩺 Starting comprehensive health check...\n');
    
    const healthCheck = new HealthCheck();
    
    // Run all checks in parallel for faster execution
    await Promise.allSettled([
        checkApplication(healthCheck),
        checkDatabase(healthCheck),
        checkRedis(healthCheck),
        checkStorage(healthCheck),
        checkWorker(healthCheck),
        checkSystemResources(healthCheck)
    ]);
    
    const results = healthCheck.getResults();
    
    // Display results
    console.log('\n📊 Health Check Results:');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${getStatusEmoji(results.overall)} ${results.overall.toUpperCase()}`);
    console.log(`Health Score: ${results.score}/100`);
    console.log(`Checks: ${results.summary.healthy} healthy, ${results.summary.warning} warnings, ${results.summary.critical} critical\n`);
    
    // Display individual checks
    Object.entries(results.checks).forEach(([name, check]) => {
        console.log(`${getStatusEmoji(check.status)} ${name.toUpperCase()}: ${check.status}`);
        
        if (check.responseTime) {
            console.log(`  ⏱️  Response Time: ${check.responseTime}`);
        }
        
        if (check.error) {
            console.log(`  ❌ Error: ${check.error}`);
        }
        
        if (check.warnings && check.warnings.length > 0) {
            check.warnings.forEach(warning => {
                console.log(`  ⚠️  ${warning}`);
            });
        }
        
        console.log('');
    });
    
    // Return exit code based on health
    const exitCode = results.overall === 'critical' ? 1 : 0;
    
    // Save results to file for monitoring systems
    const resultsFile = path.join(process.cwd(), 'health-check-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${resultsFile}`);
    
    return exitCode;
}

function getStatusEmoji(status) {
    switch (status) {
        case 'healthy': return '✅';
        case 'warning': return '⚠️';
        case 'critical': return '❌';
        default: return '❓';
    }
}

// ===========================================
// CLI Interface
// ===========================================

if (require.main === module) {
    runHealthCheck()
        .then((exitCode) => {
            process.exit(exitCode);
        })
        .catch((error) => {
            console.error('❌ Health check failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runHealthCheck,
    HealthCheck
};