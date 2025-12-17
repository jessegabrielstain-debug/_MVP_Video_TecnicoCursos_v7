'use client'

/**
 * Toast Helpers - Funções utilitárias para feedback visual
 * 
 * Uso:
 * import { showToast } from '@/lib/toast-helpers'
 * 
 * showToast.success('Operação realizada com sucesso!')
 * showToast.error('Erro ao processar', 'Tente novamente mais tarde')
 * showToast.warning('Atenção', 'Você tem alterações não salvas')
 * showToast.info('Dica', 'Use Ctrl+S para salvar')
 * showToast.loading('Processando...') // Retorna ID para dismiss
 * showToast.promise(asyncFn, { loading, success, error })
 */

import { toast } from '@/hooks/use-toast'

interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Durações padrão por tipo
const DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  loading: Infinity,
} as const

/**
 * Toast de sucesso
 */
function success(title: string, description?: string, options?: ToastOptions) {
  return toast({
    title: `✓ ${title}`,
    description,
    variant: 'default',
    duration: options?.duration ?? DURATIONS.success,
  })
}

/**
 * Toast de erro
 */
function error(title: string, description?: string, options?: ToastOptions) {
  return toast({
    title: `✕ ${title}`,
    description,
    variant: 'destructive',
    duration: options?.duration ?? DURATIONS.error,
  })
}

/**
 * Toast de aviso
 */
function warning(title: string, description?: string, options?: ToastOptions) {
  return toast({
    title: `⚠ ${title}`,
    description,
    variant: 'default',
    duration: options?.duration ?? DURATIONS.warning,
  })
}

/**
 * Toast informativo
 */
function info(title: string, description?: string, options?: ToastOptions) {
  return toast({
    title: `ℹ ${title}`,
    description,
    variant: 'default',
    duration: options?.duration ?? DURATIONS.info,
  })
}

/**
 * Toast de loading (não fecha automaticamente)
 * Retorna objeto com dismiss() para fechar manualmente
 */
function loading(title: string, description?: string) {
  return toast({
    title: `⏳ ${title}`,
    description,
    variant: 'default',
    duration: DURATIONS.loading,
  })
}

/**
 * Toast com promise - mostra loading, sucesso ou erro automaticamente
 */
async function promise<T>(
  promiseFn: Promise<T> | (() => Promise<T>),
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  },
  options?: ToastOptions
): Promise<T> {
  const loadingToast = loading(messages.loading)
  
  try {
    const result = await (typeof promiseFn === 'function' ? promiseFn() : promiseFn)
    loadingToast.dismiss()
    
    const successMessage = typeof messages.success === 'function' 
      ? messages.success(result) 
      : messages.success
    success(successMessage, undefined, options)
    
    return result
  } catch (err) {
    loadingToast.dismiss()
    
    const errorMessage = typeof messages.error === 'function'
      ? messages.error(err as Error)
      : messages.error
    error(errorMessage, (err as Error)?.message, options)
    
    throw err
  }
}

/**
 * Toast de ação (com botão)
 */
function action(
  title: string,
  description: string,
  actionLabel: string,
  onAction: () => void,
  options?: ToastOptions
) {
  return toast({
    title,
    description,
    variant: 'default',
    duration: options?.duration ?? 10000, // Mais tempo para ações
    action: (
      <button
        onClick={onAction}
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-transparent px-3 text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {actionLabel}
      </button>
    ) as React.ReactElement,
  })
}

/**
 * Dismiss todos os toasts
 */
function dismissAll() {
  // O toast original não exporta dismiss global, então usamos um workaround
  // Isso é um placeholder - em produção, você pode implementar um global dismiss
  // Nota: O sonner não tem dismiss global exposto, este é um no-op intencional
}

// Export como objeto para facilitar uso
export const showToast = {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  action,
  dismissAll,
  // Alias para compatibilidade
  show: info,
}

// Export individual das funções
export {
  success as toastSuccess,
  error as toastError,
  warning as toastWarning,
  info as toastInfo,
  loading as toastLoading,
  promise as toastPromise,
  action as toastAction,
}

/**
 * Mensagens de erro comuns normalizadas
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Dados inválidos. Verifique os campos.',
  SERVER: 'Erro no servidor. Tente novamente mais tarde.',
  UNKNOWN: 'Ocorreu um erro inesperado.',
} as const

/**
 * Normaliza erros de API para mensagens amigáveis
 */
export function normalizeApiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return ERROR_MESSAGES.UNAUTHORIZED
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return ERROR_MESSAGES.FORBIDDEN
    }
    if (message.includes('404') || message.includes('not found')) {
      return ERROR_MESSAGES.NOT_FOUND
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION
    }
    if (message.includes('500') || message.includes('server')) {
      return ERROR_MESSAGES.SERVER
    }
    
    // Se a mensagem é curta e legível, use-a
    if (error.message.length < 100 && !message.includes('error')) {
      return error.message
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN
}

/**
 * Helper para mostrar erro de API com normalização
 */
export function showApiError(error: unknown, fallbackTitle = 'Erro') {
  const message = normalizeApiError(error)
  return showToast.error(fallbackTitle, message)
}
