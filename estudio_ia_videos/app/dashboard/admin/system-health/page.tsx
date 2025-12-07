import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SystemHealthPage() {
  // In a real app, fetch this data from /api/health
  const healthData = {
    status: 'healthy',
    uptime: '99.9%',
    database: 'connected',
    redis: 'connected',
    storage: 'connected',
    aiServices: {
      elevenlabs: 'operational',
      did: 'operational',
      synthesia: 'disabled'
    },
    lastCheck: new Date().toISOString()
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real da infraestrutura</p>
        </div>
        <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'} className="text-lg px-4 py-1">
          {healthData.status === 'healthy' ? 'OPERATIONAL' : 'ISSUES DETECTED'}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {healthData.database === 'connected' ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
              Connected
            </div>
            <p className="text-xs text-muted-foreground">Supabase PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue System</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {healthData.redis === 'connected' ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-yellow-500" />}
              Active
            </div>
            <p className="text-xs text-muted-foreground">BullMQ / Redis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              2/3 Online
            </div>
            <p className="text-xs text-muted-foreground">ElevenLabs, D-ID Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              Enforced
            </div>
            <p className="text-xs text-muted-foreground">RLS + Middleware</p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Service Status Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(healthData.aiServices).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between border-b pb-2">
                <span className="capitalize font-medium">{service}</span>
                <Badge variant={status === 'operational' ? 'outline' : 'secondary'}>
                  {status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
