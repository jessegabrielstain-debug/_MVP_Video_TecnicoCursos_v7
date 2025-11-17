
/**
 * 📝 SPRINT 37: Audit Logs Viewer
 * Visualização avançada de logs de auditoria com filtros
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createBrowserSupabaseClient } from '@/lib/services';
import type { User } from '@supabase/supabase-js';

interface AuditLog {
  id: string;
  timestamp: Date;
  userEmail: string | null;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  status: string;
  description: string | null;
  ipAddress: string | null;
}

export default function AuditLogsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [limit] = useState(50);

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

  useEffect(() => {
    if (!orgId) return;
    loadLogs();
  }, [orgId, page, actionFilter, statusFilter, startDate, endDate]);

  const loadLogs = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (actionFilter && actionFilter !== 'all') {
        params.append('action', actionFilter);
      }
      if (startDate) {
        params.append('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString());
      }

      const res = await fetch(`/api/org/${orgId}/audit-logs?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!orgId) return;

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const res = await fetch(`/api/org/${orgId}/audit-logs/export?${params}`);
      const blob = await res.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      alert('Erro ao exportar logs');
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('login')) return 'bg-blue-100 text-blue-800';
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    if (action.includes('update')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('sso')) return 'bg-purple-100 text-purple-800';
    if (action.includes('billing')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✓ Sucesso</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">✗ Falhou</span>;
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.userEmail?.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.resource.toLowerCase().includes(search) ||
        log.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Faça login para acessar os logs de auditoria.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📝 Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Histórico completo de ações e eventos da organização
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por usuário, ação, recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="security:login">Login</SelectItem>
                  <SelectItem value="security:logout">Logout</SelectItem>
                  <SelectItem value="project:created">Projeto Criado</SelectItem>
                  <SelectItem value="billing:payment_success">Pagamento</SelectItem>
                  <SelectItem value="sso:configured">SSO Configurado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button
                onClick={handleExportCSV}
                className="w-full"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <Button onClick={loadLogs} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Eventos ({total})</span>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ação
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recurso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{log.userName || 'Sistema'}</div>
                          <div className="text-gray-500 text-xs">{log.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-gray-500 text-xs">{log.resourceId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.ipAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, total)} de {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total || loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

