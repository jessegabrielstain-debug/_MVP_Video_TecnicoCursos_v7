/**
 * @fileoverview Tests for validation schemas (Zod)
 * Comprehensive tests for all validation schemas and utility functions
 */

import { z } from 'zod';
import {
  VideoJobInputSchema,
  VideoJobStatusSchema,
  VideoJobQuerySchema,
  VideoJobMetricsSchema,
  RenderStatsQuerySchema,
  VideoJobCancelSchema,
  VideoJobRetrySchema,
  AnalyticsEventSchema,
  AnalyticsQuerySchema,
  ProjectCreateSchema,
  SlideUpdateSchema,
  LoginSchema,
  RegisterSchema,
  TTSProviderSchema,
  TTSGenerateSchema,
  AvatarProviderSchema,
  AvatarRenderSchema,
  ExportFormatSchema,
  ExportOptionsSchema,
  PaginationSchema,
  DateRangeSchema,
  validateData,
  formatZodErrors,
  getFirstZodError,
  createValidationErrorResponse,
} from '@/lib/validation/schemas';

// =============================================
// VideoJobInputSchema Tests
// =============================================

describe('VideoJobInputSchema', () => {
  const validInput = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Video',
    slideIds: ['550e8400-e29b-41d4-a716-446655440001'],
  };

  it('should validate valid input with minimum fields', () => {
    const result = VideoJobInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate with optional settings', () => {
    const input = {
      ...validInput,
      settings: {
        resolution: '4k',
        fps: 60,
        format: 'webm',
        quality: 'ultra',
      },
    };
    const result = VideoJobInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.settings?.resolution).toBe('4k');
    }
  });

  it('should reject invalid project ID', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      projectId: 'invalid-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('projeto inválido');
    }
  });

  it('should reject empty title', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject title over 200 chars', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('longo');
    }
  });

  it('should reject empty slideIds array', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      slideIds: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message.toLowerCase()).toContain('pelo menos um slide');
    }
  });

  it('should reject invalid FPS', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      settings: { fps: 120 },
    });
    expect(result.success).toBe(false);
  });

  it('should use default settings values', () => {
    const result = VideoJobInputSchema.safeParse({
      ...validInput,
      settings: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.settings?.resolution).toBe('1080p');
      expect(result.data.settings?.fps).toBe(30);
      expect(result.data.settings?.format).toBe('mp4');
      expect(result.data.settings?.quality).toBe('high');
    }
  });
});

// =============================================
// VideoJobStatusSchema Tests
// =============================================

describe('VideoJobStatusSchema', () => {
  it('should validate valid UUID', () => {
    const result = VideoJobStatusSchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = VideoJobStatusSchema.safeParse({
      jobId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// VideoJobQuerySchema Tests
// =============================================

describe('VideoJobQuerySchema', () => {
  it('should use defaults for empty input', () => {
    const result = VideoJobQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should coerce string numbers', () => {
    const result = VideoJobQuerySchema.safeParse({
      page: '5',
      limit: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should validate status enum', () => {
    const result = VideoJobQuerySchema.safeParse({
      status: 'processing',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = VideoJobQuerySchema.safeParse({
      status: 'invalid-status',
    });
    expect(result.success).toBe(false);
  });

  it('should reject limit over 100', () => {
    const result = VideoJobQuerySchema.safeParse({
      limit: 101,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// VideoJobMetricsSchema Tests
// =============================================

describe('VideoJobMetricsSchema', () => {
  it('should coerce date strings', () => {
    const result = VideoJobMetricsSchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.endDate).toBeInstanceOf(Date);
    }
  });

  it('should use default groupBy', () => {
    const result = VideoJobMetricsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groupBy).toBe('day');
    }
  });

  it('should accept valid groupBy values', () => {
    const validValues = ['day', 'week', 'month'];
    validValues.forEach((value) => {
      const result = VideoJobMetricsSchema.safeParse({ groupBy: value });
      expect(result.success).toBe(true);
    });
  });
});

// =============================================
// RenderStatsQuerySchema Tests
// =============================================

describe('RenderStatsQuerySchema', () => {
  it('should validate all timeRange values', () => {
    const validRanges = ['1h', '24h', '7d', '30d', '90d'];
    validRanges.forEach((range) => {
      const result = RenderStatsQuerySchema.safeParse({ timeRange: range });
      expect(result.success).toBe(true);
    });
  });

  it('should coerce boolean strings', () => {
    const result = RenderStatsQuerySchema.safeParse({
      includeErrors: true,
      includePerformance: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeErrors).toBe(true);
      expect(result.data.includePerformance).toBe(false);
    }
  });

  it('should use defaults', () => {
    const result = RenderStatsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeRange).toBe('24h');
      expect(result.data.status).toBe('all');
      expect(result.data.includeErrors).toBe(false);
    }
  });
});

// =============================================
// Job Control Schemas Tests
// =============================================

describe('VideoJobCancelSchema', () => {
  it('should validate valid cancel request', () => {
    const result = VideoJobCancelSchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'User cancelled',
    });
    expect(result.success).toBe(true);
  });

  it('should accept without reason', () => {
    const result = VideoJobCancelSchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject reason over 500 chars', () => {
    const result = VideoJobCancelSchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('VideoJobRetrySchema', () => {
  it('should validate retry request', () => {
    const result = VideoJobRetrySchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(false);
    }
  });

  it('should coerce force boolean', () => {
    const result = VideoJobRetrySchema.safeParse({
      jobId: '550e8400-e29b-41d4-a716-446655440000',
      force: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.force).toBe(true);
    }
  });
});

// =============================================
// AnalyticsEventSchema Tests
// =============================================

describe('AnalyticsEventSchema', () => {
  it('should validate valid event', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventType: 'render_completed',
      eventData: { jobId: '123', duration: 5000 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timestamp).toBeInstanceOf(Date);
    }
  });

  it('should validate all event types', () => {
    const eventTypes = [
      'slide_reordered',
      'video_exported',
      'project_created',
      'render_started',
      'render_completed',
      'render_failed',
      'user_login',
      'user_logout',
    ];
    eventTypes.forEach((type) => {
      const result = AnalyticsEventSchema.safeParse({
        eventType: type,
        eventData: {},
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid event type', () => {
    const result = AnalyticsEventSchema.safeParse({
      eventType: 'invalid_event',
      eventData: {},
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// AnalyticsQuerySchema Tests
// =============================================

describe('AnalyticsQuerySchema', () => {
  it('should validate query with dates', () => {
    const result = AnalyticsQuerySchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should use defaults for limit and offset', () => {
    const result = AnalyticsQuerySchema.safeParse({
      startDate: new Date(),
      endDate: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    }
  });

  it('should reject limit over 1000', () => {
    const result = AnalyticsQuerySchema.safeParse({
      startDate: new Date(),
      endDate: new Date(),
      limit: 1001,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// ProjectCreateSchema Tests
// =============================================

describe('ProjectCreateSchema', () => {
  it('should validate minimal project', () => {
    const result = ProjectCreateSchema.safeParse({
      name: 'My Project',
    });
    expect(result.success).toBe(true);
  });

  it('should validate full project', () => {
    const result = ProjectCreateSchema.safeParse({
      name: 'My Project',
      description: 'A test project',
      originalFileName: 'presentation.pptx',
      metadata: { source: 'upload' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = ProjectCreateSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name over 200 chars', () => {
    const result = ProjectCreateSchema.safeParse({
      name: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('should reject description over 2000 chars', () => {
    const result = ProjectCreateSchema.safeParse({
      name: 'Valid',
      description: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// SlideUpdateSchema Tests
// =============================================

describe('SlideUpdateSchema', () => {
  it('should validate valid slide update', () => {
    const result = SlideUpdateSchema.safeParse({
      slideId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'New content',
      duration: 5,
      orderIndex: 0,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative duration', () => {
    const result = SlideUpdateSchema.safeParse({
      slideId: '550e8400-e29b-41d4-a716-446655440000',
      duration: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative orderIndex', () => {
    const result = SlideUpdateSchema.safeParse({
      slideId: '550e8400-e29b-41d4-a716-446655440000',
      orderIndex: -1,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// Authentication Schemas Tests
// =============================================

describe('LoginSchema', () => {
  it('should validate valid login', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Email inválido');
    }
  });

  it('should reject short password', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('6 caracteres');
    }
  });
});

describe('RegisterSchema', () => {
  it('should validate valid registration', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name over 200 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// TTS Schemas Tests
// =============================================

describe('TTSProviderSchema', () => {
  it('should validate all providers', () => {
    const providers = ['elevenlabs', 'azure', 'google', 'aws'];
    providers.forEach((provider) => {
      const result = TTSProviderSchema.safeParse(provider);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid provider', () => {
    const result = TTSProviderSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('TTSGenerateSchema', () => {
  it('should validate valid TTS request', () => {
    const result = TTSGenerateSchema.safeParse({
      text: 'Hello world',
      voiceId: 'voice-123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe('elevenlabs');
      expect(result.data.language).toBe('pt-BR');
    }
  });

  it('should reject empty text', () => {
    const result = TTSGenerateSchema.safeParse({
      text: '',
      voiceId: 'voice-123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject text over 5000 chars', () => {
    const result = TTSGenerateSchema.safeParse({
      text: 'a'.repeat(5001),
      voiceId: 'voice-123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('5000');
    }
  });

  it('should validate TTS options', () => {
    const result = TTSGenerateSchema.safeParse({
      text: 'Hello',
      voiceId: 'voice-123',
      options: {
        speed: 1.5,
        pitch: 5,
        stability: 0.8,
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid speed', () => {
    const result = TTSGenerateSchema.safeParse({
      text: 'Hello',
      voiceId: 'voice-123',
      options: { speed: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid pitch', () => {
    const result = TTSGenerateSchema.safeParse({
      text: 'Hello',
      voiceId: 'voice-123',
      options: { pitch: -25 },
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// Avatar Schemas Tests
// =============================================

describe('AvatarProviderSchema', () => {
  it('should validate all providers', () => {
    const providers = ['heygen', 'did', 'synthesia', 'custom'];
    providers.forEach((provider) => {
      const result = AvatarProviderSchema.safeParse(provider);
      expect(result.success).toBe(true);
    });
  });
});

describe('AvatarRenderSchema', () => {
  it('should validate valid avatar render', () => {
    const result = AvatarRenderSchema.safeParse({
      provider: 'heygen',
      avatarId: 'avatar-123',
      script: 'Hello, welcome to the video!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty script', () => {
    const result = AvatarRenderSchema.safeParse({
      provider: 'heygen',
      avatarId: 'avatar-123',
      script: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject script over 10000 chars', () => {
    const result = AvatarRenderSchema.safeParse({
      provider: 'heygen',
      avatarId: 'avatar-123',
      script: 'a'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it('should validate optional webhook URL', () => {
    const result = AvatarRenderSchema.safeParse({
      provider: 'did',
      avatarId: 'avatar-123',
      script: 'Test',
      webhook: 'https://example.com/webhook',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid webhook URL', () => {
    const result = AvatarRenderSchema.safeParse({
      provider: 'did',
      avatarId: 'avatar-123',
      script: 'Test',
      webhook: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

// =============================================
// Export Schemas Tests
// =============================================

describe('ExportFormatSchema', () => {
  it('should validate all formats', () => {
    const formats = ['mp4', 'webm', 'mov', 'gif', 'png-sequence', 'audio-only'];
    formats.forEach((format) => {
      const result = ExportFormatSchema.safeParse(format);
      expect(result.success).toBe(true);
    });
  });
});

describe('ExportOptionsSchema', () => {
  it('should use defaults', () => {
    const result = ExportOptionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('mp4');
      expect(result.data.quality).toBe('high');
      expect(result.data.watermark).toBe(false);
      expect(result.data.includeSubtitles).toBe(false);
    }
  });

  it('should validate custom resolution', () => {
    const result = ExportOptionsSchema.safeParse({
      resolution: { width: 3840, height: 2160 },
    });
    expect(result.success).toBe(true);
  });

  it('should reject resolution below minimum', () => {
    const result = ExportOptionsSchema.safeParse({
      resolution: { width: 100, height: 100 },
    });
    expect(result.success).toBe(false);
  });

  it('should reject resolution above maximum', () => {
    const result = ExportOptionsSchema.safeParse({
      resolution: { width: 8000, height: 5000 },
    });
    expect(result.success).toBe(false);
  });

  it('should validate notification options', () => {
    const result = ExportOptionsSchema.safeParse({
      notification: {
        email: true,
        webhook: 'https://example.com/done',
      },
    });
    expect(result.success).toBe(true);
  });
});

// =============================================
// Pagination & DateRange Tests
// =============================================

describe('PaginationSchema', () => {
  it('should use defaults', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('should reject page below 1', () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit above 100', () => {
    const result = PaginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('should coerce string values', () => {
    const result = PaginationSchema.safeParse({ page: '5', limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.limit).toBe(25);
    }
  });
});

describe('DateRangeSchema', () => {
  it('should accept valid date range', () => {
    const result = DateRangeSchema.safeParse({
      from: '2024-01-01',
      to: '2024-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty range', () => {
    const result = DateRangeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept only from date', () => {
    const result = DateRangeSchema.safeParse({
      from: '2024-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid date range (from > to)', () => {
    const result = DateRangeSchema.safeParse({
      from: '2024-12-31',
      to: '2024-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('anterior');
    }
  });
});

// =============================================
// Utility Functions Tests
// =============================================

describe('validateData', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  });

  it('should return success for valid data', () => {
    const result = validateData(testSchema, { name: 'John', age: 30 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data', () => {
    const result = validateData(testSchema, { name: '', age: -5 });
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeInstanceOf(z.ZodError);
  });

  it('should rethrow non-Zod errors', () => {
    const throwingSchema = z.string().transform(() => {
      throw new Error('Custom error');
    });
    expect(() => validateData(throwingSchema, 'test')).toThrow('Custom error');
  });
});

describe('formatZodErrors', () => {
  it('should format flat errors', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Too short'),
    });
    const result = schema.safeParse({ email: 'bad', password: '123' });
    
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted.email).toBe('Invalid email');
      expect(formatted.password).toBe('Too short');
    }
  });

  it('should format nested errors with path', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1, 'Name required'),
      }),
    });
    const result = schema.safeParse({ user: { name: '' } });
    
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted['user.name']).toBe('Name required');
    }
  });

  it('should handle array index in path', () => {
    const schema = z.object({
      items: z.array(z.string().min(1, 'Item required')),
    });
    const result = schema.safeParse({ items: ['valid', ''] });
    
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted['items.1']).toBe('Item required');
    }
  });
});

describe('getFirstZodError', () => {
  it('should return first error message', () => {
    const schema = z.object({
      a: z.string().min(1, 'A required'),
      b: z.string().min(1, 'B required'),
    });
    const result = schema.safeParse({ a: '', b: '' });
    
    if (!result.success) {
      const message = getFirstZodError(result.error);
      expect(message).toBe('A required');
    }
  });

  it('should return default for empty errors', () => {
    const emptyError = new z.ZodError([]);
    expect(getFirstZodError(emptyError)).toBe('Dados inválidos');
  });
});

describe('createValidationErrorResponse', () => {
  it('should create structured error response', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name required'),
      email: z.string().email('Invalid email'),
    });
    const result = schema.safeParse({ name: '', email: 'bad' });
    
    if (!result.success) {
      const response = createValidationErrorResponse(result.error);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Name required');
      expect(response.details.name).toBe('Name required');
      expect(response.details.email).toBe('Invalid email');
    }
  });
});

// =============================================
// Edge Cases & Integration Tests
// =============================================

describe('Schema Edge Cases', () => {
  describe('UUID validation', () => {
    it('should accept lowercase UUID', () => {
      const result = VideoJobStatusSchema.safeParse({
        jobId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      const result = VideoJobStatusSchema.safeParse({
        jobId: '550E8400-E29B-41D4-A716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Number coercion', () => {
    it('should handle integer numbers', () => {
      const result = VideoJobQuerySchema.safeParse({
        page: 2,
        limit: 20,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('Date coercion', () => {
    it('should accept ISO string', () => {
      const result = AnalyticsQuerySchema.safeParse({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept timestamp', () => {
      const result = VideoJobMetricsSchema.safeParse({
        startDate: 1704067200000,
        endDate: 1735689600000,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Empty string handling', () => {
    it('should reject empty required strings', () => {
      const result = LoginSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty optional strings', () => {
      const result = ProjectCreateSchema.safeParse({
        name: 'Valid',
        description: '',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Schema Type Inference', () => {
  it('should infer correct types', () => {
    // This test ensures TypeScript type inference works correctly
    const validJob = {
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      slideIds: ['550e8400-e29b-41d4-a716-446655440001'],
    };
    
    const result = VideoJobInputSchema.parse(validJob);
    
    // These assertions verify the inferred type structure
    expect(typeof result.projectId).toBe('string');
    expect(typeof result.title).toBe('string');
    expect(Array.isArray(result.slideIds)).toBe(true);
  });
});
