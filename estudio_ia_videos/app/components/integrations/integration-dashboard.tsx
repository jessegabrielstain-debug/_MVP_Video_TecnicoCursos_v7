
/**
 * 🔗 Estúdio IA de Vídeos - Sprint 8
 * Dashboard de Integrações Externas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Link2,
  Youtube,
  Video,
  GraduationCap,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Upload,
  Download,
  BarChart3,
  Zap,
  Shield,
  Loader,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Copy,
  Trash2,
  Plus,
  Globe,
  type LucideIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  lastSync?: string;
  settings?: Record<string, unknown>;
}

interface Publication {
  metadata?: {
    title?: string;
  };
  targets?: string[];
  status?: string;
  results?: {
    integrationId: string;
    status: string;
    url?: string;
    error?: string;
  }[];
}

interface Stats {
  total: number;
  successRate: number;
  failed: number;
}

interface IntegrationTypeDefinition {
  type: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const INTEGRATION_TYPES: IntegrationTypeDefinition[] = [
  {
    type: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    description: 'Publicação automática no YouTube'
  },
  {
    type: 'vimeo',
    name: 'Vimeo',
    icon: Video,
    color: 'text-blue-600',
    description: 'Upload para Vimeo Business'
  },
  {
    type: 'moodle',
    name: 'Moodle',
    icon: GraduationCap,
    color: 'text-orange-600',
    description: 'Integração com LMS Moodle'
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    icon: MessageSquare,
    color: 'text-purple-600',
    description: 'Compartilhamento via Teams'
  }
];

export default function IntegrationDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  useEffect(() => {
    loadIntegrations();
    loadPublications();
    loadStats();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/list');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublications = async () => {
    try {
      const response = await fetch('/api/integrations/publications');
      if (response.ok) {
        const data = await response.json();
        setPublications(data.publications || []);
      }
    } catch (error) {
      logger.error('Erro ao carregar publicações', error instanceof Error ? error : new Error(String(error)), { component: 'IntegrationDashboard' });
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/integrations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Erro ao carregar estatísticas', error instanceof Error ? error : new Error(String(error)), { component: 'IntegrationDashboard' });
    }
  };

  const publishVideo = async (videoData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/integrations/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Vídeo publicado em ${result.results.length} plataformas`);
        loadPublications();
        loadStats();
      } else {
        throw new Error('Falha na publicação');
      }
    } catch (error) {
      toast.error('Erro na publicação: ' + (error as Error).message);
    }
  };

  const configureIntegration = async (integrationId: string, credentials: Record<string, unknown>, settings: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/integrations/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, credentials, settings })
      });

      if (response.ok) {
        toast.success('Integração configurada com sucesso!');
        loadIntegrations();
      } else {
        throw new Error('Falha na configuração');
      }
    } catch (error) {
      toast.error('Erro na configuração: ' + (error as Error).message);
    }
  };

  const syncIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Sincronização concluída');
        loadIntegrations();
      }
    } catch (error) {
      toast.error('Erro na sincronização');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando Integrações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Integrações Externas</h1>
                  <p className="text-gray-600">Publique e distribua vídeos automaticamente</p>
                </div>
              </div>
            </div>

            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Publicações</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Send className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Integrações Ativas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {integrations.filter(i => i.enabled).length}
                    </p>
                  </div>
                  <Link2 className="h-8 w-8 text-blue-600" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Falhas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="publications">Publicações</TabsTrigger>
            <TabsTrigger value="publisher">Publicar</TabsTrigger>
          </TabsList>

          {/* Tab: Integrações */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INTEGRATION_TYPES.map((type) => {
                const integration = integrations.find(i => i.type === type.type);
                const IconComponent = type.icon;
                
                return (
                  <Card key={type.type} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`h-6 w-6 ${type.color}`} />
                          <span>{type.name}</span>
                        </div>
                        {integration && getStatusIcon(integration.status)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {integration ? (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                                {integration.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            
                            {integration.lastSync && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Última Sync:</span>
                                <span className="font-medium">
                                  {new Date(integration.lastSync).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedIntegration(integration)}
                              >
                                <Settings className="h-3 w-3 mr-2" />
                                Configurar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncIntegration(integration.id)}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => {
                              // Criar nova integração
                              const newIntegration = {
                                id: `${type.type}-${Date.now()}`,
                                name: type.name,
                                type: type.type,
                                enabled: false,
                                status: 'disconnected'
                              };
                              setSelectedIntegration(newIntegration);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Publicações */}
          <TabsContent value="publications" className="space-y-6">
            <div className="space-y-4">
              {publications.map((publication, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{publication.metadata?.title || `Publicação ${index + 1}`}</h4>
                        <p className="text-sm text-gray-600">
                          {publication.targets?.length || 0} plataformas
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={publication.status === 'completed' ? 'default' : 'secondary'}>
                          {publication.status || 'processando'}
                        </Badge>
                      </div>
                    </div>

                    {/* Resultados por plataforma */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(publication.results || []).map((result, resultIndex) => (
                        <div
                          key={resultIndex}
                          className={`p-3 rounded-lg border ${
                            result.status === 'success' ? 'bg-green-50 border-green-200' :
                            result.status === 'failed' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {integrations.find(i => i.id === result.integrationId)?.name || result.integrationId}
                            </span>
                            {getStatusIcon(result.status)}
                          </div>
                          
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Ver publicação
                            </a>
                          )}
                          
                          {result.error && (
                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {publications.length === 0 && (
                <Card className="py-12">
                  <div className="text-center">
                    <Send className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma Publicação Encontrada
                    </h3>
                    <p className="text-gray-500">
                      Publique seus vídeos para ver o histórico aqui
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab: Publicar */}
          <TabsContent value="publisher" className="space-y-6">
            <VideoPublisher 
              integrations={integrations.filter(i => i.enabled)}
              onPublish={publishVideo}
              integrationTypes={INTEGRATION_TYPES}
            />
          </TabsContent>
        </Tabs>

        {/* Modal de Configuração */}
        {selectedIntegration && (
          <IntegrationConfigModal
            integration={selectedIntegration}
            onSave={configureIntegration}
            onClose={() => setSelectedIntegration(null)}
          />
        )}
      </div>
    </div>
  );
}

// Componente para publicar vídeos
interface VideoPublisherProps {
  integrations: Integration[];
  onPublish: (data: Record<string, unknown>) => void;
  integrationTypes: IntegrationTypeDefinition[];
}

function VideoPublisher({ integrations, onPublish, integrationTypes }: VideoPublisherProps) {
  const [videoFile, setVideoFile] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('Education');
  const [privacy, setPrivacy] = useState('unlisted');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

  const handlePublish = () => {
    if (!videoFile || !title || selectedIntegrations.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const publicationData = {
      videoFile,
      metadata: {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()),
        category,
        privacy,
        language: 'pt-BR'
      },
      targets: selectedIntegrations
    };

    onPublish(publicationData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Publicar Vídeo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do Vídeo */}
          <div className="space-y-4">
            <h4 className="font-semibold">Informações do Vídeo</h4>
            
            <div>
              <label className="block text-sm font-medium mb-2">Arquivo de Vídeo *</label>
              <Input
                value={videoFile}
                onChange={(e) => setVideoFile(e.target.value)}
                placeholder="video_output.mp4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Treinamento de Segurança NR-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição detalhada do treinamento..."
                className="w-full px-3 py-2 border rounded-md h-24 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="segurança, NR-10, treinamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Privacidade</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="private">Privado</option>
                  <option value="unlisted">Não listado</option>
                  <option value="public">Público</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seleção de Plataformas */}
          <div className="space-y-4">
            <h4 className="font-semibold">Plataformas de Destino</h4>
            
            <div className="space-y-3">
              {integrations.map(integration => {
                const typeInfo = integrationTypes.find(t => t.type === integration.type);
                const IconComponent = typeInfo?.icon || Globe;
                
                return (
                  <div
                    key={integration.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedIntegrations.includes(integration.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedIntegrations(prev =>
                        prev.includes(integration.id)
                          ? prev.filter(id => id !== integration.id)
                          : [...prev, integration.id]
                      );
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`h-5 w-5 ${typeInfo?.color || 'text-gray-600'}`} />
                      <div className="flex-1">
                        <h5 className="font-medium">{integration.name}</h5>
                        <p className="text-sm text-gray-600">
                          Status: {integration.status}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIntegrations.includes(integration.id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {integrations.filter(i => i.enabled).length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">Nenhuma integração ativa</p>
                <p className="text-sm text-gray-500">Configure integrações na aba anterior</p>
              </div>
            )}

            <Button
              onClick={handlePublish}
              disabled={!videoFile || !title || selectedIntegrations.length === 0}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Publicar em {selectedIntegrations.length} Plataforma(s)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Modal de configuração de integração
interface IntegrationConfigModalProps {
  integration: Integration;
  onSave: (id: string, credentials: Record<string, unknown>, settings: Record<string, unknown>) => void;
  onClose: () => void;
}

function IntegrationConfigModal({ integration, onSave, onClose }: IntegrationConfigModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, unknown>>(integration.settings || {});

  const credentialFields: Record<string, { key: string; label: string; type: string }[]> = {
    youtube: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'text' }
    ],
    vimeo: [
      { key: 'accessToken', label: 'Access Token', type: 'password' },
      { key: 'clientId', label: 'Client ID', type: 'text' }
    ],
    moodle: [
      { key: 'baseUrl', label: 'URL Base', type: 'url' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'username', label: 'Usuário', type: 'text' }
    ]
  };

  const fields = credentialFields[integration.type] || [];

  const handleSave = () => {
    onSave(integration.id, credentials, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configurar {integration.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credenciais */}
          <div>
            <h4 className="font-semibold mb-4">Credenciais</h4>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <Input
                    type={field.type}
                    value={credentials[field.key] || ''}
                    onChange={(e) => setCredentials((prev: Record<string, string>) => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                    placeholder={`Digite ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Configurações */}
          <div>
            <h4 className="font-semibold mb-4">Configurações Padrão</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Publicação Automática</span>
                <input
                  type="checkbox"
                  checked={(settings.autoPublish as boolean) || false}
                  onChange={(e) => setSettings((prev) => ({
                    ...prev,
                    autoPublish: e.target.checked
                  }))}
                  className="h-4 w-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Privacidade Padrão</label>
                <select
                  value={(settings.defaultPrivacy as string) || 'unlisted'}
                  onChange={(e) => setSettings((prev) => ({
                    ...prev,
                    defaultPrivacy: e.target.value
                  }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="private">Privado</option>
                  <option value="unlisted">Não listado</option>
                  <option value="public">Público</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSave} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
