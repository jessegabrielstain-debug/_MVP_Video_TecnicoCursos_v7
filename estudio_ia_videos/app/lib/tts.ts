/**
 * Placeholder TTS Pipeline
 * Futuro: integrar provider real (ex: ElevenLabs, AWS Polly, Azure).
 */
export interface TTSRequest {
  text: string;
  voice: string;
  language?: string;
  speed?: number; // 1.0 normal
}

export interface TTSResult {
  id: string;
  durationMs: number;
  audioUrl: string; // para teste, aponta para stub
  transcript: string;
  metadata: Record<string, unknown>;
}

export async function generateTTS(req: TTSRequest): Promise<TTSResult> {
  // Simulação determinística
  const words = req.text.split(/\s+/).filter(Boolean);
  const durationMs = Math.round(words.length * 400 / (req.speed || 1));
  return {
    id: `tts_${Date.now()}`,
    durationMs,
    audioUrl: `/audio/stub-${Date.now()}.mp3`,
    transcript: req.text,
    metadata: {
      voice: req.voice,
      language: req.language || 'pt-BR',
      speed: req.speed || 1,
      words: words.length,
      placeholder: true
    }
  };
}
