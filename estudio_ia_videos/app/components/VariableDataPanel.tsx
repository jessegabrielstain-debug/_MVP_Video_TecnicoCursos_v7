import React, { useState, useCallback, useEffect } from 'react';
import { useVariableData } from '../hooks/useVariableData';
import { Upload, FileText, Play, Download, Settings, Plus, Trash2, Edit, Eye, EyeOff, Check, X } from 'lucide-react';

interface VariableDataPanelProps {
  onJobCompleted?: (jobId: string) => void;
}

export const VariableDataPanel: React.FC<VariableDataPanelProps> = ({ onJobCompleted }) => {
  const {
    isProcessing,
    isUploading,
    isValidating,
    progress,
    templates,
    currentJob,
    csvData,
    csvHeaders,
    validationErrors,
    validationWarnings,
    selectedTemplate,
    error,
    loadTemplates,
    uploadCSV,
    validateCSV,
    createTemplate,
    selectTemplate,
    generateVariations,
    getJobStatus,
    cancelProcessing,
    reset,
    downloadResults,
  } = useVariableData();

  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (currentJob && currentJob.status === 'processing') {
      const interval = setInterval(async () => {
        await getJobStatus(currentJob.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentJob, getJobStatus]);

  useEffect(() => {
    if (currentJob && currentJob.status === 'completed' && onJobCompleted) {
      onJobCompleted(currentJob.id);
    }
  }, [currentJob, onJobCompleted]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const success = await uploadCSV(file);
      if (success) {
        setShowCSVPreview(true);
      }
    }
  }, [uploadCSV]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    selectTemplate(template || null);
  }, [templates, selectTemplate]);

  const handleValidateCSV = useCallback(async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }
    await validateCSV(selectedTemplate.id);
  }, [selectedTemplate, validateCSV]);

  const handleGenerateVariations = useCallback(async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    if (validationErrors.length > 0) {
      alert('Please fix CSV validation errors first');
      return;
    }

    await generateVariations(selectedTemplate.id, {
      maxConcurrentJobs: 5,
      retryFailedVariations: true,
      generateThumbnails: true,
      createZipArchive: true,
    });
  }, [selectedTemplate, validationErrors, generateVariations]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Personalização em Massa
        </h2>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <select
          value={selectedTemplate?.id || ''}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">Choose a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </option>
          ))}
        </select>
      </div>

      {/* CSV Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
            disabled={isUploading || isProcessing}
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'Click to upload CSV file'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              CSV format with headers matching template variables
            </p>
          </label>
        </div>
      </div>

      {/* CSV Preview */}
      {csvData.length > 0 && showCSVPreview && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">CSV Preview ({csvData.length} rows)</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {csvHeaders.map(header => (
                    <th key={header} className="text-left p-2 font-medium text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b">
                    {csvHeaders.map(header => (
                      <td key={header} className="p-2 text-gray-600">
                        {String(row[header] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 10 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing first 10 of {csvData.length} rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation Results */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="mb-6">
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">Validation Errors ({validationErrors.length})</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-red-600">... and {validationErrors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
          {validationWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Validation Warnings ({validationWarnings.length})</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationWarnings.slice(0, 5).map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
                {validationWarnings.length > 5 && (
                  <li className="text-yellow-600">... and {validationWarnings.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleValidateCSV}
          disabled={!selectedTemplate || !csvData.length || isValidating || isProcessing}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? 'Validating...' : 'Validate CSV'}
        </button>
        
        <button
          onClick={handleGenerateVariations}
          disabled={!selectedTemplate || !csvData.length || validationErrors.length > 0 || isProcessing}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Generate Variations'}
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

      {/* Current Job Status */}
      {currentJob && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Current Job: {currentJob.id}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold ml-1 capitalize">{currentJob.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Rows:</span>
                <span className="font-semibold ml-1">{currentJob.totalRows}</span>
              </div>
              <div>
                <span className="text-gray-600">Processed:</span>
                <span className="font-semibold ml-1">{currentJob.processedRows}</span>
              </div>
              <div>
                <span className="text-gray-600">Progress:</span>
                <span className="font-semibold ml-1">{currentJob.progress.toFixed(1)}%</span>
              </div>
            </div>
            
            {currentJob.status === 'completed' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => downloadResults(currentJob.id, 'zip')}
                  className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download ZIP
                </button>
                <button
                  onClick={() => downloadResults(currentJob.id, 'csv')}
                  className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download CSV
                </button>
              </div>
            )}
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
      {(currentJob || error) && (
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