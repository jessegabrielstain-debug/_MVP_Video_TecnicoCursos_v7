// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "jest",
  testRunnerNodeArgs: ["--experimental-loader=tsx"],
  
  // Jest config
  jest: {
    projectType: "custom",
    configFile: "../jest.config.cjs",
    enableFindRelatedTests: true,
  },

  // TypeScript config
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",

  // Coverage config
  coverageAnalysis: "perTest",
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },

  // Mutation config
  mutate: [
    "app/lib/**/*.ts",
    "!app/lib/**/*.test.ts",
    "!app/lib/**/*.spec.ts",
    "!app/lib/**/*.d.ts",
    "!app/lib/**/types.ts",
    // Focus on critical business logic
    "app/lib/analytics/**/*.ts",
    "app/lib/performance/**/*.ts", 
    "app/lib/validation/**/*.ts",
    "app/lib/security/**/*.ts",
    "app/lib/render/**/*.ts"
  ],

  // Ignore config files and test utilities
  ignorePatterns: [
    "**/node_modules/**",
    "**/*.config.*",
    "**/*.setup.*",
    "**/jest.setup.js",
    "**/__tests__/**",
    "**/tests/**",
    "**/coverage/**",
    "**/dist/**",
    "**/.next/**"
  ],

  // Timeout config (longer for complex mutations)
  timeoutMS: 30000,
  timeoutFactor: 2,
  dryRunTimeoutMinutes: 10,

  // Performance optimizations
  concurrency: 4,
  maxConcurrentTestRunners: 2,
  
  // Only run mutations on changed files for CI
  incrementalFile: ".stryker-tmp/incremental.json",
  
  // Dashboard config (optional)
  dashboard: {
    project: "github.com/your-org/mvp-video-tecnicocursos",
    version: "master"
  },

  // Plugin configuration
  plugins: [
    "@stryker-mutator/jest-runner",
    "@stryker-mutator/typescript-checker"
  ],

  // Detailed logging
  logLevel: "info",
  fileLogLevel: "debug",
  
  // HTML report output
  htmlReporter: {
    baseDir: "coverage/mutation"
  }
};

export default config;