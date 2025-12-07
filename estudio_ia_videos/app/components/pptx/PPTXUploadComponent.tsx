'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FILE_SIZE_MB = 50;

interface ProcessingResult {
  projectId?: string;
  slidesCount?: number;
  estimatedDuration?: number;
}

export default function PPTXUploadComponent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  const fileSizeInMb = useMemo(() => {
    if (!file) return 0;
    return file.size / (1024 * 1024);
  }, [file]);

  const isValidSize = useCallback((targetFile: File) => {
    const sizeInMb = targetFile.size / (1024 * 1024);
    if (sizeInMb > MAX_FILE_SIZE_MB) {
      toast.error(`Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB`);
      return false;
    }
    return true;
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile.name.endsWith('.pptx')) {
        toast.error('Por favor, selecione um arquivo .pptx válido');
        return;
      }

      if (!isValidSize(selectedFile)) {
        return;
      }

      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
      setProcessingResult(null);
    }
  }, [isValidSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    if (!isValidSize(file)) {
      setStatus('error');
      setErrorMessage(`Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    try {
      setUploading(true);
      setStatus('uploading');
      setProgress(0);

      // Progress simulation with more granular steps
      const progressSteps = [10, 25, 40, 55, 70, 85];
      let stepIndex = 0;
      
      const interval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(progressSteps[stepIndex]);
          stepIndex++;
        }
      }, 600);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pptx/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Tratamento especial para erros de autenticação
        if (response.status === 401) {
          throw new Error('Você precisa estar logado para fazer upload. Faça login e tente novamente.');
        }
        
        throw new Error(errorData.error || errorData.message || 'Falha no upload');
      }

      setProgress(90);
      setStatus('processing');

      const result = await response.json();
      
      setProgress(100);
      setStatus('success');
      setProcessingResult({
        projectId: result.projectId || result.data?.projectId,
        slidesCount: result.slidesCount || result.data?.slidesCount,
        estimatedDuration: result.estimatedDuration || result.data?.estimatedDuration
      });
      
      toast.success('Arquivo processado com sucesso!', {
        description: `${result.slidesCount || 0} slides extraídos`,
        action: result.projectId ? {
          label: 'Abrir Editor',
          onClick: () => router.push(`/editor/pptx?project=${result.projectId}`)
        } : undefined
      });

    } catch (error) {
      console.error('[PPTX Upload] Error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido no processamento');
      toast.error('Erro ao processar arquivo', {
        description: error instanceof Error ? error.message : undefined
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setProgress(0);
    setProcessingResult(null);
  };

  const goToEditor = () => {
    if (processingResult?.projectId) {
      router.push(`/editor/pptx?project=${processingResult.projectId}`);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all duration-300 hover:border-blue-300">
      <CardContent className="p-8">
        {!file ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center h-64 cursor-pointer transition-all duration-200 rounded-lg
              ${isDragActive ? 'bg-blue-50 border-blue-400 scale-[1.02]' : 'hover:bg-gray-100'}`}
          >
            <input {...getInputProps()} />
            <div className={`p-4 rounded-full shadow-sm mb-4 transition-all duration-200 ${isDragActive ? 'bg-blue-100 scale-110' : 'bg-white'}`}>
              <Upload className={`h-8 w-8 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte seu PPTX aqui'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              ou clique para selecionar do computador
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-white px-3 py-1 rounded-full border">
              <FileText className="h-3 w-3" />
              Suporta apenas arquivos .pptx até {MAX_FILE_SIZE_MB}MB
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File info card */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {fileSizeInMb.toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              {status !== 'uploading' && status !== 'processing' && status !== 'success' && (
                <Button variant="ghost" size="icon" onClick={removeFile} title="Remover arquivo">
                  <X className="h-5 w-5 text-gray-400 hover:text-red-500 transition-colors" />
                </Button>
              )}
            </div>

            {/* Progress states */}
            {(status === 'uploading' || status === 'processing') && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600 font-medium flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status === 'uploading' ? 'Enviando arquivo...' : 'Processando slides...'}
                  </span>
                  <span className="text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-400 text-center">
                  {status === 'processing' && 'Extraindo texto, imagens e estrutura...'}
                </p>
              </div>
            )}

            {/* Success state */}
            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium block">Processamento concluído!</span>
                    {processingResult?.slidesCount && (
                      <span className="text-sm text-green-700">
                        {processingResult.slidesCount} slides extraídos
                      </span>
                    )}
                  </div>
                </div>
                
                {processingResult?.projectId && (
                  <div className="flex justify-center">
                    <Button onClick={goToEditor} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Abrir no Editor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium block">Erro no processamento</span>
                  <span className="text-sm text-red-700">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {status !== 'success' && (
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={removeFile} 
                  disabled={uploading || status === 'processing'}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || status === 'processing'}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px]"
                >
                  {uploading || status === 'processing' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {status === 'processing' ? 'Processando...' : 'Enviando...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Iniciar Processamento
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* New upload button after success */}
            {status === 'success' && (
              <div className="flex justify-center pt-4 border-t">
                <Button variant="outline" onClick={removeFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  Processar outro arquivo
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
