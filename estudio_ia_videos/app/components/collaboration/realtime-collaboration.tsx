

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  Users, 
  MessageCircle, 
  Share2, 
  Eye, 
  Edit3, 
  Lock, 
  Unlock,
  Send,
  UserPlus,
  Clock,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'away'
  role: 'owner' | 'editor' | 'viewer'
  cursor?: { x: number, y: number }
  lastSeen: string
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: string
  type: 'text' | 'system' | 'edit'
}

interface ProjectActivity {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}

export default function RealtimeCollaboration({ projectId }: { projectId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [isConnected, setIsConnected] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [user, setUser] = useState<SupabaseUser | null>(null)

  // Simulated WebSocket connection
  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true)
      
      // Mock collaborators
      setCollaborators([
        {
          id: '1',
          name: 'Maria Silva',
          email: 'maria@empresa.com',
          status: 'online',
          role: 'editor',
          lastSeen: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'João Santos',
          email: 'joao@empresa.com',
          status: 'away',
          role: 'viewer',
          lastSeen: new Date(Date.now() - 300000).toISOString()
        }
      ])

      // Mock chat messages
      setChatMessages([
        {
          id: '1',
          userId: '1',
          userName: 'Maria Silva',
          message: 'Olá pessoal! Estou revisando o roteiro da NR-35.',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'text'
        },
        {
          id: '2',
          userId: 'system',
          userName: 'Sistema',
          message: 'João Santos entrou no projeto',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'system'
        }
      ])

      // Mock activities
      setActivities([
        {
          id: '1',
          userId: '1',
          userName: 'Maria Silva',
          action: 'Editou cena',
          details: 'Introdução - Ajustou duração para 2 minutos',
          timestamp: new Date(Date.now() - 180000).toISOString()
        },
        {
          id: '2',
          userId: '2',
          userName: 'João Santos',
          action: 'Comentou',
          details: 'Sugeriu adicionar mais exemplos práticos',
          timestamp: new Date(Date.now() - 120000).toISOString()
        }
      ])
      
      toast.success('Conectado ao modo colaborativo!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [projectId])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error)
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: user?.id || 'current',
      userName: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Você',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    setChatMessages([...chatMessages, message])
    setNewMessage('')
  }

  const handleInviteCollaborator = () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido')
      return
    }

    // Simulate invite
    toast.success(`Convite enviado para ${inviteEmail}`)
    setInviteEmail('')

    // Add system message
    const systemMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: 'system',
      userName: 'Sistema',
      message: `Convite enviado para ${inviteEmail}`,
      timestamp: new Date().toISOString(),
      type: 'system'
    }

    setChatMessages([...chatMessages, systemMessage])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'agora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Modo Colaborativo Ativo</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Conectando...</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{collaborators.length} colaboradores</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborators Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Colaboradores
            </CardTitle>
            <CardDescription>
              Pessoas trabalhando neste projeto agora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invite Section */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  placeholder="email@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInviteCollaborator()}
                />
                <Button 
                  size="sm" 
                  onClick={handleInviteCollaborator}
                  disabled={!isConnected}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Active Collaborators */}
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback className="text-xs">
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`} />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">{collaborator.name}</p>
                      <p className="text-xs text-gray-500">{collaborator.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(collaborator.role)}>
                      {collaborator.role === 'owner' ? 'Dono' : 
                       collaborator.role === 'editor' ? 'Editor' : 'Visualizar'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatTime(collaborator.lastSeen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {collaborators.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum colaborador online</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat da Equipe
            </CardTitle>
            <CardDescription>
              Comunicação em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            {/* Messages */}
            <div className="flex-1 max-h-64 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'system' ? 'justify-center' : 'justify-start'}`}>
                  {message.type === 'system' ? (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {message.message}
                    </div>
                  ) : (
                    <div className="max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {message.userName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="bg-blue-50 px-3 py-2 rounded-lg text-sm">
                        {message.message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input 
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
              />
              <Button 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!isConnected || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Atividade Recente
          </CardTitle>
          <CardDescription>
            Alterações e atualizações do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{activity.userName}</span>
                    <span className="text-sm text-gray-600">{activity.action}</span>
                    <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Features */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos de Colaboração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Edit3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Edição Simultânea</h3>
              <p className="text-xs text-gray-600">Múltiplos usuários podem editar ao mesmo tempo</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold mb-1">Visualização em Tempo Real</h3>
              <p className="text-xs text-gray-600">Veja as mudanças instantaneamente</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Share2 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold mb-1">Compartilhamento Inteligente</h3>
              <p className="text-xs text-gray-600">Controle de permissões avançado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
