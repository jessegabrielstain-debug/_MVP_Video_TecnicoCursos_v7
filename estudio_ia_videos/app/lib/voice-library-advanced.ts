export interface VoiceRegional {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age_group: string;
  region: string;
  accent: string;
  specialty: 'technical' | 'corporate' | 'friendly' | 'authoritative' | 'educational';
  tone: string;
  premium: boolean;
  preview_url: string;
}

export const voiceLibrary: VoiceRegional[] = [
  {
    id: 'br-sul-1',
    name: 'Ricardo',
    gender: 'male',
    age_group: 'Adulto',
    region: 'sul',
    accent: 'Gaúcho Suave',
    specialty: 'technical',
    tone: 'Profissional',
    premium: false,
    preview_url: '/voices/ricardo-preview.mp3'
  },
  {
    id: 'br-se-1',
    name: 'Fernanda',
    gender: 'female',
    age_group: 'Jovem Adulto',
    region: 'sudeste',
    accent: 'Paulista Neutro',
    specialty: 'corporate',
    tone: 'Dinâmico',
    premium: true,
    preview_url: '/voices/fernanda-preview.mp3'
  }
];

export class AdvancedVoiceLibrary {
  static getVoices() {
    return voiceLibrary;
  }

  static getVoiceById(id: string) {
    return voiceLibrary.find(v => v.id === id);
  }
}
