// @ts-nocheck
// TODO: Backup - fix types
'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { handlePptxUpload, initialUploadState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar PPTX'}
    </Button>
  )
}

export function UploadForm() {
  const [state, formAction] = useFormState(handlePptxUpload, initialUploadState)
  const formRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
    }
  }, [state.status])

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerId">ID do usuário (ownerId)</Label>
          <Input
            id="ownerId"
            name="ownerId"
            placeholder="00000000-0000-0000-0000-000000000000"
            required
          />
          <p className="text-xs text-muted-foreground">
            Temporário: use o UUID do usuário até conectarmos a autenticação.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="projectName">Nome do projeto</Label>
          <Input id="projectName" name="projectName" placeholder="Academia NR-12" required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="projectDescription">Descrição (opcional)</Label>
        <Textarea
          id="projectDescription"
          name="projectDescription"
          placeholder="Resumo do conteúdo que será transformado em vídeo"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pptx">Arquivo PPTX</Label>
        <Input id="pptx" name="pptx" type="file" accept=".pptx" required />
        <p className="text-xs text-muted-foreground">
          Aceitamos apenas .pptx com até 50 MB neste MVP.
        </p>
      </div>

      <SubmitButton />

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.status === 'success' && state.projectId ? (
        <Alert>
          <AlertTitle>Upload concluído</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{state.message}</p>
            {typeof state.slideCount === 'number' ? (
              <p className="text-sm text-muted-foreground">
                {state.slideCount} slides disponíveis para edição.
              </p>
            ) : null}
            <div className="flex flex-col gap-1 text-sm">
              <Link
                className="text-primary underline"
                href={`/editor?projectId=${state.projectId}`}
              >
                Abrir no editor
              </Link>
              <Link
                className="text-primary underline"
                href={`/dashboard?ownerId=${state.ownerId}`}
              >
                Ver no dashboard
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {state.warnings?.length ? (
        <Alert variant="destructive">
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              {state.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
