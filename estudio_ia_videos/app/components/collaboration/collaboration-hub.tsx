

'use client'

/**
 * 👥 COLLABORATION HUB - Sprint 17
 * Sistema de colaboração básica: comentários, compartilhamento, histórico
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users2, 
  MessageSquare, 
  Share2, 
  History, 
  Clock,
  Eye,
  Edit3,
  Send,
  Plus,
  Bell,
  UserPlus,
  Settings,
  Download,
  GitBranch,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react'

type CollaborationTab = 'team' | 'comments' | 'versions' | 'share'
const COLLAB_TABS = ['team', 'comments', 'versions', 'share'] as const
const isCollaborationTab = (value: string): value is CollaborationTab =>
  COLLAB_TABS.includes(value as CollaborationTab)

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'reviewer'
  lastActive: string
  online: boolean
}

interface ProjectComment {
  id: string
  author: TeamMember
  message: string
  timestamp: string
  type: 'comment' | 'suggestion' | 'approval' | 'question'
  resolved: boolean
  replies?: ProjectComment[]
}

interface ProjectVersion {
  id: string
  version: string
  author: TeamMember
  timestamp: string
  changes: string
  status: 'draft' | 'review' | 'approved' | 'published'
}

export default function CollaborationHub() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CollaborationTab>('team')
  const [newComment, setNewComment] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [versions, setVersions] = useState<ProjectVersion[]>([])

  useEffect(() => {
    loadCollaborationData()
  }, [])

  const loadCollaborationData = async () => {
    // Mock data - em produção viria de API
    setTeamMembers([
      {
        id: '1',
        name: 'Ana Silva',
        email: 'ana.silva@empresa.com',
        avatar: '/avatar-ana.jpg',
        role: 'owner',
        lastActive: '2 min atrás',
        online: true
      },
      {
        id: '2',
        name: 'Carlos Santos',
        email: 'carlos.santos@empresa.com',
        role: 'editor',
        lastActive: '15 min atrás',
        online: true
      },
      {
        id: '3',
        name: 'Maria Oliveira',
        email: 'maria.oliveira@empresa.com',
        role: 'reviewer',
        lastActive: '2h atrás',
        online: false
      }
    ])

    setComments([
      {
        id: '1',
        author: {
          id: '2',
          name: 'Carlos Santos',
          email: 'carlos.santos@empresa.com',
          role: 'editor',
          lastActive: '15 min atrás',
          online: true
        },
        message: 'O slide 5 sobre NR-12 precisa incluir mais informações sobre dispositivos de proteção.',
        timestamp: '10 min atrás',
        type: 'suggestion',
        resolved: false
      },
      {
        id: '2',
        author: {
          id: '3',
          name: 'Maria Oliveira',
          email: 'maria.oliveira@empresa.com',
          role: 'reviewer',
          lastActive: '2h atrás',
          online: false
        },
        message: 'Aprovado! O conteúdo está em conformidade com as NRs.',
        timestamp: '1h atrás',
        type: 'approval',
        resolved: true
      }
    ])

    setVersions([
      {
        id: '1',
        version: 'v2.1',
        author: {
          id: '1',
          name: 'Ana Silva',
          email: 'ana.silva@empresa.com',
          role: 'owner',
          lastActive: '2 min atrás',
          online: true
        },
        timestamp: '30 min atrás',
        changes: 'Adicionado compliance automático para NR-35',
        status: 'published'
      },
      {
        id: '2',
        version: 'v2.0',
        author: {
          id: '2',
          name: 'Carlos Santos',
          email: 'carlos.santos@empresa.com',
          role: 'editor',
          lastActive: '15 min atrás',
          online: true
        },
        timestamp: '2h atrás',
        changes: 'Atualização de layout e correção de erros de compliance',
        status: 'approved'
      }
    ])
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'reviewer': return 'bg-green-100 text-green-700 border-green-200'
      case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Edit3 className="h-4 w-4 text-orange-500" />
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'question': return <AlertCircle className="h-4 w-4 text-blue-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200'
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'review': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: ProjectComment = {
      id: Date.now().toString(),
      author: teamMembers[0], // Current user
      message: newComment,
      timestamp: 'agora',
      type: 'comment',
      resolved: false
    }

    setComments([comment, ...comments])
    setNewComment('')
  }

  const handleInviteUser = () => {
    // Mock - abrir modal de convite
    alert('Modal de convite seria aberto aqui')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users2 className="h-8 w-8 text-primary" />
            Colaboração Team
          </h1>
          <p className="text-muted-foreground">
            Colaboração em tempo real, comentários e controle de versões
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </Button>
          <Button onClick={handleInviteUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users2 className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
                <div className="text-sm text-muted-foreground">Membros da Equipe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{comments.length}</div>
                <div className="text-sm text-muted-foreground">Comentários</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{versions.length}</div>
                <div className="text-sm text-muted-foreground">Versões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {teamMembers.filter(m => m.online).length}
                </div>
                <div className="text-sm text-muted-foreground">Online Agora</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'team', label: 'Equipe', icon: Users2 },
          { id: 'comments', label: 'Comentários', icon: MessageSquare },
          { id: 'versions', label: 'Versões', icon: History },
          { id: 'share', label: 'Compartilhar', icon: Share2 }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              if (isCollaborationTab(tab.id)) {
                setActiveTab(tab.id)
              }
            }}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Membros da Equipe</h2>
              <Button onClick={handleInviteUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Membro
              </Button>
            </div>

            <div className="grid gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {member.online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.online ? 'Online' : `Último acesso: ${member.lastActive}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getRoleColor(member.role)} variant="outline">
                          {member.role === 'owner' && 'Proprietário'}
                          {member.role === 'editor' && 'Editor'}
                          {member.role === 'viewer' && 'Visualizador'}
                          {member.role === 'reviewer' && 'Revisor'}
                        </Badge>
                        
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Comentários e Sugestões</h2>

            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Adicione um comentário ou sugestão..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Sugestão
                    </Button>
                    <Button size="sm" onClick={handleAddComment}>
                      <Send className="h-4 w-4 mr-2" />
                      Comentar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className={`border-l-4 ${
                  comment.resolved ? 'border-l-green-500 bg-green-50/50' : 'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} />
                            <AvatarFallback>
                              {comment.author.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm">{comment.author.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {comment.timestamp}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getCommentTypeIcon(comment.type)}
                          {comment.resolved && (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              Resolvido
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm">{comment.message}</p>

                      {!comment.resolved && (
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            Responder
                          </Button>
                          <Button variant="outline" size="sm">
                            Resolver
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Histórico de Versões</h2>

            <div className="space-y-4">
              {versions.map((version, index) => (
                <Card key={version.id} className={index === 0 ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-lg">{version.version}</div>
                          {index === 0 && (
                            <Badge className="bg-primary text-white">Atual</Badge>
                          )}
                          <Badge className={getVersionStatusColor(version.status)} variant="outline">
                            {version.status === 'published' && 'Publicada'}
                            {version.status === 'approved' && 'Aprovada'}
                            {version.status === 'review' && 'Em Revisão'}
                            {version.status === 'draft' && 'Rascunho'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{version.changes}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {version.timestamp}
                          </span>
                          <span>por {version.author.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {index !== 0 && (
                          <Button variant="outline" size="sm">
                            Restaurar
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Opções de Compartilhamento</h2>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Link de Compartilhamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value="https://estudio-ia-videos.com/project/abc123"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline">Copiar</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permissões do Link:</label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Apenas visualização</option>
                      <option>Comentários e sugestões</option>
                      <option>Edição completa</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export e Download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PPTX
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Vídeo
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Relatório Compliance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

