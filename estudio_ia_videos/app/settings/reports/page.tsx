
/**
 * 📊 SPRINT 37: Reports Generator
 * Interface para geração de relatórios customizados
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, FileText, Table, Calendar, TrendingUp } from 'lucide-react';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

type ReportType = 'analytics' | 'security' | 'audit_logs' | 'billing' | 'usage' | 'sso' | 'members';

interface ReportOption {
  value: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const reportOptions: ReportOption[] = [
  {
    value: 'analytics',
    label: 'Analytics',
    description: 'Projetos, renders, TTS, uploads e usuários ativos',
    icon: TrendingUp,
  },
  {
    value: 'security',
    label: 'Segurança',
    description: 'Logins, alertas de segurança e uso de SSO',
    icon: FileText,
  },
  {
    value: 'audit_logs',
    label: 'Auditoria',
    description: 'Histórico completo de eventos e ações',
    icon: Table,
  },
  {
    value: 'billing',
    label: 'Financeiro',
    description: 'Pagamentos, receita e ticket médio',
    icon: FileText,
  },
  {
    value: 'usage',
    label: 'Uso de Recursos',
    description: 'Membros, projetos e armazenamento',
    icon: Table,
  },
  {
    value: 'sso',
    label: 'SSO',
    description: 'Uso de SSO por provedor',
    icon: FileText,
  },
  {
    value: 'members',
    label: 'Membros',
    description: 'Lista de membros ativos por role',
    icon: Table,
  },
];

export default function ReportsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportType>('analytics');
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const orgId = user?.user_metadata?.currentOrgId;

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(data.user ?? null);
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error);
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

  const handleGenerateReport = async () => {
    if (!orgId || !startDate || !endDate) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Data inicial deve ser anterior à data final');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/org/${orgId}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedReport,
          startDate,
          endDate,
          format,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao gerar relatório');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'html' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert(error instanceof Error ? error.message : 'Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  // Set default dates (last 30 days)
  const initializeDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Initialize dates on mount
  useEffect(() => {
    initializeDates();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Faça login para acessar o gerador de relatórios.</p>
      </div>
    );
  }

  const selectedOption = reportOptions.find((opt) => opt.value === selectedReport);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Gerador de Relatórios</h1>
        <p className="text-muted-foreground">
          Crie relatórios personalizados em PDF ou CSV
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Types */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportOptions.map((option) => {
                  const IconComponent = option.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedReport(option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedReport === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`h-6 w-6 ${selectedReport === option.value ? 'text-blue-600' : 'text-gray-600'}`} />
                        <div>
                          <h3 className="font-semibold mb-1">{option.label}</h3>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Report Info */}
              {selectedOption && (() => {
                const SelectedIcon = selectedOption.icon as React.ComponentType<{ className?: string }>;
                return (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <SelectedIcon className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">{selectedOption.label}</span>
                    </div>
                    <p className="text-sm text-blue-700">{selectedOption.description}</p>
                  </div>
                );
              })()}

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Período
                </label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Data inicial"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Data final"
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Formato
                </label>
                <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'csv')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      PDF (Apresentação)
                    </SelectItem>
                    <SelectItem value="csv">
                      CSV (Análise de Dados)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateReport}
                disabled={generating || !startDate || !endDate}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>

              {/* Quick Dates */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Períodos Rápidos</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Últimos 7 dias', days: 7 },
                    { label: 'Últimos 30 dias', days: 30 },
                    { label: 'Últimos 90 dias', days: 90 },
                    { label: 'Este ano', days: Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) },
                  ].map((period) => (
                    <Button
                      key={period.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - period.days);
                        setStartDate(start.toISOString().split('T')[0]);
                        setEndDate(end.toISOString().split('T')[0]);
                      }}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold mb-1">Formato PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Relatório corporativo formatado com logo, gráficos e tabelas. Ideal para apresentações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Table className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold mb-1">Formato CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Dados em planilha para análise avançada. Compatível com Excel e Google Sheets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Download className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold mb-1">Download Imediato</h3>
                <p className="text-sm text-muted-foreground">
                  Relatório gerado instantaneamente e baixado automaticamente para seu dispositivo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

