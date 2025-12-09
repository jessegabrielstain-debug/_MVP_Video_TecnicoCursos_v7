
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users,
  MessageSquare,
  Share2,
  Crown,
  Eye,
  Edit3,
  History,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  Settings,
  Link,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Send,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Monitor,
  UserPlus,
  Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  cursor?: { x: number; y: number };
  currentAction?: string;
  joinedAt: Date;
  lastActivity: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'mention';
  mentions?: string[];
}

interface VersionHistory {
  id: string;
  title: string;
  description: string;
  author: string;
  timestamp: Date;
  changes: string[];
  isCurrent: boolean;
}

interface CollaborationSession {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'ended';
  participants: number;
  duration: number;
  recordingEnabled: boolean;
}

export default function RealTimeCollaboration() {
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([
    {
      id: 'user1',
      name: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      role: 'owner',
      isOnline: true,
      currentAction: 'Editando timeline principal',
      cursor: { x: 350, y: 200 },
      joinedAt: new Date(Date.now() - 3600000),
      lastActivity: new Date()
    },
    {
      id: 'user2',
      name: 'Carlos Santos',
      email: 'carlos.santos@empresa.com',
      role: 'editor',
      isOnline: true,
      currentAction: 'Adicionando narração NR-12',
      cursor: { x: 150, y: 150 },
      joinedAt: new Date(Date.now() - 1800000),
      lastActivity: new Date(Date.now() - 300000)
    },
    {
      id: 'user3',
      name: 'Maria Oliveira',
      email: 'maria.oliveira@empresa.com',
      role: 'viewer',
      isOnline: true,
      currentAction: 'Revisando conteúdo',
      joinedAt: new Date(Date.now() - 900000),
      lastActivity: new Date(Date.now() - 120000)
    },
    {
      id: 'user4',
      name: 'João Costa',
      email: 'joao.costa@empresa.com',
      role: 'editor',
      isOnline: false,
      currentAction: 'Offline',
      joinedAt: new Date(Date.now() - 7200000),
      lastActivity: new Date(Date.now() - 3600000)
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg1',
      userId: 'user2',
      userName: 'Carlos Santos',
      message: 'Terminei de ajustar a narração da seção de segurança em máquinas. Podem revisar?',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: 'msg2',
      userId: 'system',
      userName: 'Sistema',
      message: 'Ana Silva fez alterações no template NR-12',
      timestamp: new Date(Date.now() - 1200000),
      type: 'system'
    },
    {
      id: 'msg3',
      userId: 'user1',
      userName: 'Ana Silva',
      message: '@Carlos Santos Ficou excelente! Podemos adicionar mais ênfase na parte dos EPIs?',
      timestamp: new Date(Date.now() - 900000),
      type: 'mention',
      mentions: ['user2']
    },
    {
      id: 'msg4',
      userId: 'user3',
      userName: 'Maria Oliveira',
      message: 'O conteúdo está bem alinhado com as normas. Aprovado para produção! 👍',
      timestamp: new Date(Date.now() - 600000),
      type: 'text'
    }
  ]);

  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([
    {
      id: 'v1',
      title: 'Versão Inicial NR-12',
      description: 'Template base para treinamento de segurança em máquinas',
      author: 'Ana Silva',
      timestamp: new Date(Date.now() - 7200000),
      changes: ['Criação do template inicial', 'Adição de avatares 3D', 'Configuração de narração'],
      isCurrent: false
    },
    {
      id: 'v2',
      title: 'Revisão de Conteúdo',
      description: 'Ajustes no roteiro e adição de elementos interativos',
      author: 'Carlos Santos',
      timestamp: new Date(Date.now() - 3600000),
      changes: ['Revisão do roteiro', 'Adição de quiz interativo', 'Melhorias na timeline'],
      isCurrent: false
    },
    {
      id: 'v3',
      title: 'Versão de Produção',
      description: 'Versão final aprovada para distribuição',
      author: 'Ana Silva',
      timestamp: new Date(Date.now() - 1800000),
      changes: ['Aprovação final do conteúdo', 'Otimização de performance', 'Configuração de compliance'],
      isCurrent: true
    }
  ]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<CollaborationSession>({
    id: 'session_001',
    title: 'Produção NR-12 - Segurança em Máquinas',
    status: 'active',
    participants: 3,
    duration: 2145, // seconds
    recordingEnabled: true
  });
  const [shareUrl, setShareUrl] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update session duration
      setSessionInfo(prev => ({
        ...prev,
        duration: prev.duration + 1
      }));

      // Simulate cursor movements
      setCollaborators(prev => prev.map(user => ({
        ...user,
        cursor: user.isOnline && user.cursor ? {
          x: Math.max(0, Math.min(800, user.cursor.x + (Math.random() - 0.5) * 20)),
          y: Math.max(0, Math.min(600, user.cursor.y + (Math.random() - 0.5) * 20))
        } : user.cursor
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send chat message
  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: 'current_user',
      userName: 'Você',
      message: currentMessage,
      timestamp: new Date(),
      type: currentMessage.includes('@') ? 'mention' : 'text',
      mentions: currentMessage.includes('@') ? ['user2'] : undefined
    };

    setChatMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    toast.success('Mensagem enviada');
  };

  // Invite collaborator
  const inviteCollaborator = () => {
    const inviteUrl = `${window.location.origin}/collaborate/${sessionInfo.id}`;
    setShareUrl(inviteUrl);
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link de convite copiado para a área de transferência');
  };

  // Toggle hand raise
  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    toast.success(isHandRaised ? 'Mão baixada' : 'Mão levantada');
  };

  // Export session
  const exportSession = () => {
    const sessionData = {
      sessionInfo,
      collaborators: collaborators.filter(c => c.isOnline),
      chatHistory: chatMessages,
      versionHistory,
      exportedAt: new Date()
    };
    
    logger.info('Exporting session', { component: 'RealTimeCollaboration', sessionData });
    toast.success('Sessão de colaboração exportada');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'editor': return <Edit3 className="w-3 h-3 text-blue-500" />;
      case 'viewer': return <Eye className="w-3 h-3 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-green-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Real-time Collaboration
                  </h1>
                  <p className="text-sm text-muted-foreground">Colaboração em tempo real para equipes</p>
                </div>
              </div>
              <Badge variant="secondary" className="ml-4">
                <Zap className="w-3 h-3 mr-1" />
                Live Session
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {collaborators.filter(c => c.isOnline).slice(0, 3).map(user => (
                    <Avatar key={user.id} className="w-8 h-8 border-2 border-white">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {collaborators.filter(c => c.isOnline).length} Online
                </Badge>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {formatDuration(sessionInfo.duration)}
              </Badge>
              <Button 
                onClick={inviteCollaborator}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Collaboration Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Session Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    {sessionInfo.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${sessionInfo.status === 'active' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}`}
                    >
                      <Circle className={`w-2 h-2 mr-1 ${sessionInfo.status === 'active' ? 'fill-green-500' : 'fill-red-500'}`} />
                      {sessionInfo.status === 'active' ? 'Ativo' : 'Pausado'}
                    </Badge>
                    {sessionInfo.recordingEnabled && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        <Video className="w-3 h-3 mr-1" />
                        Gravando
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant={isAudioEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  >
                    {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant={isVideoEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant={isHandRaised ? "default" : "outline"}
                    size="sm"
                    onClick={toggleHandRaise}
                    className={isHandRaised ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                  >
                    <Hand className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/collaborate/${sessionInfo.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link copiado');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportSession}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collaborative Canvas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Área de Trabalho Colaborativa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={canvasRef}
                  className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  style={{ height: '400px' }}
                >
                  {/* Collaboration Cursors */}
                  {collaborators
                    .filter(user => user.isOnline && user.cursor)
                    .map(user => (
                      <div
                        key={user.id}
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: user.cursor!.x,
                          top: user.cursor!.y,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                            style={{ 
                              backgroundColor: user.role === 'owner' ? '#F59E0B' : 
                                               user.role === 'editor' ? '#3B82F6' : '#6B7280'
                            }}
                          />
                          <div className="bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Sample collaborative content */}
                  <div className="absolute inset-4">
                    <div className="bg-white/80 rounded-lg p-4 shadow-lg">
                      <h3 className="font-bold text-lg mb-2">NR-12 - Segurança em Máquinas</h3>
                      <p className="text-sm text-muted-foreground mb-4">Template colaborativo em edição</p>
                      <div className="space-y-2">
                        <div className="h-2 bg-blue-200 rounded animate-pulse" />
                        <div className="h-2 bg-blue-200 rounded w-3/4 animate-pulse" />
                        <div className="h-2 bg-blue-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Versões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {versionHistory.map((version) => (
                    <div 
                      key={version.id}
                      className={`border rounded-lg p-4 ${version.isCurrent ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{version.title}</h4>
                          {version.isCurrent && (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Atual
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {version.author} • {formatTime(version.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{version.description}</p>
                      <div className="space-y-1">
                        {version.changes.map((change, index) => (
                          <div key={index} className="text-xs flex items-center gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            {change}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Online Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Colaboradores ({collaborators.filter(c => c.isOnline).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collaborators.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {getRoleIcon(user.role)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.currentAction}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat da Equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-60 overflow-y-auto space-y-3 pr-2">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`text-sm ${msg.type === 'system' ? 'text-center text-muted-foreground italic' : ''}`}>
                        {msg.type !== 'system' && (
                          <div className="flex items-start gap-2">
                            <Avatar className="w-6 h-6 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-500 text-white">
                                {msg.userName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-xs">{msg.userName}</span>
                                <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                                {msg.type === 'mention' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-1" />
                                    Menção
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm break-words">{msg.message}</p>
                            </div>
                          </div>
                        )}
                        {msg.type === 'system' && (
                          <p className="text-xs">{msg.message}</p>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Digite sua mensagem..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      onClick={sendMessage}
                      disabled={!currentMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Estatísticas da Sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Duração:</span>
                  <Badge variant="secondary">{formatDuration(sessionInfo.duration)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Participantes:</span>
                  <Badge variant="secondary">{collaborators.filter(c => c.isOnline).length} online</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Mensagens:</span>
                  <Badge variant="secondary">{chatMessages.filter(m => m.type !== 'system').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Alterações:</span>
                  <Badge variant="secondary">{versionHistory.length} versões</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge 
                    variant="secondary"
                    className={sessionInfo.recordingEnabled ? 'bg-red-100 text-red-800' : ''}
                  >
                    {sessionInfo.recordingEnabled ? 'Gravando' : 'Não gravando'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
