
'use client'

/**
 * 🤝 SISTEMA DE COLABORAÇÃO - Sprint 17
 * Sistema básico de colaboração: comentários, compartilhamento, histórico
 */

import React, { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  MessageCircle,
  Share2,
  Clock,
  Eye,
  Edit,
  Trash2,
  Reply,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  Copy,
  ExternalLink,
  Download,
  Settings,
  Bell,
  BellOff,
  Bookmark,
  Flag,
  MoreHorizontal,
  History,
  GitBranch,
  User,
  Calendar,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  permissions: {
    canEdit: boolean
    canComment: boolean
    canShare: boolean
    canDelete: boolean
  }
}

interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  content: string
  timestamp: string
  position?: {
    time: number
    track?: number
    x?: number
    y?: number
  }
  resolved: boolean
  priority: 'low' | 'medium' | 'high'
  mentions: string[]
  reactions: {
    emoji: string
    users: string[]
  }[]
  replies: {
    id: string
    author: { id: string; name: string; avatar: string }
    content: string
    timestamp: string
  }[]
  attachments?: {
    id: string
    name: string
    url: string
    type: string
  }[]
}

interface VersionHistory {
  id: string
  version: string
  author: {
    id: string
    name: string
    avatar: string
  }
  timestamp: string
  description: string
  changes: {
    type: 'added' | 'modified' | 'removed'
    target: string
    description: string
  }[]
  current: boolean
}

interface ShareSettings {
  public: boolean
  allowComments: boolean
  allowDownload: boolean
  expiresAt?: string
  password?: string
  domains?: string[]
}

export default function CollaborationSystem({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState('Você')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Ana Silva',
      email: 'ana@empresa.com',
      avatar: '',
      role: 'editor',
      status: 'online',
      lastSeen: new Date().toISOString(),
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canDelete: false
      }
    },
    {
      id: '2',
      name: 'Carlos Santos',
      email: 'carlos@empresa.com',
      avatar: '',
      role: 'viewer',
      status: 'offline',
      lastSeen: '2024-09-24T14:30:00Z',
      permissions: {
        canEdit: false,
        canComment: true,
        canShare: false,
        canDelete: false
      }
    }
  ])

  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'comment-1',
      author: {
        id: '1',
        name: 'Ana Silva',
        avatar: ''
      },
      content: 'O slide de introdução está muito bom! Mas acho que poderíamos aumentar o tamanho da fonte do título.',
      timestamp: '2024-09-24T15:30:00Z',
      position: {
        time: 15,
        track: 1
      },
      resolved: false,
      priority: 'medium',
      mentions: [],
      reactions: [
        { emoji: '👍', users: ['2'] }
      ],
      replies: [
        {
          id: 'reply-1',
          author: { id: '2', name: 'Carlos Santos', avatar: '' },
          content: 'Concordo com a Ana. E que tal mudar a cor do fundo também?',
          timestamp: '2024-09-24T15:32:00Z'
        }
      ]
    },
    {
      id: 'comment-2',
      author: {
        id: '2',
        name: 'Carlos Santos',
        avatar: ''
      },
      content: 'A narração está excelente! O TTS ficou muito natural.',
      timestamp: '2024-09-24T16:45:00Z',
      resolved: true,
      priority: 'low',
      mentions: [],
      reactions: [
        { emoji: '🎉', users: ['1'] }
      ],
      replies: []
    }
  ])

  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([
    {
      id: 'v1.3',
      version: '1.3',
      author: {
        id: '1',
        name: 'Ana Silva',
        avatar: ''
      },
      timestamp: '2024-09-24T18:00:00Z',
      description: 'Ajustou tamanho da fonte e adicionou nova narração',
      changes: [
        { type: 'modified', target: 'Slide 1', description: 'Aumentado tamanho da fonte do título' },
        { type: 'added', target: 'Track 2', description: 'Nova narração em português BR' },
        { type: 'modified', target: 'Background', description: 'Alterada cor de fundo para azul escuro' }
      ],
      current: true
    },
    {
      id: 'v1.2',
      version: '1.2',
      author: {
        id: 'current',
        name: 'Você',
        avatar: ''
      },
      timestamp: '2024-09-24T14:30:00Z',
      description: 'Versão inicial com slides básicos',
      changes: [
        { type: 'added', target: 'Projeto', description: 'Criação inicial do projeto NR-12' },
        { type: 'added', target: 'Slides', description: 'Adicionados 5 slides principais' }
      ],
      current: false
    }
  ])

  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    public: false,
    allowComments: true,
    allowDownload: false
  })

  const [newComment, setNewComment] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Collaborator['role']>('viewer')

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        const authUser = data.user ?? null
        setUser(authUser)

        if (authUser) {
          const name = authUser.user_metadata?.name ?? authUser.email ?? 'Você'
          const avatar = authUser.user_metadata?.avatar_url ?? ''
          setDisplayName(name)
          setAvatarUrl(avatar)
        } else {
          setDisplayName('Você')
          setAvatarUrl('')
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error)
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        setDisplayName(authUser.user_metadata?.name ?? authUser.email ?? 'Você')
        setAvatarUrl(authUser.user_metadata?.avatar_url ?? '')
      } else {
        setDisplayName('Você')
        setAvatarUrl('')
      }
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!user) return
    setVersionHistory((prev) =>
      prev.map((version) =>
        version.id === 'v1.2'
          ? {
              ...version,
              author: {
                id: user.id,
                name: displayName,
                avatar: avatarUrl
              }
            }
          : version
      )
    )
  }, [avatarUrl, displayName, user])

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: {
        id: user?.id || 'current',
        name: displayName,
        avatar: avatarUrl
      },
      content: newComment,
      timestamp: new Date().toISOString(),
      resolved: false,
      priority: 'medium',
      mentions: [],
      reactions: [],
      replies: []
    }

    setComments(prev => [comment, ...prev])
    setNewComment('')
  }

  const handleResolveComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, resolved: !comment.resolved }
          : comment
      )
    )
  }

  const handleAddReaction = (commentId: string, emoji: string) => {
    const userId = user?.id || 'current'
    
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          const existingReaction = comment.reactions.find(r => r.emoji === emoji)
          
          if (existingReaction) {
            if (existingReaction.users.includes(userId)) {
              // Remove reação
              return {
                ...comment,
                reactions: comment.reactions.map(r =>
                  r.emoji === emoji
                    ? { ...r, users: r.users.filter(u => u !== userId) }
                    : r
                ).filter(r => r.users.length > 0)
              }
            } else {
              // Adiciona reação
              return {
                ...comment,
                reactions: comment.reactions.map(r =>
                  r.emoji === emoji
                    ? { ...r, users: [...r.users, userId] }
                    : r
                )
              }
            }
          } else {
            // Nova reação
            return {
              ...comment,
              reactions: [...comment.reactions, { emoji, users: [userId] }]
            }
          }
        }
        return comment
      })
    )
  }

  const handleInviteCollaborator = () => {
    if (!inviteEmail.trim()) return

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      avatar: '',
      role: inviteRole,
      status: 'offline',
      lastSeen: new Date().toISOString(),
      permissions: {
        canEdit: inviteRole === 'owner' || inviteRole === 'editor',
        canComment: inviteRole !== 'viewer' || true,
        canShare: inviteRole === 'owner' || inviteRole === 'editor',
        canDelete: inviteRole === 'owner'
      }
    }

    setCollaborators(prev => [...prev, newCollaborator])
    setInviteEmail('')
    setShowInviteDialog(false)
  }

  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const shareId = Math.random().toString(36).substr(2, 8)
    return `${baseUrl}/shared/${projectId}/${shareId}`
  }

  const copyShareLink = async () => {
    const shareLink = generateShareLink()
    await navigator.clipboard.writeText(shareLink)
    // Mostrar toast de sucesso
  }

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getRoleColor = (role: Collaborator['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'commenter': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Comment['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collaborators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comentários ({comments.filter(c => !c.resolved).length})
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Colaboradores do Projeto
                  </CardTitle>
                  <CardDescription>
                    Gerencie quem tem acesso ao projeto e suas permissões
                  </CardDescription>
                </div>
                
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Convidar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Convidar Colaborador</DialogTitle>
                      <DialogDescription>
                        Adicione uma pessoa ao projeto e defina suas permissões
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="nome@empresa.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <div className="space-y-2">
                          {[
                            { value: 'viewer', label: 'Visualizador', desc: 'Pode apenas ver o projeto' },
                            { value: 'commenter', label: 'Comentarista', desc: 'Pode ver e comentar' },
                            { value: 'editor', label: 'Editor', desc: 'Pode editar o projeto' },
                            { value: 'owner', label: 'Proprietário', desc: 'Controle total' }
                          ].map((role) => (
                            <div
                              key={role.value}
                              className={cn(
                                "p-3 border rounded-lg cursor-pointer transition-colors",
                                inviteRole === role.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted"
                              )}
                              onClick={() => setInviteRole(role.value as Collaborator['role'])}
                            >
                              <div className="font-medium">{role.label}</div>
                              <div className="text-sm text-muted-foreground">{role.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleInviteCollaborator}>
                        Enviar Convite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                            getStatusColor(collaborator.status)
                          )}
                        />
                      </div>
                      
                      <div>
                        <div className="font-medium">{collaborator.name}</div>
                        <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {collaborator.status === 'online'
                            ? 'Online agora'
                            : `Visto ${formatDistanceToNow(new Date(collaborator.lastSeen), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}`
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(collaborator.role)}>
                        {collaborator.role === 'owner' && 'Proprietário'}
                        {collaborator.role === 'editor' && 'Editor'}
                        {collaborator.role === 'commenter' && 'Comentarista'}
                        {collaborator.role === 'viewer' && 'Visualizador'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Alterar Função
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="mr-2 h-4 w-4" />
                            Configurar Notificações
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover Acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comentários e Revisões
              </CardTitle>
              <CardDescription>
                Discuta alterações e melhoras no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Novo Comentário */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Bell className="h-4 w-4 mr-1" />
                          Mencionar
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Bookmark className="h-4 w-4 mr-1" />
                          Marcar Posição
                        </Button>
                      </div>
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de Comentários */}
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "p-4 border rounded-lg",
                          comment.resolved && "bg-muted/30 border-muted"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.avatar} />
                              <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{comment.author.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.timestamp), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                                <Badge className={getPriorityColor(comment.priority)}>
                                  {comment.priority === 'high' && 'Alta'}
                                  {comment.priority === 'medium' && 'Média'}
                                  {comment.priority === 'low' && 'Baixa'}
                                </Badge>
                                {comment.position && (
                                  <Badge variant="outline">
                                    {comment.position.time}s
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm">{comment.content}</p>
                              
                              {/* Reações */}
                              {comment.reactions.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {comment.reactions.map((reaction) => (
                                    <Button
                                      key={reaction.emoji}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => handleAddReaction(comment.id, reaction.emoji)}
                                    >
                                      <span className="mr-1">{reaction.emoji}</span>
                                      <span className="text-xs">{reaction.users.length}</span>
                                    </Button>
                                  ))}
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 px-2">
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      {['👍', '👎', '❤️', '😄', '🎉', '🤔'].map((emoji) => (
                                        <DropdownMenuItem
                                          key={emoji}
                                          onClick={() => handleAddReaction(comment.id, emoji)}
                                        >
                                          {emoji}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              
                              {/* Replies */}
                              {comment.replies.length > 0 && (
                                <div className="ml-4 pl-4 border-l space-y-2">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={reply.author.avatar} />
                                        <AvatarFallback className="text-xs">
                                          {reply.author.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{reply.author.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(reply.timestamp), { 
                                              addSuffix: true, 
                                              locale: ptBR 
                                            })}
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 pt-2">
                                <Button variant="ghost" size="sm">
                                  <Reply className="h-3 w-3 mr-1" />
                                  Responder
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleResolveComment(comment.id)}
                                  className={comment.resolved ? "text-green-600" : ""}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {comment.resolved ? 'Resolvido' : 'Resolver'}
                                </Button>
                                
                                <Button variant="ghost" size="sm">
                                  <Flag className="h-3 w-3 mr-1" />
                                  Sinalizar
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Compartilhar Projeto
              </CardTitle>
              <CardDescription>
                Configure como outras pessoas podem acessar seu projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Link de Compartilhamento */}
              <div className="space-y-3">
                <Label>Link de Compartilhamento</Label>
                <div className="flex gap-2">
                  <Input 
                    value={generateShareLink()} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Qualquer pessoa com este link poderá acessar o projeto
                </p>
              </div>

              {/* Configurações de Compartilhamento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Acesso Público</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir acesso sem necessidade de login
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {shareSettings.public ? 'Público' : 'Privado'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Comentários</Label>
                    <p className="text-sm text-muted-foreground">
                      Visitantes podem deixar comentários
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {shareSettings.allowComments ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Permitir Download</Label>
                    <p className="text-sm text-muted-foreground">
                      Visitantes podem baixar o vídeo
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {shareSettings.allowDownload ? 'Ativado' : 'Desativado'}
                  </Button>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t">
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações Avançadas
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurações de Compartilhamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Data de Expiração (Opcional)</Label>
                        <Input type="datetime-local" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Senha de Proteção (Opcional)</Label>
                        <Input type="password" placeholder="Digite uma senha..." />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Domínios Permitidos (Opcional)</Label>
                        <Textarea placeholder="empresa.com&#10;parceiro.com.br" rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                        Cancelar
                      </Button>
                      <Button>Salvar Configurações</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Versões
              </CardTitle>
              <CardDescription>
                Acompanhe todas as mudanças feitas no projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versionHistory.map((version) => (
                  <div
                    key={version.id}
                    className={cn(
                      "p-4 border rounded-lg relative",
                      version.current && "border-primary bg-primary/5"
                    )}
                  >
                    {version.current && (
                      <Badge className="absolute -top-2 left-4 bg-primary">
                        Versão Atual
                      </Badge>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">v{version.version}</span>
                            <span className="text-sm text-muted-foreground">
                              por {version.author.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(version.timestamp), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                          
                          <p className="text-sm">{version.description}</p>
                          
                          <div className="space-y-1">
                            {version.changes.map((change, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {change.type === 'added' && (
                                  <Plus className="h-3 w-3 text-green-600" />
                                )}
                                {change.type === 'modified' && (
                                  <Edit className="h-3 w-3 text-blue-600" />
                                )}
                                {change.type === 'removed' && (
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                )}
                                
                                <span className="text-muted-foreground">
                                  <span className="font-medium">{change.target}:</span> {change.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!version.current && (
                          <Button variant="outline" size="sm">
                            Restaurar
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
