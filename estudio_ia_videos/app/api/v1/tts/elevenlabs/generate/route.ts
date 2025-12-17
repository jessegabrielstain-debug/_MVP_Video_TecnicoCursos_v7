
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'

// AWS S3 Client (use hosted storage config)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voiceId, voice_id, settings, voice_settings, model_id = 'eleven_multilingual_v2' } = body
    
    const actualVoiceId = voiceId || voice_id
    const actualSettings = settings || voice_settings

    if (!text || !actualVoiceId) {
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: actualSettings || {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      audioBase64,
      duration: Math.max(1, Math.floor(text.length * 0.08)) // Estimate
    })

  } catch (error) {
    logger.error('Error generating TTS', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/tts/elevenlabs/generate' })
    return NextResponse.json(
      { 
        error: 'Failed to generate speech',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

