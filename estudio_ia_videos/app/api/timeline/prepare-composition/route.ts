
/**
 * API: Preparar composição FFmpeg da timeline
 * POST /api/timeline/prepare-composition
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Clip {
  trackIndex: number
  startTime: number
  duration: number
  type: string
  source?: string
  content?: string
  style?: {
    fontSize?: number
    color?: string
    position?: string
  }
  metadata?: {
    provider?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { timelineId, clips, duration, settings } = body;

    // Organizar clips por track e ordem
    const trackGroups: { [key: number]: Clip[] } = {};
    clips.forEach((clip: Clip) => {
      if (!trackGroups[clip.trackIndex]) {
        trackGroups[clip.trackIndex] = [];
      }
      trackGroups[clip.trackIndex].push(clip);
    });

    // Ordenar clips por startTime em cada track
    Object.keys(trackGroups).forEach((trackIndex) => {
      trackGroups[parseInt(trackIndex)].sort((a, b) => a.startTime - b.startTime);
    });

    // Gerar comandos FFmpeg
    const inputs: string[] = [];
    const filters: string[] = [];
    const audioFilters: string[] = [];

    let inputIndex = 0;

    // Track 0: Vídeo/Imagens
    if (trackGroups[0]) {
      trackGroups[0].forEach((clip, i) => {
        if (clip.type === 'image' || clip.type === 'video') {
          inputs.push(`-loop 1 -t ${clip.duration} -i "${clip.source}"`);
          
          // Aplicar transições se houver
          const transition = clips.find(
            (c: Clip) => c.type === 'transition' && 
            c.startTime >= clip.startTime && 
            c.startTime < clip.startTime + clip.duration
          );

          if (transition) {
            filters.push(
              `[${inputIndex}:v]fade=t=out:st=${clip.duration - transition.duration}:d=${transition.duration}[v${i}]`
            );
          } else {
            filters.push(`[${inputIndex}:v]scale=1920:1080[v${i}]`);
          }

          inputIndex++;
        }
      });

      // Concatenar vídeos
      if (filters.length > 0) {
        const videoInputs = filters.map((_, i) => `[v${i}]`).join('');
        filters.push(`${videoInputs}concat=n=${filters.length}:v=1:a=0[outv]`);
      }
    }

    // Track 1: Texto (overlays)
    if (trackGroups[1]) {
      trackGroups[1].forEach((clip) => {
        if (clip.type === 'text') {
          const style = clip.style || {};
          filters.push(
            `drawtext=text='${clip.content}':` +
            `fontsize=${style.fontSize || 24}:` +
            `fontcolor=${style.color || 'white'}:` +
            `x=(w-text_w)/2:` +
            `y=${style.position === 'top' ? '50' : style.position === 'bottom' ? 'h-50' : '(h-text_h)/2'}:` +
            `enable='between(t,${clip.startTime},${clip.startTime + clip.duration})'`
          );
        }
      });
    }

    // Track 2: Áudio
    if (trackGroups[2]) {
      trackGroups[2].forEach((clip, i) => {
        if (clip.type === 'audio') {
          // Se for TTS, gerar áudio primeiro
          if (clip.metadata?.provider === 'elevenlabs') {
            inputs.push(`-i "temp_audio_${i}.mp3"`);
            audioFilters.push(`[${inputIndex}:a]adelay=${clip.startTime * 1000}|${clip.startTime * 1000}[a${i}]`);
            inputIndex++;
          }
        }
      });

      // Mix de áudios
      if (audioFilters.length > 0) {
        const audioInputs = audioFilters.map((_, i) => `[a${i}]`).join('');
        audioFilters.push(`${audioInputs}amix=inputs=${audioFilters.length}[outa]`);
      }
    }

    // Construir comando FFmpeg final
    const ffmpegCommand = [
      inputs.join(' '),
      '-filter_complex',
      `"${[...filters, ...audioFilters].join(';')}"`,
      '-map "[outv]"',
      audioFilters.length > 0 ? '-map "[outa]"' : '',
      `-c:v libx264 -preset ${settings.quality === 'ultra' ? 'slow' : settings.quality === 'high' ? 'medium' : 'fast'}`,
      `-crf ${settings.quality === 'ultra' ? '18' : settings.quality === 'high' ? '23' : '28'}`,
      `-r ${settings.fps}`,
      settings.audio ? '-c:a aac -b:a 192k' : '-an',
      `-t ${duration}`,
      'output.mp4',
    ].filter(Boolean).join(' ');

    // Retornar composição
    return NextResponse.json({
      success: true,
      composition: {
        command: ffmpegCommand,
        inputs: inputs.length,
        filters: filters.length,
        duration,
        settings,
        trackGroups,
      },
    });
  } catch (error) {
    console.error('Erro ao preparar composição:', error);
    return NextResponse.json(
      { error: 'Erro ao preparar composição' },
      { status: 500 }
    );
  }
}


