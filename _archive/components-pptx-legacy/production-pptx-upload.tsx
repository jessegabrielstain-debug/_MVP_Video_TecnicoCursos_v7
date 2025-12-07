
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  projectId?: string;
  projectData?: any;
}

interface ProductionPPTXUploadProps {
  onUploadComplete?: (data: any) => void;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  autoRedirect?: boolean;
}

const ProductionPPTXUpload: React.FC<ProductionPPTXUploadProps> = ({
  onUploadComplete,
  maxFileSize = 50, // 50MB por padrão
  maxFiles = 5,
  autoRedirect = true
}) => {
  const router = useRouter();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [autoNarration, setAutoNarration] = useState(true); // Sprint 45: Auto-narração ativada por padrão
  const [narrationProvider, setNarrationProvider] = useState('azure');
  const [narrationVoice, setNarrationVoice] = useState('pt-BR-FranciscaNeural');

  // Validação de arquivo
  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Tamanho máximo: ${maxFileSize}MB`;
    }

    // Verificar extensão
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['pptx', 'ppt'].includes(extension)) {
      return 'Tipo de arquivo não suportado. Apenas arquivos PowerPoint (.pptx, .ppt)';
    }

    return null;
  };

  // Upload e processamento via API do backend
  const uploadAndProcess = async (file: File, uploadId: string): Promise<void> => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Atualizar status para uploading
      updateUploadFile(uploadId, { status: 'uploading', progress: 10 });

      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', file.name.replace(/\.[^/.]+$/, ''));

      // Simular progresso durante upload
      progressInterval = setInterval(() => {
        setUploadFiles(prev => {
          const currentFile = prev.find(f => f.id === uploadId);
          if (currentFile && currentFile.progress < 90 && currentFile.status === 'uploading') {
            return prev.map(f => 
              f.id === uploadId ? { ...f, progress: Math.min(90, f.progress + 10) } : f
            );
          }
          return prev;
        });
      }, 500);

      // Fazer upload via API do backend
      const response = await fetch('/api/pptx/upload', {
        method: 'POST',
        body: formData,
      });

      // Limpar interval SEMPRE após o fetch
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro no upload: ${response.statusText}`);
      }

      const result = await response.json();

      // Extrair projectId correto (pode vir como result.data.projectId ou result.project?.id)
      const projectId = result.data?.projectId || result.project?.id;
      
      console.log('[Upload] Result:', { projectId, hasData: !!result.data, hasProject: !!result.project });

      // Sprint 45: Gerar narração automática se ativado
      if (autoNarration && projectId) {
        try {
          updateUploadFile(uploadId, { 
            status: 'processing', 
            progress: 95
          });

          const toastId = `narration-${uploadId}`;
          toast.loading('Gerando narração automática...', { id: toastId });

          const narrationResponse = await fetch('/api/v1/pptx/auto-narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: projectId,
              options: {
                provider: narrationProvider,
                voice: narrationVoice,
                speed: 1.0,
                preferNotes: true
              }
            })
          });

          toast.dismiss(toastId);

          if (narrationResponse.ok) {
            const narrationResult = await narrationResponse.json();
            toast.success(
              `Narração gerada: ${narrationResult.stats?.narratedSlides || 0} slides`
            );
          } else {
            const errorData = await narrationResponse.json();
            console.warn('Erro ao gerar narração:', errorData);
            toast.error('Narração automática falhou, mas projeto foi criado');
          }
        } catch (narrationError) {
          console.error('Erro ao gerar narração:', narrationError);
          toast.error('Narração automática falhou, mas projeto foi criado');
        }
      }

      // Atualizar para completed
      updateUploadFile(uploadId, { 
        status: 'completed', 
        progress: 100,
        projectId: projectId,
        projectData: result
      });

      toast.success(`${file.name} processado com sucesso!`);
      
      // Callback
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Redirecionar automaticamente para o editor
      if (autoRedirect && projectId) {
        console.log('[Upload] Redirecting to editor with projectId:', projectId);
        setTimeout(() => {
          router.push(`/editor?projectId=${projectId}`);
        }, 1500);
      } else if (!projectId) {
        console.error('[Upload] No projectId found in result:', result);
        toast.error('Projeto criado mas ID não encontrado. Verifique a lista de projetos.');
      }

    } catch (error) {
      // Garantir que o interval seja limpo em caso de erro
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      updateUploadFile(uploadId, { 
        status: 'error', 
        error: errorMessage
      });
      toast.error(`Erro ao processar ${file.name}: ${errorMessage}`);
      throw error;
    } finally {
      // Garantir limpeza final do interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  };

  // Processar upload completo
  const handleFileUpload = async (file: File) => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const uploadFile: UploadFile = {
      id: uploadId,
      file,
      progress: 0,
      status: 'pending'
    };

    setUploadFiles(prev => [...prev, uploadFile]);

    try {
      await uploadAndProcess(file, uploadId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Atualizar estado do arquivo
  const updateUploadFile = (id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, ...updates } : file
      )
    );
  };

  // Remover arquivo
  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  // Handler do dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    setIsUploading(true);

    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (validation) {
        toast.error(`${file.name}: ${validation}`);
        continue;
      }

      await handleFileUpload(file);
    }

    setIsUploading(false);
  }, [uploadFiles, maxFiles]);

  // Configuração do dropzone
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    },
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles,
    disabled: isUploading
  });

  // Renderizar status do arquivo
  const renderFileStatus = (file: UploadFile) => {
    switch (file.status) {
      case 'uploading':
      case 'processing':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-600 text-sm">
              {file.status === 'uploading' ? 'Enviando' : 'Processando'}...
            </span>
          </div>
        );

      case 'completed':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-600 text-sm font-medium">Concluído</span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-600 text-xs">{file.error || 'Erro'}</span>
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 text-sm">Aguardando...</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sprint 45: Configurações de Auto-Narração */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="auto-narration" className="text-base font-semibold">
                    Gerar Narração Automática
                  </Label>
                  <p className="text-sm text-gray-500">
                    Cria automaticamente áudios de narração a partir do texto dos slides
                  </p>
                </div>
              </div>
              <Switch
                id="auto-narration"
                checked={autoNarration}
                onCheckedChange={setAutoNarration}
              />
            </div>

            {autoNarration && (
              <div className="ml-8 space-y-3 border-l-2 border-blue-200 pl-4">
                <div>
                  <Label htmlFor="narration-voice" className="text-sm">
                    Voz de Narração
                  </Label>
                  <select
                    id="narration-voice"
                    value={narrationVoice}
                    onChange={(e) => setNarrationVoice(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="pt-BR-FranciscaNeural">Francisca (Feminina, Brasileira)</option>
                    <option value="pt-BR-AntonioNeural">Antonio (Masculina, Brasileira)</option>
                    <option value="pt-BR-BrendaNeural">Brenda (Feminina, Brasileira)</option>
                    <option value="pt-BR-DonatoNeural">Donato (Masculina, Brasileira)</option>
                  </select>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> As narrações são geradas a partir das notas dos slides 
                    ou, se não houver notas, do texto visível em cada slide.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
        
        {isDragActive ? (
          <p className="text-blue-600 text-lg font-medium">
            Solte os arquivos aqui...
          </p>
        ) : (
          <div>
            <p className="text-gray-700 text-lg font-medium mb-2">
              Arraste arquivos PowerPoint aqui ou clique para selecionar
            </p>
            <p className="text-gray-500 text-sm">
              Suporta .pptx e .ppt até {maxFileSize}MB • Máximo {maxFiles} arquivos
            </p>
            <p className="text-gray-400 text-xs mt-2">
              O processamento é feito automaticamente após o upload
            </p>
          </div>
        )}
      </div>

      {/* Arquivos Rejeitados */}
      {fileRejections.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Alguns arquivos foram rejeitados: {fileRejections.map((rejection: any) => rejection.file.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Arquivos */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center justify-between">
            <span>Arquivos ({uploadFiles.length})</span>
            {uploadFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length > 0 && (
              <span className="text-sm text-blue-600 font-normal">Processando...</span>
            )}
          </h3>
          
          {uploadFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{file.file.name}</h4>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      
                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0">
                    {renderFileStatus(file)}
                    
                    {file.status === 'completed' && file.projectId && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/editor?projectId=${file.projectId}`)}
                      >
                        Abrir Editor
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading' || file.status === 'processing'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      {uploadFiles.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {uploadFiles.filter(f => f.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Concluídos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {uploadFiles.filter(f => f.status === 'uploading' || f.status === 'processing').length}
              </p>
              <p className="text-sm text-gray-600">Processando</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {uploadFiles.filter(f => f.status === 'error').length}
              </p>
              <p className="text-sm text-gray-600">Erros</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">
                {uploadFiles.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPPTXUpload;
