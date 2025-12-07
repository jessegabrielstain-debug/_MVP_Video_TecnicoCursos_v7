
import { NextResponse } from 'next/server'

export async function GET() {
  // Return available voices for ElevenLabs integration
  const voices = [
    {
      voice_id: 'pMsXgVXv3BLzUgSXRplE',
      name: 'Adam (PT-BR)',
      category: 'professional',
      language: 'pt-BR',
      gender: 'male',
      preview_url: '/api/voices/preview/adam',
      is_premium: true
    },
    {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Bella (PT-BR)',
      category: 'friendly',
      language: 'pt-BR',
      gender: 'female',
      preview_url: '/api/voices/preview/bella',
      is_premium: true
    }
  ]

  return NextResponse.json({
    voices,
    total_count: voices.length,
    premium_count: voices.filter(v => v.is_premium).length
  })
}

