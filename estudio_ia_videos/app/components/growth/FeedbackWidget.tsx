
'use client'

import React, { useState } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageCircle, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FeedbackWidgetProps {
  context?: 'post_render' | 'post_upgrade' | 'periodic' | 'manual'
  onSubmit?: (feedback: { type: string; score?: number; comment: string }) => void
}

export default function FeedbackWidget({ context = 'manual', onSubmit }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'nps' | 'csat' | 'qualitative'>('nps')
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [csatScore, setCSATScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    if (!comment && npsScore === null && csatScore === null) {
      toast.error('Por favor, forneça uma avaliação ou comentário')
      return
    }

    const feedback = {
      type: feedbackType,
      score: feedbackType === 'nps' ? (npsScore ?? undefined) : (csatScore ?? undefined),
      comment,
      context,
      timestamp: new Date().toISOString(),
    }

    try {
      // Enviar para API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      })

      if (response.ok) {
        toast.success('Obrigado pelo seu feedback!')
        setIsOpen(false)
        setNpsScore(null)
        setCSATScore(null)
        setComment('')
        onSubmit?.(feedback)
      } else {
        toast.error('Erro ao enviar feedback')
      }
    } catch (error) {
      logger.error('Erro ao enviar feedback', error instanceof Error ? error : new Error(String(error)), { component: 'FeedbackWidget', context })
      toast.error('Erro ao enviar feedback')
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0"
        title="Enviar Feedback"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl z-50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Enviar Feedback</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tipo de Feedback */}
        <div className="flex gap-2">
          <Button
            variant={feedbackType === 'nps' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('nps')}
            className="flex-1"
          >
            NPS
          </Button>
          <Button
            variant={feedbackType === 'csat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('csat')}
            className="flex-1"
          >
            CSAT
          </Button>
          <Button
            variant={feedbackType === 'qualitative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('qualitative')}
            className="flex-1"
          >
            Geral
          </Button>
        </div>

        {/* NPS Score */}
        {feedbackType === 'nps' && (
          <div>
            <Label className="text-sm mb-2 block">
              Qual a probabilidade de você recomendar o Estúdio IA? (0-10)
            </Label>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setNpsScore(i)}
                  className={`h-10 rounded border-2 font-medium text-sm transition-colors ${
                    npsScore === i
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Muito Improvável</span>
              <span>Muito Provável</span>
            </div>
          </div>
        )}

        {/* CSAT Score */}
        {feedbackType === 'csat' && (
          <div>
            <Label className="text-sm mb-2 block">
              Qual sua satisfação com a plataforma?
            </Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setCSATScore(score)}
                  className={`h-12 w-12 rounded-full border-2 font-bold transition-all ${
                    csatScore === score
                      ? 'bg-blue-600 text-white border-blue-600 scale-110'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Insatisfeito</span>
              <span>Muito Satisfeito</span>
            </div>
          </div>
        )}

        {/* Comentário */}
        <div>
          <Label htmlFor="feedback-comment" className="text-sm mb-2 block">
            {feedbackType === 'qualitative'
              ? 'O que você gostaria de compartilhar?'
              : 'Comentário (opcional)'}
          </Label>
          <Textarea
            id="feedback-comment"
            placeholder="Compartilhe sua experiência, sugestões ou problemas..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
