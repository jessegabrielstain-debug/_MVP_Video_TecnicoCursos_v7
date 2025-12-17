#!/usr/bin/env node

/**
 * 📊 Advanced Monitoring & Metrics System
 * MVP Vídeos TécnicoCursos v7
 * 
 * Sistema avançado de monitoramento para ambiente de produção
 * Coleta métricas de performance, saúde e uso de recursos
 */

const express = require('express');
const client = require('prom-client');
const Redis = require('ioredis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ===========================================
// Prometheus Metrics Setup
// ===========================================

// Clear default metrics
client.register.clear();

// Application metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
});

// Video rendering metrics
const renderJobsTotal = new client.Counter({
    name: 'render_jobs_total',
    help: 'Total number of render jobs',
    labelNames: ['status']
});

const renderJobDuration = new client.Histogram({
    name: 'render_job_duration_seconds',
    help: 'Duration of render jobs in seconds',
    labelNames: ['status'],
    buckets: [10, 30, 60, 120, 300, 600, 1200, 1800]
});

const queueSize = new client.Gauge({
    name: 'render_queue_size',
    help: 'Number of jobs in render queue'
});

// Database metrics
const dbConnections = new client.Gauge({
    name: 'database_connections',
    help: 'Number of active database connections'
});

const dbQueryDuration = new client.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Redis metrics
const redisConnections = new client.Gauge({
    name: 'redis_connections',
    help: 'Number of Redis connections'
});

const redisMemoryUsage = new client.Gauge({
    name: 'redis_memory_usage_bytes',
    help: 'Redis memory usage in bytes'
});

// System metrics
const systemMemoryUsage = new client.Gauge({
    name: 'system_memory_usage_bytes',
    help: 'System memory usage in bytes',
    labelNames: ['type']
});

const systemCpuUsage = new client.Gauge({
    name: 'system_cpu_usage_percent',
    help: 'System CPU usage percentage'
});

const diskUsage = new client.Gauge({
    name: 'disk_usage_bytes',
    help: 'Disk usage in bytes',
    labelNames: ['mount_point', 'type']
});

const processUptime = new client.Gauge({
    name: 'process_uptime_seconds',
    help: 'Process uptime in seconds'
});

// Register all metrics
client.register.registerMetric(httpRequestDuration);
client.register.registerMetric(httpRequestsTotal);
client.register.registerMetric(activeConnections);
client.register.registerMetric(renderJobsTotal);
client.register.registerMetric(renderJobDuration);
client.register.registerMetric(queueSize);
client.register.registerMetric(dbConnections);
client.register.registerMetric(dbQueryDuration);
client.register.registerMetric(redisConnections);
client.register.registerMetric(redisMemoryUsage);
client.register.registerMetric(systemMemoryUsage);
client.register.registerMetric(systemCpuUsage);
client.register.registerMetric(diskUsage);
client.register.registerMetric(processUptime);

// ===========================================
// Configuration
// ===========================================

const config = {
    port: process.env.METRICS_PORT || 9090,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    updateInterval: parseInt(process.env.METRICS_UPDATE_INTERVAL) || 30000, // 30 seconds
    enableDetailed: process.env.ENABLE_ANALYTICS_DETAILED === 'true',
    retentionDays: parseInt(process.env.METRICS_RETENTION_DAYS) || 7
};

// ===========================================
// Redis Connection
// ===========================================

let redis;
try {
    redis = new Redis(config.redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3
    });
    
    redis.on('error', (err) => {
        console.error('Redis connection error:', err);
    });
} catch (error) {
    console.warn('Redis not available, some metrics will be unavailable');
}

// ===========================================
// Metrics Collection Functions
// ===========================================

async function collectSystemMetrics() {
    try {
        // Memory usage
        const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
        const memTotal = parseInt(memInfo.match(/MemTotal:\s+(\d+)/)?.[1] || 0) * 1024;
        const memFree = parseInt(memInfo.match(/MemFree:\s+(\d+)/)?.[1] || 0) * 1024;
        const memAvailable = parseInt(memInfo.match(/MemAvailable:\s+(\d+)/)?.[1] || 0) * 1024;
        const memUsed = memTotal - memAvailable;
        
        systemMemoryUsage.set({ type: 'total' }, memTotal);
        systemMemoryUsage.set({ type: 'used' }, memUsed);
        systemMemoryUsage.set({ type: 'free' }, memFree);
        systemMemoryUsage.set({ type: 'available' }, memAvailable);
        
        // CPU usage
        const loadAvg = os.loadavg();
        systemCpuUsage.set(loadAvg[0] * 100); // 1-minute load average as percentage
        
        // Disk usage
        try {
            const diskUsageOutput = execSync('df -B1 /', { encoding: 'utf8' });
            const diskLine = diskUsageOutput.split('\n')[1];
            const diskParts = diskLine.split(/\s+/);
            const diskTotal = parseInt(diskParts[1]);
            const diskUsed = parseInt(diskParts[2]);
            const diskFree = parseInt(diskParts[3]);
            
            diskUsage.set({ mount_point: '/', type: 'total' }, diskTotal);
            diskUsage.set({ mount_point: '/', type: 'used' }, diskUsed);
            diskUsage.set({ mount_point: '/', type: 'free' }, diskFree);
        } catch (error) {
            console.warn('Could not collect disk metrics:', error.message);
        }
        
        // Process uptime
        processUptime.set(process.uptime());
        
    } catch (error) {
        console.error('Error collecting system metrics:', error);
    }
}

async function collectRedisMetrics() {
    if (!redis) return;
    
    try {
        const info = await redis.info();
        
        // Parse Redis info
        const connectedClients = parseInt(info.match(/connected_clients:(\d+)/)?.[1] || 0);
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || 0);
        
        redisConnections.set(connectedClients);
        redisMemoryUsage.set(usedMemory);
        
        // Queue size (video render queue)
        try {
            const queueLength = await redis.llen('bull:video-render-queue:waiting');
            queueSize.set(queueLength || 0);
        } catch (error) {
            console.warn('Could not get queue size:', error.message);
        }
        
    } catch (error) {
        console.error('Error collecting Redis metrics:', error);
    }
}

async function collectApplicationMetrics() {
    try {
        // This would typically fetch from your application's metrics endpoint
        const appHealthUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // For now, we'll update connection count based on system info
        try {
            const netstat = execSync('ss -t state established | wc -l', { encoding: 'utf8' });
            const connections = parseInt(netstat.trim()) - 1; // Subtract header line
            activeConnections.set(Math.max(0, connections));
        } catch (error) {
            // Fallback to a basic metric
            activeConnections.set(0);
        }
        
    } catch (error) {
        console.error('Error collecting application metrics:', error);
    }
}

// ===========================================
// Historical Data Storage
// ===========================================

async function storeHistoricalMetrics() {
    if (!redis || !config.enableDetailed) return;
    
    try {
        const timestamp = Date.now();
        const metrics = {
            timestamp,
            system: {
                memory: {
                    total: await systemMemoryUsage.get().then(m => m.find(metric => metric.labels.type === 'total')?.value || 0),
                    used: await systemMemoryUsage.get().then(m => m.find(metric => metric.labels.type === 'used')?.value || 0)
                },
                cpu: await systemCpuUsage.get(),
                disk: {
                    used: await diskUsage.get().then(m => m.find(metric => metric.labels.mount_point === '/' && metric.labels.type === 'used')?.value || 0)
                }
            },
            application: {
                connections: await activeConnections.get(),
                uptime: await processUptime.get()
            },
            redis: {
                connections: await redisConnections.get(),
                memory: await redisMemoryUsage.get(),
                queueSize: await queueSize.get()
            }
        };
        
        // Store in Redis with TTL
        const key = `metrics:historical:${timestamp}`;
        await redis.setex(key, config.retentionDays * 24 * 60 * 60, JSON.stringify(metrics));
        
        // Keep only recent entries in a sorted set for easy querying
        await redis.zadd('metrics:timestamps', timestamp, timestamp);
        
        // Remove old entries
        const cutoff = timestamp - (config.retentionDays * 24 * 60 * 60 * 1000);
        await redis.zremrangebyscore('metrics:timestamps', '-inf', cutoff);
        
    } catch (error) {
        console.error('Error storing historical metrics:', error);
    }
}

// ===========================================
// Express Server Setup
// ===========================================

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'metrics-server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
});

// Historical metrics API
app.get('/api/metrics/historical', async (req, res) => {
    if (!redis || !config.enableDetailed) {
        return res.status(501).json({ error: 'Historical metrics not enabled' });
    }
    
    try {
        const { start, end, limit = 100 } = req.query;
        
        const startTime = start ? parseInt(start) : Date.now() - (24 * 60 * 60 * 1000); // Last 24h
        const endTime = end ? parseInt(end) : Date.now();
        
        const timestamps = await redis.zrangebyscore(
            'metrics:timestamps', 
            startTime, 
            endTime, 
            'LIMIT', 0, limit
        );
        
        const metrics = [];
        for (const timestamp of timestamps) {
            const data = await redis.get(`metrics:historical:${timestamp}`);
            if (data) {
                metrics.push(JSON.parse(data));
            }
        }
        
        res.json({
            start: startTime,
            end: endTime,
            count: metrics.length,
            metrics
        });
        
    } catch (error) {
        console.error('Error fetching historical metrics:', error);
        res.status(500).json({ error: 'Failed to fetch historical metrics' });
    }
});

// Current metrics summary
app.get('/api/metrics/summary', async (req, res) => {
    try {
        const summary = {
            timestamp: new Date().toISOString(),
            system: {
                memory: {
                    usage_percent: 0,
                    total_bytes: 0,
                    used_bytes: 0
                },
                cpu: {
                    usage_percent: await systemCpuUsage.get() || 0
                },
                disk: {
                    usage_percent: 0,
                    total_bytes: 0,
                    used_bytes: 0
                },
                uptime_seconds: await processUptime.get() || 0
            },
            application: {
                active_connections: await activeConnections.get() || 0,
                total_requests: 0, // Would be populated from counter
                avg_response_time: 0 // Would be calculated from histogram
            },
            render: {
                queue_size: await queueSize.get() || 0,
                jobs_completed: 0, // Would be populated from counter
                avg_render_time: 0 // Would be calculated from histogram
            },
            redis: {
                connections: await redisConnections.get() || 0,
                memory_bytes: await redisMemoryUsage.get() || 0
            }
        };
        
        res.json(summary);
        
    } catch (error) {
        console.error('Error generating metrics summary:', error);
        res.status(500).json({ error: 'Failed to generate metrics summary' });
    }
});

// ===========================================
// Periodic Metrics Collection
// ===========================================

function startMetricsCollection() {
    console.log(`📊 Starting metrics collection with ${config.updateInterval}ms interval`);
    
    // Initial collection
    collectSystemMetrics();
    collectRedisMetrics();
    collectApplicationMetrics();
    
    // Periodic collection
    setInterval(async () => {
        await Promise.allSettled([
            collectSystemMetrics(),
            collectRedisMetrics(),
            collectApplicationMetrics()
        ]);
    }, config.updateInterval);
    
    // Historical data storage (less frequent)
    if (config.enableDetailed) {
        setInterval(storeHistoricalMetrics, config.updateInterval * 2);
    }
}

// ===========================================
// Graceful Shutdown
// ===========================================

process.on('SIGTERM', async () => {
    console.log('📊 Metrics server shutting down...');
    
    if (redis) {
        redis.disconnect();
    }
    
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📊 Metrics server shutting down...');
    
    if (redis) {
        redis.disconnect();
    }
    
    process.exit(0);
});

// ===========================================
// Server Start
// ===========================================

function start() {
    const server = app.listen(config.port, () => {
        console.log(`📊 Metrics server running on port ${config.port}`);
        console.log(`📊 Metrics endpoint: http://localhost:${config.port}/metrics`);
        console.log(`📊 Health check: http://localhost:${config.port}/health`);
        console.log(`📊 Detailed metrics: ${config.enableDetailed ? 'enabled' : 'disabled'}`);
    });
    
    startMetricsCollection();
    
    return server;
}

// Export for testing
module.exports = {
    app,
    start,
    collectSystemMetrics,
    collectRedisMetrics,
    collectApplicationMetrics
};

// Start server if this file is run directly
if (require.main === module) {
    start();
}