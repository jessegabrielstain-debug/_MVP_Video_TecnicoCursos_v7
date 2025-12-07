export type Slide = {
  id: string
  project_id: string
  order_index: number
  title: string
  content: string
  duration: number
  background_color: string
  background_image: string | null
  avatar_config: Record<string, any>
  audio_config: Record<string, any>
  created_at: string
  updated_at: string
}

export const mockSlides = new Map<string, Slide>()

export function addSlide(slide: Slide) {
  mockSlides.set(slide.id, slide)
}

export function addSlidesBulk(slides: Slide[]) {
  for (const s of slides) mockSlides.set(s.id, s)
}

export function getSlidesByProject(projectId: string): Slide[] {
  return Array.from(mockSlides.values())
    .filter(s => s.project_id === projectId)
    .sort((a, b) => a.order_index - b.order_index)
}

export function nextOrderIndex(projectId: string): number {
  const slides = getSlidesByProject(projectId)
  if (slides.length === 0) return 0
  return slides[slides.length - 1].order_index + 1
}
