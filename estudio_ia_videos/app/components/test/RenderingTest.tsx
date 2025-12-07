'use client';

/**
 * 🧪 Teste de Renderização Completa
 * Valida todo o pipeline de renderização
 */

import React, { useState } from 'react';
import { useRendering } from '@/hooks/use-rendering';
import { TimelineProject } from '@/lib/types/timeline-types';
import { ExportSettings, RenderProgress } from '@/lib/types/remotion-types';

const RenderingTest: React.FC = () => {
  const {
    isRendering,
    currentJob,
    progress,
    error,
    startRender,
    cancelRender,
    clearError,
    streamProgress,
    listJobs,
    downloadRender,
    getPreset,
    validateProject
  } = useRendering();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Projeto de teste
  const testProject: TimelineProject = {
    id: 'test-project-001',
    name: 'Projeto de Teste',
    duration: 10, // 10 segundos
    fps: 30,
    resolution: {
      width: 1920,
      height: 1080
    },
    layers: [
      {
        id: 'layer-1',
        name: 'Main Layer',
        type: 'video',
        visible: true,
        locked: false,
        elements: [
          {
            id: 'text-1',
            type: 'text',
            start: 0,
            duration: 5,
            source: 'text',
            layer: 0,
            data: {
              content: 'Teste de Renderização Completa!',
              style: {
                fontSize: 48,
                color: '#ffffff',
                fontFamily: 'Arial',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '20px',
                borderRadius: '10px'
              },
              position: { x: 50, y: 50 },
              animations: [{
                type: 'fadeInScale',
                startTime: 0,
                duration: 1,
                easing: 'easeOut'
              }]
            }
          },
          {
            id: 'text-2',
            type: 'text',
            start: 5,
            duration: 5,
            source: 'text',
            layer: 0,
            data: {
              content: 'Sistema Integrado Funcionando!',
              style: {
                fontSize: 36,
                color: '#00ff00',
                fontFamily: 'Arial',
                textAlign: 'center'
              },
              position: { x: 50, y: 70 },
              animations: [{
                type: 'slideIn',
                startTime: 5,
                duration: 1,
                direction: 'left',
                easing: 'easeOut'
              }]
            }
          }
        ]
      }
    ],
    currentTime: 0,
    zoomLevel: 1
  };

  // Configurações de exportação
  const exportSettings: ExportSettings = {
    format: 'mp4',
    quality: 80,
    fps: 30,
    codec: 'h264',
    bitrate: '5M'
  };

  const handleStartRender = async () => {
    console.log('🎬 Iniciando teste de renderização...');
    await startRender(testProject, exportSettings);
  };

  const handleCancelRender = async () => {
    console.log('⏹️ Cancelando renderização...');
    await cancelRender();
  };

  const handleListJobs = async () => {
    setLoading(true);
    try {
      const result = await listJobs();
      setJobs(result.jobs || []);
      console.log('📋 Jobs encontrados:', result);
    } catch (err) {
      console.error('Erro ao listar jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (jobId: string) => {
    console.log('⬇️ Baixando arquivo:', jobId);
    downloadRender(jobId, 'mp4');
  };

  const handleValidation = () => {
    const validation = validateProject(testProject);
    console.log('✅ Validação do projeto:', validation);
  };

  const handlePresetTest = () => {
    const presets = ['low', 'medium', 'high', 'ultra'];
    presets.forEach(preset => {
      const config = getPreset(preset);
      console.log(`🎯 Preset ${preset}:`, config);
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🧪 Teste de Renderização Completa
      </h1>

      {/* Status Atual */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Status Atual</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Renderizando:</strong> {isRendering ? '✅ Sim' : '❌ Não'}
          </div>
          <div>
            <strong>Job Atual:</strong> {currentJob?.id || 'Nenhum'}
          </div>
          <div>
            <strong>Progresso:</strong> {progress?.percentage || 0}%
          </div>
          <div>
            <strong>Erro:</strong> {error || 'Nenhum'}
          </div>
        </div>
      </div>

      {/* Progresso Detalhado */}
      {progress && (
        <div className="mb-6 p-4 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Progresso da Renderização</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            Frame {progress.frame} de {progress.totalFrames} | 
            Tempo decorrido: {progress.renderedInSeconds?.toFixed(1)}s
            {progress.estimatedTimeRemaining && (
              <span> | Tempo restante: {progress.estimatedTimeRemaining}s</span>
            )}
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Limpar Erro
          </button>
        </div>
      )}

      {/* Controles Principais */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <button
          onClick={handleStartRender}
          disabled={isRendering}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRendering ? '🎬 Renderizando...' : '▶️ Iniciar Renderização'}
        </button>

        <button
          onClick={handleCancelRender}
          disabled={!isRendering}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ⏹️ Cancelar Renderização
        </button>
      </div>

      {/* Controles Secundários */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <button
          onClick={handleListJobs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          📋 Listar Jobs
        </button>

        <button
          onClick={handleValidation}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          ✅ Validar Projeto
        </button>

        <button
          onClick={handlePresetTest}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🎯 Testar Presets
        </button>
      </div>

      {/* Lista de Jobs */}
      {jobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Jobs de Renderização</h3>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <strong>ID:</strong> {job.id} | 
                  <strong> Status:</strong> {job.status} | 
                  <strong> Criado:</strong> {new Date(job.createdAt).toLocaleString()}
                </div>
                <div className="space-x-2">
                  {job.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(job.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      ⬇️ Download
                    </button>
                  )}
                  <button
                    onClick={() => streamProgress(job.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    📡 Monitorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações do Projeto */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Projeto de Teste</h3>
        <div className="text-sm text-gray-600">
          <p><strong>ID:</strong> {testProject.id}</p>
          <p><strong>Nome:</strong> {testProject.name}</p>
          <p><strong>Duração:</strong> {testProject.duration}s</p>
          <p><strong>FPS:</strong> {testProject.fps}</p>
          <p><strong>Resolução:</strong> {testProject.resolution.width}x{testProject.resolution.height}</p>
          <p><strong>Elementos:</strong> {testProject.layers[0]?.elements.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default RenderingTest;