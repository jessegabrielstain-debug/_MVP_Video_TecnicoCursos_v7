
/**
 * 🎯 GRACEFUL DEGRADATION COMPONENTS
 * Componentes que degradam graciosamente quando há falhas
 */

'use client';

import React from 'react';
import { AlertTriangle, Loader2, Image as ImageIcon, Play, Mic, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { errorLogger } from '@/lib/error-handling/error-logger';

interface GracefulProps {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  retryButton?: boolean;
  className?: string;
}

// Hook para degradação graciosamente
function useGracefulDegradation<T>(
  asyncFunction: () => Promise<T>,
  fallbackValue: T,
  dependencies: unknown[] = []
) {
  const [data, setData] = React.useState<T>(fallbackValue);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const executeFunction = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setData(fallbackValue);
      
      errorLogger.logError({
        message: `Graceful degradation triggered: ${error.message}`,
        error,
        context: {
          component: 'useGracefulDegradation',
          retryCount,
          fallbackUsed: true
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, fallbackValue, retryCount]);

  const retry = React.useCallback(() => {
    setRetryCount(count => count + 1);
    executeFunction();
  }, [executeFunction]);

  React.useEffect(() => {
    executeFunction();
  }, dependencies);

  return { data, isLoading, error, retry, retryCount };
}

// Componente para carregar imagens com fallback
interface GracefulImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  showError?: boolean;
  retryOnError?: boolean;
  className?: string;
}

export function GracefulImage({
  src,
  alt = '',
  fallbackSrc = '/placeholder-image.jpg',
  fallbackIcon: FallbackIcon = ImageIcon,
  showError = false,
  retryOnError = true,
  className = '',
  ...props
}: GracefulImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 2;

  const handleError = React.useCallback(() => {
    errorLogger.warn(`Image failed to load: ${currentSrc}`, {
      component: 'GracefulImage',
      src: currentSrc,
      retryCount,
      alt
    });

    if (retryOnError && retryCount < maxRetries) {
      // Tentar novamente após um delay
      setTimeout(() => {
        setRetryCount(count => count + 1);
        setCurrentSrc(`${src}?retry=${retryCount + 1}`);
        setHasError(false);
      }, 1000 * (retryCount + 1));
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      // Usar fallback
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      // Mostrar erro final
      setHasError(true);
    }
    
    setIsLoading(false);
  }, [currentSrc, retryCount, src, fallbackSrc, retryOnError, alt]);

  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Reset quando src mudar
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-md ${className}`}>
        <div className="text-center p-4">
          <FallbackIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          {showError && (
            <p className="text-xs text-muted-foreground">Imagem não disponível</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      />
    </div>
  );
}

// Componente para vídeo com fallback
interface GracefulVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  fallbackMessage?: string;
  showControls?: boolean;
  retryOnError?: boolean;
}

export function GracefulVideo({
  src,
  fallbackMessage = 'Vídeo não disponível',
  showControls = true,
  retryOnError = true,
  className = '',
  ...props
}: GracefulVideoProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback(() => {
    errorLogger.warn(`Video failed to load: ${src}`, {
      component: 'GracefulVideo',
      src,
      retryCount
    });

    if (retryOnError && retryCount < 2) {
      setTimeout(() => {
        setRetryCount(count => count + 1);
        setHasError(false);
        setIsLoading(true);
      }, 2000);
    } else {
      setHasError(true);
    }
  }, [src, retryCount, retryOnError]);

  if (hasError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{fallbackMessage}</p>
            {retryOnError && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => {
                  setHasError(false);
                  setRetryCount(0);
                  setIsLoading(true);
                }}
              >
                Tentar Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <video
        {...props}
        src={src}
        controls={showControls}
        onError={handleError}
        onLoadedData={() => setIsLoading(false)}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      />
    </div>
  );
}

// Componente para carregar dados com fallback
interface GracefulDataLoaderProps<T> {
  loadFunction: () => Promise<T>;
  fallbackData: T;
  render: (data: T, isLoading: boolean, error: Error | null) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  retryButton?: boolean;
  dependencies?: unknown[];
}

export function GracefulDataLoader<T>({
  loadFunction,
  fallbackData,
  render,
  loadingComponent,
  errorComponent,
  retryButton = true,
  dependencies = []
}: GracefulDataLoaderProps<T>) {
  const { data, isLoading, error, retry } = useGracefulDegradation(
    loadFunction,
    fallbackData,
    dependencies
  );

  if (error && errorComponent) {
    return (
      <div>
        {errorComponent}
        {retryButton && (
          <Button onClick={retry} variant="outline" size="sm" className="mt-2">
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }

  if (isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  return <>{render(data, isLoading, error)}</>;
}

// Componente para funcionalidade de TTS com fallback
export function GracefulTTSPlayer({ 
  text, 
  voice = 'default',
  onError,
  className = '' 
}: {
  text: string;
  voice?: string;
  onError?: (error: Error) => void;
  className?: string;
}) {
  const [isSupported, setIsSupported] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Verificar suporte à Web Speech API
    setIsSupported('speechSynthesis' in window);
  }, []);

  const playTTS = React.useCallback(async () => {
    try {
      if (!isSupported) {
        throw new Error('Text-to-Speech não suportado neste navegador');
      }

      setIsPlaying(true);
      setError(null);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (event) => {
        const error = new Error(`TTS Error: ${event.error}`);
        setError(error);
        setIsPlaying(false);
        onError?.(error);
        
        errorLogger.logError({
          message: 'TTS playback failed',
          error,
          context: {
            component: 'GracefulTTSPlayer',
            voice,
            textLength: text.length
          }
        });
      };

      speechSynthesis.speak(utterance);

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsPlaying(false);
      onError?.(error);
    }
  }, [text, voice, isSupported, onError]);

  if (!isSupported || error) {
    return (
      <Alert className={`border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 ${className}`}>
        <Mic className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {!isSupported 
              ? 'Áudio não disponível neste navegador'
              : 'Erro no sistema de áudio'
            }
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Texto: "{text.slice(0, 100)}{text.length > 100 ? '...' : ''}"
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Button 
      onClick={playTTS}
      disabled={isPlaying}
      variant="outline"
      size="sm"
      className={className}
    >
      {isPlaying ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Mic className="h-4 w-4 mr-2" />
      )}
      {isPlaying ? 'Reproduzindo...' : 'Ouvir'}
    </Button>
  );
}

// Componente de configurações com fallback
export function GracefulSettingsPanel({
  children,
  fallbackMessage = "Configurações indisponíveis",
  className = ""
}: {
  children: React.ReactNode;
  fallbackMessage?: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{fallbackMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Skeleton components para loading states
export function GracefulSkeleton({ 
  type = 'text',
  count = 1,
  className = ""
}: {
  type?: 'text' | 'card' | 'image' | 'video' | 'list';
  count?: number;
  className?: string;
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card className={className}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        );
      
      case 'image':
        return <Skeleton className={`aspect-video ${className}`} />;
      
      case 'video':
        return <Skeleton className={`aspect-video ${className}`} />;
      
      case 'list':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
}

export { useGracefulDegradation };
