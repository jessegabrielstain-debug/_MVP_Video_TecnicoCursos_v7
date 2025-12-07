import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL,
    },
  },
});

async function main() {
  try {
    console.log('Checking for NrTemplate table...');
    const count = await prisma.nrTemplate.count();
    console.log(`NrTemplate table exists. Count: ${count}`);
  } catch (error) {
    console.error('Error checking NrTemplate table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
