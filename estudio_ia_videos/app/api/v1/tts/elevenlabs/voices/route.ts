
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const data = await response.json()

    interface ElevenLabsVoice {
      voice_id: string;
      name: string;
      category?: string;
      description?: string;
      preview_url?: string;
      labels?: {
        gender?: string;
        age?: string;
        accent?: string;
        'use case'?: string;
        language?: string;
      };
      fine_tuning?: {
        is_allowed?: boolean;
      };
    }

    // Format the response for our component
    const formattedVoices = data.voices?.map((voice: ElevenLabsVoice) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'professional',
      description: voice.description || '',
      gender: voice.labels?.gender || 'unknown',
      age: voice.labels?.age || 'unknown',
      accent: voice.labels?.accent || 'unknown',
      language: voice.labels?.language || 'en',
      useCase: voice.labels?.['use case'] || 'general',
      previewUrl: voice.preview_url,
      samples: 0
    })) || []

    return NextResponse.json({
      success: true,
      voices: formattedVoices,
      total: formattedVoices.length
    })

  } catch (error) {
    logger.error('Error fetching voices', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/tts/elevenlabs/voices' })
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}

