// @ts-nocheck
// TODO: Backup - fix types
import { UploadForm } from './upload-form'

export const runtime = 'nodejs'

export default function UploadPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Upload de apresentações</h1>
        <p className="text-muted-foreground">
          Envie um arquivo .pptx para gerar um novo projeto. Usaremos o Supabase Storage e registraremos o
          projeto com status de rascunho até que o parser normalize os slides.
        </p>
      </header>

      <UploadForm />
    </main>
  )
}
