// @ts-nocheck
// TODO: Backup - fix types
import Link from 'next/link'
import { getProjectById } from '@/lib/projects'
import { listSlides, type Slide } from '@/lib/slides'
import { SlideEditor } from './slide-editor'

type EditorPageProps = {
  searchParams?: {
    projectId?: string
  }
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const projectId = searchParams?.projectId

  if (!projectId) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Editor de slides</h1>
          <p className="text-muted-foreground">
            Informe um `projectId` na URL para carregar os slides correspondentes.
          </p>
        </header>
        <p className="text-sm text-muted-foreground">
          Exemplo: <code>/editor?projectId=00000000-0000-0000-0000-000000000000</code>
        </p>
        <Link className="text-sm text-primary underline" href="/upload">
          Criar novo projeto a partir de PPTX
        </Link>
      </main>
    )
  }

  const project = await getProjectById(projectId)

  if (!project) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Editor de slides</h1>
          <p className="text-muted-foreground">
            Projeto não encontrado. Verifique o identificador fornecido ou crie um novo upload.
          </p>
        </header>
        <Link className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted" href="/upload">
          Voltar para upload
        </Link>
      </main>
    )
  }

  let slides: Slide[] = []
  let loadError: string | null = null

  try {
    slides = await listSlides(projectId)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Falha ao carregar slides.'
  }

  if (loadError) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Editor de slides</h1>
          <p className="text-muted-foreground">{loadError}</p>
        </header>
        <Link className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted" href="/dashboard">
          Voltar para dashboard
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <SlideEditor project={project} slides={slides} />
    </main>
  )
}
