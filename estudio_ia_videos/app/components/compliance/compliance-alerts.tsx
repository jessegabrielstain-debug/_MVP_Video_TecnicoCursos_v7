'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  Clock,
  ExternalLink,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  projectId: string;
  projectTitle: string;
  nrType: string;
  score: number;
  createdAt: string;
  suggestions?: string[];
  missingPoints?: string[];
  action: string;
}

interface AlertsSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export function ComplianceAlerts() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [summary, setSummary] = useState<AlertsSummary>({ total: 0, critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/compliance/alerts' : `/api/compliance/alerts?severity=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        setSummary(data.summary);
      }
    } catch (error) {
      logger.error('Error fetching alerts', error instanceof Error ? error : new Error(String(error)), { component: 'ComplianceAlerts' });
      toast.error('Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'review_immediately':
        return 'Revisar Imediatamente';
      case 'review_soon':
        return 'Revisar em Breve';
      case 'add_content':
        return 'Adicionar Conteúdo';
      default:
        return 'Ação Necessária';
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      const response = await fetch('/api/compliance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });

      if (response.ok) {
        toast.success('Ação executada com sucesso');
        fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      logger.error('Error handling alert action', error instanceof Error ? error : new Error(String(error)), { component: 'ComplianceAlerts' });
      toast.error('Erro ao executar ação');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Alertas de Compliance</h3>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real de questões de conformidade
          </p>
        </div>
        <Button onClick={fetchAlerts} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('critical')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div className="text-2xl font-bold text-red-500">{summary.critical}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('warning')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-500">{summary.warning}</div>
              <div className="text-sm text-muted-foreground">Avisos</div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('info')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold text-blue-500">{summary.info}</div>
              <div className="text-sm text-muted-foreground">Info</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground text-center">
                {filter === 'all' 
                  ? 'Nenhum alerta de compliance encontrado. Tudo está em ordem!' 
                  : `Nenhum alerta do tipo "${filter}" encontrado.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start space-x-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <AlertTitle className="text-sm font-medium">
                        {alert.title}
                      </AlertTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getBadgeVariant(alert.type)}>
                          {alert.nrType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.score}%
                        </Badge>
                      </div>
                    </div>
                    
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>Projeto: {alert.projectTitle}</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/projects/${alert.projectId}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Projeto
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAlertAction(alert.id, alert.action)}
                        >
                          {getActionText(alert.action)}
                        </Button>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {alert.suggestions && alert.suggestions.length > 0 && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <div className="text-xs font-medium mb-1">Sugestões:</div>
                        <ul className="text-xs space-y-1">
                          {alert.suggestions.slice(0, 3).map((suggestion, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Points */}
                    {alert.missingPoints && alert.missingPoints.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-xs font-medium mb-1 text-red-700">
                          Pontos Críticos Ausentes:
                        </div>
                        <ul className="text-xs space-y-1 text-red-600">
                          {alert.missingPoints.slice(0, 3).map((point, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
}