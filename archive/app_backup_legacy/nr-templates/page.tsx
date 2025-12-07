// @ts-nocheck
// TODO: Backup - fix types
import { listNRTemplates } from '@/lib/services/nr-templates-service'
import { NrCard } from '@/components/nr/NrCard'

export const dynamic = 'force-dynamic'

function mapToCardTemplate(t: any) {
  // Aceita tanto o shape do serviço (DB) quanto do mock
  const isService = !!t.template_config?.themeColor
  return {
    nr_number: t.nr_number,
    title: t.title,
    description: t.description ?? '',
    slide_count: t.slide_count,
    duration_seconds: t.duration_seconds,
    template_config: isService
      ? {
          primary_color: t.template_config.themeColor || '#0ea5e9',
          secondary_color: t.template_config.themeColor || '#0369a1',
          typography: t.template_config.fontFamily || 'Inter',
        }
      : t.template_config,
  }
}

export default async function NrTemplatesPage() {
  const itemsRaw = await listNRTemplates()
  const items = itemsRaw.map(mapToCardTemplate)

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Catálogo de Normas Regulamentadoras</h1>
      <p className="text-sm text-gray-600 mb-6">Catálogo pronto: usa Supabase quando disponível; caso contrário, mock.</p>

      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((t) => (
          <NrCard key={t.nr_number} t={t} />
        ))}
      </ul>
    </main>
  )
}
