
/**
 * 📋 SPRINT 38: Review Panel
 * Painel de revisão e aprovação de projetos
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertCircle,
  Send, Users, Clock, History, Lock, Unlock,
  GitBranch, FileText, Eye, Edit, Play
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReviewPanelProps {
  projectId: string
  userId: string
  userName: string
  onClose?: () => void
}

type ReviewWorkflowStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'
type ReviewDecision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'

interface ReviewRequest {
  id: string
  projectId: string
  requesterId: string
  requesterName: string
  reviewers: Array<{
    userId: string
    userName: string
    userEmail: string
    decision?: ReviewDecision
    feedback?: string
    reviewedAt?: Date
    status: 'PENDING' | 'REVIEWED'
  }>
  message?: string
  dueDate?: Date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
  createdAt: Date
  updatedAt: Date
}

interface ApprovalHistory {
  id: string
  userId: string
  userName: string
  decision: ReviewDecision
  feedback?: string
  createdAt: Date
}

export default function ReviewPanel({
  projectId,
  userId,
  userName,
  onClose
}: ReviewPanelProps) {
  const [projectStatus, setReviewWorkflowStatus] = useState<ReviewWorkflowStatus>('DRAFT')
  const [currentReview, setCurrentReview] = useState<ReviewRequest | null>(null)
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([])
  const [canEdit, setCanEdit] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Request Review State
  const [showRequestReview, setShowRequestReview] = useState(false)
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewDueDate, setReviewDueDate] = useState('')
  const [availableReviewers, setAvailableReviewers] = useState<Array<{
    id: string
    name: string
    email: string
    avatar?: string
  }>>([])

  // Submit Review State
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [selectedDecision, setSelectedDecision] = useState<ReviewDecision | null>(null)

  useEffect(() => {
    loadReviewStatus()
    loadAvailableReviewers()
  }, [projectId])

  const loadReviewStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/review/status?projectId=${projectId}`)
      if (!response.ok) throw new Error('Erro ao carregar status')
      
      const data = await response.json()
      setReviewWorkflowStatus(data.status.status)
      setCurrentReview(data.status.currentReviewRequest)
      setApprovalHistory(data.status.approvalHistory || [])
      setCanEdit(data.status.canEdit)
    } catch (error: unknown) {
      console.error('Erro ao carregar status:', error)
      toast.error('Erro ao carregar status de revisão')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableReviewers = async () => {
    try {
      // Simular busca de revisores disponíveis
      // Em produção, buscar da API
      setAvailableReviewers([
        { id: 'user-1', name: 'Ana Silva', email: 'ana@empresa.com' },
        { id: 'user-2', name: 'Carlos Santos', email: 'carlos@empresa.com' },
        { id: 'user-3', name: 'Maria Oliveira', email: 'maria@empresa.com' },
      ])
    } catch (error) {
      console.error('Erro ao carregar revisores:', error)
    }
  }

  const handleRequestReview = async () => {
    if (selectedReviewers.length === 0) {
      toast.error('Selecione pelo menos um revisor')
      return
    }

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          reviewerIds: selectedReviewers,
          message: reviewMessage || undefined,
          dueDate: reviewDueDate || undefined,
        }),
      })

      if (!response.ok) throw new Error('Erro ao solicitar revisão')

      toast.success('Solicitação de revisão enviada!')
      setShowRequestReview(false)
      setSelectedReviewers([])
      setReviewMessage('')
      setReviewDueDate('')
      await loadReviewStatus()
    } catch (error: unknown) {
      console.error('Erro ao solicitar revisão:', error)
      toast.error('Erro ao solicitar revisão')
    }
  }

  const handleSubmitReview = async (decision: ReviewDecision) => {
    if (!currentReview) return

    try {
      const response = await fetch(`/api/review/${currentReview.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          feedback: reviewFeedback || undefined,
        }),
      })

      if (!response.ok) throw new Error('Erro ao submeter revisão')

      const decisionText = {
        APPROVED: 'aprovada',
        REJECTED: 'rejeitada',
        CHANGES_REQUESTED: 'solicitou alterações',
      }[decision]

      toast.success(`Revisão ${decisionText} com sucesso!`)
      setReviewFeedback('')
      setSelectedDecision(null)
      await loadReviewStatus()
    } catch (error: unknown) {
      console.error('Erro ao submeter revisão:', error)
      toast.error('Erro ao submeter revisão')
    }
  }

  const handleReopenForEditing = async () => {
    if (!confirm('Deseja realmente reabrir este projeto para edição?')) return

    try {
      const response = await fetch(`/api/review/${currentReview?.id || 'temp'}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          reason: 'Reaberto para edição',
        }),
      })

      if (!response.ok) throw new Error('Erro ao reabrir projeto')

      toast.success('Projeto reaberto para edição')
      await loadReviewStatus()
    } catch (error: unknown) {
      console.error('Erro ao reabrir:', error)
      toast.error('Erro ao reabrir projeto')
    }
  }

  const handlePublish = async () => {
    if (!confirm('Deseja publicar este projeto? Esta ação não pode ser desfeita.')) return

    try {
      const response = await fetch(`/api/review/${currentReview?.id || 'temp'}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) throw new Error('Erro ao publicar projeto')

      toast.success('Projeto publicado com sucesso!')
      await loadReviewStatus()
    } catch (error: unknown) {
      console.error('Erro ao publicar:', error)
      toast.error('Erro ao publicar projeto')
    }
  }

  const getStatusBadge = (status: ReviewWorkflowStatus) => {
    const variants = {
      DRAFT: { variant: 'secondary' as const, icon: Edit, text: 'Rascunho' },
      IN_REVIEW: { variant: 'default' as const, icon: Eye, text: 'Em Revisão' },
      APPROVED: { variant: 'default' as const, icon: CheckCircle2, text: 'Aprovado' },
      PUBLISHED: { variant: 'default' as const, icon: Play, text: 'Publicado' },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, text: 'Rejeitado' },
    }
    
    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const getDecisionIcon = (decision: ReviewDecision) => {
    const icons = {
      APPROVED: CheckCircle2,
      REJECTED: XCircle,
      CHANGES_REQUESTED: AlertCircle,
    }
    return icons[decision]
  }

  const isReviewer = currentReview?.reviewers.some(r => r.userId === userId)
  const myReview = currentReview?.reviewers.find(r => r.userId === userId)
  const hasReviewed = myReview?.status === 'REVIEWED'

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            <CardTitle>Revisão e Aprovação</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge(projectStatus)}
          {!canEdit && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Edição bloqueada
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Review */}
              {currentReview && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-medium">Solicitação Atual</h3>
                    <Badge variant={currentReview.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {currentReview.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 pl-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Solicitado por:</span>
                      <p className="font-medium">{currentReview.requesterName}</p>
                    </div>

                    {currentReview.message && (
                      <div>
                        <span className="text-sm text-muted-foreground">Mensagem:</span>
                        <p className="text-sm mt-1 p-2 bg-muted rounded">{currentReview.message}</p>
                      </div>
                    )}

                    {currentReview.dueDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Prazo: {new Date(currentReview.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}

                    {/* Reviewers */}
                    <div>
                      <span className="text-sm text-muted-foreground mb-2 block">Revisores:</span>
                      <div className="space-y-2">
                        {currentReview.reviewers.map((reviewer) => {
                          const Icon = reviewer.decision ? getDecisionIcon(reviewer.decision) : Clock
                          return (
                            <div
                              key={reviewer.userId}
                              className="flex items-center gap-3 p-2 bg-muted/50 rounded"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{reviewer.userName[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{reviewer.userName}</div>
                                <div className="text-xs text-muted-foreground">{reviewer.userEmail}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {reviewer.status === 'REVIEWED' ? (
                                  <>
                                    <Icon className={`h-4 w-4 ${
                                      reviewer.decision === 'APPROVED' ? 'text-green-500' :
                                      reviewer.decision === 'REJECTED' ? 'text-red-500' :
                                      'text-yellow-500'
                                    }`} />
                                    <Badge variant="outline" className="text-xs">
                                      {reviewer.decision === 'APPROVED' ? 'Aprovado' :
                                       reviewer.decision === 'REJECTED' ? 'Rejeitado' :
                                       'Alterações'}
                                    </Badge>
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Review Form (if user is reviewer and hasn't reviewed) */}
                    {isReviewer && !hasReviewed && (
                      <div className="mt-4 p-4 border rounded-lg bg-card space-y-3">
                        <h4 className="font-medium text-sm">Submeter Revisão</h4>
                        <Textarea
                          placeholder="Feedback (opcional)"
                          value={reviewFeedback}
                          onChange={(e) => setReviewFeedback(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReview('APPROVED')}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitReview('CHANGES_REQUESTED')}
                            className="flex-1"
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Solicitar Alterações
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSubmitReview('REJECTED')}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Review feedback if already reviewed */}
                    {isReviewer && hasReviewed && myReview?.feedback && (
                      <div className="mt-4 p-4 border rounded-lg bg-muted">
                        <h4 className="font-medium text-sm mb-2">Seu Feedback</h4>
                        <p className="text-sm">{myReview.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request Review Form */}
              {!currentReview && projectStatus === 'DRAFT' && (
                <div className="space-y-4">
                  {!showRequestReview ? (
                    <Button onClick={() => setShowRequestReview(true)} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar Revisão
                    </Button>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h3 className="font-medium">Solicitar Revisão</h3>

                      <div className="space-y-2">
                        <Label>Selecionar Revisores</Label>
                        <div className="space-y-2">
                          {availableReviewers.map((reviewer) => (
                            <div key={reviewer.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`reviewer-${reviewer.id}`}
                                checked={selectedReviewers.includes(reviewer.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedReviewers([...selectedReviewers, reviewer.id])
                                  } else {
                                    setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id))
                                  }
                                }}
                              />
                              <Label htmlFor={`reviewer-${reviewer.id}`} className="flex items-center gap-2 cursor-pointer">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>{reviewer.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{reviewer.name}</div>
                                  <div className="text-xs text-muted-foreground">{reviewer.email}</div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensagem (opcional)</Label>
                        <Textarea
                          placeholder="Adicione contexto para os revisores..."
                          value={reviewMessage}
                          onChange={(e) => setReviewMessage(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Prazo (opcional)</Label>
                        <Input
                          type="date"
                          value={reviewDueDate}
                          onChange={(e) => setReviewDueDate(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleRequestReview} disabled={selectedReviewers.length === 0}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Solicitação
                        </Button>
                        <Button variant="ghost" onClick={() => setShowRequestReview(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Approval History */}
              {approvalHistory.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <h3 className="font-medium">Histórico de Aprovações</h3>
                  </div>

                  <div className="space-y-2 pl-6">
                    {approvalHistory.map((approval) => {
                      const Icon = getDecisionIcon(approval.decision)
                      return (
                        <div key={approval.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{approval.userName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{approval.userName}</span>
                            <Icon className={`h-4 w-4 ${
                              approval.decision === 'APPROVED' ? 'text-green-500' :
                              approval.decision === 'REJECTED' ? 'text-red-500' :
                              'text-yellow-500'
                            }`} />
                            <Badge variant="outline" className="text-xs">
                              {approval.decision === 'APPROVED' ? 'Aprovado' :
                               approval.decision === 'REJECTED' ? 'Rejeitado' :
                               'Alterações Solicitadas'}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDistanceToNow(new Date(approval.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          {approval.feedback && (
                            <p className="text-sm text-muted-foreground mt-2">{approval.feedback}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t">
                {projectStatus === 'APPROVED' && (
                  <Button onClick={handlePublish} className="w-full" size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Publicar Projeto
                  </Button>
                )}

                {(projectStatus === 'IN_REVIEW' || projectStatus === 'APPROVED') && (
                  <Button
                    variant="outline"
                    onClick={handleReopenForEditing}
                    className="w-full"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Reabrir para Edição
                  </Button>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
