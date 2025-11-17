
/**
 * 🔒 SPRINT 37: Security Analytics Dashboard
 * Dashboard avançado de métricas de segurança e uso
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Users, Activity, TrendingUp, Lock, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SecurityStats {
  logins: {
    successful: number;
    failed: number;
    sso: number;
    successRate: number;
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  usage: {
    activeUsers: number;
    projects: number;
    renders: number;
    ttsConversions: number;
  };
  sso: {
    enabled: boolean;
    providers: number;
    loginsBySso: number;
  };
}

export default function SecurityAnalyticsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const orgId = user?.user_metadata?.currentOrgId;

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(data.user ?? null);
      } catch (error) {
        console.error('[SecurityAnalytics] Falha ao carregar usuário:', error);
      }
    };

    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!orgId) return;

    loadStatistics();
  }, [orgId, period]);

  const loadStatistics = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Busca alertas
      const alertsRes = await fetch(
        `/api/org/${orgId}/alerts/statistics?` +
          new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
      );
      const alertsData = await alertsRes.json();

      // Mock de outros dados (em produção, buscar de APIs reais)
      const mockStats: SecurityStats = {
        logins: {
          successful: 1250 + Math.floor(Math.random() * 500),
          failed: 45 + Math.floor(Math.random() * 50),
          sso: 890 + Math.floor(Math.random() * 300),
          successRate: 96.5 + Math.random() * 2,
        },
        alerts: alertsData.statistics || {
          total: 0,
          critical: 0,
          high: 0,
          bySeverity: {},
          byType: {},
        },
        usage: {
          activeUsers: 45 + Math.floor(Math.random() * 20),
          projects: 123 + Math.floor(Math.random() * 50),
          renders: 456 + Math.floor(Math.random() * 100),
          ttsConversions: 789 + Math.floor(Math.random() * 200),
        },
        sso: {
          enabled: true,
          providers: 2,
          loginsBySso: 890,
        },
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Faça login para acessar o dashboard de segurança.</p>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const severityColors = {
    critical: '#991b1b',
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6',
  };

  const loginChartData = [
    { name: 'Bem-sucedidos', value: stats.logins.successful, fill: '#10b981' },
    { name: 'Falhados', value: stats.logins.failed, fill: '#ef4444' },
  ];

  const alertsBySeverityData = Object.entries(stats.alerts.bySeverity || {}).map(
    ([severity, count]) => ({
      name: severity,
      value: count,
      fill: severityColors[severity as keyof typeof severityColors] || '#6b7280',
    })
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔒 Security & Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitoramento avançado de segurança e uso da plataforma
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.logins.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.logins.successful} logins bem-sucedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.alerts.critical}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.alerts.total} alertas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.usage.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {period === '7d' ? 7 : period === '30d' ? 30 : 90} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SSO Ativo</CardTitle>
            <Lock className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sso.providers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.sso.loginsBySso} logins via SSO
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList>
          <TabsTrigger value="security">🔒 Segurança</TabsTrigger>
          <TabsTrigger value="usage">📊 Uso</TabsTrigger>
          <TabsTrigger value="alerts">🚨 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logins Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Logins por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={loginChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {loginChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* SSO Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas SSO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-900">Status</p>
                    <p className="text-2xl font-bold text-green-600">Ativo</p>
                  </div>
                  <Shield className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Provedores Configurados
                    </span>
                    <span className="font-bold">{stats.sso.providers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Logins via SSO
                    </span>
                    <span className="font-bold">{stats.sso.loginsBySso}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Taxa de uso SSO
                    </span>
                    <span className="font-bold">
                      {((stats.sso.loginsBySso / stats.logins.successful) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Projetos', value: stats.usage.projects },
                      { name: 'Renders', value: stats.usage.renders },
                      { name: 'TTS', value: stats.usage.ttsConversions },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Usuários Ativos', value: stats.usage.activeUsers, icon: Users },
                  { label: 'Projetos', value: stats.usage.projects, icon: Activity },
                  { label: 'Renders', value: stats.usage.renders, icon: TrendingUp },
                  { label: 'TTS', value: stats.usage.ttsConversions, icon: Activity },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <metric.icon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">{metric.label}</span>
                    </div>
                    <span className="text-xl font-bold">{metric.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts by Severity */}
            {alertsBySeverityData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alertas por Severidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={alertsBySeverityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {alertsBySeverityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Alert Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.alerts.bySeverity || {}).map(([severity, count]) => (
                  <div
                    key={severity}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor:
                        severityColors[severity as keyof typeof severityColors] + '20',
                    }}
                  >
                    <span className="font-medium capitalize">{severity}</span>
                    <span className="text-xl font-bold">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.alerts.bySeverity || {}).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p>Nenhum alerta no período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

