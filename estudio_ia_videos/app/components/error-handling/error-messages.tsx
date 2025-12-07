
/**
 * 💬 COMPONENTES DE MENSAGENS DE ERRO AMIGÁVEIS
 * Componentes reutilizáveis para exibir erros de forma amigável ao usuário
 */

'use client';

import React from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Clock, 
  Server, 
  Shield, 
  RefreshCw, 
  Info,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ApiError } from '@/lib/error-handling/api-error-handler';

// Enum para tipos de erro
export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  AUTH = 'auth',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

// Helper functions to replace ApiErrorUtils
const ApiErrorUtils = {
  isNetworkError: (error: ApiError) => error.statusCode === 0,
  isTimeoutError: (error: ApiError) => error.statusCode === 408,
  isAuthError: (error: ApiError) => error.statusCode === 401 || error.statusCode === 403,
  isServerError: (error: ApiError) => error.statusCode >= 500,
  getUserFriendlyMessage: (error: ApiError) => error.message,
};

interface ErrorDisplayProps {
  error?: ApiError | Error;
  type?: ErrorType;
  title?: string;
  message?: string;
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// Componente principal para exibir erros
export function ErrorDisplay({
  error,
  type,
  title,
  message,
  showRetry = true,
  showDetails = false,
  onRetry,
  onDismiss,
  className = '',
}: ErrorDisplayProps) {
  const errorInfo = React.useMemo(() => {
    if (error && 'status' in error) {
      // ApiError
      const apiError = error as ApiError;
      return {
        type: getErrorTypeFromApiError(apiError),
        title: title || getErrorTitle(getErrorTypeFromApiError(apiError)),
        message: message || ApiErrorUtils.getUserFriendlyMessage(apiError),
        icon: getErrorIcon(getErrorTypeFromApiError(apiError)),
        color: getErrorColor(getErrorTypeFromApiError(apiError)),
        canRetry: showRetry,
      };
    } else if (error) {
      // Error genérico
      return {
        type: type || ErrorType.UNKNOWN,
        title: title || 'Erro Inesperado',
        message: message || error.message || 'Algo deu errado',
        icon: getErrorIcon(type || ErrorType.UNKNOWN),
        color: getErrorColor(type || ErrorType.UNKNOWN),
        canRetry: showRetry,
      };
    } else if (type) {
      // Erro tipado sem objeto Error
      return {
        type,
        title: title || getErrorTitle(type),
        message: message || getErrorMessage(type),
        icon: getErrorIcon(type),
        color: getErrorColor(type),
        canRetry: showRetry,
      };
    } else {
      // Fallback
      return {
        type: ErrorType.UNKNOWN,
        title: title || 'Erro',
        message: message || 'Algo deu errado',
        icon: AlertTriangle,
        color: 'red',
        canRetry: showRetry,
      };
    }
  }, [error, type, title, message, showRetry]);

  const IconComponent = errorInfo.icon;

  return (
    <Alert className={`border-${errorInfo.color}-200 bg-${errorInfo.color}-50 dark:border-${errorInfo.color}-800 dark:bg-${errorInfo.color}-950 ${className}`}>
      <IconComponent className={`h-4 w-4 text-${errorInfo.color}-600 dark:text-${errorInfo.color}-400`} />
      <div className="flex-1">
        <AlertDescription>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium text-${errorInfo.color}-800 dark:text-${errorInfo.color}-200 mb-1`}>
                {errorInfo.title}
              </h4>
              <p className={`text-sm text-${errorInfo.color}-700 dark:text-${errorInfo.color}-300 mb-3`}>
                {errorInfo.message}
              </p>
              
              {showDetails && error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground mb-2">
                    Detalhes técnicos
                  </summary>
                  <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                    {error.stack || error.message}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex space-x-2 ml-4">
              {errorInfo.canRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar Novamente
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Dispensar
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}

// Componente para erro de rede/conexão
export function NetworkErrorDisplay({ 
  onRetry, 
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
}: {
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}) {
  const progress = maxRetries > 0 ? (retryCount / maxRetries) * 100 : 0;

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          {isRetrying ? (
            <RefreshCw className="h-5 w-5 text-orange-600 animate-spin" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-600" />
          )}
          <div>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              {isRetrying ? 'Reconectando...' : 'Sem Conexão'}
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {isRetrying 
                ? 'Tentando restabelecer a conexão' 
                : 'Verifique sua conexão com a internet'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isRetrying && maxRetries > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-orange-700 dark:text-orange-300 mb-1">
              <span>Tentativa {retryCount} de {maxRetries}</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
        
        {!isRetrying && onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Reconectar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para erro de timeout
export function TimeoutErrorDisplay({ 
  onRetry, 
  estimatedTime,
}: {
  onRetry?: () => void;
  estimatedTime?: number; // em segundos
}) {
  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription>
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
          Operação Demorou Muito
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
          A operação está demorando mais que o esperado. 
          {estimatedTime && ` Tempo estimado: ${estimatedTime}s`}
        </p>
        
        <div className="flex space-x-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar Novamente
            </Button>
          )}
          <Button variant="ghost" size="sm">
            Aguardar Mais
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Componente para erro de servidor
export function ServerErrorDisplay({ onRetry, errorId }: {
  onRetry?: () => void;
  errorId?: string;
}) {
  return (
    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <Server className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription>
        <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
          Erro do Servidor
        </h4>
        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
          Ocorreu um problema em nossos servidores. Nossa equipe foi notificada automaticamente.
        </p>
        
        {errorId && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            ID do Erro: <code className="bg-black/10 dark:bg-white/10 px-1 rounded">{errorId}</code>
          </p>
        )}
        
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar Novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Componente para erro de autenticação
export function AuthErrorDisplay({ 
  onLogin, 
  message = "Sua sessão expirou. Faça login novamente." 
}: {
  onLogin?: () => void;
  message?: string;
}) {
  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
          Autenticação Necessária
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
          {message}
        </p>
        
        {onLogin && (
          <Button onClick={onLogin} variant="default" size="sm">
            Fazer Login
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Componente de sucesso para contraste
export function SuccessDisplay({ 
  title = "Sucesso!", 
  message, 
  onDismiss,
  className = "",
}: {
  title?: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <Alert className={`border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 ${className}`}>
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
              {title}
            </h4>
            {message && (
              <p className="text-sm text-green-700 dark:text-green-300">
                {message}
              </p>
            )}
          </div>
          
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-xs ml-4"
            >
              ×
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Utilidades auxiliares
function getErrorTypeFromApiError(error: ApiError): ErrorType {
  if (ApiErrorUtils.isNetworkError(error)) return ErrorType.NETWORK;
  if (ApiErrorUtils.isTimeoutError(error)) return ErrorType.TIMEOUT;
  if (ApiErrorUtils.isAuthError(error)) return ErrorType.AUTH;
  if (ApiErrorUtils.isServerError(error)) return ErrorType.SERVER;
  if (error.statusCode === 404) return ErrorType.NOT_FOUND;
  if (error.statusCode === 429) return ErrorType.RATE_LIMIT;
  return ErrorType.UNKNOWN;
}

function getErrorTitle(type: ErrorType): string {
  const titles = {
    [ErrorType.NETWORK]: 'Erro de Conexão',
    [ErrorType.TIMEOUT]: 'Tempo Limite Excedido',
    [ErrorType.SERVER]: 'Erro do Servidor',
    [ErrorType.AUTH]: 'Erro de Autenticação',
    [ErrorType.VALIDATION]: 'Dados Inválidos',
    [ErrorType.NOT_FOUND]: 'Não Encontrado',
    [ErrorType.RATE_LIMIT]: 'Muitas Tentativas',
    [ErrorType.UNKNOWN]: 'Erro Inesperado',
  };
  
  return titles[type];
}

function getErrorMessage(type: ErrorType): string {
  const messages = {
    [ErrorType.NETWORK]: 'Verifique sua conexão com a internet e tente novamente.',
    [ErrorType.TIMEOUT]: 'A operação demorou muito para responder.',
    [ErrorType.SERVER]: 'Problema em nossos servidores. Tente novamente em instantes.',
    [ErrorType.AUTH]: 'Você precisa fazer login para continuar.',
    [ErrorType.VALIDATION]: 'Verifique os dados informados.',
    [ErrorType.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
    [ErrorType.RATE_LIMIT]: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
    [ErrorType.UNKNOWN]: 'Algo deu errado. Tente novamente.',
  };
  
  return messages[type];
}

function getErrorIcon(type: ErrorType) {
  const icons = {
    [ErrorType.NETWORK]: WifiOff,
    [ErrorType.TIMEOUT]: Clock,
    [ErrorType.SERVER]: Server,
    [ErrorType.AUTH]: Shield,
    [ErrorType.VALIDATION]: AlertCircle,
    [ErrorType.NOT_FOUND]: Info,
    [ErrorType.RATE_LIMIT]: Clock,
    [ErrorType.UNKNOWN]: AlertTriangle,
  };
  
  return icons[type];
}

function getErrorColor(type: ErrorType): string {
  const colors = {
    [ErrorType.NETWORK]: 'orange',
    [ErrorType.TIMEOUT]: 'yellow',
    [ErrorType.SERVER]: 'red',
    [ErrorType.AUTH]: 'blue',
    [ErrorType.VALIDATION]: 'purple',
    [ErrorType.NOT_FOUND]: 'gray',
    [ErrorType.RATE_LIMIT]: 'yellow',
    [ErrorType.UNKNOWN]: 'red',
  };
  
  return colors[type];
}
