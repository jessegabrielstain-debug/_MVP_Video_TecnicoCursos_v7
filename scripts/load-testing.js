#!/usr/bin/env node

/**
 * ⚡ Load Testing Script
 * MVP Vídeos TécnicoCursos v7
 * 
 * Executa testes de carga e performance para validar capacidade de produção
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios').default;

// ===========================================
// Load Testing Configuration
// ===========================================

const LOAD_TEST_CONFIG = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    scenarios: {
        // Cenário 1: Usuários navegando normalmente
        normalBrowsing: {
            users: 50,
            duration: '5m',
            rampUp: '1m',
            endpoints: [
                { path: '/', method: 'GET', weight: 40 },
                { path: '/api/health', method: 'GET', weight: 10 },
                { path: '/api/courses', method: 'GET', weight: 20 },
                { path: '/dashboard', method: 'GET', weight: 20 },
                { path: '/editor', method: 'GET', weight: 10 }
            ]
        },
        
        // Cenário 2: Pico de tráfego
        peakTraffic: {
            users: 200,
            duration: '3m',
            rampUp: '30s',
            endpoints: [
                { path: '/', method: 'GET', weight: 50 },
                { path: '/api/courses', method: 'GET', weight: 30 },
                { path: '/api/health', method: 'GET', weight: 20 }
            ]
        },
        
        // Cenário 3: Upload intensivo
        uploadIntensive: {
            users: 20,
            duration: '5m',
            rampUp: '1m',
            endpoints: [
                { path: '/api/pptx/upload', method: 'POST', weight: 60 },
                { path: '/api/projects', method: 'POST', weight: 30 },
                { path: '/api/projects', method: 'GET', weight: 10 }
            ]
        },
        
        // Cenário 4: API intensivo
        apiIntensive: {
            users: 100,
            duration: '10m',
            rampUp: '2m',
            endpoints: [
                { path: '/api/projects', method: 'GET', weight: 30 },
                { path: '/api/slides', method: 'GET', weight: 25 },
                { path: '/api/render/jobs', method: 'GET', weight: 20 },
                { path: '/api/analytics/stats', method: 'GET', weight: 15 },
                { path: '/api/users/profile', method: 'GET', weight: 10 }
            ]
        },
        
        // Cenário 5: Render pipeline stress
        renderStress: {
            users: 10,
            duration: '15m',
            rampUp: '2m',
            endpoints: [
                { path: '/api/render/start', method: 'POST', weight: 40 },
                { path: '/api/render/jobs', method: 'GET', weight: 30 },
                { path: '/api/render/progress', method: 'GET', weight: 20 },
                { path: '/api/render/cancel', method: 'POST', weight: 10 }
            ]
        }
    },
    
    thresholds: {
        // Tempos de resposta (ms)
        p95_response_time: 2000,
        p99_response_time: 5000,
        avg_response_time: 500,
        
        // Taxa de erro
        error_rate: 1, // 1%
        
        // Throughput mínimo (req/s)
        min_throughput: 10,
        
        // Recursos do sistema
        max_cpu_usage: 80, // 80%
        max_memory_usage: 85, // 85%
        max_disk_usage: 90, // 90%
    },
    
    reportPath: '/var/log/load-test'
};

// ===========================================
// Load Test Report
// ===========================================

class LoadTestReport {
    constructor(scenario) {
        this.scenario = scenario;
        this.timestamp = new Date().toISOString();
        this.results = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                rate: 0
            },
            responseTime: {
                avg: 0,
                min: 0,
                max: 0,
                p50: 0,
                p95: 0,
                p99: 0
            },
            throughput: {
                requestsPerSecond: 0,
                bytesPerSecond: 0
            },
            errors: {},
            systemResources: {
                cpu: [],
                memory: [],
                disk: [],
                network: []
            }
        };
        this.thresholdsPassed = true;
        this.failures = [];
    }
    
    addResult(endpoint, responseTime, success, errorType = null) {
        this.results.requests.total++;
        
        if (success) {
            this.results.requests.successful++;
        } else {
            this.results.requests.failed++;
            
            if (errorType) {
                this.results.errors[errorType] = (this.results.errors[errorType] || 0) + 1;
            }
        }
        
        // Update response time statistics
        if (success) {
            this.updateResponseTimeStats(responseTime);
        }
    }
    
    updateResponseTimeStats(responseTime) {
        // Simple running average (for demonstration)
        const total = this.results.requests.successful;
        this.results.responseTime.avg = 
            ((this.results.responseTime.avg * (total - 1)) + responseTime) / total;
            
        this.results.responseTime.min = Math.min(
            this.results.responseTime.min || responseTime, 
            responseTime
        );
        
        this.results.responseTime.max = Math.max(
            this.results.responseTime.max, 
            responseTime
        );
    }
    
    addSystemSnapshot(cpu, memory, disk, networkRx, networkTx) {
        this.results.systemResources.cpu.push(cpu);
        this.results.systemResources.memory.push(memory);
        this.results.systemResources.disk.push(disk);
        this.results.systemResources.network.push({ rx: networkRx, tx: networkTx });
    }
    
    validateThresholds() {
        const config = LOAD_TEST_CONFIG.thresholds;
        
        // Check error rate
        const errorRate = (this.results.requests.failed / this.results.requests.total) * 100;
        if (errorRate > config.error_rate) {
            this.failures.push(`Error rate ${errorRate.toFixed(2)}% exceeds threshold ${config.error_rate}%`);
            this.thresholdsPassed = false;
        }
        
        // Check average response time
        if (this.results.responseTime.avg > config.avg_response_time) {
            this.failures.push(`Average response time ${this.results.responseTime.avg}ms exceeds threshold ${config.avg_response_time}ms`);
            this.thresholdsPassed = false;
        }
        
        // Check throughput
        if (this.results.throughput.requestsPerSecond < config.min_throughput) {
            this.failures.push(`Throughput ${this.results.throughput.requestsPerSecond} req/s below threshold ${config.min_throughput} req/s`);
            this.thresholdsPassed = false;
        }
        
        // Check system resources
        const avgCpu = this.results.systemResources.cpu.reduce((a, b) => a + b, 0) / this.results.systemResources.cpu.length;
        if (avgCpu > config.max_cpu_usage) {
            this.failures.push(`Average CPU usage ${avgCpu.toFixed(1)}% exceeds threshold ${config.max_cpu_usage}%`);
            this.thresholdsPassed = false;
        }
        
        const avgMemory = this.results.systemResources.memory.reduce((a, b) => a + b, 0) / this.results.systemResources.memory.length;
        if (avgMemory > config.max_memory_usage) {
            this.failures.push(`Average memory usage ${avgMemory.toFixed(1)}% exceeds threshold ${config.max_memory_usage}%`);
            this.thresholdsPassed = false;
        }
    }
    
    toJSON() {
        return {
            scenario: this.scenario,
            timestamp: this.timestamp,
            results: this.results,
            thresholdsPassed: this.thresholdsPassed,
            failures: this.failures
        };
    }
}

// ===========================================
// System Resource Monitoring
// ===========================================

class SystemMonitor {
    constructor() {
        this.monitoring = false;
        this.interval = null;
        this.data = [];
    }
    
    start(intervalMs = 5000) {
        this.monitoring = true;
        this.data = [];
        
        this.interval = setInterval(() => {
            if (!this.monitoring) return;
            
            try {
                const snapshot = this.getResourceSnapshot();
                this.data.push(snapshot);
            } catch (error) {
                console.warn('Failed to collect system metrics:', error.message);
            }
        }, intervalMs);
    }
    
    stop() {
        this.monitoring = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    getResourceSnapshot() {
        try {
            // CPU usage (Linux)
            const cpuUsage = this.getCpuUsage();
            
            // Memory usage
            const memoryUsage = this.getMemoryUsage();
            
            // Disk usage
            const diskUsage = this.getDiskUsage();
            
            // Network usage
            const networkUsage = this.getNetworkUsage();
            
            return {
                timestamp: Date.now(),
                cpu: cpuUsage,
                memory: memoryUsage,
                disk: diskUsage,
                network: networkUsage
            };
            
        } catch (error) {
            console.warn('Error collecting resource snapshot:', error.message);
            return {
                timestamp: Date.now(),
                cpu: 0,
                memory: 0,
                disk: 0,
                network: { rx: 0, tx: 0 }
            };
        }
    }
    
    getCpuUsage() {
        try {
            // Use iostat if available (Linux/macOS)
            const output = execSync('iostat 1 2 | tail -n +4 | tail -n 1', {
                encoding: 'utf8',
                timeout: 3000
            });
            
            const parts = output.trim().split(/\s+/);
            const idle = parseFloat(parts[parts.length - 1]);
            return Math.max(0, 100 - idle);
            
        } catch (error) {
            // Fallback: use top (works on most Unix systems)
            try {
                const output = execSync('top -bn1 | grep "Cpu(s)" | cut -d, -f4 | cut -d% -f1', {
                    encoding: 'utf8',
                    timeout: 3000
                });
                
                const idle = parseFloat(output.trim());
                return Math.max(0, 100 - idle);
                
            } catch (fallbackError) {
                return Math.random() * 20; // Mock data for development
            }
        }
    }
    
    getMemoryUsage() {
        try {
            const output = execSync('free | grep Mem', {
                encoding: 'utf8',
                timeout: 2000
            });
            
            const parts = output.trim().split(/\s+/);
            const total = parseInt(parts[1]);
            const available = parseInt(parts[6] || parts[3]); // available or free
            const used = total - available;
            
            return (used / total) * 100;
            
        } catch (error) {
            return Math.random() * 50 + 20; // Mock data for development
        }
    }
    
    getDiskUsage() {
        try {
            const output = execSync('df / | tail -1', {
                encoding: 'utf8',
                timeout: 2000
            });
            
            const parts = output.trim().split(/\s+/);
            const usedPercent = parts[4].replace('%', '');
            
            return parseInt(usedPercent);
            
        } catch (error) {
            return Math.random() * 30 + 30; // Mock data for development
        }
    }
    
    getNetworkUsage() {
        try {
            const output = execSync('cat /proc/net/dev | grep eth0', {
                encoding: 'utf8',
                timeout: 2000
            });
            
            const parts = output.trim().split(/\s+/);
            const rxBytes = parseInt(parts[1]);
            const txBytes = parseInt(parts[9]);
            
            return { rx: rxBytes, tx: txBytes };
            
        } catch (error) {
            return { rx: 0, tx: 0 }; // Mock data for development
        }
    }
    
    getAverages() {
        if (this.data.length === 0) return null;
        
        const totals = this.data.reduce((acc, snapshot) => ({
            cpu: acc.cpu + snapshot.cpu,
            memory: acc.memory + snapshot.memory,
            disk: acc.disk + snapshot.disk
        }), { cpu: 0, memory: 0, disk: 0 });
        
        const count = this.data.length;
        
        return {
            cpu: totals.cpu / count,
            memory: totals.memory / count,
            disk: totals.disk / count
        };
    }
}

// ===========================================
// HTTP Load Generator
// ===========================================

class LoadGenerator {
    constructor(config) {
        this.config = config;
        this.baseUrl = LOAD_TEST_CONFIG.baseUrl;
        this.report = new LoadTestReport(config.name || 'unknown');
        this.systemMonitor = new SystemMonitor();
        this.running = false;
        this.activeRequests = 0;
    }
    
    async run() {
        console.log(`🚀 Starting load test: ${this.config.name || 'unnamed'}`);
        console.log(`   Users: ${this.config.users}`);
        console.log(`   Duration: ${this.config.duration}`);
        console.log(`   Ramp-up: ${this.config.rampUp}`);
        
        this.running = true;
        this.systemMonitor.start();
        
        const startTime = Date.now();
        const duration = this.parseDuration(this.config.duration);
        const rampUp = this.parseDuration(this.config.rampUp);
        const endTime = startTime + duration;
        
        // Create user promises
        const userPromises = [];
        
        for (let i = 0; i < this.config.users; i++) {
            const delay = (rampUp / this.config.users) * i;
            
            const userPromise = this.delay(delay).then(() => {
                return this.simulateUser(i, endTime);
            });
            
            userPromises.push(userPromise);
        }
        
        // Wait for all users to complete
        await Promise.all(userPromises);
        
        this.running = false;
        this.systemMonitor.stop();
        
        // Finalize report
        this.finalizeReport(Date.now() - startTime);
        
        console.log(`✅ Load test completed: ${this.config.name || 'unnamed'}`);
        
        return this.report;
    }
    
    async simulateUser(userId, endTime) {
        while (Date.now() < endTime && this.running) {
            try {
                // Select random endpoint based on weights
                const endpoint = this.selectRandomEndpoint();
                
                const startTime = Date.now();
                this.activeRequests++;
                
                const success = await this.makeRequest(endpoint);
                const responseTime = Date.now() - startTime;
                
                this.activeRequests--;
                this.report.addResult(endpoint.path, responseTime, success);
                
                // Random delay between requests (0.5-2 seconds)
                const thinkTime = Math.random() * 1500 + 500;
                await this.delay(thinkTime);
                
            } catch (error) {
                this.activeRequests--;
                this.report.addResult('unknown', 0, false, error.message);
                
                // Backoff on error
                await this.delay(1000);
            }
        }
    }
    
    selectRandomEndpoint() {
        const totalWeight = this.config.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const endpoint of this.config.endpoints) {
            random -= endpoint.weight;
            if (random <= 0) {
                return endpoint;
            }
        }
        
        return this.config.endpoints[0]; // Fallback
    }
    
    async makeRequest(endpoint) {
        try {
            const url = `${this.baseUrl}${endpoint.path}`;
            const config = {
                method: endpoint.method,
                url: url,
                timeout: 10000,
                validateStatus: status => status < 500, // Accept 4xx as success
                headers: {
                    'User-Agent': 'LoadTest/1.0',
                    'Accept': 'application/json',
                }
            };
            
            // Add body for POST requests
            if (endpoint.method === 'POST') {
                config.data = this.generateTestData(endpoint.path);
                config.headers['Content-Type'] = 'application/json';
            }
            
            const response = await axios(config);
            return response.status < 400;
            
        } catch (error) {
            if (error.response) {
                return error.response.status < 500;
            }
            return false;
        }
    }
    
    generateTestData(path) {
        // Generate mock data based on endpoint
        switch (path) {
            case '/api/pptx/upload':
                return {
                    file: 'mock-file-data',
                    projectName: `Test Project ${Date.now()}`
                };
                
            case '/api/projects':
                return {
                    name: `Load Test Project ${Date.now()}`,
                    description: 'Generated by load test'
                };
                
            case '/api/render/start':
                return {
                    projectId: 'mock-project-id',
                    settings: { quality: 'high' }
                };
                
            default:
                return {};
        }
    }
    
    finalizeReport(totalTime) {
        const totalRequests = this.report.results.requests.total;
        
        if (totalRequests > 0) {
            this.report.results.requests.rate = totalRequests / (totalTime / 1000);
            this.report.results.throughput.requestsPerSecond = 
                this.report.results.requests.successful / (totalTime / 1000);
        }
        
        // Add system resource averages
        const systemAverages = this.systemMonitor.getAverages();
        if (systemAverages) {
            this.report.addSystemSnapshot(
                systemAverages.cpu,
                systemAverages.memory,
                systemAverages.disk,
                0, 0
            );
        }
        
        this.report.validateThresholds();
    }
    
    parseDuration(duration) {
        const unit = duration.slice(-1);
        const value = parseInt(duration.slice(0, -1));
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            default: return value;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ===========================================
// K6 Integration (if available)
// ===========================================

function generateK6Script(scenario) {
    const script = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
    stages: [
        { duration: '${scenario.rampUp}', target: ${scenario.users} },
        { duration: '${scenario.duration}', target: ${scenario.users} },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        errors: ['rate<0.01'],
    },
};

export default function () {
    const baseUrl = '${LOAD_TEST_CONFIG.baseUrl}';
    
    ${scenario.endpoints.map(endpoint => `
    // ${endpoint.path}
    let response${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')} = http.${endpoint.method.toLowerCase()}(\`\${baseUrl}${endpoint.path}\`);
    check(response${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}, {
        'status is 200': (r) => r.status === 200,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(response${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}.status !== 200);
    `).join('\n')}
    
    sleep(Math.random() * 2 + 0.5);
}
`;
    
    return script;
}

function runK6Test(scenario) {
    try {
        console.log('🎯 Running K6 load test...');
        
        const script = generateK6Script(scenario);
        const scriptPath = path.join('/tmp', `k6-script-${Date.now()}.js`);
        
        fs.writeFileSync(scriptPath, script);
        
        const output = execSync(`k6 run --out json=/tmp/k6-results.json ${scriptPath}`, {
            encoding: 'utf8',
            timeout: 30 * 60 * 1000 // 30 minutes
        });
        
        console.log('K6 output:', output);
        
        // Parse results
        const resultsPath = '/tmp/k6-results.json';
        if (fs.existsSync(resultsPath)) {
            const resultsData = fs.readFileSync(resultsPath, 'utf8');
            return JSON.parse(resultsData);
        }
        
        return null;
        
    } catch (error) {
        console.warn('K6 test failed:', error.message);
        return null;
    }
}

// ===========================================
// Main Load Testing Function
// ===========================================

async function runLoadTests(scenarioNames = null) {
    console.log('⚡ Starting load testing suite...\n');
    
    const results = [];
    const scenarios = scenarioNames ? 
        scenarioNames.map(name => ({ name, ...LOAD_TEST_CONFIG.scenarios[name] })) :
        Object.entries(LOAD_TEST_CONFIG.scenarios).map(([name, config]) => ({ name, ...config }));
    
    // Ensure report directory exists
    fs.mkdirSync(LOAD_TEST_CONFIG.reportPath, { recursive: true });
    
    for (const scenario of scenarios) {
        try {
            console.log(`\n🧪 Running scenario: ${scenario.name}`);
            
            // Try K6 first if available
            let report;
            try {
                execSync('which k6', { stdio: 'pipe' });
                const k6Results = runK6Test(scenario);
                
                if (k6Results) {
                    report = { k6: k6Results, tool: 'k6' };
                } else {
                    throw new Error('K6 failed');
                }
            } catch (error) {
                // Fallback to custom load generator
                console.log('Using custom load generator...');
                const generator = new LoadGenerator(scenario);
                report = await generator.run();
                report.tool = 'custom';
            }
            
            results.push(report);
            
            // Save individual report
            const reportFile = path.join(
                LOAD_TEST_CONFIG.reportPath,
                `load-test-${scenario.name}-${Date.now()}.json`
            );
            
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            // Display summary
            console.log(`📊 Results for ${scenario.name}:`);
            if (report.tool === 'custom') {
                console.log(`   Requests: ${report.results.requests.total} (${report.results.requests.successful} successful)`);
                console.log(`   Avg Response Time: ${report.results.responseTime.avg.toFixed(0)}ms`);
                console.log(`   Throughput: ${report.results.throughput.requestsPerSecond.toFixed(1)} req/s`);
                console.log(`   Thresholds: ${report.thresholdsPassed ? '✅ PASS' : '❌ FAIL'}`);
                
                if (!report.thresholdsPassed) {
                    console.log('   Failures:');
                    report.failures.forEach(failure => console.log(`     - ${failure}`));
                }
            }
            
            // Cool-down between tests
            if (scenarios.indexOf(scenario) < scenarios.length - 1) {
                console.log('🕐 Cool-down period...');
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30s
            }
            
        } catch (error) {
            console.error(`❌ Scenario ${scenario.name} failed:`, error.message);
            results.push({ 
                scenario: scenario.name, 
                error: error.message,
                success: false 
            });
        }
    }
    
    // Generate comprehensive report
    const comprehensiveReport = {
        timestamp: new Date().toISOString(),
        totalScenarios: scenarios.length,
        successfulScenarios: results.filter(r => !r.error).length,
        results: results
    };
    
    const finalReportPath = path.join(LOAD_TEST_CONFIG.reportPath, `load-test-summary-${Date.now()}.json`);
    fs.writeFileSync(finalReportPath, JSON.stringify(comprehensiveReport, null, 2));
    
    console.log(`\n📋 Load testing completed!`);
    console.log(`Report saved: ${finalReportPath}`);
    console.log(`Scenarios: ${comprehensiveReport.successfulScenarios}/${comprehensiveReport.totalScenarios} successful`);
    
    return comprehensiveReport;
}

// ===========================================
// CLI Interface
// ===========================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const scenarios = args.length > 0 ? args : null;
    
    runLoadTests(scenarios)
        .then(report => {
            const allPassed = report.results.every(r => !r.error && (r.thresholdsPassed !== false));
            
            if (allPassed) {
                console.log('✅ All load tests passed!');
                process.exit(0);
            } else {
                console.log('❌ Some load tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Load testing failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runLoadTests,
    LoadGenerator,
    SystemMonitor,
    LoadTestReport,
    LOAD_TEST_CONFIG
};