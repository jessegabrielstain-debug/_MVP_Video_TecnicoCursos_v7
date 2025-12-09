
'use client';

/**
 * SPRINT 36 - CUSTOM DOMAIN CONFIGURATION
 */

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DomainInfo {
  domain: string;
  verified: boolean;
  verifiedAt?: string;
  instructions: {
    records: Array<{
      type: string;
      name: string;
      value: string;
    }>;
    instructions: string[];
  };
}

interface Props {
  organizationId: string;
}

export function DomainConfiguration({ organizationId }: Props) {
  const [domain, setDomain] = useState('');
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadDomainInfo();
  }, [organizationId]);

  const loadDomainInfo = async () => {
    try {
      const response = await fetch(`/api/org/${organizationId}/domain/validate`);
      if (response.ok) {
        const data = await response.json();
        if (data.configured) {
          setDomainInfo(data);
          setDomain(data.domain);
        }
      }
    } catch (error) {
      logger.error('Failed to load domain info', error instanceof Error ? error : new Error(String(error)), { component: 'DomainConfiguration' });
    }
  };

  const handleVerify = async () => {
    if (!domain) {
      toast.error('Por favor, insira um domínio');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`/api/org/${organizationId}/domain/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Domínio verificado com sucesso!');
        setDomainInfo(data);
      } else {
        toast.error('Falha na verificação do domínio');
        setDomainInfo(data);
      }
    } catch (error) {
      toast.error('Erro ao verificar domínio');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle>Domínio Personalizado</CardTitle>
          </div>
          <CardDescription>
            Configure um domínio customizado para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {domainInfo?.verified ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium text-green-600">
                    Domínio verificado com sucesso!
                  </p>
                  <p className="text-sm">
                    {domainInfo.domain} está ativo e configurado corretamente.
                  </p>
                  {domainInfo.verifiedAt && (
                    <p className="text-xs text-gray-600">
                      Verificado em {new Date(domainInfo.verifiedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Seu Domínio</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="meudominio.com.br"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <Button onClick={handleVerify} disabled={verifying}>
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {domainInfo && !domainInfo.verified && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Domínio ainda não verificado. Configure os registros DNS abaixo.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {domainInfo?.instructions && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Configuração DNS</h4>
              
              <div className="space-y-3">
                {domainInfo.instructions.records.map((record, idx) => (
                  <Card key={idx} className="p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{record.type}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Nome:</p>
                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded block">
                          {record.name}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Valor:</p>
                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded block break-all">
                          {record.value}
                        </code>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Instruções:</p>
                    {domainInfo.instructions.instructions.map((instruction, idx) => (
                      <p key={idx} className="text-xs">
                        {instruction}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!domainInfo?.verified && (
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={handleVerify} disabled={verifying}>
                {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verificar Domínio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Adicione os registros DNS</p>
                <p className="text-gray-600 dark:text-gray-400">
                  No painel do seu provedor de domínio (GoDaddy, HostGator, Registro.br, etc.)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Aguarde a propagação</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Pode levar de 15 minutos a 48 horas (geralmente 30 minutos)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Clique em "Verificar Domínio"</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Vamos validar automaticamente a configuração
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Pronto!</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Seu domínio estará ativo e com certificado SSL automático
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
