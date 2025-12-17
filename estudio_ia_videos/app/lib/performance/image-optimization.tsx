/**
 * Image Optimization Utilities
 * Otimização de imagens com Next.js Image e compressão automática
 */

import Image from 'next/image';
import React, { ComponentType } from 'react';
import { logger } from '../logger';

/**
 * Configurações de otimização de imagem
 */
export interface ImageOptimizationConfig {
  /** Qualidade da imagem (1-100) */
  quality: number;
  /** Formatos suportados em ordem de preferência */
  formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
  /** Sizes responsivos padrão */
  defaultSizes: string;
  /** Placeholder tipo */
  placeholder: 'blur' | 'empty';
  /** Lazy loading */
  loading: 'lazy' | 'eager';
  /** Priority loading para imagens above-fold */
  priority: boolean;
}

/**
 * Props do componente OptimizedImage
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: string;
}

/**
 * Configuração padrão de otimização
 */
export const DEFAULT_IMAGE_CONFIG: ImageOptimizationConfig = {
  quality: 85,
  formats: ['webp', 'avif', 'jpeg'],
  defaultSizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder: 'blur',
  loading: 'lazy',
  priority: false
};

/**
 * Gera placeholder blur automático
 */
export const generateBlurPlaceholder = (width: number = 10, height: number = 10): string => {
  const canvas = typeof window !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    // Server-side fallback
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/hSIb6ZXbmRZIzIqw0jQSOMEEEEEE0m0ZdR5kqsY9L9GCJK0m4mMOa+g3WE9hLd6ZDd2D9eDrNQZLGj7hbgR/X2H5+y6xSSChwyX0XeE9YS8E0vD7tSUd6mJv1Gi4xLhNYIuU2Xa7EE6VZmKqm8L3DPqZU9UpU9eGg4bk+h0V4wHhVZIzIqgPOUJpJCUzQmPNfWauEFKXTQe9QIGaUkBjKJO4KeYZo/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwv/xAAjEAACAQMDBwAAAAAAAAAAAAABAgMAERIEEyJxkaGxwdHh/9oACAEBAAE/AH9yyUfRQ1myyBxrHMDLHe6PYFUqKEHnQKKKKKBRWXc6O4V9VL7aTdH9xRRGlXDZLY/yGZbqq3Zr+L3TGWS2fRRQhSsWKEEHnKHlYcV3HfT36LG6gxRRRRRQAGjUVxRcH/GHwj6KHVA6NzRQGPFcVxRRRRSEiVcVxX6g1EUGxKhkTDYERhRaEggJvLnOOYGFSofRSo4YKKKPMKpBJ7hNnzGUqKE1xRRVYgkkd7Nf/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwn/xAAcEAADAQEBAQEBAAAAAAAAAAAAARICEQMSBBP/2gAIAQMQAT8AIVXcWfMqlW0o9cOjKKSnMM7e1rKKcxxm11fHBZ9NmJ4p4q4c2cPlp5csT7M+j9lJOFOa47OeF1p5nBn4MKKdLOGzmuI6r48HhKJJvM/m//EABkRAAEFAAAAAAAAAAAAAAAAAAEAAgMRUf/aAAgBAwEBPwB7J8RJrV9CL4m6f//EABkRAQEBAQEBAAAAAAAAAAAAAAABAhEDMf/aAAgBBAEBPwC2JJ7VQhrrKFa0J7Jky6tGM1YcJxdLWvY3//Z';
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

/**
 * Detecção de suporte a formatos modernos
 */
export const detectImageFormats = (): Promise<{
  supportsWebP: boolean;
  supportsAVIF: boolean;
}> => {
  return new Promise((resolve) => {
    const webpTest = new Image();
    const avifTest = new Image();
    
    let webpSupported = false;
    let avifSupported = false;
    let testsCompleted = 0;
    
    const checkCompletion = () => {
      testsCompleted++;
      if (testsCompleted === 2) {
        resolve({
          supportsWebP: webpSupported,
          supportsAVIF: avifSupported
        });
      }
    };
    
    // Test WebP
    webpTest.onload = () => {
      webpSupported = true;
      checkCompletion();
    };
    webpTest.onerror = () => checkCompletion();
    webpTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    
    // Test AVIF
    avifTest.onload = () => {
      avifSupported = true;
      checkCompletion();
    };
    avifTest.onerror = () => checkCompletion();
    avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * Componente de imagem otimizada
 */
export const OptimizedImage: ComponentType<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = DEFAULT_IMAGE_CONFIG.defaultSizes,
  quality = DEFAULT_IMAGE_CONFIG.quality,
  priority = DEFAULT_IMAGE_CONFIG.priority,
  loading = DEFAULT_IMAGE_CONFIG.loading,
  placeholder = DEFAULT_IMAGE_CONFIG.placeholder,
  blurDataURL,
  onLoad,
  onError,
  fallback,
  ...props
}) => {
  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    }
    
    logger.debug('Image loaded successfully', {
      component: 'OptimizedImage',
      src,
      width,
      height
    });
  };

  const handleError = (error: any) => {
    const imageError = new Error(`Failed to load image: ${src}`);
    
    logger.warn('Image failed to load', {
      component: 'OptimizedImage',
      src,
      error: imageError.message
    });

    if (onError) {
      onError(imageError);
    }
  };

  // Gera blur placeholder se não fornecido
  const finalBlurDataURL = blurDataURL || (
    placeholder === 'blur' && width && height 
      ? generateBlurPlaceholder(Math.min(width, 20), Math.min(height, 20))
      : undefined
  );

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={loading}
      placeholder={placeholder}
      blurDataURL={finalBlurDataURL}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

/**
 * Componente de avatar otimizado
 */
export const OptimizedAvatar: ComponentType<{
  src: string;
  alt: string;
  size: number;
  className?: string;
}> = ({ src, alt, size, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      sizes={`${size}px`}
      quality={90} // Maior qualidade para avatares
      priority={size >= 64} // Priority para avatares grandes
      placeholder="blur"
    />
  );
};

/**
 * Componente de thumbnail otimizado
 */
export const OptimizedThumbnail: ComponentType<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}> = ({ src, alt, width, height, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      sizes="(max-width: 640px) 50vw, 25vw"
      quality={75} // Menor qualidade para thumbnails
      placeholder="blur"
    />
  );
};

/**
 * Componente de hero image otimizado
 */
export const OptimizedHeroImage: ComponentType<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      sizes="100vw"
      quality={95} // Alta qualidade para hero images
      priority={true} // Always priority para hero images
      placeholder="blur"
    />
  );
};

/**
 * Hook para detecção de formato de imagem suportado
 */
export const useImageFormatSupport = () => {
  const [formats, setFormats] = React.useState<{
    supportsWebP: boolean;
    supportsAVIF: boolean;
  } | null>(null);

  React.useEffect(() => {
    detectImageFormats().then(setFormats);
  }, []);

  return formats;
};

/**
 * Utilitário para gerar srcSet responsivo
 */
export const generateSrcSet = (
  baseSrc: string,
  widths: number[],
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): string => {
  return widths
    .map(width => {
      const url = new URL(baseSrc, window.location.origin);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', '75');
      url.searchParams.set('fm', format);
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
};

/**
 * Middleware para otimização de imagens via API
 */
export const imageOptimizationMiddleware = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
) => {
  const url = new URL(originalUrl, window.location.origin);
  
  if (options.width) url.searchParams.set('w', options.width.toString());
  if (options.height) url.searchParams.set('h', options.height.toString());
  if (options.quality) url.searchParams.set('q', options.quality.toString());
  if (options.format) url.searchParams.set('fm', options.format);
  
  return url.toString();
};