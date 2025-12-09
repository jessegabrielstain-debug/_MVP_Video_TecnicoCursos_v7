// Classe para tratamento de erros do Supabase
import { logger } from '@/lib/logger';

interface SupabaseErrorPayload {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
  stack?: string;
}

const isSupabaseErrorPayload = (value: unknown): value is SupabaseErrorPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.message === 'string' && typeof record.code === 'string';
};

const toSupabaseErrorPayload = (error: unknown): SupabaseErrorPayload => {
  if (error instanceof SupabaseError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack,
    };
  }

  if (isSupabaseErrorPayload(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'unknown',
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Erro desconhecido',
    code: 'unknown',
  };
};

export class SupabaseError extends Error {
  code: string;
  details: string | null;
  hint: string | null;

  constructor(payload: SupabaseErrorPayload) {
    super(payload.message ?? 'Erro desconhecido do Supabase');
    this.name = 'SupabaseError';
    this.code = payload.code ?? 'unknown';
    this.details = payload.details ?? null;
    this.hint = payload.hint ?? null;

    if (payload.stack) {
      this.stack = payload.stack;
    }
  }

  static isSupabaseError(error: unknown): error is SupabaseErrorPayload {
    return isSupabaseErrorPayload(error);
  }
}

const getErrorCode = (error: unknown): string => {
  if (isSupabaseErrorPayload(error) && typeof error.code === 'string') {
    return error.code;
  }

  if (error instanceof SupabaseError) {
    return error.code;
  }

  if (error instanceof Error) {
    return 'unknown';
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };
    return typeof code === 'string' ? code : 'unknown';
  }

  return 'unknown';
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isSupabaseErrorPayload(error) && typeof error.message === 'string') {
    return error.message;
  }

  if (error instanceof SupabaseError || error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
};

// Função para tratar erros do Supabase
export const handleSupabaseError = (error: unknown): SupabaseError => {
  const payload = toSupabaseErrorPayload(error);
  logger.error('Erro do Supabase', new Error(payload.message || 'Unknown error'), { component: 'ErrorHandler', payload });

  if (!payload.code || payload.code === 'unknown') {
    payload.code = getErrorCode(error);
  }

  return new SupabaseError(payload);
};

// Função para tratar erros de autenticação
export const handleAuthError = (error: unknown): string => {
  const errorMap: Record<string, string> = {
    invalid_credentials: 'Email ou senha inválidos',
    user_not_found: 'Usuário não encontrado',
    email_taken: 'Este email já está em uso',
    weak_password: 'A senha é muito fraca',
    expired_token: 'Sua sessão expirou, faça login novamente',
  };

  const code = getErrorCode(error);
  return errorMap[code] ?? getErrorMessage(error, 'Erro de autenticação');
};

// Função para tratar erros de banco de dados
export const handleDatabaseError = (error: unknown): string => {
  const errorMap: Record<string, string> = {
    '23505': 'Registro duplicado',
    '23503': 'Violação de chave estrangeira',
    '42P01': 'Tabela não existe',
    '42703': 'Coluna não existe',
  };

  const code = getErrorCode(error);
  return errorMap[code] ?? getErrorMessage(error, 'Erro de banco de dados');
};

// Função para tratar erros de armazenamento
export const handleStorageError = (error: unknown): string => {
  const errorMap: Record<string, string> = {
    'storage/object-not-found': 'Arquivo não encontrado',
    'storage/unauthorized': 'Não autorizado a acessar este arquivo',
    'storage/quota-exceeded': 'Cota de armazenamento excedida',
    'storage/invalid-format': 'Formato de arquivo inválido',
  };

  const code = getErrorCode(error);
  return errorMap[code] ?? getErrorMessage(error, 'Erro de armazenamento');
};

// Função para logging centralizado
export const logError = (
  context: string,
  error: unknown,
  additionalInfo: Record<string, unknown> = {}
): void => {
  const payload = toSupabaseErrorPayload(error);

  logger.error(`[${context}] Erro`, new Error(payload.message || 'Unknown error'), {
    component: 'ErrorHandler',
    message: payload.message,
    code: payload.code ?? getErrorCode(error),
    details: payload.details,
    hint: payload.hint,
    stack: payload.stack,
    ...additionalInfo,
  });

  // Aqui você pode implementar logging para serviços externos
  // como Sentry, LogRocket, etc.
};