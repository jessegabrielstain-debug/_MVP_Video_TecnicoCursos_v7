/**
 * API Validator - Validação centralizada para API routes
 * 
 * Fornece helpers para validar requests de forma consistente
 * com tratamento de erros e mensagens amigáveis.
 * 
 * @module lib/validation/api-validator
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { Logger } from '@/lib/logger';

const logger = new Logger('APIValidator');

/**
 * Resultado da validação de request
 */
export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: string;
  details?: Record<string, string>;
  response: NextResponse;
}

export type ValidateResult<T> = ValidationResult<T> | ValidationError;

/**
 * Opções de validação
 */
export interface ValidateOptions {
  /** Logar erros de validação */
  logErrors?: boolean;
  /** Status HTTP para erros (default: 400) */
  errorStatus?: number;
  /** Incluir detalhes de erro na resposta */
  includeDetails?: boolean;
}

const defaultOptions: Required<ValidateOptions> = {
  logErrors: true,
  errorStatus: 400,
  includeDetails: true,
};

/**
 * Formata erros Zod em um objeto legível
 */
function formatErrors(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const err of error.errors) {
    const path = err.path.join('.');
    formatted[path || 'root'] = err.message;
  }
  return formatted;
}

/**
 * Obtém a primeira mensagem de erro
 */
function getFirstError(error: ZodError): string {
  return error.errors[0]?.message || 'Dados inválidos';
}

/**
 * Valida o body de uma request JSON
 * 
 * @example
 * ```typescript
 * const result = await validateRequestBody(request, MySchema);
 * if (!result.success) return result.response;
 * const data = result.data; // Tipado como z.infer<typeof MySchema>
 * ```
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  options?: ValidateOptions
): Promise<ValidateResult<T>> {
  const opts = { ...defaultOptions, ...options };
  
  try {
    const body = await request.json();
    const data = schema.parse(body);
    
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = getFirstError(error);
      const details = formatErrors(error);
      
      if (opts.logErrors) {
        logger.warn('Request body validation failed', {
          url: request.url,
          method: request.method,
          errors: details,
        });
      }
      
      const responseBody: Record<string, unknown> = {
        success: false,
        error: errorMessage,
      };
      
      if (opts.includeDetails) {
        responseBody.details = details;
      }
      
      return {
        success: false,
        error: errorMessage,
        details,
        response: NextResponse.json(responseBody, { status: opts.errorStatus }),
      };
    }
    
    // Erro de parse JSON
    if (error instanceof SyntaxError) {
      const errorMessage = 'JSON inválido no corpo da requisição';
      
      if (opts.logErrors) {
        logger.warn('Invalid JSON in request body', {
          url: request.url,
          error: error.message,
        });
      }
      
      return {
        success: false,
        error: errorMessage,
        response: NextResponse.json(
          { success: false, error: errorMessage },
          { status: opts.errorStatus }
        ),
      };
    }
    
    throw error;
  }
}

/**
 * Valida query params de uma request
 * 
 * @example
 * ```typescript
 * const result = validateQueryParams(request, QuerySchema);
 * if (!result.success) return result.response;
 * ```
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  options?: ValidateOptions
): ValidateResult<T> {
  const opts = { ...defaultOptions, ...options };
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[]> = {};
    
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        params[key] = Array.isArray(existing) 
          ? [...existing, value] 
          : [existing, value];
      } else {
        params[key] = value;
      }
    });
    
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = getFirstError(error);
      const details = formatErrors(error);
      
      if (opts.logErrors) {
        logger.warn('Query params validation failed', {
          url: request.url,
          errors: details,
        });
      }
      
      const responseBody: Record<string, unknown> = {
        success: false,
        error: errorMessage,
      };
      
      if (opts.includeDetails) {
        responseBody.details = details;
      }
      
      return {
        success: false,
        error: errorMessage,
        details,
        response: NextResponse.json(responseBody, { status: opts.errorStatus }),
      };
    }
    
    throw error;
  }
}

/**
 * Valida path params (route segments)
 * 
 * @example
 * ```typescript
 * const result = validatePathParams({ id: params.id }, IdSchema);
 * if (!result.success) return result.response;
 * ```
 */
export function validatePathParams<T>(
  params: Record<string, string | string[] | undefined>,
  schema: ZodSchema<T>,
  options?: ValidateOptions
): ValidateResult<T> {
  const opts = { ...defaultOptions, ...options };
  
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = getFirstError(error);
      const details = formatErrors(error);
      
      if (opts.logErrors) {
        logger.warn('Path params validation failed', {
          params,
          errors: details,
        });
      }
      
      return {
        success: false,
        error: errorMessage,
        details,
        response: NextResponse.json(
          { success: false, error: errorMessage },
          { status: opts.errorStatus }
        ),
      };
    }
    
    throw error;
  }
}

/**
 * Valida body e query params juntos
 */
export async function validateRequest<B, Q>(
  request: NextRequest,
  bodySchema: ZodSchema<B>,
  querySchema: ZodSchema<Q>,
  options?: ValidateOptions
): Promise<
  | { success: true; body: B; query: Q }
  | ValidationError
> {
  const queryResult = validateQueryParams(request, querySchema, options);
  if (!queryResult.success) {
    return queryResult;
  }
  
  const bodyResult = await validateRequestBody(request, bodySchema, options);
  if (!bodyResult.success) {
    return bodyResult;
  }
  
  return {
    success: true,
    body: bodyResult.data,
    query: queryResult.data,
  };
}

/**
 * Cria response de erro de validação padrão
 */
export function createValidationError(
  message: string,
  details?: Record<string, string>,
  status = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Sanitiza string para prevenir XSS básico
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Zod refinement para sanitização automática
 */
export const SafeString = z.string().transform(sanitizeString);

/**
 * Zod refinement para URLs seguras (apenas http/https)
 */
export const SafeUrl = z.string().url().refine(
  (url) => url.startsWith('http://') || url.startsWith('https://'),
  'URL deve usar protocolo http ou https'
);
