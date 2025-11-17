#!/usr/bin/env node

/**
 * Production Setup Script
 * Configures all services for real operation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Load environment variables
require('dotenv').config();

interface ServiceConfig {
  name: string;
  required: boolean;
  status: 'configured' | 'missing' | 'invalid';
  details: string;
}

async function validateSupabaseConnection(): Promise<ServiceConfig> {
  try {
    // In a real implementation, we would connect to Supabase
    // For now, verify the URL format and that keys are not placeholders
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || supabaseUrl.includes('your_') || supabaseUrl === 'https://your-project.supabase.co') {
      return {
        name: 'Supabase',
        required: true,
        status: 'missing',
        details: 'NEXT_PUBLIC_SUPABASE_URL not configured'
      };
    }
    
    if (!anonKey || anonKey === 'your_anon_key' || anonKey.length < 20) {
      return {
        name: 'Supabase',
        required: true,
        status: 'missing',
        details: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured'
      };
    }
    
    if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key' || serviceRoleKey.length < 20) {
      return {
        name: 'Supabase',
        required: true,
        status: 'missing',
        details: 'SUPABASE_SERVICE_ROLE_KEY not configured'
      };
    }
    
    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (e) {
      return {
        name: 'Supabase',
        required: true,
        status: 'invalid',
        details: 'Invalid Supabase URL format'
      };
    }
    
    return {
      name: 'Supabase',
      required: true,
      status: 'configured',
      details: 'Configuration valid'
    };
  } catch (error) {
    return {
      name: 'Supabase',
      required: true,
      status: 'invalid',
      details: `Connection failed: ${(error as Error).message}`
    };
  }
}

async function validateRedisConnection(): Promise<ServiceConfig> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    if (redisUrl.includes('your_') || redisUrl === 'redis://localhost:6379') {
      return {
        name: 'Redis',
        required: true,
        status: 'missing',
        details: 'REDIS_URL not configured'
      };
    }
    
    // In a real implementation, we would test Redis connection
    // For now, just validate URL format
    try {
      new URL(redisUrl);
    } catch (e) {
      return {
        name: 'Redis',
        required: true,
        status: 'invalid',
        details: 'Invalid Redis URL format'
      };
    }
    
    return {
      name: 'Redis',
      required: true,
      status: 'configured',
      details: 'Configuration valid'
    };
  } catch (error) {
    return {
      name: 'Redis',
      required: true,
      status: 'invalid',
      details: `Connection failed: ${(error as Error).message}`
    };
  }
}

async function validateStorageConfig(): Promise<ServiceConfig> {
  try {
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsBucket = process.env.AWS_S3_BUCKET;
    
    const missingFields: string[] = [];
    
    if (!awsAccessKeyId || awsAccessKeyId.includes('your_') || awsAccessKeyId === 'your_aws_access_key') {
      missingFields.push('AWS_ACCESS_KEY_ID');
    }
    
    if (!awsSecretAccessKey || awsSecretAccessKey.includes('your_') || awsSecretAccessKey === 'your_aws_secret_key') {
      missingFields.push('AWS_SECRET_ACCESS_KEY');
    }
    
    if (!awsBucket || awsBucket.includes('your_') || awsBucket === 'your-bucket-name') {
      missingFields.push('AWS_S3_BUCKET');
    }
    
    if (missingFields.length > 0) {
      return {
        name: 'Storage (AWS S3)',
        required: true,
        status: 'missing',
        details: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    return {
      name: 'Storage (AWS S3)',
      required: true,
      status: 'configured',
      details: 'Configuration valid'
    };
  } catch (error) {
    return {
      name: 'Storage (AWS S3)',
      required: true,
      status: 'invalid',
      details: `Configuration invalid: ${(error as Error).message}`
    };
  }
}

async function validateTTSConfig(): Promise<ServiceConfig> {
  try {
    const azureKey = process.env.AZURE_SPEECH_KEY;
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    
    const hasAzure = azureKey && !azureKey.includes('your_') && azureKey.length > 10;
    const hasElevenLabs = elevenLabsKey && !elevenLabsKey.includes('your_') && elevenLabsKey.startsWith('sk_');
    
    if (!hasAzure && !hasElevenLabs) {
      return {
        name: 'TTS Services',
        required: true,
        status: 'missing',
        details: 'Need either Azure Speech or ElevenLabs API key'
      };
    }
    
    return {
      name: 'TTS Services',
      required: true,
      status: 'configured',
      details: `Configured: ${hasAzure ? 'Azure, ' : ''}${hasElevenLabs ? 'ElevenLabs' : ''}`.replace(', ', '').replace('  ', ' ')
    };
  } catch (error) {
    return {
      name: 'TTS Services',
      required: true,
      status: 'invalid',
      details: `Configuration invalid: ${(error as Error).message}`
    };
  }
}

async function checkEnvironment(): Promise<ServiceConfig> {
  try {
    // Check if we're in production environment
    const nodeEnv = process.env.NODE_ENV;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (nodeEnv === 'production' && (!appUrl || appUrl.includes('localhost'))) {
      return {
        name: 'Environment',
        required: true,
        status: 'invalid',
        details: 'Production environment requires valid NEXT_PUBLIC_APP_URL'
      };
    }
    
    return {
      name: 'Environment',
      required: true,
      status: 'configured',
      details: `Environment: ${nodeEnv || 'development'}`
    };
  } catch (error) {
    return {
      name: 'Environment',
      required: true,
      status: 'invalid',
      details: `Environment check failed: ${(error as Error).message}`
    };
  }
}

async function runProductionSetup(): Promise<ServiceConfig[]> {
  console.log('🚀 Running production setup validation...\n');
  
  const validations = [
    checkEnvironment(),
    validateSupabaseConnection(),
    validateRedisConnection(),
    validateStorageConfig(),
    validateTTSConfig()
  ];
  
  const results = await Promise.all(validations);
  
  // Print results
  console.log('📋 Service Configuration Status:\n');
  
  results.forEach(result => {
    const statusIcon = 
      result.status === 'configured' ? '✅' : 
      result.status === 'missing' ? '❌' : 
      '⚠️';
    
    console.log(`${statusIcon} ${result.name}: ${result.status.toUpperCase()}`);
    console.log(`   Details: ${result.details}`);
    console.log('');
  });
  
  // Summary
  const configured = results.filter(r => r.status === 'configured').length;
  const missing = results.filter(r => r.status === 'missing').length;
  const invalid = results.filter(r => r.status === 'invalid').length;
  const totalRequired = results.filter(r => r.required).length;
  
  console.log(`📊 Configuration Summary:`);
  console.log(`   Total Required Services: ${totalRequired}`);
  console.log(`   Properly Configured: ${configured}`);
  console.log(`   Missing: ${missing}`);
  console.log(`   Invalid: ${invalid}`);
  console.log('');
  
  if (missing > 0 || invalid > 0) {
    console.log('❌ Some services are not properly configured for production!');
    console.log('   Please update your .env.local file with valid credentials.');
    process.exit(1);
  } else {
    console.log('✅ All required services are properly configured!');
    console.log('   You can now run the application in production mode.');
    process.exit(0);
  }
  
  return results;
}

// Function to generate production-ready .env file
async function generateProductionEnv(): Promise<void> {
  const productionEnv = `# ====================================================================
# 🔐 PRODUCTION ENVIRONMENT CONFIGURATION
# ====================================================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# ====================================================================
# SUPABASE - DATABASE & AUTH (REQUIRED)
# ====================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase

# ====================================================================
# REDIS - CACHE & QUEUE (REQUIRED)
# ====================================================================
REDIS_URL=redis://your-redis-url:6379

# ====================================================================
# STORAGE (REQUIRED - at least one)
# ====================================================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name

# ====================================================================
# TEXT-TO-SPEECH PROVIDERS (REQUIRED - at least one)
# ====================================================================
# Azure Speech (Recommended for PT-BR)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=brazilsouth

# ElevenLabs (For voice cloning)
ELEVENLABS_API_KEY=sk_your_elevenlabs_key_here

# ====================================================================
# MONITORING & ANALYTICS (OPTIONAL BUT RECOMMENDED)
# ====================================================================
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# ====================================================================
# SECURITY
# ====================================================================
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_unique_nextauth_secret

# Feature Flags
FLAG_ENABLE_ADVANCED_ANALYTICS=true
FLAG_ENABLE_RBAC=true
FLAG_ENABLE_VIDEO_RENDER=true
`;

  const envPath = path.join(process.cwd(), '.env.production');
  fs.writeFileSync(envPath, productionEnv);
  
  console.log(`✅ Production .env file generated: ${envPath}`);
}

// Run the production setup
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--generate') || args.includes('-g')) {
    generateProductionEnv().catch(error => {
      console.error('Error generating production env:', error);
      process.exit(1);
    });
  } else {
    runProductionSetup().catch(error => {
      console.error('Production setup validation failed:', error);
      process.exit(1);
    });
  }
}

export { runProductionSetup, ServiceConfig, generateProductionEnv };