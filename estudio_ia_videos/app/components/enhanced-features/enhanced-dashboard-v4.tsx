
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Film, Brain, Users, BarChart3, Zap,
  Sparkles, Target, Clock, TrendingUp,
  Play, Settings, Download, Share2,
  Video, Activity, Palette, Mic,
  Award, AlertCircle, Eye,
  Calendar, User, Bell, Search,
  Plus, ArrowRight, Maximize2
} from 'lucide-react';
import Link from 'next/link';

interface ProjectSprint24 {
  id: string;
  name: string;
  type: 'timeline' | 'collaboration' | 'analytics' | 'mobile' | 'ai-generation';
  status: 'active' | 'completed' | 'scheduled';
  progress: number;
  aiScore: number;
  lastUpdated: string;
  thumbnail: string;
  features: string[];
}

interface Sprint24Metric {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

const EnhancedDashboardV4 = () => {
  const [activeView, setActiveView] = useState<'overview' | 'sprint24' | 'analytics' | 'projects'>('sprint24');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors by only rendering time on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const [sprint24Projects] = useState<ProjectSprint24[]>([
    {
      id: 'timeline-professional',
      name: 'Timeline Multi-Track Professional',
      type: 'timeline',
      status: 'active',
      progress: 95,
      aiScore: 96.8,
      lastUpdated: '2024-09-26T15:30:00Z',
      thumbnail: '🎬',
      features: ['Advanced Timeline', 'Keyframe System', 'Audio Sync IA', 'Motion Graphics']
    },
    {
      id: 'collaboration-hub',
      name: 'Real-Time Collaboration Hub',
      type: 'collaboration',
      status: 'active',
      progress: 88,
      aiScore: 94.2,
      lastUpdated: '2024-09-26T14:45:00Z',
      thumbnail: '👥',
      features: ['Live Collaboration', 'AI Conflict Resolution', 'Version Control', 'Comments System']
    },
    {
      id: 'predictive-analytics',
      name: 'Predictive Analytics Advanced',
      type: 'analytics',
      status: 'active',
      progress: 92,
      aiScore: 91.5,
      lastUpdated: '2024-09-26T15:15:00Z',
      thumbnail: '🔮',
      features: ['Content Prediction', 'Performance Optimization', 'Resource Planning', 'AI Insights']
    },
    {
      id: 'mobile-assistant',
      name: 'Mobile IA Assistant',
      type: 'mobile',
      status: 'completed',
      progress: 100,
      aiScore: 89.7,
      lastUpdated: '2024-09-26T13:20:00Z',
      thumbnail: '📱',
      features: ['Mobile Dashboard', 'Voice Recording', 'Quick Capture', 'AI Templates']
    },
    {
      id: 'ai-content-generation',
      name: 'AI Content Generation',
      type: 'ai-generation',
      status: 'active',
      progress: 90,
      aiScore: 97.3,
      lastUpdated: '2024-09-26T15:45:00Z',
      thumbnail: '🤖',
      features: ['Content AI', 'Smart Templates', 'Auto Generation', 'Quality Analysis']
    }
  ]);

  const [sprint24Metrics] = useState<Sprint24Metric[]>([
    {
      name: 'System Functionality',
      current: 97,
      target: 95,
      unit: '%',
      trend: 'up',
      color: 'text-green-400'
    },
    {
      name: 'AI Integration',
      current: 94.5,
      target: 90,
      unit: '%',
      trend: 'up',
      color: 'text-purple-400'
    },
    {
      name: 'User Experience',
      current: 92.8,
      target: 85,
      unit: '/100',
      trend: 'up',
      color: 'text-blue-400'
    },
    {
      name: 'Performance Score',
      current: 96.1,
      target: 90,
      unit: '%',
      trend: 'up',
      color: 'text-yellow-400'
    }
  ]);

  const [quickActions] = useState([
    {
      title: 'Timeline Professional',
      description: 'Editor timeline multi-track com IA',
      icon: <Film className="w-6 h-6" />,
      href: '/timeline-multi-track-professional',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Collaboration Hub',
      description: 'Colaboração em tempo real',
      icon: <Users className="w-6 h-6" />,
      href: '/collaborative-ia-studio',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Predictive Analytics',
      description: 'Analytics preditivo avançado',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/predictive-analytics-advanced',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Mobile Assistant',
      description: 'Assistente móvel IA',
      icon: <Brain className="w-6 h-6" />,
      href: '/mobile-ia-assistant',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'AI Content Generator',
      description: 'Geração de conteúdo IA',
      icon: <Sparkles className="w-6 h-6" />,
      href: '/ai-content-generation',
      color: 'bg-pink-600 hover:bg-pink-700'
    }
  ]);

  const [aiInsights] = useState([
    {
      type: 'success',
      title: 'Sprint 24 97% Concluído',
      message: 'Timeline Professional e Analytics Preditivo estão funcionando perfeitamente',
      action: 'Ver Detalhes'
    },
    {
      type: 'info',
      title: 'Novo Recorde de Performance',
      message: 'Sistema alcançou 96.1% de performance, superando meta em 6.1%',
      action: 'Analytics'
    },
    {
      type: 'tip',
      title: 'Oportunidade de Otimização',
      message: 'IA identificou 3 áreas para potencial melhoria de 15% no engajamento',
      action: 'Otimizar'
    }
  ]);

  // Dashboard functions
  const handleOpenProject = useCallback((projectId: string) => {
    logger.debug(`Abrindo projeto: ${projectId}`, { component: 'EnhancedDashboardV4', projectId });
  }, []);

  const handleQuickAction = useCallback((href: string) => {
    logger.debug(`Navegando para: ${href}`, { component: 'EnhancedDashboardV4', href });
  }, []);

  const getStatusColor = (status: ProjectSprint24['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'active': return 'text-blue-400 bg-blue-900/20';
      case 'scheduled': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTrendIcon = (trend: Sprint24Metric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'tip': return '💡';
      case 'warning': return '⚠️';
      default: return '📝';
    }
  };

  const formatTime = (timestamp: string) => {
    // Only format time on client-side to prevent hydration errors
    if (!mounted) {
      return '--:--';
    }
    return new Date(timestamp).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Film className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Estúdio IA</h1>
            </div>
            <Badge variant="outline" className="border-purple-400 text-purple-400">
              <Sparkles className="w-4 h-4 mr-1" />
              Sprint 24
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "projects" | "analytics" | "overview" | "sprint24")} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sprint24">Sprint 24</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sprint24" className="space-y-6">
            {/* Sprint 24 Hero */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-400/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    🎬 Sprint 24 - Timeline Professional
                  </h2>
                  <p className="text-xl text-gray-300 mb-6">
                    Sistema profissional completo com Timeline Multi-Track, Colaboração IA, Analytics Preditivo e Mobile Assistant.
                  </p>
                  <div className="flex gap-4">
                    <Link href="/timeline-multi-track-professional">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Film className="w-5 h-5 mr-2" />
                        Timeline Professional
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline">
                      <Eye className="w-5 h-5 mr-2" />
                      Ver Demonstração
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {sprint24Metrics.map((metric) => (
                    <div key={metric.name} className="bg-black/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${metric.color}`}>
                            {metric.current}{metric.unit}
                          </span>
                          {getTrendIcon(metric.trend)}
                        </div>
                      </div>
                      <Progress 
                        value={(metric.current / metric.target) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Meta: {metric.target}{metric.unit}</span>
                        <span>{metric.current > metric.target ? '+' : ''}{((metric.current / metric.target - 1) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sprint 24 Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sprint24Projects.map((project) => (
                <Card key={project.id} className="bg-gray-800 border-gray-700 hover:border-purple-400/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{project.thumbnail}</div>
                        <div>
                          <CardTitle className="text-lg text-white">{project.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Atualizado: {formatTime(project.lastUpdated)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">
                          {project.progress}%
                        </div>
                        <div className="text-xs text-gray-400">
                          IA Score: {project.aiScore}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <Progress value={project.progress} className="h-2" />
                    
                    <div className="flex flex-wrap gap-2">
                      {project.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/${project.id}`} className="flex-1">
                        <Button 
                          size="sm" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Abrir
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="px-3">
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions Sprint 24 */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Ações Rápidas - Sprint 24
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="ghost"
                        className={`h-20 w-full flex flex-col gap-2 ${action.color} text-white p-4`}
                        onClick={() => handleQuickAction(action.href)}
                      >
                        {action.icon}
                        <div className="text-center">
                          <div className="text-sm font-semibold">{action.title}</div>
                          <div className="text-xs opacity-80">{action.description}</div>
                        </div>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6">
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-900/50 to-blue-800/30 border-blue-400/30">
                <CardContent className="p-6 text-center">
                  <Film className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">588</div>
                  <div className="text-sm text-blue-300">Módulos Total</div>
                  <div className="text-xs text-gray-400 mt-2">
                    571 funcionais (97%)
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-purple-400/30">
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">94.7%</div>
                  <div className="text-sm text-purple-300">IA Integration</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Sprint 24 completo
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-900/50 to-green-800/30 border-green-400/30">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">96.1%</div>
                  <div className="text-sm text-green-300">Performance</div>
                  <div className="text-xs text-gray-400 mt-2">
                    +6.1% acima da meta
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 border-yellow-400/30">
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">Enterprise</div>
                  <div className="text-sm text-yellow-300">Ready</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Production stable
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  IA Insights do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg">
                    <div className="text-xl">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{insight.message}</p>
                      <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 mt-2 p-0 h-auto">
                        {insight.action} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Analytics Avançado</h3>
              <p className="text-gray-400 mb-4">Acesse o dashboard completo de analytics preditivo</p>
              <Link href="/predictive-analytics-advanced">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Analytics Completo
                </Button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sprint24Projects.map((project) => (
                <Card key={project.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{project.thumbnail}</div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{project.name}</h4>
                        <div className="text-xs text-gray-400">{project.type}</div>
                      </div>
                    </div>
                    
                    <Progress value={project.progress} className="h-2 mb-3" />
                    
                    <div className="flex justify-between items-center">
                      <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                      <span className="text-xs text-purple-400">
                        {project.aiScore}% IA
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedDashboardV4;
