
'use client';

/**
 * SPRINT 36 - SSO CONFIGURATION PANEL
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SSOConfig {
  id?: string;
  provider: 'SAML' | 'OAUTH_GOOGLE' | 'OAUTH_MICROSOFT' | 'OAUTH_OKTA';
  isActive: boolean;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  enforceSSO: boolean;
}

interface Props {
  organizationId: string;
}

export function SSOConfigurationPanel({ organizationId }: Props) {
  const [config, setConfig] = useState<SSOConfig>({
    provider: 'SAML',
    isActive: false,
    enforceSSO: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const providerOptions: SSOConfig['provider'][] = ['SAML', 'OAUTH_GOOGLE', 'OAUTH_MICROSOFT', 'OAUTH_OKTA'];

  const isProviderValue = (value: string): value is SSOConfig['provider'] => {
    return providerOptions.some(option => option === value);
  };

  useEffect(() => {
    loadConfig();
  }, [organizationId]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/org/${organizationId}/sso`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      logger.error('Failed to load SSO config', error instanceof Error ? error : new Error(String(error)), { component: 'SSOConfigurationPanel' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configuração SSO salva com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`/api/org/${organizationId}/sso/test`, {
        method: 'POST',
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success('Teste de SSO bem-sucedido!');
      } else {
        toast.error('Teste de SSO falhou');
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao testar SSO' });
      toast.error('Erro ao testar SSO');
    } finally {
      setTesting(false);
    }
  };

  const copyMetadata = () => {
    const metadata = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/saml/metadata/${organizationId}`;
    navigator.clipboard.writeText(metadata);
    toast.success('URL de metadados copiada!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Single Sign-On (SSO)</CardTitle>
          </div>
          <CardDescription>
            Configure autenticação empresarial com SAML ou OAuth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div>
              <p className="font-medium">Status do SSO</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.isActive ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <Badge variant={config.isActive ? 'default' : 'secondary'}>
              {config.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <Tabs
            value={config.provider}
            onValueChange={(value) => {
              if (isProviderValue(value)) {
                setConfig({ ...config, provider: value });
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="SAML">SAML 2.0</TabsTrigger>
              <TabsTrigger value="OAUTH_OKTA">Okta</TabsTrigger>
              <TabsTrigger value="OAUTH_MICROSOFT">Azure AD</TabsTrigger>
              <TabsTrigger value="OAUTH_GOOGLE">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="SAML" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>SSO URL (Entry Point)</Label>
                <Input
                  placeholder="https://sso.example.com/saml2/sso"
                  value={config.samlEntryPoint || ''}
                  onChange={(e) => setConfig({ ...config, samlEntryPoint: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Entity ID (Issuer)</Label>
                <Input
                  placeholder="https://sso.example.com/saml2/metadata"
                  value={config.samlIssuer || ''}
                  onChange={(e) => setConfig({ ...config, samlIssuer: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Certificado X.509</Label>
                <Textarea
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  value={config.samlCert || ''}
                  onChange={(e) => setConfig({ ...config, samlCert: e.target.value })}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Service Provider Metadata</p>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/saml/metadata/${organizationId}`}
                      />
                      <Button size="sm" variant="outline" onClick={copyMetadata}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="OAUTH_OKTA" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Okta Domain</Label>
                <Input
                  placeholder="dev-123456.okta.com"
                  value={config.oauthClientId || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  placeholder="0oa..."
                  value={config.oauthClientSecret || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientSecret: e.target.value })}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    Configure o redirect URI em seu Okta: <br />
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/okta
                    </code>
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="OAUTH_MICROSOFT" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Application (client) ID</Label>
                <Input
                  placeholder="12345678-1234-1234-1234-123456789012"
                  value={config.oauthClientId || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Directory (tenant) ID</Label>
                <Input
                  placeholder="87654321-4321-4321-4321-210987654321"
                  value={config.samlIssuer || ''}
                  onChange={(e) => setConfig({ ...config, samlIssuer: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={config.oauthClientSecret || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientSecret: e.target.value })}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    Configure o redirect URI no Azure: <br />
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/azure-ad
                    </code>
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="OAUTH_GOOGLE" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={config.oauthClientId || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder="GOCSPX-..."
                  value={config.oauthClientSecret || ''}
                  onChange={(e) => setConfig({ ...config, oauthClientSecret: e.target.value })}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    Configure o redirect URI no Google Console: <br />
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google
                    </code>
                  </p>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Forçar SSO para todos os membros</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Desativar login com senha quando SSO estiver ativo
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enforceSSO}
                onChange={(e) => setConfig({ ...config, enforceSSO: e.target.checked })}
                className="h-4 w-4"
              />
            </div>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Configuração
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guia de Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Configure seu Identity Provider</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No seu provedor de SSO (Okta, Azure AD, Google, etc.), crie uma nova aplicação SAML ou OAuth.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Adicione as URLs de callback</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use as URLs fornecidas acima para configurar os redirects no seu provedor.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Copie as credenciais</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Copie o Client ID, Secret, ou certificados do seu provedor e cole aqui.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">4. Teste a configuração</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique em "Testar Conexão" para validar a configuração antes de ativar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
