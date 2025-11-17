'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mic, 
  Video, 
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  Plus,
  Settings,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

interface Avatar {
  id: string;
  display_name: string;
  gender: 'male' | 'female';
  avatar_type: string;
  is_active: boolean;
  created_at: string;
}

interface Voice {
  id: string;
  display_name: string;
  gender: 'male' | 'female';
  language: string;
  is_active: boolean;
  created_at: string;
}

interface SystemStats {
  id: string;
  total_renders: number;
  cpu_usage: number;
  memory_usage: number;
  created_at: string;
}

export default function DashboardPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  // KPIs principais
  const totalAvatars = avatars.length;
  const totalVoices = voices.length;
  const activeAvatars = avatars.filter(a => a.is_active).length;
  const totalRenders = systemStats.reduce((sum, stat) => sum + (stat.total_renders || 0), 0);

  // Dados para gráficos
  const genderData = [
    { name: 'Masculino', value: avatars.filter(a => a.gender === 'male').length, color: '#8B5CF6' },
    { name: 'Feminino', value: avatars.filter(a => a.gender === 'female').length, color: '#06B6D4' }
  ];

  const languageData = voices.reduce((acc, voice) => {
    const lang = voice.language || 'Não especificado';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageChartData = Object.entries(languageData).map(([language, count]) => ({
    language,
    count,
    fill: `url(#gradient-${language})`
  }));

  const performanceData = systemStats.slice(-10).map(stat => ({
    time: new Date(stat.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    cpu: stat.cpu_usage || 0,
    memory: stat.memory_usage || 0,
    renders: stat.total_renders || 0
  }));

  useEffect(() => {
    loadData();
    setupRealtime();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar avatares
      const { data: avatarsData } = await supabase
        .from('avatar_models')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Carregar vozes
      const { data: voicesData } = await supabase
        .from('voice_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Carregar estatísticas
      const { data: statsData } = await supabase
        .from('system_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (avatarsData) setAvatars(avatarsData);
      if (voicesData) setVoices(voicesData);
      if (statsData) setSystemStats(statsData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avatar_models' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_profiles' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !genderFilter || avatar.gender === genderFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && avatar.is_active) ||
      (statusFilter === 'inactive' && !avatar.is_active);
    return matchesSearch && matchesGender && matchesStatus;
  });

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !genderFilter || voice.gender === genderFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && voice.is_active) ||
      (statusFilter === 'inactive' && !voice.is_active);
    return matchesSearch && matchesGender && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Carregando Dashboard...</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Preparando seus dados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Premium */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Realtime Ativo</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Avatar 3D Studio
              </h1>
              <p className="text-lg text-white/90">Dashboard Premium com Analytics Avançado</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={loadData}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button className="bg-white text-violet-600 hover:bg-white/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Avatares</CardTitle>
              <Users className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalAvatars}</div>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {activeAvatars} ativos
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Vozes</CardTitle>
              <Mic className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalVoices}</div>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {voices.filter(v => v.is_active).length} ativas
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Renders Totais</CardTitle>
              <Video className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalRenders.toLocaleString()}</div>
              <Progress value={75} className="mt-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">75% da capacidade</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">98.5%</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">+2.1% este mês</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Controles */}
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar avatares, vozes ou projetos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600"
                />
              </div>
              <div className="flex gap-2">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[180px] bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600">
                    <SelectValue placeholder="Todos os gêneros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os gêneros</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs com Gráficos */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg p-1 rounded-xl border border-white/20 dark:border-slate-700/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">Visão Geral</TabsTrigger>
            <TabsTrigger value="avatars" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">Avatares</TabsTrigger>
            <TabsTrigger value="voices" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">Vozes</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">Analytics</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Gênero */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Users className="h-5 w-5 text-violet-600" />
                    Distribuição por Gênero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <defs>
                        <linearGradient id="gradient-male" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                        <linearGradient id="gradient-female" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#gradient-${entry.name === 'Masculino' ? 'male' : 'female'})`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Idiomas */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Mic className="h-5 w-5 text-sky-600" />
                    Distribuição por Idioma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={languageChartData}>
                      <defs>
                        <linearGradient id="gradient-bar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="language" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="count" fill="url(#gradient-bar)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-600" />
                    Gerenciamento de Avatares
                  </span>
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Avatar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAvatars.slice(0, 6).map((avatar) => (
                    <Card key={avatar.id} className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border-white/30 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-sky-500 text-white">
                              {avatar.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{avatar.display_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {avatar.gender === 'male' ? '👨 Masculino' : '👩 Feminino'}
                            </p>
                          </div>
                          <Badge variant={avatar.is_active ? "secondary" : "outline"} 
                                 className={avatar.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "text-gray-500"}>
                            {avatar.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{avatar.avatar_type}</span>
                          <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700">
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voices" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
                  <span className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-sky-600" />
                    Gerenciamento de Vozes
                  </span>
                  <Button className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Voz
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVoices.slice(0, 6).map((voice) => (
                    <Card key={voice.id} className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border-white/30 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-500 text-white">
                              🎤
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{voice.display_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {voice.gender === 'male' ? '👨 Masculino' : '👩 Feminino'}
                            </p>
                          </div>
                          <Badge variant={voice.is_active ? "secondary" : "outline"}
                                 className={voice.is_active ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "text-gray-500"}>
                            {voice.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{voice.language}</span>
                          <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700">
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <defs>
                        <linearGradient id="gradient-cpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                        <linearGradient id="gradient-memory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="time" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="url(#gradient-cpu)" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="memory" stroke="url(#gradient-memory)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Novo avatar criado', item: 'Avatar Profissional', time: '2 minutos atrás', type: 'success' },
                      { action: 'Renderização concluída', item: 'Vídeo Corporativo', time: '5 minutos atrás', type: 'info' },
                      { action: 'Voz atualizada', item: 'Voz Nativa', time: '10 minutos atrás', type: 'warning' },
                      { action: 'Sistema iniciado', item: 'Dashboard', time: '15 minutos atrás', type: 'default' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/30 dark:bg-slate-700/30 rounded-lg backdrop-blur-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500' :
                          activity.type === 'info' ? 'bg-blue-500' :
                          activity.type === 'warning' ? 'bg-orange-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{activity.item}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/20 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  Métricas de Performance em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <defs>
                      <linearGradient id="gradient-renders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="renders" 
                      stroke="url(#gradient-renders)" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#10B981' }}
                      activeDot={{ r: 8, fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}