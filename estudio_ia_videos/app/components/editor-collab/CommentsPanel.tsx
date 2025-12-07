
/**
 * 💬 SPRINT 38: Comments Panel
 * Painel lateral de comentários com threads, menções e reações
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageSquare, Send, Reply, CheckCircle2, Circle,
  ThumbsUp, MoreVertical, Pin, Archive, Trash2,
  AtSign, Smile, Paperclip, Filter, Search
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommentsPanelProps {
  projectId: string
  userId: string
  userName: string
  onClose?: () => void
}

interface Comment {
  id: string
  projectId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  mentions: string[]
  reactions: Array<{ emoji: string; userId: string }>
  isResolved: boolean
  replies: Comment[]
  createdAt: Date
  updatedAt: Date
}

export default function CommentsPanel({
  projectId,
  userId,
  userName,
  onClose
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{
    id: string
    name: string
    email: string
    avatar?: string
  }>>([])
  const [mentionQuery, setMentionQuery] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()
  }, [projectId, filter])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/comments?projectId=${projectId}${filter !== 'all' ? `&isResolved=${filter === 'resolved'}` : ''}`
      )
      if (!response.ok) throw new Error('Erro ao carregar comentários')
      
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error: unknown) {
      console.error('Erro ao carregar comentários:', error)
      toast.error('Erro ao carregar comentários')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          content: newComment,
          type: 'general',
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar comentário')

      const data = await response.json()
      setComments([data.comment, ...comments])
      setNewComment('')
      toast.success('Comentário criado!')
    } catch (error: unknown) {
      console.error('Erro ao criar comentário:', error)
      toast.error('Erro ao criar comentário')
    }
  }

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return

    try {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText,
        }),
      })

      if (!response.ok) throw new Error('Erro ao responder comentário')

      await loadComments()
      setReplyText('')
      setReplyingTo(null)
      toast.success('Resposta enviada!')
    } catch (error: unknown) {
      console.error('Erro ao responder:', error)
      toast.error('Erro ao responder comentário')
    }
  }

  const handleResolve = async (commentId: string, resolve: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolve }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar comentário')

      await loadComments()
      toast.success(resolve ? 'Comentário resolvido!' : 'Comentário reaberto!')
    } catch (error: unknown) {
      console.error('Erro ao resolver:', error)
      toast.error('Erro ao atualizar comentário')
    }
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) throw new Error('Erro ao adicionar reação')

      await loadComments()
    } catch (error: unknown) {
      console.error('Erro ao adicionar reação:', error)
      toast.error('Erro ao adicionar reação')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Deseja realmente deletar este comentário?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao deletar comentário')

      await loadComments()
      toast.success('Comentário deletado!')
    } catch (error: unknown) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao deletar comentário')
    }
  }

  const handleMentionInput = async (text: string) => {
    setNewComment(text)
    
    // Detectar @mention
    const lastAtIndex = text.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1)
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt)
        setShowMentionSuggestions(true)
        
        // Buscar usuários
        try {
          const response = await fetch(
            `/api/comments/mention-search?projectId=${projectId}&query=${afterAt}`
          )
          if (response.ok) {
            const data = await response.json()
            setMentionSuggestions(data.users || [])
          }
        } catch (error) {
          console.error('Erro ao buscar usuários:', error)
        }
      } else {
        setShowMentionSuggestions(false)
      }
    } else {
      setShowMentionSuggestions(false)
    }
  }

  const handleSelectMention = (user: { id: string; name: string }) => {
    const lastAtIndex = newComment.lastIndexOf('@')
    const beforeMention = newComment.substring(0, lastAtIndex)
    setNewComment(`${beforeMention}@[${user.name}](${user.id}) `)
    setShowMentionSuggestions(false)
    textareaRef.current?.focus()
  }

  const filteredComments = comments.filter(comment => {
    if (searchQuery) {
      return comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
             comment.userName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const stats = {
    total: comments.length,
    resolved: comments.filter(c => c.isResolved).length,
    pending: comments.filter(c => !c.isResolved).length,
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Comentários</CardTitle>
            <Badge variant="secondary">{stats.total}</Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {stats.resolved} resolvidos
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Circle className="h-3 w-3 mr-1" />
            {stats.pending} pendentes
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comentários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('resolved')}
          >
            Resolvidos
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando comentários...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  userId={userId}
                  onReply={() => setReplyingTo(comment.id)}
                  onResolve={(resolve) => handleResolve(comment.id, resolve)}
                  onReaction={(emoji) => handleReaction(comment.id, emoji)}
                  onDelete={() => handleDeleteComment(comment.id)}
                  replyingTo={replyingTo === comment.id}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={() => handleReply(comment.id)}
                  onCancelReply={() => {
                    setReplyingTo(null)
                    setReplyText('')
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-3">
        <div className="w-full space-y-2">
          {/* Mention Suggestions */}
          {showMentionSuggestions && mentionSuggestions.length > 0 && (
            <Card className="absolute bottom-24 left-3 right-3 p-2 shadow-lg z-50">
              <ScrollArea className="max-h-40">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectMention(user)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-sm"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </Card>
          )}

          {/* New Comment Input */}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Adicionar comentário... (use @ para mencionar)"
              value={newComment}
              onChange={(e) => handleMentionInput(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleCreateComment()
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <AtSign className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleCreateComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-1" />
              Enviar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter para enviar
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}

interface CommentItemProps {
  comment: Comment
  userId: string
  onReply: () => void
  onResolve: (resolve: boolean) => void
  onReaction: (emoji: string) => void
  onDelete: () => void
  replyingTo: boolean
  replyText: string
  onReplyTextChange: (text: string) => void
  onSubmitReply: () => void
  onCancelReply: () => void
}

function CommentItem({
  comment,
  userId,
  onReply,
  onResolve,
  onReaction,
  onDelete,
  replyingTo,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
}: CommentItemProps) {
  const isAuthor = comment.userId === userId
  const hasReactions = comment.reactions && comment.reactions.length > 0

  return (
    <div className={`p-3 rounded-lg border ${comment.isResolved ? 'bg-muted/30 border-muted' : 'bg-card'}`}>
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>{comment.userName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {comment.isResolved && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resolvido
              </Badge>
            )}
          </div>
        </div>
        {isAuthor && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="ml-10 space-y-2">
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

        {/* Reactions */}
        {hasReactions && (
          <div className="flex gap-1 flex-wrap">
            {comment.reactions.map((reaction, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                {reaction.emoji}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="sm" onClick={onReply}>
            <Reply className="h-3 w-3 mr-1" />
            Responder
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onReaction('👍')}>
            <ThumbsUp className="h-3 w-3 mr-1" />
            Curtir
          </Button>
          {!comment.isResolved ? (
            <Button variant="ghost" size="sm" onClick={() => onResolve(true)}>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Resolver
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onResolve(false)}>
              <Circle className="h-3 w-3 mr-1" />
              Reabrir
            </Button>
          )}
        </div>

        {/* Reply Input */}
        {replyingTo && (
          <div className="space-y-2 pt-2">
            <Textarea
              placeholder="Escrever resposta..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSubmitReply} disabled={!replyText.trim()}>
                <Send className="h-3 w-3 mr-1" />
                Enviar
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelReply}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2 mt-3 pl-4 border-l-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.userAvatar} />
                    <AvatarFallback>{reply.userName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{reply.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm ml-8">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
