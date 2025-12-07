/**
 * 🔔 Componente de Notificações de Render
 * Interface visual para acompanhar status de renderização
 */

import React, { useState } from 'react';
import { Bell, X, Play, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { useRenderPipeline, RenderJob } from '@/hooks/use-render-pipeline';

interface RenderNotificationsProps {
  userId: string | null;
  className?: string;
}

export function RenderNotifications({ userId, className = '' }: RenderNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    renderQueue, 
    isConnected, 
    // connectionError, // Not exposed by useRenderPipeline yet
    // retryConnection // Not exposed
  } = useRenderPipeline();

  const activeJobs = renderQueue ? [
    ...renderQueue.processing,
    ...renderQueue.pending
  ] : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userId) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        title="Notificações de Render"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        
        {/* Badge de jobs ativos */}
        {activeJobs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeJobs.length}
          </span>
        )}

        {/* Indicador de conexão */}
        <div className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Renders Ativos</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Status da conexão */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">Desconectado</span>
                </>
              )}
            </div>
          </div>

          {/* Lista de jobs */}
          <div className="max-h-96 overflow-y-auto">
            {activeJobs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhum render ativo</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeJobs.map((job) => (
                  <RenderJobItem key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RenderJobItemProps {
  job: RenderJob;
}

function RenderJobItem({ job }: RenderJobItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'failed':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-4 border-l-4 ${getStatusColor(job.status)}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon(job.status)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {getStatusText(job.status)}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(job.updated_at)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 truncate mb-2">
            {(job.input_data?.script_text as string) || 'Sem descrição'}
          </p>
          
          {/* Barra de progresso */}
          {job.status === 'processing' && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progresso</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Botão de ação */}
          {job.status === 'completed' && job.output_url && (
            <button
              onClick={() => window.open(job.output_url, '_blank')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Play className="w-3 h-3" />
              Ver Vídeo
            </button>
          )}
          
          {/* Mensagem de erro */}
          {job.status === 'failed' && job.error_message && (
            <p className="text-xs text-red-600 mt-1">
              {job.error_message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}