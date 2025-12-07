
import dotenv from 'dotenv';
import { generateLipSyncVideo } from '../estudio_ia_videos/app/lib/services/lip-sync-integration';
import { logger } from '../estudio_ia_videos/app/lib/services/logger-service';

// Load env vars
dotenv.config();

// Mock logger
logger.info = (context, message, data) => console.log(`[INFO] [${context}] ${message}`, data || '');
logger.error = (context, message, error, data) => console.error(`[ERROR] [${context}] ${message}`, error, data || '');
logger.warn = (context, message, data) => console.warn(`[WARN] [${context}] ${message}`, data || '');

async function testLipSync() {
  console.log('🚀 Starting Lip Sync Integration Test...');

  try {
    const result = await generateLipSyncVideo({
      text: "Olá, este é um teste completo de sincronização labial.",
      avatarImageUrl: "https://img.freepik.com/free-photo/portrait-white-man-isolated_53876-40306.jpg",
      outputFileName: `test-lip-sync-${Date.now()}`
    });

    console.log('✅ Lip Sync Video Generated Successfully!');
    console.log('🎥 Video URL:', result.videoUrl);
    console.log('🔊 Audio URL:', result.audioUrl);

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  }
}

testLipSync();
