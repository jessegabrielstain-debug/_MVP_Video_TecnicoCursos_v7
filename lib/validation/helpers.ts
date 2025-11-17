/**
 * Helpers para validação e parsing usando Zod
 * Centraliza lógica de error handling e formatação de mensagens
 */

import { z, ZodError } from 'zod';
import { NextResponse } from 'next/server';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    issues?: z.ZodIssue[];
  };
}

/**
 * Parse e valida dados com Zod schema
 * @param schema Schema Zod para validação
 * @param data Dados a serem validados
 * @returns Resultado com success flag e data ou error
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          issues: err.errors,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erro de validação desconhecido',
      },
    };
  }
}

/**
 * Safe parse que retorna ValidationResult ao invés de throw
 * @param schema Schema Zod
 * @param data Dados a validar
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos',
      issues: result.error.errors,
    },
  };
}

/**
 * Cria resposta HTTP padronizada para erro de validação
 * @param issues Issues do Zod ou mensagem customizada
 * @param status HTTP status (default 400)
 */
export function validationErrorResponse(
  issues: z.ZodIssue[] | string,
  status = 400
): NextResponse {
  const details = typeof issues === 'string' 
    ? { message: issues }
    : { issues };
    
  return NextResponse.json(
    {
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido',
      details,
    },
    { status }
  );
}

/**
 * Parse query params de URL com Zod schema
 * Converte URLSearchParams para objeto e valida
 * @param url URL da requisição
 * @param schema Schema Zod para query params
 */
export function parseQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return safeValidate(schema, params);
}

/**
 * Parse body JSON com validação automática
 * @param req Request object
 * @param schema Schema Zod
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const json = await req.json();
    return safeValidate(schema, json);
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Body não é JSON válido',
      },
    };
  }
}

/**
 * Extrai primeiro erro de forma legível
 * @param issues Lista de issues do Zod
 */
export function getFirstErrorMessage(issues: z.ZodIssue[]): string {
  if (!issues.length) return 'Erro de validação';
  const first = issues[0];
  return `${first.path.join('.')}: ${first.message}`;
}

/**
 * Formata todos erros em lista
 * @param issues Lista de issues do Zod
 */
export function formatValidationErrors(issues: z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}

/**
 * Middleware helper para validar path params (ex: [id])
 * @param params Params object do Next.js
 * @param schema Schema Zod
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  return safeValidate(schema, params);
}
