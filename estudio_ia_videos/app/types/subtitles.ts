export interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  words: TranscriptionWord[];
  confidence: number;
  speaker?: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  language: string;
  duration: number;
  confidence: number;
  wordCount: number;
}

export interface KaraokeStyle {
  activeColor: string;
  inactiveColor: string;
  fontSize: number;
  fontFamily: string;
  animationSpeed: number;
  backgroundColor?: string;
  textShadow?: string;
}

export interface SubtitleFormat {
  format: 'srt' | 'ass' | 'vtt';
  content: string;
  filename: string;
}

export interface TranscriptionOptions {
  language?: string;
  enableKaraoke?: boolean;
  enableSpeakerDiarization?: boolean;
  maxSpeakers?: number;
  karaokeStyle?: KaraokeStyle;
}

export interface TranscriptionJob {
  id: string;
  userId: string;
  audioPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: TranscriptionResult;
  error?: string;
  options: TranscriptionOptions;
  createdAt: string;
  updatedAt: string;
}

export interface SubtitleTrack {
  id: string;
  name: string;
  language: string;
  format: 'srt' | 'ass' | 'vtt';
  content: string;
  isKaraoke?: boolean;
  isDefault?: boolean;
  isForced?: boolean;
}

export interface SubtitleSettings {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  textShadow: boolean;
  opacity: number;
  position: 'bottom' | 'top' | 'center';
  karaokeEnabled: boolean;
  karaokeAnimationSpeed: number;
  karaokeActiveColor: string;
  karaokeInactiveColor: string;
}

export interface SubtitlePreset {
  id: string;
  name: string;
  description: string;
  settings: SubtitleSettings;
  isDefault?: boolean;
}

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 24,
  fontFamily: 'Arial',
  textColor: '#ffffff',
  backgroundColor: '#000000',
  textShadow: true,
  opacity: 0.8,
  position: 'bottom',
  karaokeEnabled: true,
  karaokeAnimationSpeed: 300,
  karaokeActiveColor: '#00ff00',
  karaokeInactiveColor: '#ffffff'
};

export const SUBTITLE_PRESETS: SubtitlePreset[] = [
  {
    id: 'karaoke',
    name: 'Karaokê',
    description: 'Estilo karaokê com animação de palavras',
    settings: {
      ...DEFAULT_SUBTITLE_SETTINGS,
      karaokeEnabled: true,
      karaokeActiveColor: '#00ff00',
      karaokeInactiveColor: '#ffffff',
      karaokeAnimationSpeed: 300
    },
    isDefault: true
  },
  {
    id: 'netflix',
    name: 'Netflix',
    description: 'Estilo Netflix com fundo semi-transparente',
    settings: {
      ...DEFAULT_SUBTITLE_SETTINGS,
      fontSize: 28,
      backgroundColor: '#000000',
      opacity: 0.7,
      karaokeEnabled: false
    }
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Estilo YouTube limpo e moderno',
    settings: {
      ...DEFAULT_SUBTITLE_SETTINGS,
      fontSize: 22,
      textShadow: true,
      karaokeEnabled: false
    }
  },
  {
    id: 'accessibility',
    name: 'Acessibilidade',
    description: 'Alta contraste para melhor acessibilidade',
    settings: {
      ...DEFAULT_SUBTITLE_SETTINGS,
      fontSize: 32,
      textColor: '#ffff00',
      backgroundColor: '#000000',
      opacity: 0.9,
      karaokeEnabled: false
    }
  }
];

export interface SubtitleTrackConfig {
  id: string;
  label: string;
  language: string;
  format: 'srt' | 'ass' | 'vtt';
  content: string;
  isKaraoke?: boolean;
  isDefault?: boolean;
  isForced?: boolean;
  settings?: SubtitleSettings;
}

export interface TranscriptionAnalytics {
  totalTranscriptions: number;
  averageConfidence: number;
  totalDuration: number;
  totalWords: number;
  languageDistribution: Record<string, number>;
  dailyStats: Array<{
    date: string;
    count: number;
    duration: number;
  }>;
  topLanguages: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
}