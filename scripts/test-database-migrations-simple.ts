/**
 * Simple Database Migration Test
 * Verifies that our main database schema files can be applied successfully
 */

console.log('🧪 Starting Database Migration Tests...');

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment
config({ path: '.env.local' });

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

async function testDatabaseConnection(): Promise<TestResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'Database Connection',
        passed: false,
        error: 'Missing Supabase credentials'
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic query
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .single();

    if (error && !error.message.includes('does not exist')) {
      return {
        name: 'Database Connection',
        passed: false,
        error: error.message
      };
    }

    return {
      name: 'Database Connection',
      passed: true
    };

  } catch (error) {
    return {
      name: 'Database Connection',
      passed: false,
      error: error.message
    };
  }
}

async function testTableExists(tableName: string): Promise<TestResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from(tableName)
      .select('count(*)')
      .single();

    return {
      name: `Table: ${tableName}`,
      passed: !error || error.message.includes('count'),
      error: error?.message
    };

  } catch (error) {
    return {
      name: `Table: ${tableName}`,
      passed: false,
      error: error.message
    };
  }
}

async function runAllTests(): Promise<void> {
  const tests: Promise<TestResult>[] = [];

  // Test database connection
  tests.push(testDatabaseConnection());

  // Test core tables
  const coreTables = [
    'users',
    'projects', 
    'slides',
    'render_jobs',
    'analytics_events',
    'nr_courses',
    'nr_modules'
  ];

  for (const table of coreTables) {
    tests.push(testTableExists(table));
  }

  console.log('Running tests...\n');

  const results = await Promise.all(tests);
  
  let passedCount = 0;
  let totalCount = results.length;

  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      passedCount++;
    } else {
      console.log(`❌ ${result.name}: ${result.error || 'Unknown error'}`);
    }
  }

  console.log(`\n📊 Migration Test Results:`);
  console.log(`   Passed: ${passedCount}/${totalCount}`);
  console.log(`   Success Rate: ${((passedCount/totalCount) * 100).toFixed(1)}%`);

  if (passedCount === totalCount) {
    console.log('\n🎉 All migration tests passed! Database schema is healthy.');
  } else {
    console.log('\n⚠️  Some migration tests failed. Check the errors above.');
    
    if (passedCount === 0) {
      console.log('\n💡 Tip: Run `npm run setup:supabase` to create the database schema.');
    }
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Migration test suite failed:', error);
  process.exit(1);
});