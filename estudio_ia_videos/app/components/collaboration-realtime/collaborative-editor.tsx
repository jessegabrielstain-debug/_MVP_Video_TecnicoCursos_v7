
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  MessageCircle, 
  Eye,
  Edit3,
  Share2,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Send,
  Mic,
  Video,
  ScreenShare as Screen,
  Settings,
  UserPlus,
  Crown,
  Shield,
  Headphones,
  Volume2,
  VolumeX,
  Camera,
  CameraOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para colaboração
interface CollaboratorUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'reviewer';
  status: 'online' | 'away' | 'offline';
  lastActive: Date;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
  };
  editing?: {
    elementId: string;
    elementType: string;
    timestamp: Date;
  };
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'ai_suggestion' | 'file' | 'mention';
  metadata?: Record<string, unknown>;
}

interface CollaborationSession {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: Date;
  activeUsers: number;
  totalChanges: number;
  aiSuggestions: number;
  version: string;
}

interface AICollaborationSuggestion {
  id: string;
  type: 'improvement' | 'workflow' | 'conflict' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  appliedBy?: string;
}

export default function CollaborativeEditor() {
  // Estados principais
  const [activeUsers, setActiveUsers] = useState<CollaboratorUser[]>([
    {
      id: 'user1',
      name: 'Ana Silva',
      email: 'ana@empresa.com',
      avatar: '/api/placeholder/32/32',
      role: 'owner',
      status: 'online',
      lastActive: new Date(),
      cursor: { x: 450, y: 200 }
    },
    {
      id: 'user2',
      name: 'Carlos Santos',
      email: 'carlos@empresa.com',
      avatar: '/api/placeholder/32/32',
      role: 'editor',
      status: 'online',
      lastActive: new Date(),
      editing: {
        elementId: 'timeline_element_1',
        elementType: 'video',
        timestamp: new Date()
      }
    },
    {
      id: 'user3',
      name: 'Maria Oliveira',
      email: 'maria@empresa.com',
      avatar: '/api/placeholder/32/32',
      role: 'reviewer',
      status: 'away',
      lastActive: new Date(Date.now() - 300000)
    },
    {
      id: 'user4',
      name: 'João Costa',
      email: 'joao@empresa.com',
      avatar: '/api/placeholder/32/32',
      role: 'viewer',
      status: 'online',
      lastActive: new Date()
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg1',
      userId: 'system',
      message: 'Ana Silva iniciou a sessão de colaboração',
      timestamp: new Date(Date.now() - 3600000),
      type: 'system'
    },
    {
      id: 'msg2',
      userId: 'user2',
      message: 'Pessoal, o que acham de adicionar uma transição mais suave entre os slides?',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: 'msg3',
      userId: 'ai_assistant',
      message: 'Sugestão IA: Detectei que o volume do áudio pode ser otimizado. Posso aplicar ajuste automático?',
      timestamp: new Date(Date.now() - 900000),
      type: 'ai_suggestion',
      metadata: { confidence: 0.89, impact: 'medium' }
    },
    {
      id: 'msg4',
      userId: 'user1',
      message: 'Boa ideia Carlos! @IA_Assistant aplique a sugestão de áudio',
      timestamp: new Date(Date.now() - 600000),
      type: 'mention'
    }
  ]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [isVoiceCall, setIsVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState<AICollaborationSuggestion[]>([
    {
      id: 'sug1',
      type: 'improvement',
      title: 'Otimização de Timeline',
      description: 'Detectamos que 3 elementos podem ser sincronizados melhor. Aplicar otimização automática?',
      confidence: 0.92,
      impact: 'high',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: 'sug2',
      type: 'workflow',
      title: 'Fluxo de Aprovação',
      description: 'Carlos terminou a edição. Sugerir envio para revisão da Maria?',
      confidence: 0.85,
      impact: 'medium',
      timestamp: new Date(Date.now() - 180000)
    },
    {
      id: 'sug3',
      type: 'conflict',
      title: 'Conflito de Edição',
      description: 'Dois usuários editando o mesmo elemento. Resolver automaticamente?',
      confidence: 0.78,
      impact: 'high',
      timestamp: new Date(Date.now() - 120000)
    }
  ]);

  const [sessionStats, setSessionStats] = useState({
    totalCollaborators: activeUsers.length,
    onlineUsers: activeUsers.filter(u => u.status === 'online').length,
    totalChanges: 47,
    aiOptimizations: 12,
    sessionDuration: '2h 15m',
    lastSync: 'Há 3s'
  });

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'editor': return Edit3;
      case 'reviewer': return Shield;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-400';
      case 'editor': return 'text-blue-400';
      case 'reviewer': return 'text-purple-400';
      case 'viewer': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Send message
  const sendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        userId: 'user1', // Current user
        message: currentMessage,
        timestamp: new Date(),
        type: currentMessage.includes('@') ? 'mention' : 'text'
      };
      setChatMessages(prev => [...prev, newMessage]);
      setCurrentMessage('');
    }
  };

  // Apply AI suggestion
  const applyAISuggestion = (suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    const systemMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: 'system',
      message: 'IA aplicou otimização automaticamente',
      timestamp: new Date(),
      type: 'system'
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  // Real-time cursor simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev.map(user => {
        if (user.status === 'online' && user.cursor) {
          return {
            ...user,
            cursor: {
              ...user.cursor,
              x: user.cursor.x + (Math.random() - 0.5) * 20,
              y: user.cursor.y + (Math.random() - 0.5) * 20
            }
          };
        }
        return user;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
              Colaboração IA em Tempo Real
            </h1>
            <p className="text-gray-400">
              Sistema inteligente de colaboração com IA integrada
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Users className="mr-1 h-3 w-3" />
              {sessionStats.onlineUsers} Online
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              {sessionStats.aiOptimizations} IA Otimizações
            </Badge>
            
            {/* Voice/Video Controls */}
            <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceCall(!isVoiceCall)}
                className={isVoiceCall ? 'text-green-400' : 'text-gray-400'}
              >
                {isVoiceCall ? <Headphones className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={isMuted ? 'text-red-400' : 'text-green-400'}
                disabled={!isVoiceCall}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCameraOn(!cameraOn)}
                className={cameraOn ? 'text-green-400' : 'text-gray-400'}
                disabled={!isVoiceCall}
              >
                {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </Button>
              
              <Button variant="ghost" size="sm">
                <Screen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Colaboradores</p>
                  <p className="text-lg font-bold text-blue-400">{sessionStats.totalCollaborators}</p>
                </div>
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Online</p>
                  <p className="text-lg font-bold text-green-400">{sessionStats.onlineUsers}</p>
                </div>
                <div className="flex space-x-1">
                  {activeUsers.filter(u => u.status === 'online').slice(0, 3).map(user => (
                    <div
                      key={user.id}
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Mudanças</p>
                  <p className="text-lg font-bold text-purple-400">{sessionStats.totalChanges}</p>
                </div>
                <Edit3 className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">IA Assist</p>
                  <p className="text-lg font-bold text-yellow-400">{sessionStats.aiOptimizations}</p>
                </div>
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Duração</p>
                  <p className="text-lg font-bold text-pink-400">{sessionStats.sessionDuration}</p>
                </div>
                <Clock className="h-6 w-6 text-pink-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sync</p>
                  <p className="text-lg font-bold text-cyan-400">{sessionStats.lastSync}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
        {/* Main Collaboration Workspace */}
        <div className="col-span-8">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workspace Colaborativo</CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Active user cursors preview */}
                  {activeUsers.filter(u => u.status === 'online' && u.cursor).map(user => (
                    <div key={user.id} className="flex items-center space-x-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-400">{user.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative h-[calc(100%-100px)] overflow-hidden">
              {/* Simulated Canvas with Real-time Cursors */}
              <div className="relative w-full h-full bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
                {/* Demo workspace content */}
                <div className="absolute inset-4 space-y-4">
                  <div className="h-16 bg-blue-600/20 border-2 border-blue-600 rounded flex items-center justify-center">
                    <span className="text-blue-400 font-medium">Timeline Principal</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-green-600/20 border-2 border-green-600 rounded flex items-center justify-center">
                      <span className="text-green-400 text-sm">Slide 1</span>
                    </div>
                    <div className="h-24 bg-purple-600/20 border-2 border-purple-600 rounded flex items-center justify-center">
                      <span className="text-purple-400 text-sm">Slide 2</span>
                    </div>
                    <div className="h-24 bg-yellow-600/20 border-2 border-yellow-600 rounded flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">Slide 3</span>
                    </div>
                  </div>
                  
                  <div className="h-12 bg-gray-700 rounded flex items-center px-4">
                    <Volume2 className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="flex-1 bg-gray-800 h-2 rounded-full">
                      <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">Áudio: 33%</span>
                  </div>
                </div>

                {/* Real-time user cursors */}
                <AnimatePresence>
                  {activeUsers.filter(u => u.status === 'online' && u.cursor).map(user => (
                    <motion.div
                      key={user.id}
                      className="absolute pointer-events-none z-10"
                      animate={{ 
                        x: user.cursor!.x, 
                        y: user.cursor!.y 
                      }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                      {/* Cursor */}
                      <div className="relative">
                        <svg width="20" height="20" viewBox="0 0 20 20" className="text-blue-400">
                          <path
                            fill="currentColor"
                            d="M0 0L8 12L4 12L0 20V0Z"
                          />
                        </svg>
                        
                        {/* User label */}
                        <div className="absolute top-5 left-2 bg-gray-900 px-2 py-1 rounded text-xs text-white border border-gray-700 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                            <span>{user.name.split(' ')[0]}</span>
                            {user.editing && (
                              <Edit3 className="h-3 w-3 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Editing indicators */}
                {activeUsers.filter(u => u.editing).map(user => (
                  <div
                    key={`editing-${user.id}`}
                    className="absolute top-4 right-4 bg-blue-600/20 border border-blue-600 rounded p-2 flex items-center space-x-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-blue-400">{user.name.split(' ')[0]} editando</p>
                      <p className="text-xs text-gray-400">{user.editing!.elementType}</p>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Collaboration Tools */}
        <div className="col-span-4 space-y-4">
          <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="ai">IA Assist</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Colaboradores Ativos</CardTitle>
                    <Button variant="ghost" size="sm">
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {activeUsers.map(user => {
                        const RoleIcon = getRoleIcon(user.role);
                        
                        return (
                          <motion.div
                            key={user.id}
                            className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(user.status)}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <div className="flex items-center space-x-1">
                                <RoleIcon className={`h-3 w-3 ${getRoleColor(user.role)}`} />
                                <span className={`text-xs capitalize ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {user.editing && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Chat da Equipe</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-48 p-3">
                    <div className="space-y-3">
                      {chatMessages.map(message => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex space-x-2 ${
                            message.type === 'system' ? 'justify-center' : ''
                          }`}
                        >
                          {message.type !== 'system' && (
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              {message.userId === 'ai_assistant' ? (
                                <div className="bg-purple-600 text-white flex items-center justify-center h-full w-full rounded-full">
                                  <Sparkles className="h-3 w-3" />
                                </div>
                              ) : (
                                <>
                                  <AvatarImage 
                                    src={activeUsers.find(u => u.id === message.userId)?.avatar} 
                                  />
                                  <AvatarFallback className="text-xs">
                                    {activeUsers.find(u => u.id === message.userId)?.name.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>
                          )}
                          
                          <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
                            {message.type !== 'system' && (
                              <div className="flex items-center space-x-1 mb-1">
                                <span className="text-xs font-medium">
                                  {message.userId === 'ai_assistant' 
                                    ? 'IA Assistant' 
                                    : activeUsers.find(u => u.id === message.userId)?.name || 'Usuário'
                                  }
                                </span>
                                <span className="text-xs text-gray-400">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            
                            <div className={`text-sm p-2 rounded-lg ${
                              message.type === 'system' 
                                ? 'bg-gray-800 text-gray-400 text-xs' 
                                : message.type === 'ai_suggestion'
                                  ? 'bg-purple-600/20 border border-purple-600/50 text-purple-300'
                                  : message.type === 'mention'
                                    ? 'bg-blue-600/20 border border-blue-600/50 text-blue-300'
                                    : 'bg-gray-800 text-gray-300'
                            }`}>
                              {message.message}
                              
                              {message.type === 'ai_suggestion' && message.metadata && (
                                <div className="mt-2 pt-2 border-t border-purple-600/30 flex items-center justify-between">
                                  <span className="text-xs text-purple-400">
                                    Confiança: {((message.metadata.confidence as number) * 100).toFixed(0)}%
                                  </span>
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1">
                                    Aplicar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="p-3 border-t border-gray-800">
                    <div className="flex space-x-2">
                      <Input
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage} size="sm">
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <div className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Sugestões IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      <div className="space-y-3">
                        {aiSuggestions.map(suggestion => (
                          <motion.div
                            key={suggestion.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gray-800 p-3 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-medium">{suggestion.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  suggestion.impact === 'high' 
                                    ? 'border-red-500/50 text-red-400'
                                    : suggestion.impact === 'medium'
                                      ? 'border-yellow-500/50 text-yellow-400'
                                      : 'border-green-500/50 text-green-400'
                                }`}
                              >
                                {suggestion.impact}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-3">
                              {suggestion.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Confiança: {(suggestion.confidence * 100).toFixed(0)}%
                              </span>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1"
                                onClick={() => applyAISuggestion(suggestion.id)}
                              >
                                <Zap className="mr-1 h-3 w-3" />
                                Aplicar
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Status IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Auto-otimização</span>
                      <div className="w-8 h-4 bg-green-600 rounded-full flex items-center px-0.5">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-3.5 transition-transform" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Conflito resolver</span>
                      <div className="w-8 h-4 bg-green-600 rounded-full flex items-center px-0.5">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-3.5 transition-transform" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Sync em tempo real</span>
                      <div className="w-8 h-4 bg-green-600 rounded-full flex items-center px-0.5">
                        <div className="w-3 h-3 bg-white rounded-full translate-x-3.5 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
