'use client';

import { useEffect, useState } from 'react';
import { 
  Server, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

interface EnvVariable {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
}

export default function EnvironmentPage() {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [visibleVars, setVisibleVars] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/environment');
      if (res.ok) {
        const data = await res.json();
        setVariables(data.variables || []);
      }
    } catch (error) {
      console.error('Erro ao buscar variáveis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addVariable = () => {
    if (!newKey.trim()) return;
    
    if (variables.some(v => v.key === newKey.toUpperCase())) {
      alert('Variável já existe!');
      return;
    }

    setVariables([
      ...variables,
      { key: newKey.toUpperCase(), value: newValue, isSecret: newIsSecret }
    ]);
    setNewKey('');
    setNewValue('');
    setNewIsSecret(false);
    setSaveStatus('idle');
  };

  const updateVariable = (key: string, value: string) => {
    setVariables(variables.map(v => 
      v.key === key ? { ...v, value } : v
    ));
    setSaveStatus('idle');
  };

  const deleteVariable = (key: string) => {
    if (confirm(`Tem certeza que deseja remover "${key}"?`)) {
      setVariables(variables.filter(v => v.key !== key));
      setSaveStatus('idle');
    }
  };

  const toggleVisibility = (key: string) => {
    setVisibleVars(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/admin/environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportEnv = () => {
    const content = variables
      .map(v => `${v.key}=${v.value}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.production';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importEnv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const newVars: EnvVariable[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          if (key) {
            newVars.push({
              key: key.trim(),
              value: value.trim(),
              isSecret: key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
            });
          }
        }
      });

      setVariables(prev => {
        const merged = [...prev];
        newVars.forEach(newVar => {
          const existingIndex = merged.findIndex(v => v.key === newVar.key);
          if (existingIndex >= 0) {
            merged[existingIndex] = newVar;
          } else {
            merged.push(newVar);
          }
        });
        return merged;
      });
      setSaveStatus('idle');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredVariables = variables.filter(v => 
    v.key.toLowerCase().includes(filter.toLowerCase()) ||
    v.value.toLowerCase().includes(filter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Server className="w-7 h-7 mr-3 text-purple-500" />
            Variáveis de Ambiente
          </h1>
          <p className="text-gray-400 mt-1">Gerencie as variáveis de ambiente do sistema</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVariables}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 cursor-pointer transition-colors flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Importar</span>
            <input type="file" accept=".env,.txt" onChange={importEnv} className="hidden" />
          </label>
          <button
            onClick={exportEnv}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
              saveStatus === 'success' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {isSaving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : 'Salvar'}
            </span>
          </button>
        </div>
      </div>

      {/* Add New Variable */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Adicionar Nova Variável</h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              placeholder="NOME_DA_VARIAVEL"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor</label>
            <input
              type={newIsSecret ? 'password' : 'text'}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="valor_da_variavel"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSecret"
              checked={newIsSecret}
              onChange={(e) => setNewIsSecret(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="isSecret" className="text-sm text-gray-300">Secreto</label>
          </div>
          <button
            onClick={addVariable}
            disabled={!newKey.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar variáveis..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">{filteredVariables.length} variáveis</span>
      </div>

      {/* Variables List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-750 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Valor</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredVariables.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma variável encontrada
                </td>
              </tr>
            ) : (
              filteredVariables.map((variable) => (
                <tr key={variable.key} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-blue-400">{variable.key}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type={variable.isSecret && !visibleVars[variable.key] ? 'password' : 'text'}
                        value={variable.value}
                        onChange={(e) => updateVariable(variable.key, e.target.value)}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded py-1 px-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {variable.isSecret && (
                        <button
                          onClick={() => toggleVisibility(variable.key)}
                          className="p-1 text-gray-500 hover:text-gray-300"
                        >
                          {visibleVars[variable.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(variable.key, variable.value)}
                        className="p-1 text-gray-500 hover:text-gray-300"
                      >
                        {copiedKey === variable.key ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteVariable(variable.key)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
