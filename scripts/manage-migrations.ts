import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const PRISMA_DIR = path.join(process.cwd(), 'estudio_ia_videos', 'prisma');
const ENV_PATH = path.join(process.cwd(), 'estudio_ia_videos', '.env.local');

// Load environment variables from .env.local manually
function loadEnv() {
  if (fs.existsSync(ENV_PATH)) {
    console.log(`Loading environment from ${ENV_PATH}`);
    const envConfig = fs.readFileSync(ENV_PATH, 'utf-8');
    envConfig.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return; // Skip comments and empty lines

      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
          console.log(`Loaded env var: ${key}`);
        }
      }
    });
  } else {
    console.warn(`Warning: ${ENV_PATH} not found.`);
  }
}

function runCommand(command: string) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(process.cwd(), 'estudio_ia_videos'),
      env: process.env // Pass the loaded env vars
    });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const action = args[0];

  if (!action) {
    console.log(`
Usage: tsx scripts/manage-migrations.ts <action> [options]

Actions:
  dev <name>      Create a new migration and apply it (dev environment)
  deploy          Apply pending migrations (production/CI)
  status          Check migration status
  reset           Reset database and re-apply all migrations (DESTRUCTIVE)
  generate        Generate Prisma Client
  studio          Open Prisma Studio
    `);
    return;
  }

  switch (action) {
    case 'dev':
      const name = args[1] || 'update';
      runCommand(`npx prisma migrate dev --name ${name}`);
      break;
    case 'deploy':
      runCommand(`npx prisma migrate deploy`);
      break;
    case 'status':
      runCommand(`npx prisma migrate status`);
      break;
    case 'reset':
      runCommand(`npx prisma migrate reset`);
      break;
    case 'generate':
      runCommand(`npx prisma generate`);
      break;
    case 'studio':
      runCommand(`npx prisma studio`);
      break;
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

main();
