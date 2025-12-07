
/**
 * PPTX Upload Modal
 * Modal for uploading and processing PowerPoint files
 */

"use client"

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Logger } from '@/lib/logger';

const logger = new Logger('PPTXUploadModal');

interface PPTXUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (projectId: string) => void;
}

export function PPTXUploadModal({ open, onOpenChange, onSuccess }: PPTXUploadModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.pptx')) {
        toast.error('Arquivo inválido', {
          description: 'Apenas arquivos .pptx são permitidos.',
        });
        return;
      }

      // Validate file size (50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande', {
          description: 'O tamanho máximo permitido é 50MB.',
        });
        return;
      }

      setFile(selectedFile);
      setProjectName(selectedFile.name.replace('.pptx', ''));
      setStatus('idle');
      setErrorMessage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setStatus('uploading');
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', projectName);

      setProgress(30);

      const response = await fetch('/api/pptx/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Erro ao processar arquivo');
      }

      const data = await response.json();
      
      setProgress(100);
      setStatus('success');

      toast.success('PPTX importado com sucesso!', {
        description: `${data.slides.length} slides foram processados.`,
      });

      // Wait a bit to show success state
      setTimeout(() => {
        if (!hasRedirected) {
          setHasRedirected(true);
          if (onSuccess) {
            onSuccess(data.project.id);
          } else {
            router.push(`/editor/${data.project.id}`);
          }
          onOpenChange(false);
          resetForm();
        }
      }, 1500);

    } catch (error) {
      logger.error('Upload error', error instanceof Error ? error : undefined);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      
      toast.error('Erro ao importar PPTX', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProjectName('');
    setProgress(0);
    setStatus('idle');
    setErrorMessage('');
    setHasRedirected(false);
  };

  const handleClose = () => {
    if (!uploading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open && !hasRedirected} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Apresentação PPTX</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo PowerPoint (.pptx) para criar um novo projeto de vídeo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Area */}
          {!file && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo PPTX aqui'}
              </p>
              <p className="text-sm text-gray-500">
                ou clique para selecionar (máx. 50MB)
              </p>
            </div>
          )}

          {/* File Info */}
          {file && status === 'idle' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                <FileText className="w-10 h-10 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  <div className="mt-4">
                    <Label htmlFor="projectName">Nome do Projeto</Label>
                    <Input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Digite o nome do projeto"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setProjectName('');
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          )}

          {/* Progress */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {status === 'uploading' ? 'Enviando arquivo...' : 'Processando slides...'}
                </p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">
                Isso pode levar alguns minutos dependendo do tamanho do arquivo.
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Importação concluída!</p>
                <p className="text-sm text-green-700">Redirecionando para o editor...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Erro ao processar arquivo</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || !projectName.trim()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Importar e Criar Projeto'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
