
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, MessageCircle, Video, Mic, MicOff,
  Share2, Eye, Edit, Clock, Send,
  ThumbsUp, ThumbsDown, AlertCircle,
  Sparkles, Zap, Target, TrendingUp,
  FileText, Image, Play, Pause,
  Settings, MoreHorizontal, UserPlus
} from 'lucide-react';

interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  avatar: string;
  status: 'online' | 'away' | 'offline';
  cursor: { x: number; y: number } | null;
  currentElement?: string;
  lastSeen: string;
}

interface CollaborationComment {
  id: string;
  userId: string;
  elementId?: string;
  text: string;
  timestamp: string;
  type: 'comment' | 'suggestion' | 'approval' | 'request';
  resolved: boolean;
  likes: string[];
  aiGenerated?: boolean;
}

interface ProjectVersion {
  id: string;
  name: string;
  author: string;
  timestamp: string;
  description: string;
  aiScore: number;
  changes: string[];
}

interface AICollaborationInsight {
  id: string;
  type: 'conflict' | 'suggestion' | 'optimization' | 'warning';
  title: string;
  description: string;
  users: string[];
  priority: 'high' | 'medium' | 'low';
  autoResolve?: boolean;
}

const RealTimeCollaborationHub = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'comments' | 'versions' | 'insights'>('workspace');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAIAssisting, setIsAIAssisting] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([
    {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      role: 'owner',
      avatar: '👨‍💼',
      status: 'online',
      cursor: { x: 250, y: 150 },
      currentElement: 'timeline-track-1',
      lastSeen: 'Agora'
    },
    {
      id: 'user-2',
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      role: 'editor',
      avatar: '👩‍🏫',
      status: 'online',
      cursor: { x: 400, y: 200 },
      currentElement: 'audio-track-2',
      lastSeen: 'Agora'
    },
    {
      id: 'user-3',
      name: 'Carlos Mendes',
      email: 'carlos@empresa.com',
      role: 'reviewer',
      avatar: '👨‍🔧',
      status: 'away',
      cursor: null,
      lastSeen: '5 min atrás'
    },
    {
      id: 'ia-assistant',
      name: 'IA Assistant',
      email: 'ai@sistema.com',
      role: 'editor',
      avatar: '🤖',
      status: 'online',
      cursor: null,
      lastSeen: 'Sempre ativo'
    }
  ]);

  const [comments, setComments] = useState<CollaborationComment[]>([
    {
      id: 'comment-1',
      userId: 'user-2',
      elementId: 'timeline-track-1',
      text: 'Sugiro aumentar o volume da narração nesta parte',
      timestamp: '2024-09-26T14:30:00Z',
      type: 'suggestion',
      resolved: false,
      likes: ['user-1'],
      aiGenerated: false
    },
    {
      id: 'comment-2',
      userId: 'ia-assistant',
      text: 'IA detectou que esta transição pode ser otimizada para 23% mais engajamento',
      timestamp: '2024-09-26T14:35:00Z',
      type: 'suggestion',
      resolved: false,
      likes: [],
      aiGenerated: true
    },
    {
      id: 'comment-3',
      userId: 'user-3',
      elementId: 'audio-track-2',
      text: 'Aprovado! Excelente qualidade de áudio',
      timestamp: '2024-09-26T14:40:00Z',
      type: 'approval',
      resolved: true,
      likes: ['user-1', 'user-2']
    }
  ]);

  const [versions, setVersions] = useState<ProjectVersion[]>([
    {
      id: 'v-1',
      name: 'Versão Inicial',
      author: 'João Silva',
      timestamp: '2024-09-26T10:00:00Z',
      description: 'Primeira versão do treinamento NR-10',
      aiScore: 78.5,
      changes: ['Criação inicial', 'Upload de slides', 'Configuração básica']
    },
    {
      id: 'v-2',
      name: 'Melhorias IA v1',
      author: 'IA Assistant',
      timestamp: '2024-09-26T12:30:00Z',
      description: 'Otimizações automáticas aplicadas pela IA',
      aiScore: 89.2,
      changes: ['Otimização de áudio', 'Sincronização melhorada', 'Transições suavizadas']
    },
    {
      id: 'v-3',
      name: 'Revisão Colaborativa',
      author: 'Maria Santos',
      timestamp: '2024-09-26T14:45:00Z',
      description: 'Incorporação de feedbacks da equipe',
      aiScore: 94.7,
      changes: ['Ajustes de narração', 'Correções de conteúdo', 'Melhorias visuais']
    }
  ]);

  const [aiInsights, setAiInsights] = useState<AICollaborationInsight[]>([
    {
      id: 'insight-1',
      type: 'conflict',
      title: 'Conflito de Edição Detectado',
      description: 'João e Maria estão editando o mesmo elemento simultaneamente',
      users: ['user-1', 'user-2'],
      priority: 'high',
      autoResolve: false
    },
    {
      id: 'insight-2',
      type: 'suggestion',
      title: 'Sugestão de Melhoria IA',
      description: 'IA identificou oportunidade de otimização em 3 elementos',
      users: ['ia-assistant'],
      priority: 'medium',
      autoResolve: true
    },
    {
      id: 'insight-3',
      type: 'optimization',
      title: 'Workflow Otimizado',
      description: 'Reorganizar tarefas pode economizar 45 minutos',
      users: ['user-1', 'user-2', 'user-3'],
      priority: 'low',
      autoResolve: false
    }
  ]);

  // Real-time collaboration functions
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    const comment: CollaborationComment = {
      id: `comment-${Date.now()}`,
      userId: 'user-1', // Current user
      text: newComment,
      timestamp: new Date().toISOString(),
      type: 'comment',
      resolved: false,
      likes: [],
      aiGenerated: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');

    // Simulate AI response
    if (isAIAssisting && Math.random() > 0.7) {
      setTimeout(() => {
        const aiComment: CollaborationComment = {
          id: `ai-comment-${Date.now()}`,
          userId: 'ia-assistant',
          text: 'IA analisou seu comentário e sugere aplicar filtro de ruído automático',
          timestamp: new Date().toISOString(),
          type: 'suggestion',
          resolved: false,
          likes: [],
          aiGenerated: true
        };
        setComments(prev => [...prev, aiComment]);
      }, 2000);
    }
  }, [newComment, isAIAssisting]);

  const handleLikeComment = useCallback((commentId: string, userId: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const likes = comment.likes.includes(userId)
          ? comment.likes.filter(id => id !== userId)
          : [...comment.likes, userId];
        return { ...comment, likes };
      }
      return comment;
    }));
  }, []);

  const handleResolveComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment =>
      comment.id === commentId ? { ...comment, resolved: true } : comment
    ));
  }, []);

  // AI Collaboration features
  const handleAIOptimize = useCallback(() => {
    console.log('🤖 IA otimizando colaboração...');
  }, []);

  const handleAutoResolveConflicts = useCallback(() => {
    console.log('✨ Resolvendo conflitos automaticamente...');
    setAiInsights(prev => prev.map(insight =>
      insight.autoResolve ? { ...insight, type: 'optimization' as const } : insight
    ));
  }, []);

  const handleVoiceChat = useCallback(() => {
    setIsRecording(!isRecording);
    console.log(isRecording ? 'Parando chat de voz' : 'Iniciando chat de voz');
  }, [isRecording]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const getUserById = (userId: string) => collaborators.find(u => u.id === userId);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInsightIcon = (type: AICollaborationInsight['type']) => {
    switch (type) {
      case 'conflict': return '⚠️';
      case 'suggestion': return '💡';
      case 'optimization': return '⚡';
      case 'warning': return '🔥';
      default: return '📝';
    }
  };

  const getInsightColor = (type: AICollaborationInsight['type']) => {
    switch (type) {
      case 'conflict': return 'text-red-400 bg-red-900/20';
      case 'suggestion': return 'text-blue-400 bg-blue-900/20';
      case 'optimization': return 'text-green-400 bg-green-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-blue-400">👥 Collaboration Hub</h2>
          <Badge variant="outline" className="border-blue-400 text-blue-400">
            <Users className="w-3 h-3 mr-1" />
            {collaborators.filter(u => u.status === 'online').length} Online
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceChat}
            className={`${isRecording ? 'text-red-400 bg-red-900/20' : 'text-green-400'}`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAIOptimize}
            className="text-purple-400 hover:text-purple-300"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            IA Assist
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Collaborators Bar */}
      <div className="flex items-center gap-3 p-3 bg-gray-850 border-b border-gray-700">
        <span className="text-xs text-gray-400">Colaboradores:</span>
        <div className="flex items-center gap-2">
          {collaborators.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded-full text-xs cursor-pointer hover:bg-gray-600"
              onClick={() => setSelectedUser(user.id)}
            >
              <div className="relative">
                <div className="text-sm">{user.avatar}</div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-gray-700 rounded-full ${
                  user.status === 'online' ? 'bg-green-400' :
                  user.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
              </div>
              <span className="text-white">{user.name.split(' ')[0]}</span>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="workspace" className="flex-1">Workspace</TabsTrigger>
            <TabsTrigger value="comments" className="flex-1">
              Comments ({comments.filter(c => !c.resolved).length})
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex-1">Versions</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">IA Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workspace" className="flex-1 p-4 overflow-y-auto">
            {/* Live Workspace View */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-400" />
                      Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-900 rounded border-2 border-dashed border-gray-600 flex items-center justify-center relative">
                      <div className="text-gray-500">
                        <Play className="w-12 h-12 mx-auto mb-2" />
                        <p>Preview do Projeto</p>
                      </div>
                      
                      {/* Live cursors */}
                      {collaborators.map((user) => user.cursor && (
                        <div
                          key={user.id}
                          className="absolute pointer-events-none"
                          style={{ 
                            left: `${(user.cursor.x / 800) * 100}%`, 
                            top: `${(user.cursor.y / 450) * 100}%` 
                          }}
                        >
                          <div className="bg-blue-500 w-4 h-4 rounded-full border-2 border-white" />
                          <div className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded mt-1">
                            {user.name.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Edit className="w-4 h-4 text-green-400" />
                      Live Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {[
                          { user: 'João Silva', action: 'editando timeline track 1', time: '14:45' },
                          { user: 'Maria Santos', action: 'ajustando volume do áudio', time: '14:44' },
                          { user: 'IA Assistant', action: 'otimizou 3 transições', time: '14:43' },
                          { user: 'Carlos Mendes', action: 'adicionou comentário', time: '14:40' }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            <span className="text-blue-400">{activity.user}</span>
                            <span className="text-gray-300">{activity.action}</span>
                            <span className="text-gray-500 ml-auto">{activity.time}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Current Editors */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Editores Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {collaborators.filter(u => u.currentElement && u.status === 'online').map((user) => (
                      <div key={user.id} className="bg-gray-700 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-lg">{user.avatar}</div>
                          <div>
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-gray-400">{user.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-400">
                          Editando: {user.currentElement}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="comments" className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const user = getUserById(comment.userId);
                    return (
                      <Card key={comment.id} className={`${
                        comment.resolved ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-800 border-gray-700'
                      }`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="text-lg">{user?.avatar}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{user?.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.type}
                                </Badge>
                                {comment.aiGenerated && (
                                  <Badge className="text-xs bg-purple-900/20 text-purple-400">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    IA
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-500 ml-auto">
                                  {formatTime(comment.timestamp)}
                                </span>
                              </div>
                              
                              <p className={`text-sm ${comment.resolved ? 'text-gray-400' : 'text-gray-300'}`}>
                                {comment.text}
                              </p>
                              
                              {comment.elementId && (
                                <div className="text-xs text-blue-400 mt-1">
                                  Sobre: {comment.elementId}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLikeComment(comment.id, 'user-1')}
                                  className="text-xs h-6 px-2"
                                >
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  {comment.likes.length}
                                </Button>
                                
                                {!comment.resolved && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResolveComment(comment.id)}
                                    className="text-xs h-6 px-2 text-green-400"
                                  >
                                    Resolver
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
            
            {/* Comment Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="self-end bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="versions" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {versions.map((version) => (
                <Card key={version.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{version.name}</h4>
                        <p className="text-xs text-gray-400">
                          {version.author} • {formatTime(version.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-purple-900/20 text-purple-400">
                          IA {version.aiScore}%
                        </Badge>
                        <Button size="sm" variant="outline" className="text-xs">
                          Restaurar
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{version.description}</p>
                    
                    <div className="space-y-1">
                      {version.changes.map((change, index) => (
                        <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                          {change}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">IA Collaboration Insights</h3>
                <Button
                  size="sm"
                  onClick={handleAutoResolveConflicts}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Auto Resolve
                </Button>
              </div>
              
              {aiInsights.map((insight) => (
                <Card key={insight.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-lg">{getInsightIcon(insight.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                          <Badge className={`text-xs ${getInsightColor(insight.type)}`}>
                            {insight.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{insight.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Usuários afetados:</span>
                          {insight.users.map((userId) => {
                            const user = getUserById(userId);
                            return (
                              <div key={userId} className="text-xs">{user?.avatar}</div>
                            );
                          })}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="text-xs">
                            Ver Detalhes
                          </Button>
                          {insight.autoResolve && (
                            <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700">
                              Auto Resolver
                            </Button>
                          )}
                        </div>
                      </div>
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

export default RealTimeCollaborationHub;
