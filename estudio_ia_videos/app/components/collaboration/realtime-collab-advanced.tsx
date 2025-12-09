
/**
 * 🤝 REAL-TIME COLLABORATION ADVANCED
 * Sistema completo de colaboração simultânea com histórico e comentários
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users, MessageSquare, History, Lock, Unlock, Eye,
  Clock, CheckCircle2, AlertCircle, Send, Reply,
  ThumbsUp, MoreVertical, Pin, Archive, Trash2,
  GitBranch, RotateCcw, Save, FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  color: string
  role: 'owner' | 'editor' | 'viewer'
}

interface Comment {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
  elementId?: string
  slideId?: string
  resolved: boolean
  replies: Reply[]
  likes: string[]
  pinned: boolean
}

interface Reply {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
}

interface Version {
  id: string
  name: string
  description: string
  timestamp: Date
  author: string
  changes: Change[]
  snapshot: any
}

interface Change {
  type: 'add' | 'edit' | 'delete'
  elementId: string
  description: string
}

interface ElementLock {
  elementId: string
  userId: string
  userName: string
  timestamp: Date
}

interface RealtimeCollabAdvancedProps {
  projectId: string
  userId: string
  userName: string
}

export default function RealtimeCollabAdvanced({
  projectId,
  userId,
  userName
}: RealtimeCollabAdvancedProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [elementLocks, setElementLocks] = useState<ElementLock[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'versions' | 'activity'>('users')
  const [isRecording, setIsRecording] = useState(false)
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Conectar ao Socket.IO
  useEffect(() => {
    const newSocket = io('/api/collaboration/socket', {
      query: { projectId, userId, userName }
    })

    newSocket.on('connect', () => {
      logger.info('Conectado ao servidor de colaboração', { component: 'RealtimeCollabAdvanced' });
      toast.success('Colaboração ativada')
    })

    newSocket.on('user:joined', (user: User) => {
      setActiveUsers(prev => [...prev, user])
      toast.success(`${user.name} entrou no projeto`)
    })

    newSocket.on('user:left', (userId: string) => {
      setActiveUsers(prev => prev.filter(u => u.id !== userId))
    })

    newSocket.on('element:locked', (lock: ElementLock) => {
      setElementLocks(prev => [...prev, lock])
    })

    newSocket.on('element:unlocked', (elementId: string) => {
      setElementLocks(prev => prev.filter(l => l.elementId !== elementId))
    })

    newSocket.on('comment:added', (comment: Comment) => {
      setComments(prev => [comment, ...prev])
    })

    newSocket.on('comment:resolved', (commentId: string) => {
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, resolved: true } : c))
      )
    })

    newSocket.on('version:saved', (version: Version) => {
      setVersions(prev => [version, ...prev])
      toast.success('Nova versão salva')
    })

    newSocket.on('disconnect', () => {
      toast.error('Conexão perdida. Tentando reconectar...')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [projectId, userId, userName])

  // Bloquear elemento para edição
  const lockElement = useCallback((elementId: string) => {
    if (!socket) return

    socket.emit('element:lock', {
      projectId,
      elementId,
      userId,
      userName
    })

    toast.success('Elemento bloqueado para edição')
  }, [socket, projectId, userId, userName])

  // Desbloquear elemento
  const unlockElement = useCallback((elementId: string) => {
    if (!socket) return

    socket.emit('element:unlock', {
      projectId,
      elementId
    })

    toast.success('Elemento desbloqueado')
  }, [socket, projectId])

  // Adicionar comentário
  const addComment = useCallback(() => {
    if (!socket || !newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId,
      userName,
      text: newComment,
      timestamp: new Date(),
      elementId: selectedElement || undefined,
      resolved: false,
      replies: [],
      likes: [],
      pinned: false
    }

    socket.emit('comment:add', {
      projectId,
      comment
    })

    setNewComment('')
    toast.success('Comentário adicionado')
  }, [socket, projectId, userId, userName, newComment, selectedElement])

  // Resolver comentário
  const resolveComment = useCallback((commentId: string) => {
    if (!socket) return

    socket.emit('comment:resolve', {
      projectId,
      commentId
    })
  }, [socket, projectId])

  // Curtir comentário
  const likeComment = useCallback((commentId: string) => {
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? {
              ...c,
              likes: c.likes.includes(userId)
                ? c.likes.filter(id => id !== userId)
                : [...c.likes, userId]
            }
          : c
      )
    )
  }, [userId])

  // Fixar comentário
  const pinComment = useCallback((commentId: string) => {
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, pinned: !c.pinned } : c))
    )
  }, [])

  // Salvar versão
  const saveVersion = useCallback(() => {
    if (!socket) return

    const versionName = prompt('Nome da versão:')
    if (!versionName) return

    const versionDesc = prompt('Descrição (opcional):')

    const version: Version = {
      id: `version-${Date.now()}`,
      name: versionName,
      description: versionDesc || '',
      timestamp: new Date(),
      author: userName,
      changes: [],
      snapshot: {} // Aqui viria o snapshot real do projeto
    }

    socket.emit('version:save', {
      projectId,
      version
    })
  }, [socket, projectId, userName])

  // Restaurar versão
  const restoreVersion = useCallback((versionId: string) => {
    if (!socket) return

    if (!confirm('Restaurar esta versão? As mudanças não salvas serão perdidas.')) {
      return
    }

    socket.emit('version:restore', {
      projectId,
      versionId
    })

    toast.success('Versão restaurada')
  }, [socket, projectId])

  // Verificar se elemento está bloqueado
  const isElementLocked = useCallback((elementId: string) => {
    return elementLocks.find(l => l.elementId === elementId && l.userId !== userId)
  }, [elementLocks, userId])

  // Gravar comentário de voz
  const recordVoiceComment = useCallback(() => {
    setIsRecording(!isRecording)
    toast(isRecording ? 'Gravação parada' : 'Gravando...')
  }, [isRecording])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Colaboração em Tempo Real</h2>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              {activeUsers.length} online
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={saveVersion}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Versão
            </Button>

            <Button
              onClick={recordVoiceComment}
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              className="gap-2"
            >
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Gravando...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Comentário de Voz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Colaboração */}
        <div className="w-96 bg-white border-r shadow-lg flex flex-col">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 rounded-none border-b">
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="versions" className="gap-2">
                <History className="w-4 h-4" />
                Versões
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Clock className="w-4 h-4" />
                Atividade
              </TabsTrigger>
            </TabsList>

            {/* Usuários Ativos */}
            <TabsContent value="users" className="flex-1 p-4 overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {activeUsers.map((user) => (
                    <Card key={user.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="relative">
                          <AvatarFallback
                            style={{ backgroundColor: user.color }}
                            className="text-white font-semibold"
                          >
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'owner'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'editor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Comentários */}
            <TabsContent value="comments" className="flex-1 flex flex-col p-0">
              <div className="p-4 border-b">
                <Textarea
                  ref={commentInputRef}
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-2 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      addComment()
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Ctrl+Enter para enviar</span>
                  <Button onClick={addComment} size="sm" className="gap-2">
                    <Send className="w-4 h-4" />
                    Enviar
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {comments
                    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                    .map((comment) => (
                      <Card
                        key={comment.id}
                        className={`p-4 ${comment.resolved ? 'opacity-50' : ''} ${
                          comment.pinned ? 'border-2 border-yellow-400' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {comment.userName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-sm text-gray-900">
                                  {comment.userName}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(comment.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => pinComment(comment.id)}
                                >
                                  <Pin className={`w-4 h-4 ${comment.pinned ? 'text-yellow-600' : 'text-gray-400'}`} />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{comment.text}</p>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => likeComment(comment.id)}
                                className="gap-1 text-xs"
                              >
                                <ThumbsUp className={`w-3 h-3 ${comment.likes.includes(userId) ? 'fill-blue-500 text-blue-500' : 'text-gray-400'}`} />
                                {comment.likes.length}
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                <Reply className="w-3 h-3 text-gray-400" />
                                Responder
                              </Button>
                              {!comment.resolved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resolveComment(comment.id)}
                                  className="gap-1 text-xs text-green-600"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Resolver
                                </Button>
                              )}
                              {comment.resolved && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  Resolvido
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Versões */}
            <TabsContent value="versions" className="flex-1 p-4 overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {versions.map((version) => (
                    <Card key={version.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{version.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {version.author} • {new Date(version.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreVersion(version.id)}
                          className="gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restaurar
                        </Button>
                      </div>
                      {version.description && (
                        <p className="text-xs text-gray-600 mb-2">{version.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {version.changes.length} alterações
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Atividade */}
            <TabsContent value="activity" className="flex-1 p-4 overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">João editou slide 5</p>
                      <p className="text-xs text-gray-500">há 2 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Maria adicionou comentário</p>
                      <p className="text-xs text-gray-500">há 5 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Carlos salvou nova versão</p>
                      <p className="text-xs text-gray-500">há 10 minutos</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Principal */}
        <div className="flex-1 bg-gray-100 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Card className="p-8">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Área de Trabalho Colaborativa
                </h3>
                <p className="text-gray-600">
                  {activeUsers.length} usuário(s) editando simultaneamente
                </p>

                {/* Indicadores de elementos bloqueados */}
                {elementLocks.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Elementos em edição:</h4>
                    {elementLocks.map((lock) => (
                      <div
                        key={lock.elementId}
                        className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200"
                      >
                        <Lock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">
                          <strong>{lock.userName}</strong> está editando {lock.elementId}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cursores de outros usuários */}
                <div className="mt-8 flex justify-center gap-4">
                  {activeUsers
                    .filter(u => u.id !== userId)
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-full"
                        style={{ backgroundColor: user.color + '20' }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-sm font-medium" style={{ color: user.color }}>
                          {user.name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
