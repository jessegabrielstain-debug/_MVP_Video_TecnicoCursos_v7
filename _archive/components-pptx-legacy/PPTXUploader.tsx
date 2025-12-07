'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Eye,
  Download,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { PPTXParser } from '@/lib/pptx/PPTXParser';
import { type ParsedPPTXData } from '@/lib/definitions';

export interface PPTXFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadProgress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  slides?: number;
  processedData?: {
    slideCount: number;
    textContent: string[];
    images: string[];
    duration: number;
    pptxDocument?: ParsedPPTXData;
    timelineData?: any;
  };
  error?: string;
}

interface PPTXUploaderProps {
  projectId: string;
  onUploadComplete?: (file: PPTXFile) => void;
  onProcessingComplete?: (file: PPTXFile) => void;
  maxFileSize?: number; // MB
  allowMultiple?: boolean;
  className?: string;
}

export const PPTXUploader: React.FC<PPTXUploaderProps> = ({
  projectId,
  onUploadComplete,
  onProcessingComplete,
  maxFileSize = 50,
  allowMultiple = false,
  className = ''
}) => {
  const [files, setFiles] = useState<PPTXFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerar ID único para arquivo
  const generateFileId = useCallback(() => {
    return `pptx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validar arquivo PPTX
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Verificar extensão
    const validExtensions = ['.pptx', '.ppt'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return { valid: false, error: 'Apenas arquivos .pptx e .ppt são aceitos' };
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return { valid: false, error: `Arquivo muito grande. Máximo ${maxFileSize}MB` };
    }

    // Verificar tipo MIME
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    if (file.type && !validMimeTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo inválido' };
    }

    return { valid: true };
  }, [maxFileSize]);

  // Upload e processamento do arquivo (REAL)
  const uploadFile = useCallback(async (file: File) => {
    const fileId = generateFileId();
    const fileData: PPTXFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      uploadProgress: 0,
      status: 'uploading'
    };

    setFiles(prev => [...prev, fileData]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);

      // 1. Upload
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/pptx/upload');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, uploadProgress: progress } : f
          ));
        }
      };

      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(JSON.parse(xhr.responseText).error || 'Erro no upload'));
          }
        };
        xhr.onerror = () => reject(new Error('Erro de rede'));
        xhr.send(formData);
      });

      const uploadId = response.upload_id;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', uploadProgress: 100 } : f
      ));

      onUploadComplete?.(fileData);
      toast.success(`Upload concluído: ${file.name}`);

      // 2. Polling for Processing Status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/pptx/upload?project_id=${projectId}&status=completed`);
          const statusData = await statusRes.json();
          
          const completedUpload = statusData.uploads?.find((u: any) => u.id === uploadId);
          
          if (completedUpload) {
            clearInterval(pollInterval);
            
            // 3. Import to Timeline
            const importRes = await fetch('/api/import/pptx-to-timeline-real', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, pptxUploadId: uploadId })
            });
            
            if (!importRes.ok) {
                throw new Error('Erro ao importar para timeline');
            }

            const importData = await importRes.json();

            const processedFile: PPTXFile = {
                ...fileData,
                status: 'completed',
                processedData: {
                    slideCount: completedUpload.slide_count,
                    textContent: [], // TODO: Fetch if needed
                    images: [], // TODO: Fetch if needed
                    duration: importData.timeline.duration,
                    timelineData: importData.timeline
                }
            };

            setFiles(prev => prev.map(f => 
                f.id === fileId ? processedFile : f
            ));

            onProcessingComplete?.(processedFile);
            toast.success(`Processamento concluído: ${completedUpload.slide_count} slides importados`);
          }
          
          // Check for failure
          const failedRes = await fetch(`/api/pptx/upload?project_id=${projectId}&status=failed`);
          const failedData = await failedRes.json();
          const failedUpload = failedData.uploads?.find((u: any) => u.id === uploadId);
          
          if (failedUpload) {
             clearInterval(pollInterval);
             throw new Error(failedUpload.error_message || 'Falha no processamento');
          }

        } catch (err) {
            // Ignore polling errors or handle them
            console.error('Polling error', err);
        }
      }, 2000);

    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
      
      toast.error(`Erro: ${error.message}`);
    }
  }, [generateFileId, projectId, onUploadComplete, onProcessingComplete]);

  // Manipular arquivos selecionados
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    
    if (!allowMultiple && fileArray.length > 1) {
      toast.error('Apenas um arquivo é permitido');
      return;
    }

    for (const file of fileArray) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      uploadFile(file);
    }
  }, [allowMultiple, validateFile, uploadFile]);

  // Event handlers para drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remover arquivo
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Componente de status do arquivo
  const FileStatus: React.FC<{ file: PPTXFile }> = ({ file }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <CardTitle className="text-sm">{file.name}</CardTitle>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {file.status === 'uploading' && (
              <Badge className="bg-blue-100 text-blue-800">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Upload
              </Badge>
            )}
            {file.status === 'processing' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Processando
              </Badge>
            )}
            {file.status === 'completed' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Concluído
              </Badge>
            )}
            {file.status === 'error' && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Erro
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeFile(file.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="space-y-2">
            <Progress value={file.uploadProgress} className="h-2" />
            <p className="text-xs text-gray-600">
              {file.status === 'uploading' 
                ? `Enviando... ${file.uploadProgress}%`
                : 'Processando PPTX...'
              }
            </p>
          </div>
        )}
        
        {/* Processed Data */}
        {file.status === 'completed' && file.processedData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Slides:</span>
                <span className="ml-2 font-medium">{file.processedData.slideCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Duração:</span>
                <span className="ml-2 font-medium">
                  {Math.floor(file.processedData.duration / 60)}:{(file.processedData.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" variant="outline">
                <PlayCircle className="w-4 h-4 mr-2" />
                Timeline
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {file.status === 'error' && file.error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {file.error}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload de Apresentação PPTX
        </h3>
        <p className="text-gray-600 mb-4">
          Arraste e solte seu arquivo PPTX aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Máximo {maxFileSize}MB • Formatos: .pptx, .ppt
        </p>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          Selecionar Arquivo
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.ppt"
          multiple={allowMultiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
      
      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">
            Arquivos ({files.length})
          </h4>
          
          <div className="space-y-3">
            {files.map(file => (
              <FileStatus key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
      
      {/* Stats */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {files.filter(f => f.status === 'completed').length}
                </div>
                <div className="text-gray-600">Processados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {files.filter(f => f.status === 'processing' || f.status === 'uploading').length}
                </div>
                <div className="text-gray-600">Em Progresso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {files.filter(f => f.status === 'error').length}
                </div>
                <div className="text-gray-600">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {files.reduce((sum, f) => sum + (f.processedData?.slideCount || 0), 0)}
                </div>
                <div className="text-gray-600">Total Slides</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};