/**
 * 🖼️ Image Optimization Utilities
 * Next.js Image component wrappers with automatic optimization
 * Sprint 27 - Performance Enhancement
 */

import { logger } from '@/lib/logger';

/**
 * Supported image formats for optimization
 */
export type OptimizedImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

/**
 * Image quality presets
 */
export const IMAGE_QUALITY_PRESETS = {
  thumbnail: 60,
  preview: 75,
  standard: 80,
  high: 90,
  lossless: 100,
} as const;

export type ImageQualityPreset = keyof typeof IMAGE_QUALITY_PRESETS;

/**
 * Responsive breakpoints for srcset
 */
export const RESPONSIVE_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  quality?: number | ImageQualityPreset;
  format?: OptimizedImageFormat;
  width?: number;
  height?: number;
  blur?: boolean;
  priority?: boolean;
}

/**
 * Optimized image props for Next.js Image component
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  className?: string;
}

/**
 * Get quality value from preset or number
 */
export function getQualityValue(quality: number | ImageQualityPreset): number {
  if (typeof quality === 'number') {
    return Math.max(1, Math.min(100, quality));
  }
  return IMAGE_QUALITY_PRESETS[quality];
}

/**
 * Generate responsive sizes string for Next.js Image
 */
export function generateResponsiveSizes(
  config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default?: string;
  } = {}
): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw',
    default: defaultSize = '100vw',
  } = config;

  return [
    `(max-width: ${RESPONSIVE_BREAKPOINTS.mobile}px) ${mobile}`,
    `(max-width: ${RESPONSIVE_BREAKPOINTS.tablet}px) ${tablet}`,
    `(max-width: ${RESPONSIVE_BREAKPOINTS.desktop}px) ${desktop}`,
    defaultSize,
  ].join(', ');
}

/**
 * Generate blur placeholder data URL
 * Creates a tiny SVG placeholder for blur-up effect
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#e2e8f0'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="blur" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#blur)"/>
    </svg>
  `.trim();

  const base64 = typeof btoa === 'function' 
    ? btoa(svg) 
    : Buffer.from(svg).toString('base64');

  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Build optimized image props for Next.js Image component
 */
export function buildOptimizedImageProps(
  src: string,
  alt: string,
  config: ImageOptimizationConfig = {}
): OptimizedImageProps {
  const {
    quality = 'standard',
    width,
    height,
    blur = true,
    priority = false,
  } = config;

  const props: OptimizedImageProps = {
    src,
    alt,
    quality: getQualityValue(quality),
    priority,
    loading: priority ? 'eager' : 'lazy',
  };

  if (width) props.width = width;
  if (height) props.height = height;

  if (blur && !priority) {
    props.placeholder = 'blur';
    props.blurDataURL = generateBlurPlaceholder(width || 10, height || 10);
  }

  // Generate responsive sizes for non-fixed images
  if (!width || !height) {
    props.sizes = generateResponsiveSizes();
  }

  return props;
}

/**
 * Detect best supported image format
 */
export function detectBestFormat(): OptimizedImageFormat {
  if (typeof window === 'undefined') {
    return 'webp'; // Default for SSR
  }

  // Check AVIF support
  const avifSupport = document
    .createElement('canvas')
    .toDataURL('image/avif')
    .startsWith('data:image/avif');

  if (avifSupport) {
    return 'avif';
  }

  // Check WebP support
  const webpSupport = document
    .createElement('canvas')
    .toDataURL('image/webp')
    .startsWith('data:image/webp');

  if (webpSupport) {
    return 'webp';
  }

  return 'jpeg';
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if exceeds max width
  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  // Scale down if still exceeds max height
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [640, 750, 828, 1080, 1200, 1920]
): string {
  // For Next.js, we let the Image component handle this
  // This is useful for custom image implementations
  return widths
    .map((w) => {
      const url = new URL(baseSrc, 'https://placeholder.com');
      url.searchParams.set('w', String(w));
      return `${url.pathname}${url.search} ${w}w`;
    })
    .join(', ');
}

/**
 * Image loader for external image services
 */
export interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Default image loader for Next.js
 */
export function defaultImageLoader({ src, width, quality }: ImageLoaderParams): string {
  return `${src}?w=${width}&q=${quality || 75}`;
}

/**
 * Cloudinary image loader
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderParams): string {
  const cloudinaryBase = process.env.NEXT_PUBLIC_CLOUDINARY_URL;
  if (!cloudinaryBase) {
    logger.warn('Cloudinary URL not configured, using default loader');
    return defaultImageLoader({ src, width, quality });
  }

  const transforms = [
    `w_${width}`,
    `q_${quality || 'auto'}`,
    'f_auto',
    'c_limit',
  ].join(',');

  return `${cloudinaryBase}/${transforms}/${src}`;
}

/**
 * Supabase Storage image loader
 */
export function supabaseStorageLoader({ src, width, quality }: ImageLoaderParams): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !src.includes(supabaseUrl)) {
    return defaultImageLoader({ src, width, quality });
  }

  // Supabase Storage transformation API
  const url = new URL(src);
  url.searchParams.set('width', String(width));
  url.searchParams.set('quality', String(quality || 75));
  
  return url.toString();
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(imageSrcs: string[]): void {
  if (typeof window === 'undefined') return;

  imageSrcs.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });

  logger.debug(`Preloaded ${imageSrcs.length} critical images`);
}

/**
 * Image optimization stats
 */
export interface ImageOptimizationStats {
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
  format: OptimizedImageFormat;
  dimensions: { width: number; height: number };
}

/**
 * Calculate optimization savings
 */
export function calculateOptimizationSavings(
  originalSize: number,
  optimizedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

/**
 * Export default configuration
 */
export const DEFAULT_IMAGE_CONFIG = {
  quality: IMAGE_QUALITY_PRESETS.standard,
  format: 'webp' as OptimizedImageFormat,
  maxWidth: 1920,
  maxHeight: 1080,
  enableBlur: true,
  enableResponsive: true,
} as const;
