
'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CostAlert {
  threshold: number;
  current: number;
  service: string;
  severity: 'warning' | 'critical';
}

interface CostDashboard {
  total: number;
  byCategory: Record<string, number>;
  byService: Record<string, number>;
  alerts: CostAlert[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

export function CostDashboard() {
  const [data, setData] = useState<CostDashboard | null>(null);
  const [projection, setProjection] = useState<{ projected: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const [dashboardRes, projectionRes] = await Promise.all([
        fetch('/api/ga/costs?action=dashboard'),
        fetch('/api/ga/costs?action=projection'),
      ]);

      const dashboardData = await dashboardRes.json();
      const projectionData = await projectionRes.json();

      setData(dashboardData);
      setProjection(projectionData);
    } catch (error) {
      logger.error('Error fetching costs', error instanceof Error ? error : new Error(String(error)), { component: 'CostDashboard' });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading || !data) {
    return <div className="p-4">Carregando custos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Daily Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
              {getTrendIcon(data.trend)}
              <span>{data.trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projection ? formatCurrency(projection.projected) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {projection ? `${(projection.confidence * 100).toFixed(0)}% confidence` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Badge variant={data.alerts.length > 0 ? 'destructive' : 'secondary'}>
              {data.alerts.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.alerts.length > 0 ? 'Thresholds exceeded' : 'All within limits'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.map((alert, index) => (
              <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>{alert.service}</strong> exceeded threshold
                    </span>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {formatCurrency(alert.current)} / {formatCurrency(alert.threshold)}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(data.byCategory).map(([category, cost]) => {
            const percentage = (cost / data.total) * 100;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{category}</span>
                  <span className="font-medium">{formatCurrency(cost)}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* By Service */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(data.byService).map(([service, cost]) => (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm">{service}</span>
              <span className="font-medium">{formatCurrency(cost)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
