#!/usr/bin/env node
/**
 * 🔐 Environment Validation Script
 * Validates all required environment variables before production deployment
 * FASE 8.2 - Environment Configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  pattern?: RegExp;
  sensitive?: boolean;
  defaultValue?: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
  sensitiveExposed: string[];
}

// ============================================
// Environment Variable Definitions
// ============================================

const REQUIRED_VARIABLES: EnvVariable[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key',
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    sensitive: true,
  },

  // Database
  {
    name: 'DIRECT_DATABASE_URL',
    required: false,
    description: 'Direct PostgreSQL connection URL',
    pattern: /^postgres(ql)?:\/\/.+/,
    sensitive: true,
  },

  // Redis (for BullMQ)
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL for job queue',
    pattern: /^redis(s)?:\/\/.+/,
    defaultValue: 'redis://localhost:6379',
  },

  // Next.js
  {
    name: 'NEXTAUTH_SECRET',
    required: false,
    description: 'NextAuth.js secret for session encryption',
    sensitive: true,
  },
  {
    name: 'NEXTAUTH_URL',
    required: false,
    description: 'NextAuth.js callback URL',
    pattern: /^https?:\/\/.+/,
  },

  // OpenAI (if used)
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    pattern: /^sk-[A-Za-z0-9-_]+$/,
    sensitive: true,
  },

  // ElevenLabs TTS
  {
    name: 'ELEVENLABS_API_KEY',
    required: false,
    description: 'ElevenLabs API key for TTS',
    sensitive: true,
  },

  // Application
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Node environment (development/production/test)',
    pattern: /^(development|production|test)$/,
    defaultValue: 'development',
  },
];

const PRODUCTION_ONLY_REQUIRED: string[] = [
  'SUPABASE_SERVICE_ROLE_KEY',
];

// ============================================
// Validation Functions
// ============================================

function loadEnvFile(envPath: string): Record<string, string> {
  const envVars: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    return envVars;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envVars[key] = value;
  }

  return envVars;
}

function validateEnvironment(
  envVars: Record<string, string>,
  isProduction: boolean
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
    warnings: [],
    sensitiveExposed: [],
  };

  for (const variable of REQUIRED_VARIABLES) {
    const value = envVars[variable.name] || process.env[variable.name];
    const isRequiredInProduction = PRODUCTION_ONLY_REQUIRED.includes(variable.name);
    const isRequired = variable.required || (isProduction && isRequiredInProduction);

    // Check if missing
    if (!value) {
      if (isRequired) {
        result.missing.push(variable.name);
        result.valid = false;
      } else if (!variable.defaultValue) {
        result.warnings.push(`Optional variable ${variable.name} is not set`);
      }
      continue;
    }

    // Validate pattern if provided
    if (variable.pattern && !variable.pattern.test(value)) {
      result.invalid.push(`${variable.name}: Invalid format`);
      result.valid = false;
    }

    // Check if sensitive variable is exposed publicly
    if (variable.sensitive && variable.name.startsWith('NEXT_PUBLIC_')) {
      result.sensitiveExposed.push(variable.name);
      result.valid = false;
    }
  }

  // Check for sensitive keys in NEXT_PUBLIC variables
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      // Check if value looks like a secret
      if (value.startsWith('sk-') || 
          (value.startsWith('eyJ') && value.includes('service_role'))) {
        result.sensitiveExposed.push(key);
        result.valid = false;
      }
    }
  }

  return result;
}

// ============================================
// Report Generation
// ============================================

function generateReport(result: ValidationResult, isProduction: boolean): string {
  const lines: string[] = [];
  const divider = '═'.repeat(60);
  
  lines.push('');
  lines.push(divider);
  lines.push('  🔐 ENVIRONMENT VALIDATION REPORT');
  lines.push(`  Mode: ${isProduction ? '🚀 PRODUCTION' : '🔧 DEVELOPMENT'}`);
  lines.push(divider);
  lines.push('');

  if (result.valid) {
    lines.push('  ✅ All required environment variables are configured correctly!');
    lines.push('');
  } else {
    lines.push('  ❌ Validation FAILED - Please fix the following issues:');
    lines.push('');
  }

  // Missing variables
  if (result.missing.length > 0) {
    lines.push('  📋 MISSING REQUIRED VARIABLES:');
    for (const name of result.missing) {
      const variable = REQUIRED_VARIABLES.find(v => v.name === name);
      lines.push(`     ❌ ${name}`);
      if (variable?.description) {
        lines.push(`        └─ ${variable.description}`);
      }
    }
    lines.push('');
  }

  // Invalid variables
  if (result.invalid.length > 0) {
    lines.push('  ⚠️ INVALID FORMAT:');
    for (const msg of result.invalid) {
      lines.push(`     ❌ ${msg}`);
    }
    lines.push('');
  }

  // Security issues
  if (result.sensitiveExposed.length > 0) {
    lines.push('  🔒 SECURITY ISSUES:');
    for (const name of result.sensitiveExposed) {
      lines.push(`     🚨 ${name} - Sensitive key exposed in public variable!`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('  💡 WARNINGS (non-blocking):');
    for (const warning of result.warnings) {
      lines.push(`     ⚠️ ${warning}`);
    }
    lines.push('');
  }

  // Summary
  lines.push(divider);
  lines.push(`  Status: ${result.valid ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push(`  Missing: ${result.missing.length} | Invalid: ${result.invalid.length} | Warnings: ${result.warnings.length}`);
  lines.push(divider);
  lines.push('');

  return lines.join('\n');
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
  console.log('\n🔍 Validating environment configuration...\n');

  // Determine paths
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const rootDir = path.resolve(scriptDir, '..');
  const appDir = path.join(rootDir, 'estudio_ia_videos');

  // Windows path fix
  const normalizedRoot = process.platform === 'win32' 
    ? rootDir.replace(/^\/([A-Z]:)/, '$1') 
    : rootDir;
  const normalizedApp = process.platform === 'win32'
    ? appDir.replace(/^\/([A-Z]:)/, '$1')
    : appDir;

  // Load env files (check multiple locations)
  const envPaths = [
    path.join(normalizedRoot, '.env'),
    path.join(normalizedRoot, '.env.local'),
    path.join(normalizedApp, '.env'),
    path.join(normalizedApp, '.env.local'),
  ];

  let envVars: Record<string, string> = {};
  for (const envPath of envPaths) {
    const loaded = loadEnvFile(envPath);
    envVars = { ...envVars, ...loaded };
    if (Object.keys(loaded).length > 0) {
      console.log(`  📄 Loaded: ${envPath}`);
    }
  }

  // Check if production
  const nodeEnv = envVars['NODE_ENV'] || process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Validate
  const result = validateEnvironment(envVars, isProduction);

  // Generate and print report
  const report = generateReport(result, isProduction);
  console.log(report);

  // Exit with appropriate code
  process.exit(result.valid ? 0 : 1);
}

// Export for programmatic use
export { validateEnvironment, loadEnvFile, REQUIRED_VARIABLES };
export type { ValidationResult, EnvVariable };

// Run if executed directly
main().catch((error) => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
