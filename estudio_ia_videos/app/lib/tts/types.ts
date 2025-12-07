export interface TTSRequest {
  text: string;
  voice?: string; // e.g., 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
  model?: string; // e.g., 'tts-1', 'tts-1-hd'
  speed?: number; // 0.25 to 4.0
}

export interface TTSResponse {
  audioUrl?: string;
  error?: string;
  duration?: number;
}

export interface ITTSService {
  generate(request: TTSRequest): Promise<TTSResponse>;
}
