/**
 * Azure TTS Provider
 * 
 * Implementation of Text-to-Speech using Microsoft Azure Cognitive Services
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureConfig {
  subscriptionKey: string;
  region: string;
}

export interface Voice {
  name: string;
  locale: string;
  voiceType: string;
  shortName: string;
  displayName: string;
  styleList: string[];
}

export class AzureTTSProvider {
  private subscriptionKey: string;
  private region: string;

  constructor(config: AzureConfig) {
    this.subscriptionKey = config.subscriptionKey;
    this.region = config.region;
  }

  async getVoices(): Promise<Voice[]> {
    // Mock implementation for now as we don't have the full SDK setup in this environment
    // In a real implementation, we would use the SDK to fetch voices
    return this.getAvailableVoices();
  }

  getAvailableVoices(): Voice[] {
    return [
      {
        name: 'Francisca',
        locale: 'pt-BR',
        voiceType: 'Neural',
        shortName: 'pt-BR-FranciscaNeural',
        displayName: 'Francisca (Neural)',
        styleList: ['neutral', 'calm', 'cheerful']
      },
      {
        name: 'Antonio',
        locale: 'pt-BR',
        voiceType: 'Neural',
        shortName: 'pt-BR-AntonioNeural',
        displayName: 'Antonio (Neural)',
        styleList: ['neutral', 'serious']
      }
    ];
  }

  analyzeTextQuality(text: string): { complexity: string; readability: number; technicalTerms: string[]; recommendedAdjustments: string[] } {
    const suggestions: string[] = [];
    if (text.length > 200) suggestions.push('Texto muito longo, considere dividir em parágrafos.');
    if (!/[.!?]$/.test(text)) suggestions.push('Considere terminar a frase com pontuação.');
    
    // Simple heuristic for complexity
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / (words.length || 1);
    const complexity = avgWordLength > 6 ? 'Alta' : avgWordLength > 4 ? 'Média' : 'Baixa';
    
    return { 
      complexity,
      readability: Math.max(0, 100 - suggestions.length * 10), 
      technicalTerms: [], 
      recommendedAdjustments: suggestions 
    };
  }

  optimizeForContentType(type: string): { speed: number; pitch: number; style: string; recommendedVoices: string[]; recommendedStyle: string; recommendedSpeed: number } {
    switch (type) {
      case 'news':
        return { speed: 1.1, pitch: 0, style: 'newscast', recommendedVoices: ['pt-BR-FranciscaNeural'], recommendedStyle: 'newscast', recommendedSpeed: 1.1 };
      case 'story':
        return { speed: 0.9, pitch: -0.05, style: 'narration-relaxed', recommendedVoices: ['pt-BR-AntonioNeural'], recommendedStyle: 'narration-relaxed', recommendedSpeed: 0.9 };
      case 'tutorial':
        return { speed: 1.0, pitch: 0, style: 'neutral', recommendedVoices: ['pt-BR-FranciscaNeural'], recommendedStyle: 'neutral', recommendedSpeed: 1.0 };
      default:
        return { speed: 1.0, pitch: 0, style: 'neutral', recommendedVoices: [], recommendedStyle: 'neutral', recommendedSpeed: 1.0 };
    }
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  async textToSpeech(text: string, voiceId: string): Promise<Buffer> {
    // This would use the SDK to synthesize speech
    // For now, we'll throw if SDK is not available or return a mock buffer
    // The test mocks the SDK, so we need to use the SDK classes if they are available
    
    // Since we are in a Node environment, we assume the SDK is installed or mocked
    // But for this file creation, I'll write the code assuming the SDK is present
    
    const speechConfig = sdk.SpeechConfig.fromSubscription(this.subscriptionKey, this.region);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
    speechConfig.speechSynthesisVoiceName = voiceId;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const audioData = Buffer.from(result.audioData);
            synthesizer.close();
            resolve(audioData);
          } else {
            synthesizer.close();
            reject(new Error(`Azure TTS failed: ${result.errorDetails}`));
          }
        },
        (error) => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  }
}
