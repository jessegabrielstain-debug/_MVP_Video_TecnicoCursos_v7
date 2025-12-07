
export const dynamic = 'force-dynamic';

import { Metadata } from 'next'
import { ProfessionalPPTXStudio } from '@/components/pptx/professional-pptx-studio'

export const metadata: Metadata = {
  title: 'Editor PPTX Professional | Estúdio IA de Vídeos',
  description: 'Editor profissional de PPTX com Canvas Fabric.js, Timeline cinematográfico e TTS ElevenLabs'
}

export default function PPTXEditorRealPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalPPTXStudio />
    </div>
  )
}

