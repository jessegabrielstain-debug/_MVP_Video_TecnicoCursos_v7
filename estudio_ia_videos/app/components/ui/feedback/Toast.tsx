/**
 * Toast Component
 * Sistema de notificações toast para feedback do usuário
 */

'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends Toast {
  onDismiss: (id: string) => void;
}

function ToastItem({ id, type, title, message, duration = 5000, action, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  const typeConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      className: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/10 dark:border-green-900/20 dark:text-green-400',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      className: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-900/20 dark:text-yellow-400',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      className: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/10 dark:border-blue-900/20 dark:text-blue-400',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all',
        config.className,
        isExiting ? 'animate-out slide-out-to-right' : 'animate-in slide-in-from-right'
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>

        <div className="flex-1 space-y-1">
          {title && (
            <h3 className="font-semibold text-sm">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>

          {action && (
            <button
              onClick={() => {
                action.onClick();
                handleDismiss();
              }}
              className="text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast Container
 */
export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

/**
 * Toast Hook
 */
let toastId = 0;
const toastListeners: Set<(toasts: Toast[]) => void> = new Set();
let toastsState: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toastsState]));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.add(setToasts);
    return () => {
      toastListeners.delete(setToasts);
    };
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`;
    const newToast = { ...toast, id };
    toastsState = [...toastsState, newToast];
    notifyListeners();
    return id;
  };

  const dismissToast = (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    notifyListeners();
  };

  const dismissAll = () => {
    toastsState = [];
    notifyListeners();
  };

  return {
    toasts,
    toast: {
      success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
        addToast({ type: 'success', message, ...options }),
      error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
        addToast({ type: 'error', message, ...options }),
      info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
        addToast({ type: 'info', message, ...options }),
      warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
        addToast({ type: 'warning', message, ...options }),
    },
    dismissToast,
    dismissAll,
  };
}

/**
 * Global toast functions para uso fora de componentes
 */
export const toast = {
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    const id = `toast-${++toastId}`;
    const newToast = { type: 'success' as ToastType, message, id, ...options };
    toastsState = [...toastsState, newToast];
    notifyListeners();
    return id;
  },
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    const id = `toast-${++toastId}`;
    const newToast = { type: 'error' as ToastType, message, id, ...options };
    toastsState = [...toastsState, newToast];
    notifyListeners();
    return id;
  },
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    const id = `toast-${++toastId}`;
    const newToast = { type: 'info' as ToastType, message, id, ...options };
    toastsState = [...toastsState, newToast];
    notifyListeners();
    return id;
  },
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
    const id = `toast-${++toastId}`;
    const newToast = { type: 'warning' as ToastType, message, id, ...options };
    toastsState = [...toastsState, newToast];
    notifyListeners();
    return id;
  },
};
