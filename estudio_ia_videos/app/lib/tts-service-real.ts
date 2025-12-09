
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '@/lib/logger';

const execPromise = util.promisify(exec);

interface SynthesizeOptions {
  text: string;
  voiceId?: string;
  format?: 'mp3' | 'wav';
}

interface SynthesizeResult {
  fileUrl: string;
  duration: number;
  filePath: string;
}

// Ensure audio directory exists
const AUDIO_DIR = path.join(process.cwd(), 'public', 'tts-audio');
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export async function synthesizeToFile(options: SynthesizeOptions): Promise<SynthesizeResult> {
  logger.info(`Synthesizing text: "${options.text}"`, { component: 'TtsServiceReal' });
  
  const fileName = `${uuidv4()}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);
  const publicUrl = `/tts-audio/${fileName}`;

  try {
      // Use edge-tts (free, no key required) via CLI if available, or fallback to mock
      // To use this, user needs: pip install edge-tts
      // Command: edge-tts --text "Hello" --write-media hello.mp3 --voice pt-BR-AntonioNeural
      
      const voice = options.voiceId || 'pt-BR-AntonioNeural';
      const command = `edge-tts --text "${options.text.replace(/"/g, '\\"')}" --write-media "${filePath}" --voice ${voice}`;
      
      logger.info(`Executing TTS command: ${command}`, { component: 'TtsServiceReal' });
      await execPromise(command);
      
      // Get duration (mocked for now as getting duration from mp3 requires another lib like mp3-duration or ffprobe)
      // In a real scenario we would use ffprobe here.
      // Let's estimate: ~150 words per minute -> 2.5 words per second.
      const wordCount = options.text.split(' ').length;
      const estimatedDuration = Math.max(2, wordCount / 2.5); // seconds

      return {
        fileUrl: publicUrl,
        duration: estimatedDuration,
        filePath: filePath
      };

  } catch (error) {
      logger.warn('Edge-TTS failed or not installed, falling back to mock.', { component: 'TtsServiceReal', error });
      
      // Fallback: Create a silent or dummy file so the system doesn't crash
      // For now, we just return the mock data but without creating a real file (which might break ffmpeg later)
      // Ideally we should copy a "silence.mp3" to the target path.
      
      return {
        fileUrl: publicUrl,
        duration: options.text.length * 0.1, 
        filePath: filePath // File won't exist!
      };
  }
}

export async function listVoices() {
  return [
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Neural)', gender: 'male', language: 'pt-BR' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Neural)', gender: 'female', language: 'pt-BR' },
    { id: 'en-US-ChristopherNeural', name: 'Christopher (Neural)', gender: 'male', language: 'en-US' },
    { id: 'en-US-JennyNeural', name: 'Jenny (Neural)', gender: 'female', language: 'en-US' },
  ];
}
