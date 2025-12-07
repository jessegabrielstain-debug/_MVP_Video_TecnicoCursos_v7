import { synthesizeToFile, listVoices } from './tts-service-real';

export class TTSService {
  static async synthesize(text: string, options: { voiceId?: string; format?: 'mp3' | 'wav' } = {}) {
    return synthesizeToFile({ text, ...options });
  }

  static async getVoices() {
    return listVoices();
  }

  static getAvailableVoices(language: string) {
    return [
      { id: 'pt-BR-Standard-A', name: 'Fernanda', language: 'pt-BR', gender: 'Female' },
      { id: 'pt-BR-Standard-B', name: 'Ricardo', language: 'pt-BR', gender: 'Male' }
    ];
  }
}

export * from './tts-service-real';

