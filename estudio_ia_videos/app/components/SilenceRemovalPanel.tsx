import React, { useState, useCallback } from 'react';
import { useSilenceRemoval, SilenceRemovalOptions } from '../hooks/useSilenceRemoval';
import { Play, Pause, Download, Settings, FileAudio, Zap, Wind, Mic } from 'lucide-react';

interface SilenceRemovalPanelProps {
  onProcessed?: (file: File) => void;
}

export const SilenceRemovalPanel: React.FC<SilenceRemovalPanelProps> = ({ onProcessed }) => {
  const {
    isProcessing,
    isDetecting,
    isRemoving,
    progress,
    result,
    error,
    originalFile,
    processedFile,
    detectSilence,
    removeSilence,
    processFile,
    cancelProcessing,
    reset,
    exportResult,
  } = useSilenceRemoval();

  const [options, setOptions] = useState<SilenceRemovalOptions>({
    silenceThreshold: -30,
    minSilenceDuration: 0.5,
    breathDetection: true,
    fillerWordDetection: false,
    minBreathDuration: 0.1,
    maxBreathDuration: 0.8,
    padding: 0.05,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      setPreviewTime(0);
      setIsPlaying(false);
    } else {
      alert('Please select an audio or video file');
    }
  }, []);

  const handleDetectSilence = useCallback(async () => {
    if (!selectedFile) return;
    await detectSilence(selectedFile, options);
  }, [selectedFile, options, detectSilence]);

  const handleRemoveSilence = useCallback(async () => {
    if (!selectedFile || !result) return;
    await removeSilence(selectedFile, result.segments, options);
  }, [selectedFile, result, options, removeSilence]);

  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) return;
    const processed = await processFile(selectedFile, options);
    if (processed && onProcessed) {
      onProcessed(processed);
    }
  }, [selectedFile, options, processFile, onProcessed]);

  const handleExport = useCallback((format: 'json' | 'csv' | 'srt') => {
    exportResult(format);
  }, [exportResult]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toFixed(1)}s`;
  };

  const getSegmentColor = (type: string): string => {
    switch (type) {
      case 'silence': return 'bg-blue-500';
      case 'breath': return 'bg-green-500';
      case 'filler': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'silence': return <Zap className="w-4 h-4" />;
      case 'breath': return <Wind className="w-4 h-4" />;
      case 'filler': return <Mic className="w-4 h-4" />;
      default: return <FileAudio className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Corte Mágico
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Audio/Video File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileAudio className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports MP3, WAV, MP4, MOV, and other formats
            </p>
          </label>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Detection Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Silence Threshold (dB)
              </label>
              <input
                type="range"
                min="-50"
                max="-10"
                step="1"
                value={options.silenceThreshold}
                onChange={(e) => setOptions(prev => ({ ...prev, silenceThreshold: parseInt(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-600">{options.silenceThreshold} dB</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Silence Duration (s)
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={options.minSilenceDuration}
                onChange={(e) => setOptions(prev => ({ ...prev, minSilenceDuration: parseFloat(e.target.value) }))}
                className="w-full"
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-600">{options.minSilenceDuration}s</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  checked={options.breathDetection}
                  onChange={(e) => setOptions(prev => ({ ...prev, breathDetection: e.target.checked }))}
                  className="mr-2"
                  disabled={isProcessing}
                />
                Detect Breath Sounds
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  checked={options.fillerWordDetection}
                  onChange={(e) => setOptions(prev => ({ ...prev, fillerWordDetection: e.target.checked }))}
                  className="mr-2"
                  disabled={isProcessing}
                />
                Detect Filler Words
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleDetectSilence}
          disabled={!selectedFile || isDetecting || isProcessing}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isDetecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Detect Silence
            </>
          )}
        </button>
        
        <button
          onClick={handleRemoveSilence}
          disabled={!result || isRemoving || isProcessing}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isRemoving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Remove Silence
            </>
          )}
        </button>

        <button
          onClick={handleProcessFile}
          disabled={!selectedFile || isProcessing}
          className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Auto Process
            </>
          )}
        </button>

        {isProcessing && (
          <button
            onClick={cancelProcessing}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-800 mb-2">Detection Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Original Duration:</span>
                <span className="font-semibold ml-1">{formatDuration(result.originalDuration)}</span>
              </div>
              <div>
                <span className="text-gray-600">Processed Duration:</span>
                <span className="font-semibold ml-1">{formatDuration(result.processedDuration)}</span>
              </div>
              <div>
                <span className="text-gray-600">Time Saved:</span>
                <span className="font-semibold ml-1 text-green-600">
                  {formatDuration(result.originalDuration - result.processedDuration)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Audio Quality:</span>
                <span className="font-semibold ml-1">{result.audioQuality.toFixed(1)}/100</span>
              </div>
            </div>
          </div>

          {/* Segments Visualization */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Detected Segments ({result.segments.length})</h4>
            <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
              {result.segments.length === 0 ? (
                <p className="text-gray-600 text-center">No silence or breath segments detected</p>
              ) : (
                <div className="space-y-2">
                  {result.segments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getSegmentColor(segment.type)} flex items-center justify-center text-white`}>
                          {getSegmentIcon(segment.type)}
                        </div>
                        <div>
                          <span className="font-medium capitalize">{segment.type}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{segment.duration.toFixed(2)}s</div>
                        <div className="text-xs text-gray-500">{segment.confidence.toFixed(2)} confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => handleExport('srt')}
              className="bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              SRT
            </button>
          </div>
        </div>
      )}

      {/* Processed File */}
      {processedFile && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Processed File</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{processedFile.name}</p>
                <p className="text-xs text-gray-500">
                  Size: {(processedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(processedFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = processedFile.name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={reset}
            className="mt-2 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Reset Button */}
      {(result || processedFile || error) && (
        <div className="text-center">
          <button
            onClick={reset}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};