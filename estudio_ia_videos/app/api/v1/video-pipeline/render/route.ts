
import { NextRequest, NextResponse } from 'next/server';

interface VideoRenderRequest {
  projectId: string;
  format: string;
  quality: string;
  resolution: number;
  fps: number;
  bitrate: number;
  audioQuality: number;
  customSettings?: {
    videoCodec?: string;
    audioCodec?: string;
    audioChannels?: string;
    sampleRate?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoRenderRequest = await request.json();
    
    // Simulação da renderização de vídeo
    // Em produção, isso seria integrado com FFmpeg
    const jobId = `render_${Date.now()}`;
    
    const result = {
      success: true,
      jobId,
      status: 'processing',
      estimatedTime: 15 + Math.random() * 30, // 15-45 minutos
      progress: 0,
      parameters: {
        format: body.format,
        quality: body.quality,
        resolution: `${Math.round(body.resolution * 16/9)}x${body.resolution}`,
        fps: body.fps,
        bitrate: `${body.bitrate}kbps`,
        audioQuality: `${body.audioQuality}kbps`
      },
      metadata: {
        projectId: body.projectId,
        startTime: new Date().toISOString(),
        estimatedSize: `${Math.round((body.bitrate * 60 * 5) / 8000)}MB`, // ~5 min video
        codec: body.customSettings?.videoCodec || 'h264',
        audioCodec: body.customSettings?.audioCodec || 'aac'
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha na renderização de vídeo', details: error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    // Retorna status de um job específico
    const progress = Math.min(100, Math.random() * 100);
    
    const jobStatus = {
      jobId,
      status: progress >= 100 ? 'completed' : 'processing',
      progress: Math.round(progress),
      remainingTime: progress >= 100 ? 0 : Math.round((100 - progress) / 2),
      outputUrl: progress >= 100 ? `/api/downloads/${jobId}.mp4` : null,
      fileSize: progress >= 100 ? `${Math.round(45 + Math.random() * 200)}MB` : null
    };

    return NextResponse.json(jobStatus);
  }

  // Retorna lista de todos os jobs
  const jobs = [
    {
      id: 'render_1727233200000',
      name: 'Treinamento NR-12 - Prensas',
      status: 'completed',
      progress: 100,
      format: 'MP4 HD',
      startTime: '10:30',
      fileSize: '287MB'
    },
    {
      id: 'render_1727234100000',
      name: 'NR-35 - Trabalho em Altura',
      status: 'processing',
      progress: 67,
      format: 'MP4 HD',
      startTime: '10:45',
      remainingTime: 15
    }
  ];

  return NextResponse.json({ jobs });
}

