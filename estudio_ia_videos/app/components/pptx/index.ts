
/**
 * PPTX Components - Export all PPTX UI components
 * 
 * Componente principal de upload: PPTXUploadComponent
 * Outros uploaders foram arquivados em _archive/components-pptx-legacy/
 * 
 * Uso:
 * ```tsx
 * import { PPTXUploadComponent } from '@/components/pptx'
 * // ou
 * import PPTXUploadComponent, { ProcessingResult } from '@/components/pptx/PPTXUploadComponent'
 * ```
 */

// Componente principal de upload
export { default as PPTXUploadComponent } from './PPTXUploadComponent';
export type { ProcessingResult, PPTXUploadComponentProps } from './PPTXUploadComponent';

// Outros componentes PPTX
export * from './pptx-upload-modal';
export * from './slide-timeline';
