/**
 * Live Streaming Engine
 * Sistema completo de streaming ao vivo (RTMP, WebRTC, HLS)
 */

import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { spawn, ChildProcess } from 'child_process';

// ==============================================
// TIPOS
// ==============================================

export interface LiveStream {
  id: string;
  userId: string;
  title: string;
  description?: string;
  
  status: 'idle' | 'starting' | 'live' | 'paused' | 'ending' | 'ended';
  
  config: {
    protocol: 'rtmp' | 'webrtc' | 'srt';
    resolution: { width: number; height: number };
    fps: number;
    bitrate: number; // kbps
    audioCodec: 'aac' | 'opus' | 'mp3';
    videoCodec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
    latency: 'ultra-low' | 'low' | 'normal'; // WebRTC, SRT, RTMP
  };
  
  endpoints: {
    ingest: {
      rtmp?: string;
      webrtc?: string;
      srt?: string;
      streamKey: string;
    };
    playback: {
      hls: string;
      dash?: string;
      webrtc?: string;
    };
  };
  
  features: {
    chat: boolean;
    reactions: boolean;
    polls: boolean;
    qna: boolean;
    multiCamera: boolean;
    screenShare: boolean;
    recording: boolean;
  };
  
  analytics: {
    viewers: {
      current: number;
      peak: number;
      total: number;
    };
    engagement: {
      reactions: number;
      messages: number;
      duration: number; // seconds
    };
  };
  
  recording?: {
    enabled: boolean;
    url?: string;
    startedAt?: string;
    fileSize?: number;
  };
  
  metadata: {
    createdAt: string;
    startedAt?: string;
    endedAt?: string;
    duration?: number; // seconds
  };
}

export interface StreamViewer {
  id: string;
  streamId: string;
  userId?: string;
  sessionId: string;
  
  connection: {
    ip: string;
    country?: string;
    device: string;
    browser: string;
  };
  
  quality: {
    resolution: string;
    bitrate: number;
    fps: number;
    bufferHealth: number; // 0-100
    latency: number; // ms
  };
  
  engagement: {
    joinedAt: string;
    leftAt?: string;
    duration: number; // seconds
    reactions: number;
    messages: number;
  };
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId?: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'message' | 'reaction' | 'join' | 'leave';
}

export interface StreamReaction {
  type: '❤️' | '👍' | '😂' | '😮' | '🔥' | '👏';
  count: number;
  users: string[];
}

export interface StartStreamOptions {
  userId: string;
  title: string;
  description?: string;
  protocol: 'rtmp' | 'webrtc' | 'srt';
  resolution: { width: number; height: number };
  fps?: number;
  bitrate?: number;
  features?: Partial<LiveStream['features']>;
  recording?: boolean;
}

export interface StreamStats {
  streamId: string;
  status: string;
  uptime: number; // seconds
  viewers: {
    current: number;
    peak: number;
    total: number;
  };
  bandwidth: {
    in: number; // Mbps
    out: number; // Mbps
  };
  quality: {
    fps: number;
    bitrate: number;
    droppedFrames: number;
    bufferHealth: number;
  };
}

// ==============================================
// LIVE STREAMING ENGINE
// ==============================================

export class LiveStreamingEngine {
  private supabase;
  private activeStreams: Map<string, ChildProcess> = new Map();
  private readonly RTMP_BASE_URL = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live';
  private readonly HLS_BASE_URL = process.env.HLS_SERVER_URL || 'https://cdn.example.com/hls';

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Criar e iniciar stream
   */
  async startStream(options: StartStreamOptions): Promise<{
    success: boolean;
    stream?: LiveStream;
    error?: string;
  }> {
    try {
      logger.info('Starting live stream', {
        component: 'LiveStreamingEngine',
        userId: options.userId,
        protocol: options.protocol
      });

      // Gerar stream key
      const streamKey = this.generateStreamKey();

      // Criar stream no banco
      const { data: stream, error } = await this.supabase
        .from('live_streams')
        .insert({
          user_id: options.userId,
          title: options.title,
          description: options.description,
          status: 'starting',
          config: {
            protocol: options.protocol,
            resolution: options.resolution,
            fps: options.fps || 30,
            bitrate: options.bitrate || 2500,
            audioCodec: 'aac',
            videoCodec: 'h264',
            latency: options.protocol === 'webrtc' ? 'ultra-low' : 'normal'
          },
          endpoints: {
            ingest: {
              rtmp: options.protocol === 'rtmp' ? `${this.RTMP_BASE_URL}/${streamKey}` : undefined,
              streamKey
            },
            playback: {
              hls: `${this.HLS_BASE_URL}/${streamKey}/index.m3u8`
            }
          },
          features: {
            chat: true,
            reactions: true,
            polls: false,
            qna: false,
            multiCamera: false,
            screenShare: true,
            recording: options.recording || false,
            ...options.features
          },
          analytics: {
            viewers: { current: 0, peak: 0, total: 0 },
            engagement: { reactions: 0, messages: 0, duration: 0 }
          },
          metadata: {
            createdAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Iniciar processamento FFmpeg para transcodificação
      if (options.protocol === 'rtmp') {
        await this.startRTMPProcessor(stream.id, streamKey, options);
      }

      // Atualizar status
      await this.updateStreamStatus(stream.id, 'live');

      logger.info('Stream started successfully', {
        component: 'LiveStreamingEngine',
        streamId: stream.id
      });

      return { success: true, stream: stream as LiveStream };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parar stream
   */
  async stopStream(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Stopping stream', {
        component: 'LiveStreamingEngine',
        streamId
      });

      // Parar FFmpeg se estiver rodando
      const process = this.activeStreams.get(streamId);
      if (process) {
        process.kill('SIGTERM');
        this.activeStreams.delete(streamId);
      }

      // Atualizar stream
      await this.supabase
        .from('live_streams')
        .update({
          status: 'ended',
          'metadata.endedAt': new Date().toISOString()
        })
        .eq('id', streamId);

      // Calcular analytics finais
      await this.finalizeStreamAnalytics(streamId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obter estatísticas do stream em tempo real
   */
  async getStreamStats(streamId: string): Promise<StreamStats | null> {
    try {
      const stream = await this.getStream(streamId);
      if (!stream) return null;

      const uptime = stream.metadata.startedAt
        ? Math.floor((Date.now() - new Date(stream.metadata.startedAt).getTime()) / 1000)
        : 0;

      return {
        streamId,
        status: stream.status,
        uptime,
        viewers: stream.analytics.viewers,
        bandwidth: {
          in: stream.config.bitrate / 1000, // Convert to Mbps
          out: (stream.config.bitrate * stream.analytics.viewers.current) / 1000
        },
        quality: {
          fps: stream.config.fps,
          bitrate: stream.config.bitrate,
          droppedFrames: 0, // TODO: Get from FFmpeg stats
          bufferHealth: 95 // TODO: Get from player stats
        }
      };
    } catch (error) {
      logger.error('Error getting stream stats', error instanceof Error ? error : new Error(String(error)), {
        component: 'LiveStreamingEngine',
        streamId
      });
      return null;
    }
  }

  /**
   * Enviar mensagem no chat
   */
  async sendChatMessage(
    streamId: string,
    userId: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.from('stream_messages').insert({
        stream_id: streamId,
        user_id: userId,
        message,
        type: 'message',
        timestamp: new Date().toISOString()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Incrementar contador de mensagens
      await this.incrementEngagementMetric(streamId, 'messages');

      // TODO: Broadcast via WebSocket para todos os viewers

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Adicionar reação
   */
  async addReaction(
    streamId: string,
    userId: string,
    reaction: StreamReaction['type']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase.from('stream_reactions').insert({
        stream_id: streamId,
        user_id: userId,
        reaction,
        timestamp: new Date().toISOString()
      });

      await this.incrementEngagementMetric(streamId, 'reactions');

      // TODO: Broadcast via WebSocket

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Rastrear viewer
   */
  async trackViewer(
    streamId: string,
    viewer: Omit<StreamViewer, 'id' | 'streamId'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.supabase.from('stream_viewers').insert({
        stream_id: streamId,
        user_id: viewer.userId,
        session_id: viewer.sessionId,
        connection: viewer.connection,
        quality: viewer.quality,
        engagement: viewer.engagement
      });

      // Incrementar contador de viewers
      await this.incrementViewerCount(streamId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Listar streams ativos
   */
  async listLiveStreams(filters?: {
    userId?: string;
    status?: LiveStream['status'];
    limit?: number;
  }): Promise<LiveStream[]> {
    try {
      let query = this.supabase
        .from('live_streams')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        return [];
      }

      return data as LiveStream[];
    } catch (error) {
      return [];
    }
  }

  // ==============================================
  // HELPERS PRIVADOS
  // ==============================================

  private generateStreamKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length: 32 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private async startRTMPProcessor(
    streamId: string,
    streamKey: string,
    options: StartStreamOptions
  ): Promise<void> {
    // Iniciar FFmpeg para processar RTMP input e gerar HLS output
    const args = [
      '-i', `${this.RTMP_BASE_URL}/${streamKey}`,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-b:v', `${options.bitrate}k`,
      '-maxrate', `${options.bitrate! * 1.5}k`,
      '-bufsize', `${options.bitrate! * 2}k`,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '10',
      '-hls_flags', 'delete_segments',
      `/tmp/hls/${streamKey}/index.m3u8`
    ];

    const ffmpeg = spawn('ffmpeg', args);

    ffmpeg.stdout?.on('data', (data) => {
      logger.debug('FFmpeg stdout', {
        component: 'LiveStreamingEngine',
        data: data.toString()
      });
    });

    ffmpeg.stderr?.on('data', (data) => {
      // FFmpeg outputs to stderr by default
      logger.debug('FFmpeg stderr', {
        component: 'LiveStreamingEngine',
        data: data.toString()
      });
    });

    ffmpeg.on('close', (code) => {
      logger.info('FFmpeg process closed', {
        component: 'LiveStreamingEngine',
        streamId,
        code
      });
      this.activeStreams.delete(streamId);
    });

    this.activeStreams.set(streamId, ffmpeg);
  }

  private async getStream(streamId: string): Promise<LiveStream | null> {
    const { data } = await this.supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .single();

    return data as LiveStream | null;
  }

  private async updateStreamStatus(
    streamId: string,
    status: LiveStream['status']
  ): Promise<void> {
    const updates: any = { status };

    if (status === 'live') {
      updates['metadata.startedAt'] = new Date().toISOString();
    } else if (status === 'ended') {
      updates['metadata.endedAt'] = new Date().toISOString();
    }

    await this.supabase
      .from('live_streams')
      .update(updates)
      .eq('id', streamId);
  }

  private async incrementViewerCount(streamId: string): Promise<void> {
    await this.supabase.rpc('increment_stream_viewers', {
      stream_id: streamId
    });
  }

  private async incrementEngagementMetric(
    streamId: string,
    metric: 'reactions' | 'messages'
  ): Promise<void> {
    await this.supabase.rpc('increment_stream_engagement', {
      stream_id: streamId,
      metric_name: metric
    });
  }

  private async finalizeStreamAnalytics(streamId: string): Promise<void> {
    const stream = await this.getStream(streamId);
    if (!stream) return;

    const duration = stream.metadata.startedAt
      ? Math.floor((Date.now() - new Date(stream.metadata.startedAt).getTime()) / 1000)
      : 0;

    await this.supabase
      .from('live_streams')
      .update({
        'metadata.duration': duration,
        'analytics.engagement.duration': duration
      })
      .eq('id', streamId);
  }
}

// Export singleton
export const liveStreamingEngine = new LiveStreamingEngine();
