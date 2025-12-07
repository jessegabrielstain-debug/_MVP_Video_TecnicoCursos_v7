/**
 * Validation schemas for cancel operations
 */

import { z } from 'zod';

/**
 * Schema para cancelar job
 */
export const CancelJobSchema = z.object({
  jobId: z.string().uuid('Job ID deve ser um UUID válido'),
  reason: z.string().min(3).max(500).optional(),
  force: z.boolean().optional().default(false),
});

export type CancelJobInput = z.infer<typeof CancelJobSchema>;

/**
 * Schema para cancelar múltiplos jobs
 */
export const BatchCancelSchema = z.object({
  jobIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().min(3).max(500).optional(),
  force: z.boolean().optional().default(false),
});

export type BatchCancelInput = z.infer<typeof BatchCancelSchema>;

/**
 * Schema para cancelar jobs de um projeto
 */
export const CancelProjectJobsSchema = z.object({
  projectId: z.string().uuid('Project ID deve ser um UUID válido'),
  status: z.enum(['queued', 'processing']).optional(),
  reason: z.string().min(3).max(500).optional(),
});

export type CancelProjectJobsInput = z.infer<typeof CancelProjectJobsSchema>;

/**
 * Schema para cancelar jobs de um usuário
 */
export const CancelUserJobsSchema = z.object({
  userId: z.string().uuid('User ID deve ser um UUID válido'),
  status: z.enum(['queued', 'processing']).optional(),
  reason: z.string().min(3).max(500).optional(),
});

export type CancelUserJobsInput = z.infer<typeof CancelUserJobsSchema>;
