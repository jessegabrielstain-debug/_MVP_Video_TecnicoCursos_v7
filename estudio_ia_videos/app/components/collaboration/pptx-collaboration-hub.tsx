'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
  Users,
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Crown,
  Edit3,
  Share2,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  Settings,
  Bell,
  BellOff,
  MousePointer2 as Cursor,
  MousePointer,
  Palette,
  Lock,
  Unlock,
  History,
  Undo,
  Redo,
  Save,
  FileText,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

// Types for collaboration
interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  isOnline: boolean
  lastSeen: string
  cursor?: {
    x: number
    y: number
    timestamp: number
  }
  currentSlide?: number
  isTyping?: boolean
}

interface CollaborationComment {
  id: string
  userId: string
  user: CollaborationUser
  slideId?: string
  timestamp: number
  x?: number
  y?: number
  content: string
  resolved: boolean
  replies: CollaborationComment[]
  mentions: string[]
}

interface CollaborationActivity {
  id: string
  userId: string
  user: CollaborationUser
  type: 'edit' | 'comment' | 'join' | 'leave' | 'save' | 'export'
  description: string
  timestamp: number
  slideId?: string
  data?: any
}

interface CollaborationState {
  isConnected: boolean
  users: CollaborationUser[]
  comments: CollaborationComment[]
  activities: CollaborationActivity[]
  currentUser: CollaborationUser | null
  projectLocked: boolean
  lockedBy?: CollaborationUser
}

interface PPTXCollaborationHubProps {
  projectId: string
  currentUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  onUserActivity?: (activity: CollaborationActivity) => void
  onCommentAdd?: (comment: CollaborationComment) => void
  onLockToggle?: (locked: boolean) => void
}

// Mock data for demonstration
const MOCK_USERS: CollaborationUser[] = [
  {
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana@empresa.com',
    avatar: '/avatars/ana.jpg',
    role: 'owner',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    currentSlide: 1
  },
  {
    id: 'user-2',
    name: 'Carlos Santos',
    email: 'carlos@empresa.com',
    avatar: '/avatars/carlos.jpg',
    role: 'editor',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    currentSlide: 3,
    isTyping: true
  },
  {
    id: 'user-3',
    name: 'Maria Costa',
    email: 'maria@empresa.com',
    role: 'viewer',
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

const MOCK_COMMENTS: CollaborationComment[] = [
  {
    id: 'comment-1',
    userId: 'user-2',
    user: MOCK_USERS[1],
    slideId: 'slide-1',
    timestamp: Date.now() - 10 * 60 * 1000,
    x: 100,
    y: 200,
    content: 'Esta imagem poderia ser maior para mais impacto visual',
    resolved: false,
    replies: [],
    mentions: []
  },
  {
    id: 'comment-2',
    userId: 'user-3',
    user: MOCK_USERS[2],
    slideId: 'slide-2',
    timestamp: Date.now() - 25 * 60 * 1000,
    content: 'Ótimo trabalho! Apenas ajustar a fonte do título.',
    resolved: true,
    replies: [
      {
        id: 'reply-1',
        userId: 'user-1',
        user: MOCK_USERS[0],
        timestamp: Date.now() - 20 * 60 * 1000,
        content: 'Feito! Obrigada pelo feedback.',
        resolved: false,
        replies: [],
        mentions: ['user-3']
      }
    ],
    mentions: []
  }
]

export default function PPTXCollaborationHub({
  projectId,
  currentUser,
  onUserActivity,
  onCommentAdd,
  onLockToggle
}: PPTXCollaborationHubProps) {
  // Collaboration state
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    isConnected: false,
    users: [],
    comments: [],
    activities: [],
    currentUser: null,
    projectLocked: false
  })

  // UI state
  const [showCollaborators, setShowCollaborators] = useState(true)
  const [showComments, setShowComments] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [mentionQuery, setMentionQuery] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const INVITE_ROLES = ['viewer', 'commenter', 'editor'] as const
  type InviteRole = (typeof INVITE_ROLES)[number]
  const isInviteRole = (value: string): value is InviteRole =>
    INVITE_ROLES.includes(value as InviteRole)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('viewer')

  // Voice/Video state
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [inCall, setInCall] = useState(false)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const cursorUpdateRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize collaboration
  useEffect(() => {
    initializeCollaboration()
    return () => {
      cleanup()
    }
  }, [projectId])

  const initializeCollaboration = useCallback(async () => {
    try {
      // Initialize mock data
      setCollaborationState({
        isConnected: true,
        users: MOCK_USERS,
        comments: MOCK_COMMENTS,
        activities: generateMockActivities(),
        currentUser: {
          ...currentUser,
          role: 'owner',
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        projectLocked: false
      })

      // In a real implementation, this would connect to Supabase Realtime
      // connectToSupabaseRealtime()
      
      toast.success('Conectado ao sistema de colaboração')
    } catch (error) {
      toast.error('Erro ao conectar sistema de colaboração')
      logger.error('Collaboration initialization error', error instanceof Error ? error : new Error(String(error)), { component: 'PPTXCollaborationHub' });
    }
  }, [projectId, currentUser])

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (cursorUpdateRef.current) {
      clearTimeout(cursorUpdateRef.current)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  // Generate mock activities
  const generateMockActivities = (): CollaborationActivity[] => {
    return [
      {
        id: 'activity-1',
        userId: 'user-2',
        user: MOCK_USERS[1],
        type: 'edit',
        description: 'Editou o slide 3 - "Resultados do Trimestre"',
        timestamp: Date.now() - 5 * 60 * 1000,
        slideId: 'slide-3'
      },
      {
        id: 'activity-2',
        userId: 'user-1',
        user: MOCK_USERS[0],
        type: 'comment',
        description: 'Adicionou comentário no slide 1',
        timestamp: Date.now() - 10 * 60 * 1000,
        slideId: 'slide-1'
      },
      {
        id: 'activity-3',
        userId: 'user-3',
        user: MOCK_USERS[2],
        type: 'join',
        description: 'Entrou na sessão de colaboração',
        timestamp: Date.now() - 15 * 60 * 1000
      }
    ]
  }

  // Handle comment submission
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return

    const comment: CollaborationComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      user: collaborationState.currentUser!,
      timestamp: Date.now(),
      content: newComment,
      resolved: false,
      replies: [],
      mentions: extractMentions(newComment)
    }

    setCollaborationState(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }))

    if (onCommentAdd) {
      onCommentAdd(comment)
    }

    setNewComment('')
    toast.success('Comentário adicionado')
  }, [newComment, currentUser, collaborationState.currentUser, onCommentAdd])

  // Extract mentions from comment
  const extractMentions = (text: string): string[] => {
    const mentions = text.match(/@\w+/g) || []
    return mentions.map(mention => mention.substring(1))
  }

  // Handle user invitation
  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido')
      return
    }

    try {
      // In real implementation, this would call Supabase API
      toast.success(`Convite enviado para ${inviteEmail}`)
      setShowInviteDialog(false)
      setInviteEmail('')
    } catch (error) {
      toast.error('Erro ao enviar convite')
    }
  }, [inviteEmail, inviteRole])

  // Toggle project lock
  const handleToggleLock = useCallback(() => {
    const newLocked = !collaborationState.projectLocked
    
    setCollaborationState(prev => ({
      ...prev,
      projectLocked: newLocked,
      lockedBy: newLocked ? prev.currentUser! : undefined
    }))

    if (onLockToggle) {
      onLockToggle(newLocked)
    }

    toast.info(newLocked ? 'Projeto bloqueado para edição' : 'Projeto desbloqueado')
  }, [collaborationState.projectLocked, onLockToggle])

  // Start voice/video call
  const handleStartCall = useCallback(() => {
    setInCall(true)
    toast.success('Chamada iniciada')
    // In real implementation, integrate with WebRTC or similar
  }, [])

  const handleEndCall = useCallback(() => {
    setInCall(false)
    setVoiceEnabled(false)
    setVideoEnabled(false)
    toast.info('Chamada encerrada')
  }, [])

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60 * 1000) return 'Agora'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}min atrás`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h atrás`
    
    return new Date(timestamp).toLocaleDateString()
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500'
      case 'editor': return 'bg-blue-500'
      case 'commenter': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex h-full">
      {/* Main Collaboration Panel */}
      <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Colaboração
            </h3>
            
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                collaborationState.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-muted-foreground">
                {collaborationState.isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convidar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Colaborador</DialogTitle>
                  <DialogDescription>
                    Adicione um novo membro ao projeto
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Email</Label>
                    <Input
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Permissão</Label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={inviteRole}
                      onChange={(e) => {
                        const { value } = e.target
                        if (!isInviteRole(value)) {
                          return
                        }
                        setInviteRole(value)
                      }}
                    >
                      <option value="viewer">Visualizar</option>
                      <option value="commenter">Comentar</option>
                      <option value="editor">Editar</option>
                    </select>
                  </div>
                  
                  <Button onClick={handleInviteUser} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleLock}
              className="flex-1"
            >
              {collaborationState.projectLocked ? (
                <Lock className="w-4 h-4 mr-2" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              {collaborationState.projectLocked ? 'Bloqueado' : 'Livre'}
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-border">
          <Button
            variant={showCollaborators ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setShowCollaborators(true)
              setShowComments(false)
              setShowActivity(false)
            }}
            className="flex-1 rounded-none"
          >
            <Users className="w-4 h-4 mr-1" />
            Usuários ({collaborationState.users.length})
          </Button>
          
          <Button
            variant={showComments ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setShowCollaborators(false)
              setShowComments(true)
              setShowActivity(false)
            }}
            className="flex-1 rounded-none"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Comentários ({collaborationState.comments.length})
          </Button>
          
          <Button
            variant={showActivity ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setShowCollaborators(false)
              setShowComments(false)
              setShowActivity(true)
            }}
            className="flex-1 rounded-none"
          >
            <History className="w-4 h-4 mr-1" />
            Atividade
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {/* Collaborators Panel */}
            {showCollaborators && (
              <div className="space-y-3">
                {/* Voice/Video Controls */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Chamada</span>
                      <Badge variant={inCall ? "default" : "secondary"}>
                        {inCall ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!inCall ? (
                        <Button size="sm" onClick={handleStartCall} className="flex-1">
                          <Phone className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant={voiceEnabled ? "default" : "outline"}
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                          >
                            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={videoEnabled ? "default" : "outline"}
                            onClick={() => setVideoEnabled(!videoEnabled)}
                          >
                            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleEndCall}
                          >
                            <PhoneOff className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* User List */}
                {collaborationState.users.map(user => (
                  <motion.div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border bg-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {user.name}
                        </span>
                        {user.role === 'owner' && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRoleBadgeColor(user.role)} text-white`}
                        >
                          {user.role}
                        </Badge>
                        
                        {user.currentSlide && (
                          <span className="text-xs text-muted-foreground">
                            Slide {user.currentSlide}
                          </span>
                        )}
                        
                        {user.isTyping && (
                          <motion.div
                            className="flex space-x-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          </motion.div>
                        )}
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        {user.isOnline ? 'Online agora' : `Visto ${formatTimestamp(new Date(user.lastSeen).getTime())}`}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Comments Panel */}
            {showComments && (
              <div className="space-y-4">
                {/* Add Comment */}
                <Card>
                  <CardContent className="p-3">
                    <Textarea
                      placeholder="Adicionar comentário... Use @nome para mencionar"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-20 text-sm"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        Use @nome para mencionar usuários
                      </span>
                      <Button size="sm" onClick={handleSubmitComment}>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Comment List */}
                <div className="space-y-3">
                  {collaborationState.comments.map(comment => (
                    <motion.div
                      key={comment.id}
                      className={`p-3 rounded-lg border ${comment.resolved ? 'bg-green-50 border-green-200' : 'bg-card'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {comment.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                            {comment.resolved && (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                          
                          <p className="text-sm text-foreground mb-2">
                            {comment.content}
                          </p>
                          
                          {comment.slideId && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Slide
                            </Badge>
                          )}
                          
                          {comment.replies.length > 0 && (
                            <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="text-sm">
                                  <span className="font-medium text-muted-foreground">
                                    {reply.user.name}:
                                  </span>
                                  <span className="ml-2">{reply.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Panel */}
            {showActivity && (
              <div className="space-y-3">
                {collaborationState.activities.map(activity => (
                  <motion.div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {activity.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                        
                        {activity.slideId && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Slide
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Project Lock Warning */}
        {collaborationState.projectLocked && (
          <div className="p-3 border-t border-border bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-center space-x-2 text-sm">
              <Lock className="w-4 h-4 text-yellow-600" />
              <span className="flex-1">
                Projeto bloqueado por {collaborationState.lockedBy?.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}