/**
 * PPTX Types - Tipos centralizados para upload, processamento e edição de PPTX
 * 
 * @module lib/types/pptx
 */

// Re-export tipos unificados relevantes
export type {
  Slide,
  Project,
  UnifiedSlide,
  UnifiedElement,
  UnifiedParseResult,
  UnifiedTimeline,
  UnifiedTimelineScene
} from '../types-unified-v2';

/**
 * Status de um job de upload/processamento
 */
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

/**
 * Resultado do processamento de um arquivo PPTX
 */
export interface PPTXProcessingResult {
  /** ID do projeto criado no banco */
  projectId?: string;
  /** Número de slides extraídos */
  slidesCount?: number;
  /** Duração estimada em segundos */
  estimatedDuration?: number;
  /** Dados brutos retornados pela API */
  rawData?: Record<string, unknown>;
}

/**
 * Arquivo PPTX selecionado para upload
 */
export interface PPTXFile {
  /** Objeto File do browser */
  file: File;
  /** Nome do arquivo */
  name: string;
  /** Tamanho em bytes */
  size: number;
  /** Tipo MIME */
  type: string;
}

/**
 * Estado do componente de upload
 */
export interface PPTXUploadState {
  /** Status atual do upload */
  status: UploadStatus;
  /** Progresso de 0 a 100 */
  progress: number;
  /** Arquivo selecionado */
  file: PPTXFile | null;
  /** Mensagem de erro se houver */
  error: string | null;
  /** Resultado do processamento */
  result: PPTXProcessingResult | null;
}

/**
 * Informações do projeto após upload
 */
export interface PPTXProjectInfo {
  /** ID do projeto */
  id: string;
  /** Nome do projeto */
  name: string;
  /** Número total de slides */
  totalSlides: number;
  /** Status do projeto */
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  /** URL do arquivo original no storage */
  pptxUrl?: string;
  /** Data de criação */
  createdAt: string;
}

/**
 * Dados de um slide individual
 */
export interface PPTXSlideData {
  /** ID único do slide */
  id: string;
  /** Índice/ordem do slide */
  index: number;
  /** Título do slide */
  title?: string;
  /** Conteúdo textual */
  content: string[];
  /** URLs das imagens */
  images: string[];
  /** Notas do apresentador */
  notes?: string;
  /** Duração em segundos */
  duration: number;
}

/**
 * Resposta da API de upload
 */
export interface PPTXUploadResponse {
  success: boolean;
  projectId?: string;
  slidesCount?: number;
  estimatedDuration?: number;
  error?: string;
  message?: string;
}

/**
 * Dados completos de um projeto PPTX
 */
export interface PPTXProjectData {
  /** Informações do projeto */
  project: PPTXProjectInfo;
  /** Slides do projeto */
  slides: PPTXSlideData[];
  /** Timeline de renderização */
  timeline?: {
    totalDuration: number;
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
  };
  /** Assets extraídos */
  assets?: {
    images: string[];
    fonts: string[];
    media: string[];
  };
}

/**
 * Opções de upload
 */
export interface PPTXUploadOptions {
  /** Tamanho máximo em MB */
  maxFileSizeMB?: number;
  /** Se deve redirecionar após upload */
  autoRedirect?: boolean;
  /** URL da API de upload */
  uploadEndpoint?: string;
}

/**
 * Callbacks do uploader
 */
export interface PPTXUploadCallbacks {
  /** Chamado quando o upload inicia */
  onUploadStart?: (file: PPTXFile) => void;
  /** Chamado durante o progresso */
  onProgress?: (progress: number) => void;
  /** Chamado quando completa com sucesso */
  onSuccess?: (result: PPTXProcessingResult) => void;
  /** Chamado quando ocorre erro */
  onError?: (error: Error) => void;
  /** Chamado quando cancela */
  onCancel?: () => void;
}
