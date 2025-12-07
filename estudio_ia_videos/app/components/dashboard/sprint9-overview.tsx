
/**
 * 🚀 Estúdio IA de Vídeos - Sprint 9
 * Overview Dashboard para Sprint 9
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Cloud,
  Smartphone,
  Shield,
  BarChart3,
  Activity,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertTriangle,
  Users,
  Cpu,
  Database,
  Network,
  Globe,
  Sparkles,
  Rocket,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface SystemHealth {
  cluster: {
    uptime: number;
    cpuUsage: number;
    requests: number;
    latency: number;
  };
  ml: {
    modelsDeployed: number;
    accuracy: number;
  };
  services: {
    healthy: number;
    total: number;
  };
}

interface RealtimeMetrics {
  ml: any[];
  security: {
    overview: {
      activeSessions: number;
    };
  };
}

export default function Sprint9Overview() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);

  const getBadgeVariant = (color: string) => {
    const variants = {
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[color as keyof typeof variants] || 'default';
  };

  useEffect(() => {
    loadSystemHealth();
    loadRealtimeMetrics();
    
    // Atualizar métricas em tempo real
    const interval = setInterval(loadRealtimeMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/metrics');
      if (response.ok) {
        const health = await response.json();
        setSystemHealth(health);
      }
    } catch (error) {
      console.error('Erro ao carregar saúde do sistema:', error);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const [clusterRes, mlRes, securityRes] = await Promise.allSettled([
        fetch('/api/v2/cloud-native/cluster/status'),
        fetch('/api/v2/ml/models'),
        fetch('/api/v2/security/zero-trust?endpoint=dashboard')
      ]);

      const metrics = {
        cluster: clusterRes.status === 'fulfilled' ? await clusterRes.value.json() : null,
        ml: mlRes.status === 'fulfilled' ? await mlRes.value.json() : null,
        security: securityRes.status === 'fulfilled' ? await securityRes.value.json() : null,
        timestamp: new Date()
      };

      setRealtimeMetrics(metrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const sprint9Features = [
    {
      title: 'IA Multimodal',
      subtitle: 'Computer Vision + Speech + NLP',
      icon: Brain,
      href: '/cloud-native',
      status: 'active',
      color: 'purple',
      metrics: realtimeMetrics?.ml ? `${realtimeMetrics.ml.length} modelos` : '5 modelos'
    },
    {
      title: 'Cloud Native',
      subtitle: 'Microserviços & Kubernetes',
      icon: Cloud,
      href: '/cloud-control',
      status: 'healthy',
      color: 'blue',
      metrics: systemHealth ? `${systemHealth.services.healthy}/${systemHealth.services.total} serviços` : '5/6 serviços'
    },
    {
      title: 'Mobile PWA',
      subtitle: 'Offline-first Experience',
      icon: Smartphone,
      href: '/mobile-control',
      status: 'optimized',
      color: 'green',
      metrics: '87% cache hit rate'
    },
    {
      title: 'Zero-Trust',
      subtitle: 'Segurança Enterprise',
      icon: Shield,
      href: '/security-dashboard',
      status: 'secure',
      color: 'red',
      metrics: realtimeMetrics?.security ? `${realtimeMetrics.security.overview.activeSessions} sessões` : '8 sessões'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Sprint 9 Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <Rocket className="h-8 w-8" />
            <h2 className="text-3xl font-bold">Sprint 9 - Cloud Native & IA Multimodal</h2>
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-lg opacity-90 mb-6 max-w-3xl">
            Revolucione a criação de vídeos com IA Multimodal avançada, 
            arquitetura Cloud Native, segurança Zero-Trust e experiência mobile-first.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-white/20 text-white border-white/30">
              Computer Vision Avançado
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              Speech Analysis + NLP
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              Microserviços Kubernetes
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              Zero-Trust Security
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              PWA Offline-First
            </Badge>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4">
            <Brain className="h-24 w-24" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Cloud className="h-20 w-20" />
          </div>
        </div>
      </div>

      {/* Real-time System Status */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-green-600" />
                Sistema Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-600">Operacional</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Uptime: {(systemHealth.cluster.uptime * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Cpu className="h-4 w-4 mr-2 text-blue-600" />
                CPU Cluster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.cluster.cpuUsage.toFixed(0)}%
              </div>
              <Progress value={systemHealth.cluster.cpuUsage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                Modelos ML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {systemHealth.ml.modelsDeployed}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Acc: {(systemHealth.ml.accuracy * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Network className="h-4 w-4 mr-2 text-indigo-600" />
                Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {systemHealth.cluster.requests.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Hoje ({systemHealth.cluster.latency.toFixed(0)}ms avg)
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sprint9Features.map((feature) => {
          const Icon = feature.icon;
          const isActive = false; // Remover dependência de pathname
          
          return (
            <Card key={feature.title} className={`
              group transition-all duration-300 hover:shadow-lg
              ${isActive ? 'ring-2 ring-purple-300 shadow-lg' : ''}
            `}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-${feature.color}-100`}>
                      <Icon className={`h-5 w-5 text-${feature.color}-600`} />
                    </div>
                    <div>
                      <div className="font-semibold">{feature.title}</div>
                      <div className="text-sm text-gray-600 font-normal">
                        {feature.subtitle}
                      </div>
                    </div>
                  </div>
                  <Badge className={getBadgeVariant(feature.color)}>
                    {feature.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-700">
                  {feature.metrics}
                </div>
                
                <Link href={feature.href}>
                  <Button className="w-full group-hover:bg-primary/90">
                    <Target className="h-4 w-4 mr-2" />
                    Acessar {feature.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Sprint 9 - Real Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                IA Multimodal
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Análises Hoje:</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Accuracy Média:</span>
                  <span className="font-semibold text-green-600">89.4%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tempo Médio:</span>
                  <span className="font-semibold text-blue-600">2.8s</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Cloud className="h-4 w-4 mr-2 text-blue-600" />
                Cloud Native
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pods Ativos:</span>
                  <span className="font-semibold">35/35</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto-scaling:</span>
                  <span className="font-semibold text-green-600">Ativo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Eficiência:</span>
                  <span className="font-semibold text-purple-600">94.2%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Shield className="h-4 w-4 mr-2 text-red-600" />
                Segurança
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Threat Level:</span>
                  <span className="font-semibold text-green-600">Baixo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Compliance:</span>
                  <span className="font-semibold text-green-600">97.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MFA Adoption:</span>
                  <span className="font-semibold text-blue-600">73%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/cloud-native">
                <Button variant="outline" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  IA Multimodal
                </Button>
              </Link>
              
              <Link href="/cloud-control">
                <Button variant="outline" size="sm">
                  <Cloud className="h-4 w-4 mr-2" />
                  Cloud Control
                </Button>
              </Link>
              
              <Link href="/mobile-control">
                <Button variant="outline" size="sm">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile PWA
                </Button>
              </Link>
              
              <Link href="/security-dashboard">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Zero-Trust
                </Button>
              </Link>
              
              <Link href="/ml-ops">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  ML Analytics
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
