import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Setup environment
config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestCase {
  name: string;
  description: string;
  sqlFile: string;
  validator: (supabase: any) => Promise<void>;
}

class DatabaseMigrationTester {
  private supabase: any;
  private testDb: string;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for migration testing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.testDb = `test_migration_${Date.now()}`;
  }

  async runSqlFile(filePath: string): Promise<void> {
    try {
      const sqlContent = await fs.readFile(filePath, 'utf-8');
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await this.supabase.rpc('execute_sql', {
            sql_statement: statement
          });
          
          if (error) {
            console.error(`Error executing: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading SQL file ${filePath}:`, error);
      throw error;
    }
  }

  async validateTableExists(tableName: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`Table ${tableName} does not exist`);
    }
  }

  async validateRLSPolicy(tableName: string, policyName: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', tableName)
      .eq('policyname', policyName);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`RLS policy ${policyName} not found on table ${tableName}`);
    }
  }

  async validateIndex(indexName: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('indexname', indexName);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`Index ${indexName} does not exist`);
    }
  }

  async validateFunction(functionName: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', functionName)
      .eq('routine_schema', 'public');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(`Function ${functionName} does not exist`);
    }
  }

  async cleanup(): Promise<void> {
    // Note: In real test, you'd drop test schema or use transaction rollback
    console.log('Cleanup: Migration test completed');
  }

  async runMigrationTests(): Promise<void> {
    const rootPath = path.resolve(__dirname, '../..');
    
    const testCases: TestCase[] = [
      {
        name: 'Core Schema Migration',
        description: 'Tests main database schema creation',
        sqlFile: path.join(rootPath, 'database-schema.sql'),
        validator: async (supabase) => {
          await this.validateTableExists('users');
          await this.validateTableExists('projects');
          await this.validateTableExists('slides');
          await this.validateTableExists('render_jobs');
          await this.validateTableExists('analytics_events');
          await this.validateTableExists('nr_courses');
          await this.validateTableExists('nr_modules');
          
          console.log('✅ All core tables exist');
        }
      },
      {
        name: 'RLS Policies Migration',
        description: 'Tests Row Level Security policies',
        sqlFile: path.join(rootPath, 'database-rls-policies.sql'),
        validator: async (supabase) => {
          await this.validateRLSPolicy('projects', 'projects_user_isolation');
          await this.validateRLSPolicy('slides', 'slides_user_isolation');
          await this.validateRLSPolicy('render_jobs', 'render_jobs_user_isolation');
          await this.validateRLSPolicy('analytics_events', 'analytics_events_user_isolation');
          
          console.log('✅ All RLS policies exist');
        }
      },
      {
        name: 'Performance Indexes',
        description: 'Tests performance optimization indexes',
        sqlFile: path.join(rootPath, 'setup-performance-indexes.sql'),
        validator: async (supabase) => {
          await this.validateIndex('idx_projects_user_created');
          await this.validateIndex('idx_slides_project_order');
          await this.validateIndex('idx_render_jobs_status_created');
          await this.validateIndex('idx_analytics_events_timestamp');
          
          console.log('✅ All performance indexes exist');
        }
      },
      {
        name: 'RBAC System',
        description: 'Tests Role-Based Access Control',
        sqlFile: path.join(rootPath, 'database-rbac-complete.sql'),
        validator: async (supabase) => {
          await this.validateTableExists('roles');
          await this.validateTableExists('permissions');
          await this.validateTableExists('user_roles');
          await this.validateFunction('is_admin');
          await this.validateFunction('has_permission');
          
          console.log('✅ RBAC system properly configured');
        }
      },
      {
        name: 'NR Templates Data',
        description: 'Tests Normas Regulamentadoras templates',
        sqlFile: path.join(rootPath, 'database-nr-templates.sql'),
        validator: async (supabase) => {
          const { data, error } = await this.supabase
            .from('nr_courses')
            .select('count(*)')
            .single();
            
          if (error) throw error;
          if (!data || data.count === 0) {
            throw new Error('No NR courses found after migration');
          }
          
          console.log(`✅ Found ${data.count} NR courses`);
        }
      }
    ];

    console.log('🧪 Starting Database Migration Tests...\n');

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      try {
        console.log(`📋 Running: ${testCase.name}`);
        console.log(`   Description: ${testCase.description}`);

        // Check if SQL file exists
        try {
          await fs.access(testCase.sqlFile);
        } catch {
          console.log(`⚠️  SQL file not found: ${testCase.sqlFile}, skipping...`);
          continue;
        }

        // Run migration
        await this.runSqlFile(testCase.sqlFile);
        
        // Validate
        await testCase.validator(this.supabase);
        
        console.log(`✅ ${testCase.name} PASSED\n`);
        passedTests++;

      } catch (error) {
        console.error(`❌ ${testCase.name} FAILED:`);
        console.error(`   Error: ${error.message}\n`);
      }
    }

    // Results summary
    console.log('📊 Migration Test Results:');
    console.log(`   Passed: ${passedTests}/${totalTests}`);
    console.log(`   Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All migration tests passed! Database schema is healthy.');
    } else {
      console.log('\n⚠️  Some migration tests failed. Review the errors above.');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DatabaseMigrationTester();
  
  tester.runMigrationTests()
    .then(() => tester.cleanup())
    .catch((error) => {
      console.error('Migration test suite failed:', error);
      process.exit(1);
    });
}

export { DatabaseMigrationTester };