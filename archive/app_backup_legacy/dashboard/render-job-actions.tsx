// @ts-nocheck
// TODO: Backup - fix types
'use client'

import { useState, useTransition } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { RenderJob } from '@/lib/render-jobs'
import { startRenderJobAction, type StartRenderResult } from './actions'

interface RenderJobActionsProps {
  projectId: string
  ownerId: string
  latestJob: RenderJob | null
}

const BLOCKED_STATES = new Set<RenderJob['status']>(['pending', 'processing'])

export function RenderJobActions({ projectId, ownerId, latestJob }: RenderJobActionsProps) {
  const [status, setStatus] = useState<StartRenderResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasJobInProgress = latestJob ? BLOCKED_STATES.has(latestJob.status) : false

  const handleStartRender = () => {
    setStatus(null)
    startTransition(async () => {
      const result = await startRenderJobAction({ projectId, ownerId })
      setStatus(result)
    })
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        onClick={handleStartRender}
        disabled={isPending || hasJobInProgress}
        className="w-full md:w-auto"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Agendando…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Iniciar renderização
          </span>
        )}
      </Button>

      {hasJobInProgress ? (
        <p className="text-xs text-muted-foreground">
          Existe um job em andamento. Aguarde a conclusão antes de iniciar outro.
        </p>
      ) : null}

      {status ? (
        <Alert variant={status.ok ? 'default' : 'destructive'}>
          <AlertDescription className="text-sm">
            {status.message}
            {status.ok && status.jobId ? ` (job ${status.jobId})` : ''}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
