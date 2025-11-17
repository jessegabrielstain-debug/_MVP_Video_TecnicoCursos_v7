/**
 * Video Transcoder stub para testes
 */

export enum VideoFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi'
}

export enum VideoCodec {
  H264 = 'libx264',
  H265 = 'libx265',
  VP9 = 'libvpx-vp9'
}

export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'libmp3lame',
  OPUS = 'libopus'
}

export enum VideoPreset {
  ULTRAFAST = 'ultrafast',
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow'
}

export const STANDARD_RESOLUTIONS = {
  '4K': '3840x2160',
  '1080p': '1920x1080',
  '720p': '1280x720',
  '480p': '854x480'
}

export interface TranscodeOptions {
  format?: VideoFormat
  videoCodec?: VideoCodec
  audioCodec?: AudioCodec
  preset?: VideoPreset
  resolution?: string
  bitrate?: string
}

export default class VideoTranscoder {
  async transcode(inputPath: string, outputPath: string, options: TranscodeOptions): Promise<void> {
    return Promise.resolve()
  }
}

export function transcodeForNR(inputPath: string, outputPath: string): Promise<void> {
  return Promise.resolve()
}

export function createAdaptiveStream(inputPath: string, outputDir: string): Promise<string[]> {
  return Promise.resolve([])
}
