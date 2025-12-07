
export interface BrazilianVoiceRegional {
  id: string;
  display_name: string;
  region: {
    name: string;
    state: string;
    accent_description: string;
  };
  characteristics: {
    gender: 'masculino' | 'feminino' | 'neutro';
    age_group: string;
    tone: string;
  };
  audio_quality: {
    neural_quality: 'studio' | 'premium' | 'standard';
  };
  pricing_tier: 'gratuito' | 'premium' | 'standard';
  specialties: {
    content_types: string[];
  };
  preview_text: string;
}

export class BrazilianRegionalTTS {
  static REGIONAL_VOICES: BrazilianVoiceRegional[] = [
    {
      id: 'br-sp-male-1',
      display_name: 'Carlos (SP)',
      region: {
        name: 'Sudeste',
        state: 'São Paulo',
        accent_description: 'Paulistano Urbano'
      },
      characteristics: {
        gender: 'masculino',
        age_group: 'Adulto',
        tone: 'Profissional'
      },
      audio_quality: {
        neural_quality: 'studio'
      },
      pricing_tier: 'gratuito',
      specialties: {
        content_types: ['treinamento', 'apresentacao']
      },
      preview_text: 'Olá, vamos começar nosso treinamento corporativo.'
    },
    {
      id: 'br-rj-female-1',
      display_name: 'Fernanda (RJ)',
      region: {
        name: 'Sudeste',
        state: 'Rio de Janeiro',
        accent_description: 'Carioca Suave'
      },
      characteristics: {
        gender: 'feminino',
        age_group: 'Jovem Adulto',
        tone: 'Amigável'
      },
      audio_quality: {
        neural_quality: 'premium'
      },
      pricing_tier: 'premium',
      specialties: {
        content_types: ['marketing', 'social']
      },
      preview_text: 'E aí pessoal, tudo bem? Vamos falar sobre novidades.'
    },
    {
      id: 'br-ba-male-1',
      display_name: 'João (BA)',
      region: {
        name: 'Nordeste',
        state: 'Bahia',
        accent_description: 'Soteropolitano'
      },
      characteristics: {
        gender: 'masculino',
        age_group: 'Adulto',
        tone: 'Calmo'
      },
      audio_quality: {
        neural_quality: 'standard'
      },
      pricing_tier: 'gratuito',
      specialties: {
        content_types: ['narrativa', 'educacional']
      },
      preview_text: 'A história do Brasil começa aqui, com muita cultura.'
    },
    {
      id: 'br-rs-female-1',
      display_name: 'Ana (RS)',
      region: {
        name: 'Sul',
        state: 'Rio Grande do Sul',
        accent_description: 'Gaúcho'
      },
      characteristics: {
        gender: 'feminino',
        age_group: 'Adulto',
        tone: 'Assertivo'
      },
      audio_quality: {
        neural_quality: 'studio'
      },
      pricing_tier: 'premium',
      specialties: {
        content_types: ['noticias', 'tecnico']
      },
      preview_text: 'Bom dia. Hoje vamos analisar os dados do trimestre.'
    }
  ];

  static getRecommendedVoiceForContent(contentType: string, targetAudience: string): BrazilianVoiceRegional[] {
    // Simple recommendation logic based on content type
    return this.REGIONAL_VOICES.filter(voice => {
      if (contentType === 'treinamento' || contentType === 'tecnico') {
        return voice.characteristics.tone === 'Profissional' || voice.characteristics.tone === 'Assertivo';
      }
      if (contentType === 'marketing' || contentType === 'social') {
        return voice.characteristics.tone === 'Amigável' || voice.characteristics.tone === 'Calmo';
      }
      return true;
    });
  }
}
