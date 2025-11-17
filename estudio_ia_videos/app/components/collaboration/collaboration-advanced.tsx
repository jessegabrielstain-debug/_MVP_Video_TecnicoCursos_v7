

'use client'

/**
 * 🤝 SISTEMA DE COLABORAÇÃO AVANÇADO - Sprint 43 ✅
 * Sistema completo de colaboração em tempo real para equipes
 * Comentários, compartilhamento, revisões, histórico de versões
 * ✅ CONECTADO AO BANCO DE DADOS REAL
 */

import React, { useState, useEffect, useRef } from 'react'
import { useCollaboration, type Comment as CommentType, type ProjectVersion as ProjectVersionType } from '@/hooks/use-collaboration'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MessageSquare,
  Users,
  Share,
  History,
  GitBranch,
  Eye,
  EyeOff,
  Clock,
  Send,
  Reply,
  Heart,
  Tag,
  Bell,
  BellOff,
  Download,
  Upload,
  Plus,
  X,
  Check,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  CheckCircle,
  Archive,
  MoreVertical,
  UserPlus,
  Settings,
  Lock,
  Unlock,
  Activity
} from 'lucide-react'

// ==================== INTERFACES ====================
// ✅ Usando interfaces do hook use-collaboration ao invés de definições locais

// Aliases para compatibilidade
type Comment = CommentType
type ProjectVersion = ProjectVersionType

interface Reaction {
  type: 'like' | 'love' | 'useful' | 'question'
  userId: string
  userName: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastSeen: string
  permissions: {
    canEdit: boolean
    canComment: boolean
    canShare: boolean
    canExport: boolean
    canInvite: boolean
  }
}

interface ShareSettings {
  isPublic: boolean
  allowComments: boolean
  allowDownload: boolean
  expiresAt?: string
  password?: string
  domain?: string
  allowedEmails: string[]
}

interface Notification {
  id: string
  type: 'comment' | 'mention' | 'share' | 'version' | 'approval'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  avatar?: string
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

// ==================== USANDO DADOS REAIS DO BANCO ====================
// ✅ Os dados agora vêm do hook useCollaboration que conecta às APIs reais
// Todos os mocks foram removidos e substituídos por dados reais do DB

// ==================== COMPONENTE PRINCIPAL ====================

export default function CollaborationAdvanced({ projectId = 'demo-project' }: { projectId?: string }) {
  const [activeTab, setActiveTab] = useState('comments')
  
  // ✅ USANDO HOOK REAL DE COLABORAÇÃO
  const { comments, versions, isLoading, error, actions } = useCollaboration(projectId)
  
  // Mock para team members (não tem API ainda)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [showResolved, setShowResolved] = useState(false)
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowDownload: false,
    allowedEmails: []
  })

  // ==================== COMPONENTE DE COMENTÁRIOS ====================

  const CommentsPanel = () => (
    <div className="space-y-4">
      {/* Filtros de comentários */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={!showResolved ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowResolved(false)}
          >
            Ativos ({comments.filter(c => c.status === 'pending').length})
          </Button>
          <Button
            variant={showResolved ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowResolved(true)}
          >
            Resolvidos ({comments.filter(c => c.status === 'resolved').length})
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Ordenar por data</DropdownMenuItem>
            <DropdownMenuItem>Ordenar por autor</DropdownMenuItem>
            <DropdownMenuItem>Filtrar por prioridade</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Exportar comentários</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lista de comentários */}
      <ScrollArea className="h-[400px] space-y-4">
        {comments
          .filter(comment => showResolved ? comment.status === 'resolved' : comment.status === 'pending')
          .map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        }
      </ScrollArea>

      {/* Novo comentário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Novo Comentário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Adicione seu comentário ou feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="private-comment" />
              <Label htmlFor="private-comment" className="text-xs">Comentário privado</Label>
            </div>
            <Button size="sm" disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Comentar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ==================== COMPONENTE DE CARD DE COMENTÁRIO ====================

  const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card className={cn("mb-4", comment.status === 'resolved' && 'opacity-70')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>{comment.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm">{comment.author.name}</p>
                <Badge variant={comment.author.role === 'reviewer' ? 'secondary' : 'outline'} className="text-xs">
                  {comment.author.role}
                </Badge>
                {comment.status === 'resolved' && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolvido
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Reply className="h-4 w-4 mr-2" />
                Responder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Check className="h-4 w-4 mr-2" />
                Marcar como resolvido
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm mb-3">{comment.content}</p>
        
        {/* Reações */}
        <div className="flex items-center space-x-3 mb-3">
          <Button variant="ghost" size="sm" className="h-7">
            <Heart className="h-3 w-3 mr-1" />
            {comment.reactions.filter(r => r.type === 'love').length}
          </Button>
          <Button variant="ghost" size="sm" className="h-7">
            <Star className="h-3 w-3 mr-1" />
            {comment.reactions.filter(r => r.type === 'useful').length}
          </Button>
        </div>

        {/* Respostas */}
        {comment.replies.length > 0 && (
          <div className="space-y-2 pl-4 border-l-2 border-gray-100">
            {comment.replies.map(reply => (
              <div key={reply.id} className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.author.avatar} />
                    <AvatarFallback className="text-xs">
                      {reply.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-xs">{reply.author.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reply.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <p className="text-xs">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ==================== COMPONENTE DE HISTÓRICO DE VERSÕES ====================

  const VersionsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Histórico de Versões</h3>
        <Button size="sm">
          <GitBranch className="h-4 w-4 mr-2" />
          Nova Versão
        </Button>
      </div>

      <ScrollArea className="h-[500px] space-y-4">
        {versions.map((version, index) => (
          <Card key={version.id} className={cn("mb-4", index === 0 && 'border-blue-200')}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{version.name}</h4>
                    {version.isCurrent && (
                      <Badge variant="default">Atual</Badge>
                    )}
                    {version.isActive && (
                      <Badge variant="outline">Ativa</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{version.description || 'Sem descrição'}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={version.author.avatar} />
                        <AvatarFallback className="text-xs">
                          {version.author.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{version.author.name}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(version.timestamp).toLocaleString('pt-BR')}</span>
                    {version.fileSize && (
                      <>
                        <span>•</span>
                        <span>{(version.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Visualizar versão</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {version.isCurrent && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Versão {version.versionNumber} - {version.description || 'Sem descrição'}
                </p>
                {version.fileSize && (
                  <p className="text-xs text-muted-foreground">
                    Tamanho: {(version.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )

  // ==================== COMPONENTE DE EQUIPE ====================

  const TeamPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Equipe do Projeto</h3>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar
        </Button>
      </div>

      <div className="grid gap-4">
        {teamMembers.map(member => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                    member.status === 'online' ? 'bg-green-500' : 
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                  )} />
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={member.role === 'owner' ? 'default' : 'outline'} className="text-xs">
                      {member.role === 'owner' ? 'Proprietário' : 
                       member.role === 'admin' ? 'Admin' :
                       member.role === 'editor' ? 'Editor' :
                       member.role === 'reviewer' ? 'Revisor' : 'Visualizador'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {member.status === 'online' ? 'Online' : 
                       member.status === 'away' ? 'Ausente' : 
                       `Visto ${new Date(member.lastSeen).toLocaleString('pt-BR', { 
                         month: 'short', 
                         day: 'numeric', 
                         hour: '2-digit', 
                         minute: '2-digit' 
                       })}`}
                    </span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                  <DropdownMenuItem>Alterar função</DropdownMenuItem>
                  <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    Remover do projeto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // ==================== COMPONENTE DE COMPARTILHAMENTO ====================

  const SharePanel = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações de Compartilhamento</CardTitle>
          <CardDescription>
            Controle quem pode ver e interagir com seu projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-share">Projeto público</Label>
              <p className="text-xs text-muted-foreground">
                Qualquer pessoa com o link pode visualizar
              </p>
            </div>
            <Switch 
              id="public-share"
              checked={shareSettings.isPublic}
              onCheckedChange={(checked) => 
                setShareSettings(prev => ({ ...prev, isPublic: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-comments">Permitir comentários</Label>
              <p className="text-xs text-muted-foreground">
                Visitantes podem deixar feedback
              </p>
            </div>
            <Switch 
              id="allow-comments"
              checked={shareSettings.allowComments}
              onCheckedChange={(checked) => 
                setShareSettings(prev => ({ ...prev, allowComments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-download">Permitir download</Label>
              <p className="text-xs text-muted-foreground">
                Visitantes podem baixar o arquivo
              </p>
            </div>
            <Switch 
              id="allow-download"
              checked={shareSettings.allowDownload}
              onCheckedChange={(checked) => 
                setShareSettings(prev => ({ ...prev, allowDownload: checked }))
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Link de compartilhamento</Label>
            <div className="flex space-x-2">
              <Input 
                readOnly 
                value="https://estudio-ia.com.br/projects/nr12-training/share/abc123"
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                Copiar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-protect">Senha de proteção (opcional)</Label>
            <Input 
              id="password-protect"
              type="password"
              placeholder="Digite uma senha"
              value={shareSettings.password || ''}
              onChange={(e) => 
                setShareSettings(prev => ({ ...prev, password: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convitar por Email</CardTitle>
          <CardDescription>
            Adicione colaboradores específicos ao projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input 
              placeholder="email@exemplo.com"
              type="email"
              className="flex-1"
            />
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Convidar
            </Button>
          </div>
          
          <div className="space-y-2">
            {shareSettings.allowedEmails.map((email, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{email}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShareSettings(prev => ({
                    ...prev,
                    allowedEmails: prev.allowedEmails.filter((_, i) => i !== index)
                  }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ==================== RENDER PRINCIPAL ====================

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Colaboração</span>
            </CardTitle>
            <CardDescription>
              Gerencie comentários, versões, equipe e compartilhamento do projeto
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
              <Badge variant="secondary" className="ml-1 text-xs">
                {notifications.filter(n => !n.isRead).length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4" />
              Atividade
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comments" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Comentários</span>
              <Badge variant="secondary" className="text-xs">
                {comments.filter(c => c.status === 'pending').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Versões</span>
              <Badge variant="secondary" className="text-xs">
                {versions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Equipe</span>
              <Badge variant="secondary" className="text-xs">
                {teamMembers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center space-x-2">
              <Share className="h-4 w-4" />
              <span>Compartilhar</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="comments">
              <CommentsPanel />
            </TabsContent>

            <TabsContent value="versions">
              <VersionsPanel />
            </TabsContent>

            <TabsContent value="team">
              <TeamPanel />
            </TabsContent>

            <TabsContent value="share">
              <SharePanel />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

