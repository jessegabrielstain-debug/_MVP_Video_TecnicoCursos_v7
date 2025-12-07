#!/usr/bin/env node

/**
 * Quick Health Check - Verifica status básico do sistema
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function quickHealthCheck() {
  console.log('🏥 Quick Health Check\n');

  // 1. Environment Variables
  console.log('📋 Environment Variables:');
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let envOk = true;
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`   ❌ ${varName}: MISSING`);
      envOk = false;
    }
  }

  if (!envOk) {
    console.log('\n❌ Environment variables missing. Please check .env.local\n');
    process.exit(1);
  }

  // 2. Database Connection
  console.log('\n🗄️ Database Connection:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`   ❌ Database: ${error.message}`);
    } else {
      console.log(`   ✅ Database: Connected (found ${data?.length || 0} users)`);
    }
  } catch (error) {
    console.log(`   ❌ Database: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 3. Storage Buckets
  console.log('\n📦 Storage Buckets:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log(`   ❌ Storage: ${error.message}`);
    } else {
      const expectedBuckets = ['videos', 'avatars', 'thumbnails', 'assets'];
      for (const bucket of expectedBuckets) {
        const exists = buckets?.find(b => b.name === bucket);
        if (exists) {
          console.log(`   ✅ ${bucket}`);
        } else {
          console.log(`   ⚠️ ${bucket} (missing)`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Storage: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n✅ Health check completed\n');
}

quickHealthCheck().catch(error => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});
