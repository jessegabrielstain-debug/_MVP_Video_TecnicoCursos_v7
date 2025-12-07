const { pathsToModuleNameMapper } = require('ts-jest');
const path = require('path');

// Caminho absoluto para babel.config.cjs
const babelConfigPath = path.resolve(__dirname, 'babel.config.cjs');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/estudio_ia_videos/app/$1',
    '^dnd-core$': 'dnd-core/dist/cjs',
    '^react-dnd$': 'react-dnd/dist/cjs',
    '^react-dnd-html5-backend$': 'react-dnd-html5-backend/dist/cjs',
    '^@prisma/client$': '<rootDir>/estudio_ia_videos/node_modules/@prisma/client',
  },

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false,
          skipLibCheck: true,
          target: 'ES2020',
          module: 'commonjs',
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
        },
      },
    ],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', { configFile: babelConfigPath }],
  },
// ... (o resto do arquivo permanece o mesmo)


  transformIgnorePatterns: [
    '/node_modules/(?!bullmq|msgpackr|jose|@supabase/auth-helpers-shared|@supabase/auth-helpers-nextjs|dnd-core|react-dnd|react-dnd-html5-backend).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
  ],

  testMatch: [
    '<rootDir>/estudio_ia_videos/app/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/estudio_ia_videos/app/tests/**/*.test.{ts,tsx}',
  ],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/_archive/',
    '<rootDir>/archive/',
    '<rootDir>/estudio_ia_videos/app/e2e/',
    '<rootDir>/tests/e2e/',
    'e2e',
    'vitest',
    'playwright',
  ],
  
  setupFilesAfterEnv: ['<rootDir>/estudio_ia_videos/app/jest.setup.js'],
  testTimeout: 120000,
  verbose: true,
};
