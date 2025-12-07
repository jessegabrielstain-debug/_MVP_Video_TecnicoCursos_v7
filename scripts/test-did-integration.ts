
import dotenv from 'dotenv';
import { generateAndUploadTTSAudio } from '../estudio_ia_videos/app/lib/services/tts/elevenlabs-service';
import { didService } from '../estudio_ia_videos/app/lib/services/avatar/did-service';
import { logger } from '../estudio_ia_videos/app/lib/services/logger-service';

// Load env vars
dotenv.config();

// Mock logger to print to console
logger.info = (context, message, data) => console.log(`[INFO] [${context}] ${message}`, data || '');
logger.error = (context, message, error, data) => console.error(`[ERROR] [${context}] ${message}`, error, data || '');
logger.warn = (context, message, data) => console.warn(`[WARN] [${context}] ${message}`, data || '');

async function testDIDIntegration() {
  console.log('🚀 Starting D-ID Integration Test...');

  try {
    // Step 1: Generate TTS Audio
    console.log('\n🎤 Step 1: Generating TTS Audio...');
    const text = "Olá, este é um teste de integração do sistema de vídeo.";
    const audioUrl = await generateAndUploadTTSAudio(text, `test-did-${Date.now()}.mp3`);
    console.log('✅ Audio generated and uploaded:', audioUrl);

    // Step 2: Create D-ID Talk
    console.log('\n🎨 Step 2: Creating D-ID Talk...');
    // Using a sample image from a public source (e.g., a generated face or stock photo)
    // Ensure this URL is accessible by D-ID servers
    const sourceUrl = 'https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg'; 
    
    // Note: Using a generic image might fail if D-ID can't detect a face. 
    // Ideally we should use a known working image.
    // Let's try to use a known one if possible, or just this one.
    
    const videoUrl = await didService.createTalk({
      sourceUrl: sourceUrl,
      audioUrl: audioUrl,
    });

    console.log('✅ D-ID Talk created successfully!');
    console.log('🎥 Video URL:', videoUrl);

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testDIDIntegration();
