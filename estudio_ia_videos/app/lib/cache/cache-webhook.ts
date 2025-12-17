/**
 * Webhook handler para invalidação de cache
 * Processa webhooks de eventos externos e invalida cache accordingly
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cacheInvalidationHandlers } from './cache-invalidation';
import { logger } from '../logger';
import { validateRequestBody } from '../validation/api-validator';

/**
 * Schema para webhook de invalidação de cache
 */
export const CacheWebhookSchema = z.object({
  event: z.enum([
    'project.updated',
    'project.deleted',
    'render.completed',
    'render.failed',
    'slides.updated',
    'template.updated',
    'user.updated',
    'system.config.updated'
  ]),
  data: z.object({
    id: z.string(),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    templateId: z.string().optional(),
    jobId: z.string().optional()
  }),
  timestamp: z.string().datetime().optional(),
  source: z.string().optional()
});

export type CacheWebhookPayload = z.infer<typeof CacheWebhookSchema>;

/**
 * Processa webhook de invalidação de cache
 */
export async function processCacheInvalidationWebhook(
  request: NextRequest
): Promise<Response> {
  try {
    // Validar payload
    const result = await validateRequestBody(request, CacheWebhookSchema);
    
    if (!result.success) {
      // Type narrowing: quando success é false, result é ValidationError
      const validationError = result as { success: false; error: string; response: Response };
      return validationError.response;
    }
    
    const payload = result.data;

    logger.info('Processing cache invalidation webhook', {
      component: 'CacheWebhook',
      event: payload.event,
      data: payload.data
    });

    // Processar evento
    await handleCacheInvalidationEvent(payload);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cache invalidation processed' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Failed to process cache invalidation webhook', error, {
      component: 'CacheWebhook'
    });

    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to process webhook' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Manipula evento de invalidação de cache
 */
async function handleCacheInvalidationEvent(payload: CacheWebhookPayload): Promise<void> {
  const { event, data } = payload;

  switch (event) {
    case 'project.updated':
    case 'project.deleted':
      if (data.projectId) {
        cacheInvalidationHandlers.onProjectUpdated(data.projectId);
      }
      break;

    case 'render.completed':
    case 'render.failed':
      if (data.jobId && data.projectId) {
        cacheInvalidationHandlers.onRenderJobCompleted(data.jobId, data.projectId);
      }
      break;

    case 'slides.updated':
      if (data.projectId) {
        cacheInvalidationHandlers.onSlidesUpdated(data.projectId);
      }
      break;

    case 'template.updated':
      if (data.templateId) {
        cacheInvalidationHandlers.onTemplateUpdated(data.templateId);
      }
      break;

    case 'user.updated':
      if (data.userId) {
        cacheInvalidationHandlers.onUserUpdated(data.userId);
      }
      break;

    case 'system.config.updated':
      cacheInvalidationHandlers.onSystemConfigUpdated();
      break;

    default:
      logger.warn('Unknown cache invalidation event', {
        component: 'CacheWebhook',
        event
      });
  }
}

/**
 * Middleware para invalidação automática de cache em mutações
 */
export function withCacheInvalidation(options: {
  events: Array<{
    condition: (request: NextRequest, response: Response) => boolean;
    event: CacheWebhookPayload['event'];
    dataExtractor: (request: NextRequest, response: Response) => CacheWebhookPayload['data'];
  }>;
}) {
  return function(handler: Function) {
    return async function(request: NextRequest, ...args: any[]) {
      const response = await handler(request, ...args);

      // Verifica se deve invalidar cache
      for (const { condition, event, dataExtractor } of options.events) {
        if (condition(request, response)) {
          try {
            const data = dataExtractor(request, response);
            await handleCacheInvalidationEvent({ event, data });
            
            logger.debug('Auto cache invalidation triggered', {
              component: 'CacheMiddleware',
              event,
              data
            });
          } catch (error) {
            logger.error('Failed to auto-invalidate cache', error, {
              component: 'CacheMiddleware',
              event
            });
          }
        }
      }

      return response;
    };
  };
}

/**
 * Helper para extrair dados comuns de requests
 */
export const cacheDataExtractors = {
  /**
   * Extrai projectId da URL ou body
   */
  projectId: (request: NextRequest): string | undefined => {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/projects\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Tenta extrair do searchParams
    return url.searchParams.get('projectId') || undefined;
  },

  /**
   * Extrai userId do contexto de autenticação (assumindo que está no header)
   */
  userId: (request: NextRequest): string | undefined => {
    return request.headers.get('x-user-id') || undefined;
  },

  /**
   * Extrai jobId da URL
   */
  jobId: (request: NextRequest): string | undefined => {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/jobs\/([^\/]+)/);
    return pathMatch ? pathMatch[1] : undefined;
  },

  /**
   * Extrai templateId da URL
   */
  templateId: (request: NextRequest): string | undefined => {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/templates\/([^\/]+)/);
    return pathMatch ? pathMatch[1] : undefined;
  }
};

/**
 * Condições comuns para invalidação
 */
export const cacheInvalidationConditions = {
  /**
   * Invalida em sucesso (2xx responses)
   */
  onSuccess: (request: NextRequest, response: Response): boolean => {
    return response.status >= 200 && response.status < 300;
  },

  /**
   * Invalida em métodos de mutação
   */
  onMutation: (request: NextRequest): boolean => {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  },

  /**
   * Invalida em paths específicos
   */
  onPath: (pattern: RegExp) => (request: NextRequest): boolean => {
    const url = new URL(request.url);
    return pattern.test(url.pathname);
  }
};