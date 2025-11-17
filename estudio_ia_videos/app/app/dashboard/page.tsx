import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listProjectsByOwner, type Project } from '@/lib/projects'
import { listRenderJobs } from '@/lib/render-jobs'
import type { RenderJob } from '@/lib/render-jobs'
import { RenderJobActions } from './render-job-actions'
import { createServerSupabaseClient } from '@/lib/services'
import { ProjectList } from '@/components/ProjectList'

type DashboardPageProps = {
  searchParams?: {
    ownerId?: string
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const ownerId = searchParams?.ownerId ?? user.id

  let projects: Project[] = []
  let loadError: string | null = null

  try {
    projects = await listProjectsByOwner(ownerId)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Falha ao carregar projetos'
  }

  if (loadError) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard de projetos</h1>
          <p className="text-muted-foreground">{loadError}</p>
        </header>
        <div>
          <Link className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted" href="/upload">
            Voltar para upload
          </Link>
        </div>
      </main>
    )
  }

  if (projects.length === 0) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard de projetos</h1>
          <p className="text-muted-foreground">
            Nenhum projeto encontrado para este usuário. Inicie pelo upload de um PPTX para criar o primeiro projeto
          </p>
        </header>
        <div>
          <Link className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-muted" href="/upload">
            Criar projeto a partir de PPTX
          </Link>
        </div>
      </main>
    )
  }

  const projectsWithJobs = await Promise.all(
    projects.map(async (project) => {
      try {
        const jobs = await listRenderJobs(project.id)
        const latestJob = jobs[0] ?? null
        return { project, latestJob, jobError: undefined as string | undefined }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao carregar jobs'
        return { project, latestJob: null as RenderJob | null, jobError: message }
      }
    })
  )

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard de projetos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status de renderização, reabra o editor e faça download dos vídeos gerados.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">✅ Auth: {user.email}</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">✅ API Projects</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">✅ API Slides</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">✅ API Analytics</span>
        </div>
      </header>

      {/* Sistema de Gerenciamento de Projetos/Slides */}
      <section className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">🚀 Gerenciamento de Projetos e Slides</h2>
        <ProjectList />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {projectsWithJobs.map(({ project, latestJob, jobError }) => (
          <article key={project.id} className="rounded-lg border bg-background p-4 shadow-sm">
            <header className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                {project.description ? (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                ) : null}
              </div>
              <span className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                {project.status}
              </span>
            </header>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criado em</dt>
                <dd>{new Date(project.created_at).toLocaleString('pt-BR')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Atualizado em</dt>
                <dd>{new Date(project.updated_at).toLocaleString('pt-BR')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Último render</dt>
                <dd>{latestJob ? new Date(latestJob.created_at).toLocaleString('pt-BR') : 'Nenhum job ainda'}</dd>
              </div>
              {latestJob ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status do render</dt>
                  <dd className="font-medium">{latestJob.status} · {latestJob.progress}%</dd>
                </div>
              ) : null}
              {jobError ? (
                <div className="flex justify-between text-destructive">
                  <dt className="text-muted-foreground">Erro</dt>
                  <dd>{jobError}</dd>
                </div>
              ) : null}
            </dl>

            <footer className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Link className="inline-flex items-center rounded-md border px-3 py-1 hover:bg-muted" href={`/editor?projectId=${project.id}`}>
                  Abrir editor
                </Link>
                <Link className="inline-flex items-center rounded-md border px-3 py-1 hover:bg-muted" href={`/api/render/jobs?projectId=${project.id}`}>
                  Ver jobs (JSON)
                </Link>
                {latestJob?.output_url ? (
                  <a
                    className="inline-flex items-center rounded-md border px-3 py-1 hover:bg-muted"
                    href={latestJob.output_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download MP4
                  </a>
                ) : null}
              </div>
              <RenderJobActions projectId={project.id} ownerId={project.owner_id} latestJob={latestJob} />
            </footer>
          </article>
        ))}
      </section>
    </main>
  )
}
