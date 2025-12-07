import { AzureTTSProvider, Voice } from './providers/azure';

export type AzureVoice = Voice;

const config = {
  subscriptionKey: process.env.AZURE_SPEECH_KEY || '',
  region: process.env.AZURE_SPEECH_REGION || 'eastus'
};

export const azureSpeechService = new AzureTTSProvider(config);
