
'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface SLO {
  name: string;
  description: string;
  target: number;
  current: number;
  window: string;
  type: string;
  unit: string;
}

interface ErrorBudget {
  service: string;
  period: string;
  budget: number;
  consumed: number;
  remaining: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
}

export function SLODashboard() {
  const [slos, setSlos] = useState<SLO[]>([]);
  const [errorBudgets, setErrorBudgets] = useState<ErrorBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  useEffect(() => {
    fetchSLOs();
  }, []);

  const fetchSLOs = async () => {
    try {
      const response = await fetch('/api/ga/slos?action=report');
      const data = await response.json();
      
      setSlos(data.slos || []);
      setErrorBudgets(data.errorBudgets || []);
      setOverallHealth(data.overallHealth || 'healthy');
    } catch (error) {
      logger.error('Error fetching SLOs', error instanceof Error ? error : new Error(String(error)), { component: 'SLODashboard' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-orange-500';
      case 'exhausted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-orange-100 text-orange-800',
      exhausted: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || ''}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-4">Carregando SLOs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Health Overview</span>
            {getStatusBadge(overallHealth)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {overallHealth === 'healthy' && 'All systems operating normally'}
              {overallHealth === 'warning' && 'Some SLOs need attention'}
              {overallHealth === 'critical' && 'Critical SLO violations detected'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* SLOs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slos.map((slo, index) => {
          const errorBudget = errorBudgets[index];
          const percentage = errorBudget
            ? Math.min(100, (errorBudget.consumed / errorBudget.budget) * 100)
            : 0;

          return (
            <Card key={slo.name}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{slo.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {slo.current.toFixed(slo.unit === 'percentage' ? 1 : 0)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Target: {slo.target} {slo.unit}
                    </span>
                  </div>

                  {errorBudget && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Error Budget</span>
                        {getStatusBadge(errorBudget.status)}
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {errorBudget.remaining.toFixed(2)} / {errorBudget.budget.toFixed(2)} remaining
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">{slo.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
