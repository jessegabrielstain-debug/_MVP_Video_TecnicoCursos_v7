import { listNRTemplates } from '@/lib/services/nr-templates-service'
import { NetflixRow } from '@/components/dashboard/netflix-row'
import { Play, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BrowsePage() {
  const templates = await listNRTemplates()

  // Transform templates to Netflix items
  const nrItems = templates.map(t => ({
    id: t.id,
    title: `${t.nr_number} - ${t.title}`,
    image: '', // TODO: Add thumbnail URL to NRTemplate or use a placeholder generator
    duration: `${Math.floor(t.duration_seconds / 60)} min`,
    description: t.description || 'Sem descrição',
    match: 98,
    year: 2024,
    rating: 'L'
  }))

  // Mock categories for demo
  const popularItems = [...nrItems].sort(() => 0.5 - Math.random()).slice(0, 5)
  const newItems = [...nrItems].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)

  // Featured Item (Random)
  const featured = nrItems[Math.floor(Math.random() * nrItems.length)] || {
    id: 'featured',
    title: 'NR-35 Trabalho em Altura',
    description: 'Curso completo sobre segurança em trabalho em altura, cobrindo todos os aspectos da norma regulamentadora.',
    image: ''
  }

  return (
    <div className="relative h-screen bg-gradient-to-b from-gray-900/10 to-[#010511] lg:h-[140vh]">
      <main className="relative pl-4 pb-24 lg:space-y-24 lg:pl-16">
        {/* Hero Section */}
        <div className="flex flex-col space-y-2 py-16 md:space-y-4 lg:h-[65vh] lg:justify-end lg:pb-12">
          <div className="absolute top-0 left-0 -z-10 h-[95vh] w-full">
             <div className="h-full w-full bg-gradient-to-r from-black via-black/50 to-transparent absolute z-10" />
             <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60" />
          </div>

          <h1 className="text-2xl font-bold md:text-4xl lg:text-7xl text-white z-20">
            {featured.title}
          </h1>
          <p className="max-w-xs text-xs text-shadow-md md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl text-white z-20">
            {featured.description?.slice(0, 150)}...
          </p>

          <div className="flex space-x-3 z-20">
            <button className="flex items-center gap-x-2 rounded bg-white px-5 py-1.5 text-sm font-bold text-black transition hover:bg-[#e6e6e6] md:px-8 md:py-2.5 md:text-xl">
              <Play className="h-4 w-4 text-black md:h-7 md:w-7" fill="currentColor" />
              Assistir
            </button>
            <button className="flex items-center gap-x-2 rounded bg-[gray]/70 px-5 py-1.5 text-sm font-bold text-white transition hover:bg-[gray]/40 md:px-8 md:py-2.5 md:text-xl">
              <Info className="h-4 w-4 md:h-7 md:w-7" />
              Mais Info
            </button>
          </div>
        </div>

        {/* Rows */}
        <section className="md:space-y-24 z-20 relative">
          <NetflixRow title="Normas Regulamentadoras" items={nrItems} />
          <NetflixRow title="Em Alta" items={popularItems} />
          <NetflixRow title="Adicionados Recentemente" items={newItems} />
        </section>
      </main>
    </div>
  )
}
