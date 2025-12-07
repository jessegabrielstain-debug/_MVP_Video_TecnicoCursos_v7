// @ts-nocheck
// TODO: Backup - fix types
import Link from 'next/link'

const roadmap = [
  {
    href: '/upload',
    label: 'Upload PPTX',
    status: 'Em reconstrução',
  },
  {
    href: '/editor',
    label: 'Editor de slides',
    status: 'Em reconstrução',
  },
  {
    href: '/dashboard',
    label: 'Dashboard de projetos',
    status: 'Em reconstrução',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Estúdio IA de Vídeos · MVP Recovery</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Estrutura mínima para reconstruir o fluxo upload → edição → render. As rotas prioritárias estão listadas abaixo e serão preenchidas nas próximas tarefas da Fase 1.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {roadmap.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-dashed p-4 transition hover:border-foreground"
          >
            <span className="block text-lg font-medium">{item.label}</span>
            <span className="text-sm text-muted-foreground">{item.status}</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
