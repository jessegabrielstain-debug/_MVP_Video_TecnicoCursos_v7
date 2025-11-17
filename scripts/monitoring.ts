#!/usr/bin/env node

/**
 * Production Monitoring Script
 * Comprehensive monitoring for all system components
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

interface MonitoringResult {
  component: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  message: string;
  timestamp: string;
  details?: any;
}

// Load environment variables
require('dotenv').config();

async function checkDatabaseHealth(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test connection with a simple query
    const start = Date.now();
    const { error } = await supabase.from('users').select('id').limit(1);
    const responseTime = Date.now() - start;
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Check for basic metrics
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: jobCount } = await supabase.from('render_jobs').select('*', { count: 'exact', head: true });
    
    return {
      component: 'Database',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      message: `Connection OK (${responseTime}ms)`,
      timestamp,
      details: {
        responseTime,
        userCount: userCount || 0,
        jobCount: jobCount || 0
      }
    };
  } catch (error) {
    return {
      component: 'Database',
      status: 'critical',
      message: `Connection failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function checkStorageHealth(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if we can list buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      throw new Error(bucketError.message);
    }
    
    // Check if expected buckets exist
    const expectedBuckets = ['avatars', 'videos', 'thumbnails', 'assets'];
    const foundBuckets = buckets.map(b => b.name);
    const missingBuckets = expectedBuckets.filter(b => !foundBuckets.includes(b));
    
    if (missingBuckets.length > 0) {
      return {
        component: 'Storage',
        status: 'degraded',
        message: `Missing buckets: ${missingBuckets.join(', ')}`,
        timestamp,
        details: {
          foundBuckets,
          missingBuckets
        }
      };
    }
    
    return {
      component: 'Storage',
      status: 'healthy',
      message: `All ${buckets.length} buckets accessible`,
      timestamp,
      details: {
        buckets: foundBuckets
      }
    };
  } catch (error) {
    return {
      component: 'Storage',
      status: 'critical',
      message: `Storage check failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function checkQueueHealth(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // This would connect to Redis/BullMQ in a real implementation
    // For now, simulate checking the queue system
    
    // Since we can't directly access BullMQ here, we'll check if configuration is valid
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl || redisUrl.includes('your_')) {
      return {
        component: 'Queue System',
        status: 'critical',
        message: 'Redis configuration invalid',
        timestamp
      };
    }
    
    // In a real implementation, this would check actual queue metrics
    return {
      component: 'Queue System',
      status: 'healthy',
      message: 'Configuration valid',
      timestamp,
      details: {
        redisUrl: redisUrl.replace(/\/\/.*@/, '//***@') // Mask credentials
      }
    };
  } catch (error) {
    return {
      component: 'Queue System',
      status: 'critical',
      message: `Queue check failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function checkTTSHealth(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Check if TTS services are configured
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    const services = [];
    
    if (azureKey && !azureKey.includes('your_')) {
      services.push('Azure Speech');
    }
    
    if (elevenLabsKey && !elevenLabsKey.includes('your_') && elevenLabsKey.startsWith('sk_')) {
      services.push('ElevenLabs');
    }
    
    if (services.length === 0) {
      return {
        component: 'TTS Services',
        status: 'critical',
        message: 'No TTS services configured',
        timestamp
      };
    }
    
    return {
      component: 'TTS Services',
      status: 'healthy',
      message: `Configured: ${services.join(', ')}`,
      timestamp,
      details: {
        services: services.length
      }
    };
  } catch (error) {
    return {
      component: 'TTS Services',
      status: 'critical',
      message: `TTS check failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function checkApplicationHealth(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Check if the application is running
    // In a real implementation, this would make a request to the health endpoint
    const buildDir = path.join(process.cwd(), 'estudio_ia_videos', 'app', '.next');
    const hasBuild = fs.existsSync(buildDir);
    
    if (!hasBuild) {
      return {
        component: 'Application',
        status: 'critical',
        message: 'Application not built',
        timestamp
      };
    }
    
    // Check for important directories
    const requiredDirs = [
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'api'),
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'components'),
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'lib')
    ];
    
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
    
    if (missingDirs.length > 0) {
      return {
        component: 'Application',
        status: 'degraded',
        message: 'Some required directories missing',
        timestamp,
        details: {
          missing: missingDirs.map(d => path.basename(d))
        }
      };
    }
    
    // Check for important files
    const requiredFiles = [
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'package.json'),
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'next.config.js'),
      path.join(process.cwd(), 'estudio_ia_videos', 'app', 'lib', 'analytics', 'render-core.ts')
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      return {
        component: 'Application',
        status: 'degraded',
        message: 'Some required files missing',
        timestamp,
        details: {
          missing: missingFiles.map(f => path.basename(f))
        }
      };
    }
    
    return {
      component: 'Application',
      status: 'healthy',
      message: 'Application structure intact',
      timestamp,
      details: {
        buildExists: hasBuild
      }
    };
  } catch (error) {
    return {
      component: 'Application',
      status: 'critical',
      message: `Application check failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function checkPerformanceMetrics(): Promise<MonitoringResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Get basic system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage ? process.cpuUsage() : undefined;
    
    // In a real implementation, we'd also collect from external services
    return {
      component: 'Performance',
      status: 'healthy',
      message: 'Performance metrics collected',
      timestamp,
      details: {
        uptime: Math.round(uptime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        ...(cpuUsage && {
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        })
      }
    };
  } catch (error) {
    return {
      component: 'Performance',
      status: 'degraded',
      message: `Performance check failed: ${(error as Error).message}`,
      timestamp
    };
  }
}

async function runFullMonitoring(): Promise<MonitoringResult[]> {
  console.log('🏥 Running production monitoring checks...\n');
  
  const checks = [
    checkDatabaseHealth(),
    checkStorageHealth(),
    checkQueueHealth(),
    checkTTSHealth(),
    checkApplicationHealth(),
    checkPerformanceMetrics()
  ];
  
  const results = await Promise.all(checks);
  
  // Print results
  results.forEach(result => {
    const statusIcon = 
      result.status === 'healthy' ? '✅' : 
      result.status === 'degraded' ? '⚠️' : 
      result.status === 'critical' ? '❌' : '❓';
    
    console.log(`${statusIcon} ${result.component}: ${result.status.toUpperCase()}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Time: ${result.timestamp}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
    console.log('');
  });
  
  // Summary
  const healthy = results.filter(r => r.status === 'healthy').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const critical = results.filter(r => r.status === 'critical').length;
  
  console.log(`📊 Monitoring Summary:`);
  console.log(`   Healthy: ${healthy}`);
  console.log(`   Degraded: ${degraded}`);
  console.log(`   Critical: ${critical}`);
  console.log('');
  
  if (critical > 0) {
    console.log('❌ CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED');
    process.exit(1);
  } else if (degraded > 0) {
    console.log('⚠️  Degraded performance - review recommendations');
    process.exit(0);
  } else {
    console.log('✅ All systems healthy');
    process.exit(0);
  }
  
  return results;
}

// Function to generate monitoring dashboard data
function generateDashboardData(results: MonitoringResult[]): string {
  const now = new Date();
  const data = {
    timestamp: now.toISOString(),
    summary: {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      critical: results.filter(r => r.status === 'critical').length
    },
    components: results.reduce((acc, curr) => {
      acc[curr.component] = {
        status: curr.status,
        message: curr.message,
        lastCheck: curr.timestamp
      };
      return acc;
    }, {} as Record<string, any>)
  };
  
  return JSON.stringify(data, null, 2);
}

// Run monitoring
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--dashboard') || args.includes('-d')) {
    // Generate dashboard data only
    checkDatabaseHealth()
      .then(db => 
        Promise.all([
          Promise.resolve(db), // reuse the first result
          checkStorageHealth(),
          checkQueueHealth(),
          checkTTSHealth(),
          checkApplicationHealth(),
          checkPerformanceMetrics()
        ])
      )
      .then(results => {
        const dashboardData = generateDashboardData(results);
        const dashboardPath = path.join(process.cwd(), 'monitoring-dashboard.json');
        fs.writeFileSync(dashboardPath, dashboardData);
        console.log(`📊 Dashboard data generated: ${dashboardPath}`);
        console.log(dashboardData);
      })
      .catch(error => {
        console.error('Monitoring failed:', error);
        process.exit(1);
      });
  } else {
    runFullMonitoring().catch(error => {
      console.error('Monitoring failed:', error);
      process.exit(1);
    });
  }
}

export { runFullMonitoring, MonitoringResult, generateDashboardData };