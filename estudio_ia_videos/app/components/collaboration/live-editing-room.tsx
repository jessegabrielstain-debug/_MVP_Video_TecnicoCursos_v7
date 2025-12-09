
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Video, MessageCircle, Share2, Eye, Edit3, 
  UserPlus, Clock, CheckCircle, AlertCircle, 
  Zap, Globe, Lock, Settings, Crown, Star
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveEditingRoomProps {
  projectId?: string;
  roomId?: string;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
  status: 'online' | 'offline' | 'editing' | 'reviewing';
  cursor?: { x: number; y: number };
  lastActivity: string;
  permissions: string[];
}

interface LiveEdit {
  id: string;
  userId: string;
  userName: string;
  type: 'text' | 'audio' | 'visual' | 'timeline' | 'effect';
  content: string;
  timestamp: string;
  status: 'pending' | 'applied' | 'rejected';
  target: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: string;
  videoTimestamp?: number;
  resolved: boolean;
  replies: Comment[];
  type: 'general' | 'timeline' | 'suggestion' | 'approval';
}

const LiveEditingRoom: React.FC<LiveEditingRoomProps> = ({ 
  projectId = 'proj_123',
  roomId = 'room_abc' 
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [liveEdits, setLiveEdits] = useState<LiveEdit[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [newComment, setNewComment] = useState('');
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'focus' | 'presentation'>('grid');
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebRTC and WebSocket connections
  useEffect(() => {
    initializeLiveCollaboration();
    loadCollaborationData();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [projectId, roomId]);

  const initializeLiveCollaboration = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Simulate WebSocket connection
      setTimeout(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        toast.success('Conectado à sala de edição colaborativa');
      }, 1500);

      // Load mock collaborators
      const mockCollaborators: Collaborator[] = [
        {
          id: 'user_1',
          name: 'Ana Silva',
          avatar: '/avatars/ana.jpg',
          role: 'owner',
          status: 'online',
          lastActivity: 'Agora',
          permissions: ['edit', 'approve', 'invite', 'export']
        },
        {
          id: 'user_2',
          name: 'Carlos Santos',
          avatar: '/avatars/carlos.jpg',
          role: 'editor',
          status: 'editing',
          lastActivity: 'há 2 min',
          permissions: ['edit', 'comment']
        },
        {
          id: 'user_3',
          name: 'Mariana Costa',
          avatar: '/avatars/mariana.jpg',
          role: 'reviewer',
          status: 'reviewing',
          lastActivity: 'há 5 min',
          permissions: ['comment', 'approve']
        },
        {
          id: 'user_4',
          name: 'João Oliveira',
          avatar: '/avatars/joao.jpg',
          role: 'viewer',
          status: 'online',
          lastActivity: 'há 1 min',
          permissions: ['view']
        }
      ];

      setCollaborators(mockCollaborators);

    } catch (error) {
      logger.error('Erro ao conectar sala de colaboração', error instanceof Error ? error : new Error(String(error)), { component: 'LiveEditingRoom' });
      setConnectionStatus('disconnected');
      toast.error('Erro ao conectar na sala colaborativa');
    }
  };

  const loadCollaborationData = async () => {
    try {
      // Load mock live edits
      const mockLiveEdits: LiveEdit[] = [
        {
          id: 'edit_1',
          userId: 'user_2',
          userName: 'Carlos Santos',
          type: 'text',
          content: 'Alteração no título: "NR-12: Segurança em Máquinas"',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: 'applied',
          target: 'slide_1'
        },
        {
          id: 'edit_2',
          userId: 'user_3',
          userName: 'Mariana Costa',
          type: 'audio',
          content: 'Sugestão de narração mais clara no slide 5',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'pending',
          target: 'slide_5'
        },
        {
          id: 'edit_3',
          userId: 'user_2',
          userName: 'Carlos Santos',
          type: 'timeline',
          content: 'Ajuste da duração do slide 3: 8s → 12s',
          timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          status: 'applied',
          target: 'timeline'
        }
      ];

      setLiveEdits(mockLiveEdits);

      // Load mock comments
      const mockComments: Comment[] = [
        {
          id: 'comment_1',
          userId: 'user_3',
          userName: 'Mariana Costa',
          avatar: '/avatars/mariana.jpg',
          content: 'A transição entre os slides 2 e 3 poderia ser mais suave',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          videoTimestamp: 15.5,
          resolved: false,
          replies: [],
          type: 'suggestion'
        },
        {
          id: 'comment_2',
          userId: 'user_1',
          userName: 'Ana Silva',
          avatar: '/avatars/ana.jpg',
          content: 'Aprovado! Excelente trabalho na narração dos procedimentos de segurança.',
          timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          resolved: true,
          replies: [],
          type: 'approval'
        },
        {
          id: 'comment_3',
          userId: 'user_4',
          userName: 'João Oliveira',
          avatar: '/avatars/joao.jpg',
          content: 'Sugestão: adicionar mais exemplos práticos no slide 7',
          timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          videoTimestamp: 42.3,
          resolved: false,
          replies: [
            {
              id: 'reply_1',
              userId: 'user_2',
              userName: 'Carlos Santos',
              avatar: '/avatars/carlos.jpg',
              content: 'Boa ideia! Vou adicionar exemplos da indústria automobilística.',
              timestamp: new Date().toISOString(),
              resolved: false,
              replies: [],
              type: 'general'
            }
          ],
          type: 'suggestion'
        }
      ];

      setComments(mockComments);

    } catch (error) {
      logger.error('Erro ao carregar dados de colaboração', error instanceof Error ? error : new Error(String(error)), { component: 'LiveEditingRoom' });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId: 'current_user',
      userName: 'Você',
      avatar: '/avatars/user.jpg',
      content: newComment,
      timestamp: new Date().toISOString(),
      videoTimestamp: selectedTimestamp,
      resolved: false,
      replies: [],
      type: 'general'
    };

    setComments([comment, ...comments]);
    setNewComment('');
    
    toast.success('Comentário adicionado');
  };

  const handleApproveEdit = async (editId: string) => {
    setLiveEdits(liveEdits.map(edit => 
      edit.id === editId 
        ? { ...edit, status: 'applied' }
        : edit
    ));
    toast.success('Edição aprovada e aplicada');
  };

  const handleRejectEdit = async (editId: string) => {
    setLiveEdits(liveEdits.map(edit => 
      edit.id === editId 
        ? { ...edit, status: 'rejected' }
        : edit
    ));
    toast.success('Edição rejeitada');
  };

  const handleInviteCollaborator = async () => {
    toast.success('Link de convite copiado para clipboard');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'editor': return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'reviewer': return <Eye className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'editing': return 'bg-blue-500 animate-pulse';
      case 'reviewing': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getEditTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Edit3 className="h-4 w-4" />;
      case 'audio': return <MessageCircle className="h-4 w-4" />;
      case 'timeline': return <Clock className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-300">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              🤝 Live Editing Room
            </h1>
            <p className="text-muted-foreground">
              Edição colaborativa em tempo real • Projeto: NR-12 Treinamento
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {connectionStatus === 'connected' ? 'Conectado' : connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
            </Badge>
            
            <Button onClick={handleInviteCollaborator} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Convidar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Collaboration Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Live Video Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Preview Colaborativo
                </CardTitle>
                <CardDescription>
                  Visualização em tempo real com cursores dos colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-white text-center space-y-2">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">NR-12: Segurança em Máquinas</p>
                    <p className="text-sm opacity-75">Duração: 8:45 • Status: Em edição colaborativa</p>
                    
                    {/* Live Cursors */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {collaborators.filter(c => c.status === 'editing').map(collaborator => (
                        <div key={collaborator.id} className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          {collaborator.name.split(' ')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Edits Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Edições em Tempo Real
                </CardTitle>
                <CardDescription>
                  Feed de alterações ao vivo dos colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {liveEdits.length > 0 ? liveEdits.map(edit => (
                      <div key={edit.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getEditTypeIcon(edit.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{edit.userName}</p>
                            <Badge variant={edit.status === 'applied' ? 'default' : edit.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                              {edit.status === 'applied' ? 'Aplicada' : edit.status === 'pending' ? 'Pendente' : 'Rejeitada'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(edit.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{edit.content}</p>
                          
                          {edit.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleApproveEdit(edit.id)} className="h-6 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectEdit(edit.id)} className="h-6 text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma edição em tempo real no momento</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Collaborators & Comments */}
          <div className="space-y-6">
            
            {/* Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Colaboradores ({collaborators.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(collaborator.status)} border-2 border-white rounded-full`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{collaborator.name}</p>
                          {getRoleIcon(collaborator.role)}
                        </div>
                        <p className="text-xs text-muted-foreground">{collaborator.lastActivity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Add Comment */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleAddComment} size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 text-xs">
                    <input
                      type="number"
                      placeholder="Timestamp (s)"
                      value={selectedTimestamp}
                      onChange={(e) => setSelectedTimestamp(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded"
                    />
                    <span className="text-muted-foreground py-1">Link no tempo do vídeo</span>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{comment.userName}</p>
                              {comment.videoTimestamp && (
                                <Badge variant="outline" className="text-xs">
                                  {comment.videoTimestamp}s
                                </Badge>
                              )}
                              <Badge variant={comment.type === 'approval' ? 'default' : 'secondary'} className="text-xs">
                                {comment.type === 'approval' ? 'Aprovação' : comment.type === 'suggestion' ? 'Sugestão' : 'Geral'}
                              </Badge>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(comment.timestamp).toLocaleString()}
                            </p>
                            
                            {/* Replies */}
                            {comment.replies.length > 0 && (
                              <div className="ml-4 mt-3 space-y-2 border-l pl-3">
                                {comment.replies.map(reply => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={reply.avatar} />
                                      <AvatarFallback className="text-xs">{reply.userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-xs">{reply.userName}</p>
                                      <p className="text-xs">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Status Bar */}
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sala Pública
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {collaborators.length} colaboradores
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Sessão ativa há 45 min
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default LiveEditingRoom;
