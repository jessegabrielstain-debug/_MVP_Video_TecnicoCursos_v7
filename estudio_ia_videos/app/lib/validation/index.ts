/**
 * Validation Module Index
 * Exportações centralizadas de schemas Zod e helpers de validação
 */

// Main schemas (authoritative - contains all base schemas)
export * from './schemas';

// Additional schemas from subdirectory that don't conflict
export * from './schemas/webhook-schema';
export * from './schemas/voice-cloning-schema';
export * from './schemas/metrics-schema';
export * from './schemas/stats-schema';
export * from './schemas/cancel-schema';

// API validator helpers
export * from './api-validator';

// Re-export Zod for convenience
export { z } from 'zod';
