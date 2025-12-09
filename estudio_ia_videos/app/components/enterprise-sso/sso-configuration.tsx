
/**
 * 🏢 Estúdio IA de Vídeos - Sprint 5
 * Configuração de Enterprise SSO
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SSOStatus = 'active' | 'inactive' | 'testing'

interface SSOConfiguration {
  clientId?: string;
  discoveryUrl?: string;
  entityId?: string;
  ssoUrl?: string;
  [key: string]: unknown;
}

interface SSOProvider {
  id: string;
  name: string;
  type: string;
  status: SSOStatus;
  enabled?: boolean;
  domain: string;
  users: number;
  lastTest: string | null;
  configuration: SSOConfiguration;
  [key: string]: unknown;
}

interface TestResult {
  success: boolean;
  message?: string;
  details: {
    connectivity?: boolean;
    responseTime?: number;
    error?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AuditStats {
  activeSessions: number;
  totalLogins24h: number;
  failedLogins24h: number;
  providersUsed: number;
  averageSessionDuration: number;
  securityAlerts: Array<{
    id?: string;
    level?: string;
    message: string;
    severity: string;
    timestamp: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Settings,
  Users,
  Key,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  Activity,
  FileText,
  Download,
  TestTube,
  Plus,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';

export default function SSOConfiguration() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);

  useEffect(() => {
    loadSSOProviders();
    loadAuditStats();
  }, []);

  const loadSSOProviders = async () => {
    try {
      const response = await fetch('/api/enterprise-sso/providers');
      const data = await response.json();
      setProviders(data);
      if (data.length > 0) {
        setSelectedProvider(data[0]);
      }
    } catch (error) {
      logger.error('Erro ao carregar provedores', error instanceof Error ? error : new Error(String(error)), { component: 'SSOConfiguration' });
      // Mock data
      setProviders(mockProviders);
      setSelectedProvider(mockProviders[0]);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await fetch('/api/enterprise-sso/audit/stats');
      const data = await response.json();
      setAuditStats(data);
    } catch (error) {
      logger.error('Erro ao carregar estatísticas', error instanceof Error ? error : new Error(String(error)), { component: 'SSOConfiguration' });
      setAuditStats(mockAuditStats);
    }
  };

  const mockProviders: SSOProvider[] = [
    {
      id: 'azure-ad',
      name: 'Microsoft Azure AD',
      type: 'oidc',
      domain: 'empresa.onmicrosoft.com',
      status: 'active',
      lastTest: '2025-08-30T10:30:00Z',
      users: 234,
      configuration: {
        clientId: 'xxxx-xxxx-xxxx-xxxx',
        discoveryUrl: 'https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid_configuration'
      }
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      type: 'oauth',
      domain: 'empresa.com',
      status: 'active',
      lastTest: '2025-08-29T15:20:00Z',
      users: 156,
      configuration: {
        clientId: 'xxxx-xxxx.apps.googleusercontent.com'
      }
    },
    {
      id: 'okta-saml',
      name: 'Okta SAML',
      type: 'saml',
      domain: 'empresa.okta.com',
      status: 'testing',
      lastTest: null,
      users: 0,
      configuration: {
        entityId: 'http://www.okta.com/exk1234567890',
        ssoUrl: 'https://empresa.okta.com/app/estudio-ia/exk1234567890/sso/saml'
      }
    }
  ];

  const mockAuditStats = {
    activeSessions: 127,
    totalLogins24h: 245,
    failedLogins24h: 12,
    providersUsed: 2,
    averageSessionDuration: 45,
    securityAlerts: [
      {
        type: 'brute_force',
        severity: 'high',
        message: '7 tentativas de login falhadas do IP 192.168.1.100',
        timestamp: '2025-08-30T14:25:00Z'
      }
    ]
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/enterprise-sso/test/${providerId}`, {
        method: 'POST'
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      logger.error('Erro ao testar provedor', error instanceof Error ? error : new Error(String(error)), { component: 'SSOConfiguration' });
      setTestResult({
        success: false,
        details: { error: 'Erro de conectividade' }
      });
    }
  };

  const STATUS_CONFIG: Record<SSOStatus, { variant: NonNullable<BadgeProps['variant']>; icon: string; text: string }> = {
    active: { variant: 'default', icon: '✅', text: 'Ativo' },
    inactive: { variant: 'secondary', icon: '⏸️', text: 'Inativo' },
    testing: { variant: 'outline', icon: '🧪', text: 'Testando' }
  };

  const getStatusBadge = (status: SSOStatus) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
    return (
      <Badge variant={config.variant}>
        {config.icon} {config.text}
      </Badge>
    );
  };

  const getProviderIcon = (type: string) => {
    const icons = {
      oidc: '🔐',
      oauth: '🔑',
      saml: '📄',
      ldap: '🗂️'
    };
    return icons[type as keyof typeof icons] || '🔒';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏢 Enterprise SSO Configuration
          </h1>
          <p className="text-gray-600 text-lg">
            Configure Single Sign-On para integração com sistemas corporativos
          </p>
        </div>

        {/* Quick Stats */}
        {auditStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Sessões Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{auditStats.activeSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Logins 24h</p>
                    <p className="text-2xl font-bold text-blue-600">{auditStats.totalLogins24h}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Falhas</p>
                    <p className="text-2xl font-bold text-red-600">{auditStats.failedLogins24h}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Provedores</p>
                    <p className="text-2xl font-bold text-purple-600">{auditStats.providersUsed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Sessão Média</p>
                    <p className="text-2xl font-bold text-orange-600">{auditStats.averageSessionDuration}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Alertas</p>
                    <p className="text-2xl font-bold text-yellow-600">{auditStats.securityAlerts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="providers">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">🔐 Provedores</TabsTrigger>
            <TabsTrigger value="permissions">👥 Permissões</TabsTrigger>
            <TabsTrigger value="audit">📊 Auditoria</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Providers List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Provedores SSO</span>
                      <Button size="sm" onClick={() => setIsEditing(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Novo
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {providers.map((provider) => (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedProvider?.id === provider.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getProviderIcon(provider.type)}</span>
                            <h3 className="font-semibold text-sm">{provider.name}</h3>
                          </div>
                          {getStatusBadge(provider.status)}
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Domínio: {provider.domain}</div>
                          <div>Usuários: {provider.users}</div>
                          <div>Tipo: {provider.type.toUpperCase()}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {selectedProvider ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>🔧 {selectedProvider.name}</span>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestProvider(selectedProvider.id)}
                          >
                            <TestTube className="h-4 w-4 mr-1" />
                            Testar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Configuration Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Tipo de Provedor</label>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getProviderIcon(selectedProvider.type)}</span>
                              <Badge variant="outline">{selectedProvider.type.toUpperCase()}</Badge>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Domínio</label>
                            <Input 
                              value={selectedProvider.domain} 
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            {getStatusBadge(selectedProvider.status)}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Client ID</label>
                            <Input 
                              value={selectedProvider.configuration.clientId || 'Não configurado'} 
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Usuários Conectados</label>
                            <Input 
                              value={selectedProvider.users.toLocaleString()} 
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Último Teste</label>
                            <Input 
                              value={selectedProvider.lastTest ? new Date(selectedProvider.lastTest).toLocaleString() : 'Nunca testado'} 
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Test Results */}
                      {testResult && (
                        <div className={`p-4 rounded-lg border ${
                          testResult.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-2 mb-3">
                            {testResult.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <h4 className={`font-semibold ${
                              testResult.success ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {testResult.success ? 'Teste Bem-sucedido' : 'Teste Falhou'}
                            </h4>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            {testResult.details.connectivity !== undefined && (
                              <div>Conectividade: {testResult.details.connectivity ? '✅' : '❌'}</div>
                            )}
                            {testResult.details.responseTime && (
                              <div>Tempo de resposta: {testResult.details.responseTime}ms</div>
                            )}
                            {testResult.details.error && (
                              <div className="text-red-600">Erro: {testResult.details.error}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Configuration Form */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Configuração Detalhada</h4>
                        
                        {selectedProvider.type === 'oidc' && (
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Discovery URL</label>
                              <Input 
                                value={selectedProvider.configuration.discoveryUrl} 
                                placeholder="https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid_configuration"
                              />
                            </div>
                          </div>
                        )}

                        {selectedProvider.type === 'saml' && (
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Entity ID</label>
                              <Input 
                                value={selectedProvider.configuration.entityId} 
                                placeholder="http://www.okta.com/exk1234567890"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">SSO URL</label>
                              <Input 
                                value={selectedProvider.configuration.ssoUrl} 
                                placeholder="https://empresa.okta.com/app/estudio-ia/sso/saml"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                          Selecione um Provedor SSO
                        </h3>
                        <p className="text-gray-500">
                          Escolha um provedor para ver ou editar configurações
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            {/* Permission Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>👥 Grupos de Permissões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Administradores', users: 5, permissions: 7, color: 'red' },
                      { name: 'Gerentes', users: 12, permissions: 4, color: 'blue' },
                      { name: 'Instrutores', users: 28, permissions: 3, color: 'green' },
                      { name: 'Estudantes', users: 189, permissions: 2, color: 'gray' }
                    ].map((group) => (
                      <div key={group.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{group.name}</h4>
                          <p className="text-sm text-gray-600">{group.users} usuários</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{group.permissions} permissões</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔑 Permissões Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      'user_management',
                      'content_management',
                      'analytics_view',
                      'system_settings',
                      'sso_configuration',
                      'audit_logs',
                      'enterprise_features'
                    ].map((permission) => (
                      <div key={permission} className="flex items-center justify-between p-2 text-sm">
                        <span className="font-mono">{permission}</span>
                        <Badge variant="outline" className="text-xs">Sistema</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {/* Security Alerts */}
            {auditStats?.securityAlerts && auditStats.securityAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>⚠️ Alertas de Segurança</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditStats.securityAlerts.map((alert, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-red-800">Alerta de Segurança</h4>
                            <Badge variant="destructive">{alert.severity}</Badge>
                          </div>
                          <p className="text-sm text-red-700">{alert.message}</p>
                          <p className="text-xs text-red-600 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Summary */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Resumo de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{auditStats?.totalLogins24h || 0}</div>
                    <p className="text-sm text-gray-600">Logins Sucessos</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{auditStats?.failedLogins24h || 0}</div>
                    <p className="text-sm text-gray-600">Logins Falhados</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{auditStats?.activeSessions || 0}</div>
                    <p className="text-sm text-gray-600">Sessões Ativas</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{auditStats?.averageSessionDuration || 0}m</div>
                    <p className="text-sm text-gray-600">Duração Média</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Global SSO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Configurações Globais de SSO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="force-sso" defaultChecked />
                      <label htmlFor="force-sso" className="text-sm">
                        Forçar SSO para todos os usuários
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-provision" defaultChecked />
                      <label htmlFor="auto-provision" className="text-sm">
                        Provisionar usuários automaticamente
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="audit-enabled" defaultChecked />
                      <label htmlFor="audit-enabled" className="text-sm">
                        Habilitar logs de auditoria
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Timeout de Sessão (minutos)</label>
                      <Input type="number" defaultValue="480" min="30" max="1440" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Máximo de Sessões por Usuário</label>
                      <Input type="number" defaultValue="3" min="1" max="10" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Retenção de Logs (dias)</label>
                      <Input type="number" defaultValue="90" min="30" max="365" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Domain Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>🌐 Mapeamento de Domínios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input placeholder="empresa.com" />
                    <select className="px-3 py-2 border rounded-md">
                      <option value="azure-ad">Azure AD</option>
                      <option value="google-workspace">Google Workspace</option>
                      <option value="okta-saml">Okta SAML</option>
                    </select>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {[
                      { domain: 'empresa.com', provider: 'Google Workspace', users: 156 },
                      { domain: 'filial.empresa.com', provider: 'Azure AD', users: 78 }
                    ].map((mapping, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{mapping.domain}</span>
                          <span className="text-sm text-gray-600 ml-2">→ {mapping.provider}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{mapping.users} usuários</Badge>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
