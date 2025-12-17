'use client';

import { useEffect, useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Shield,
  Database,
  Cloud,
  Mic,
  Video,
  Lock
} from 'lucide-react';

interface CredentialGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  credentials: Credential[];
}

interface Credential {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder: string;
  helpText?: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialGroup[]>([]);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'error'>>({});

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/credentials');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.groups || getDefaultGroups());
      } else {
        setCredentials(getDefaultGroups());
      }
    } catch {
      setCredentials(getDefaultGroups());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultGroups = (): CredentialGroup[] => [
    {
      id: 'supabase',
      name: 'Supabase',
      icon: <Database className="w-5 h-5" />,
      description: 'Banco de dados e autenticação',
      credentials: [
        { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'URL do Projeto', value: '', type: 'url', required: true, placeholder: 'https://seu-projeto.supabase.co', helpText: 'URL do seu projeto Supabase' },
        { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key', value: '', type: 'password', required: true, placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', helpText: 'Chave pública anônima' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', value: '', type: 'password', required: true, placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', helpText: 'Chave de serviço (secreta)' },
        { key: 'DIRECT_DATABASE_URL', label: 'Database URL', value: '', type: 'password', required: true, placeholder: 'postgresql://postgres:senha@db.xxx.supabase.co:5432/postgres', helpText: 'URL de conexão direta ao banco' },
      ]
    },
    {
      id: 'tts',
      name: 'Text-to-Speech',
      icon: <Mic className="w-5 h-5" />,
      description: 'Serviços de síntese de voz',
      credentials: [
        { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs API Key', value: '', type: 'password', required: false, placeholder: 'sk_...', helpText: 'Chave da API ElevenLabs' },
        { key: 'AZURE_SPEECH_KEY', label: 'Azure Speech Key', value: '', type: 'password', required: false, placeholder: 'sua-chave-azure', helpText: 'Chave do Azure Speech Services' },
        { key: 'AZURE_SPEECH_REGION', label: 'Azure Speech Region', value: '', type: 'text', required: false, placeholder: 'eastus', helpText: 'Região do Azure (ex: eastus, brazilsouth)' },
      ]
    },
    {
      id: 'video',
      name: 'Vídeo & Avatar',
      icon: <Video className="w-5 h-5" />,
      description: 'Serviços de geração de vídeo',
      credentials: [
        { key: 'HEYGEN_API_KEY', label: 'HeyGen API Key', value: '', type: 'password', required: false, placeholder: 'sua-chave-heygen', helpText: 'Chave da API HeyGen para avatares' },
        { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', value: '', type: 'password', required: false, placeholder: 'sk-...', helpText: 'Chave da API OpenAI' },
      ]
    },
    {
      id: 'storage',
      name: 'Storage (AWS S3)',
      icon: <Cloud className="w-5 h-5" />,
      description: 'Armazenamento de arquivos',
      credentials: [
        { key: 'AWS_ACCESS_KEY_ID', label: 'Access Key ID', value: '', type: 'password', required: false, placeholder: 'AKIA...', helpText: 'ID da chave de acesso AWS' },
        { key: 'AWS_SECRET_ACCESS_KEY', label: 'Secret Access Key', value: '', type: 'password', required: false, placeholder: 'sua-secret-key', helpText: 'Chave secreta AWS' },
        { key: 'AWS_REGION', label: 'Região', value: '', type: 'text', required: false, placeholder: 'us-east-1', helpText: 'Região do bucket S3' },
        { key: 'AWS_S3_BUCKET', label: 'Nome do Bucket', value: '', type: 'text', required: false, placeholder: 'meu-bucket', helpText: 'Nome do bucket S3' },
      ]
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: <Database className="w-5 h-5" />,
      description: 'Cache e filas',
      credentials: [
        { key: 'REDIS_URL', label: 'Redis URL', value: 'redis://redis:6379', type: 'text', required: true, placeholder: 'redis://redis:6379', helpText: 'URL do servidor Redis' },
      ]
    },
    {
      id: 'security',
      name: 'Segurança',
      icon: <Shield className="w-5 h-5" />,
      description: 'Autenticação e segurança',
      credentials: [
        { key: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', value: '', type: 'password', required: false, placeholder: 'gere-um-secret-seguro', helpText: 'Secret para NextAuth (gere com: openssl rand -base64 32)' },
        { key: 'NEXTAUTH_URL', label: 'NextAuth URL', value: '', type: 'url', required: false, placeholder: 'https://seu-dominio.com', helpText: 'URL base da aplicação' },
        { key: 'ADMIN_EMAIL', label: 'Email Admin', value: '', type: 'text', required: true, placeholder: 'admin@empresa.com', helpText: 'Email do administrador principal' },
        { key: 'ADMIN_PASSWORD', label: 'Senha Admin', value: '', type: 'password', required: true, placeholder: '••••••••', helpText: 'Senha do administrador (mín. 8 caracteres)' },
      ]
    },
    {
      id: 'monitoring',
      name: 'Monitoramento',
      icon: <Shield className="w-5 h-5" />,
      description: 'Logs e monitoramento',
      credentials: [
        { key: 'SENTRY_DSN', label: 'Sentry DSN', value: '', type: 'url', required: false, placeholder: 'https://xxx@xxx.ingest.sentry.io/xxx', helpText: 'DSN do Sentry para error tracking' },
        { key: 'LOG_LEVEL', label: 'Nível de Log', value: 'info', type: 'text', required: false, placeholder: 'info', helpText: 'Nível de log (debug, info, warn, error)' },
      ]
    }
  ];

  const toggleVisibility = (key: string) => {
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateCredential = (groupId: string, key: string, value: string) => {
    setCredentials(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          credentials: group.credentials.map(cred => 
            cred.key === key ? { ...cred, value } : cred
          )
        };
      }
      return group;
    }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const allCredentials: Record<string, string> = {};
      credentials.forEach(group => {
        group.credentials.forEach(cred => {
          if (cred.value) {
            allCredentials[cred.key] = cred.value;
          }
        });
      });

      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: allCredentials })
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

  const testConnection = async (groupId: string) => {
    setTestResults(prev => ({ ...prev, [groupId]: 'testing' }));
    
    try {
      const res = await fetch(`/api/admin/credentials/test/${groupId}`, {
        method: 'POST'
      });
      
      if (res.ok) {
        setTestResults(prev => ({ ...prev, [groupId]: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, [groupId]: 'error' }));
      }
    } catch {
      setTestResults(prev => ({ ...prev, [groupId]: 'error' }));
    }

    setTimeout(() => {
      setTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[groupId];
        return newResults;
      });
    }, 3000);
  };

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
            <Key className="w-7 h-7 mr-3 text-blue-500" />
            Credenciais & APIs
          </h1>
          <p className="text-gray-400 mt-1">Gerencie as chaves de API e credenciais do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
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
            {isSaving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : saveStatus === 'error' ? 'Erro!' : 'Salvar Alterações'}
          </span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start space-x-3">
        <Lock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-400 font-medium">Segurança das Credenciais</p>
          <p className="text-yellow-400/70 text-sm mt-1">
            Todas as credenciais são armazenadas de forma criptografada. Nunca compartilhe suas chaves de API.
          </p>
        </div>
      </div>

      {/* Credential Groups */}
      <div className="space-y-6">
        {credentials.map((group) => (
          <div key={group.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Group Header */}
            <div className="px-6 py-4 bg-gray-750 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                  {group.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{group.name}</h3>
                  <p className="text-sm text-gray-400">{group.description}</p>
                </div>
              </div>
              <button
                onClick={() => testConnection(group.id)}
                disabled={testResults[group.id] === 'testing'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  testResults[group.id] === 'success'
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : testResults[group.id] === 'error'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {testResults[group.id] === 'testing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : testResults[group.id] === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : testResults[group.id] === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>
                  {testResults[group.id] === 'testing' ? 'Testando...' 
                    : testResults[group.id] === 'success' ? 'Conectado!'
                    : testResults[group.id] === 'error' ? 'Falhou'
                    : 'Testar Conexão'}
                </span>
              </button>
            </div>

            {/* Credentials */}
            <div className="p-6 space-y-4">
              {group.credentials.map((cred) => (
                <div key={cred.key} className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-300">
                      {cred.label}
                    </span>
                    {cred.required && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        Obrigatório
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={cred.type === 'password' && !visibleFields[cred.key] ? 'password' : 'text'}
                      value={cred.value}
                      onChange={(e) => updateCredential(group.id, cred.key, e.target.value)}
                      placeholder={cred.placeholder}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                    />
                    {cred.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => toggleVisibility(cred.key)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {visibleFields[cred.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                  {cred.helpText && (
                    <p className="text-xs text-gray-500">{cred.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
