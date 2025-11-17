#!/usr/bin/env node

/**
 * Worker Health Check Script
 * Monitors render worker status and health
 */

import { Worker, Queue, QueueScheduler, QueueEvents } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Load environment variables
require('dotenv').config();

interface WorkerHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  details: {
    activeJobs: number;
    waitingJobs: number;
    failedJobs: number;
    completedJobs: number;
    uptime: string;
    lastActivity: string;
    redisConnected: boolean;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  timestamp: string;
}

async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
    
    await redis.ping();
    await redis.quit();
    return true;
  } catch (error) {
    return false;
  }
}

async function checkRenderQueueHealth(): Promise<WorkerHealth> {
  const timestamp = new Date().toISOString();
  
  // Check Redis connection first
  const redisConnected = await checkRedisHealth();
  
  if (!redisConnected) {
    return {
      serviceName: 'render-queue',
      status: 'unhealthy',
      details: {
        activeJobs: 0,
        waitingJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
        uptime: 'unknown',
        lastActivity: 'unknown',
        redisConnected: false
      },
      timestamp
    };
  }
  
  // Connect to BullMQ queue
  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
  };
  
  try {
    const queue = new Queue('render-queue', { connection });
    const queueEvents = new QueueEvents('render-queue', { connection });
    
    // Get queue metrics
    const activeCount = await queue.getActiveCount();
    const waitingCount = await queue.getWaitingCount();
    const failedCount = await queue.getFailedCount();
    const completedCount = await queue.getCompletedCount();
    
    // Get recent job activity
    const recentCompleted = await queue.getJobs(['completed'], 0, 10, true);
    const lastActivity = recentCompleted.length > 0 
      ? recentCompleted[0].finishedOn?.toString() || 'unknown' 
      : 'no recent activity';
    
    // Determine status based on metrics
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';
    
    if (failedCount > 10) {
      status = 'unhealthy';
    } else if (failedCount > 5 || activeCount > 20) {
      status = 'degraded';
    } else if (waitingCount > 50) {
      status = 'degraded'; // High queue backlog
    }
    
    // Close connections
    await queue.close();
    await queueEvents.close();
    
    return {
      serviceName: 'render-queue',
      status,
      details: {
        activeJobs: activeCount,
        waitingJobs: waitingCount,
        failedJobs: failedCount,
        completedJobs: completedCount,
        uptime: 'N/A', // Would need to track worker start time
        lastActivity,
        redisConnected: true
      },
      timestamp
    };
  } catch (error) {
    return {
      serviceName: 'render-queue',
      status: 'unhealthy',
      details: {
        activeJobs: 0,
        waitingJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
        uptime: 'unknown',
        lastActivity: 'unknown',
        redisConnected: redisConnected
      },
      timestamp
    };
  }
}

async function checkDatabaseHealth(): Promise<WorkerHealth> {
  const timestamp = new Date().toISOString();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test basic connection
    const { data, error } = await supabase
      .from('render_jobs') // Check render jobs table specifically
      .select('status, created_at')
      .limit(1)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Check for potential issues
    const recentJobs = await supabase
      .from('render_jobs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .in('status', ['processing', 'failed']);
      
    const activeJobs = recentJobs.data?.filter(job => job.status === 'processing').length || 0;
    const failedJobs = recentJobs.data?.filter(job => job.status === 'failed').length || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' = 'healthy';
    if (failedJobs > 10) {
      status = 'unhealthy';
    } else if (failedJobs > 5 || activeJobs > 15) {
      status = 'degraded';
    }
    
    return {
      serviceName: 'database',
      status,
      details: {
        activeJobs,
        waitingJobs: 0, // N/A for database
        failedJobs,
        completedJobs: recentJobs.data?.length || 0,
        uptime: 'N/A', // Database uptime is tracked separately
        lastActivity: recentJobs.data?.[0]?.created_at || 'unknown',
        redisConnected: true // Not applicable for database
      },
      timestamp
    };
  } catch (error) {
    return {
      serviceName: 'database',
      status: 'unhealthy',
      details: {
        activeJobs: 0,
        waitingJobs: 0,
        failedJobs: 0,
        completedJobs: 0,
        uptime: 'unknown',
        lastActivity: 'unknown',
        redisConnected: true
      },
      timestamp
    };
  }
}

async function runWorkerHealthChecks(): Promise<WorkerHealth[]> {
  console.log('🏥 Running worker health checks...\n');
  
  const checks = [
    checkRenderQueueHealth(),
    checkDatabaseHealth()
  ];
  
  const results = await Promise.all(checks);
  
  // Print results
  results.forEach(result => {
    const statusIcon = 
      result.status === 'healthy' ? '✅' : 
      result.status === 'degraded' ? '⚠️' : 
      result.status === 'unhealthy' ? '❌' : '❓';
    
    console.log(`${statusIcon} ${result.serviceName} (${result.status.toUpperCase()}):`);
    console.log(`   Active jobs: ${result.details.activeJobs}`);
    console.log(`   Waiting jobs: ${result.details.waitingJobs}`);
    console.log(`   Failed jobs: ${result.details.failedJobs}`);
    console.log(`   Completed jobs: ${result.details.completedJobs}`);
    console.log(`   Last activity: ${result.details.lastActivity}`);
    console.log(`   Redis connected: ${result.details.redisConnected ? '✅' : '❌'}`);
    console.log('');
  });
  
  // Summary
  const healthy = results.filter(r => r.status === 'healthy').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const unhealthy = results.filter(r => r.status === 'unhealthy').length;
  
  console.log(`📊 Summary: ${healthy} healthy, ${degraded} degraded, ${unhealthy} unhealthy`);
  
  if (unhealthy > 0) {
    console.log('\n❌ Some workers are unhealthy');
    process.exit(1);
  } else if (degraded > 0) {
    console.log('\n⚠️  Some workers are experiencing issues');
    process.exit(0);
  } else {
    console.log('\n✅ All workers are healthy');
    process.exit(0);
  }
  
  return results;
}

// Run the health checks
if (require.main === module) {
  runWorkerHealthChecks().catch(error => {
    console.error('Worker health check failed:', error);
    process.exit(1);
  });
}

export { runWorkerHealthChecks, WorkerHealth, checkRenderQueueHealth, checkDatabaseHealth };