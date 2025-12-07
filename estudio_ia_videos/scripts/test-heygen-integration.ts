import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local BEFORE importing app code
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

async function testHeyGenIntegration() {
  // Dynamic import to ensure env vars are loaded first
  const { avatarEngine } = await import('../app/lib/avatar-engine');
  const { heyGenService } = await import('../app/lib/heygen-service');

  console.log('🚀 Testing HeyGen Integration...');

  // 1. Check API Key
  if (!process.env.HEYGEN_API_KEY) {
    console.error('❌ HEYGEN_API_KEY is missing in .env');
    return;
  }

  // 2. List Avatars & Voices
  console.log('\n📋 Listing Avatars & Voices...');
  let avatarId = 'Anna_public_3_20240108';
  let voiceId = '';

  try {
    const avatars = await heyGenService.listAvatars();
    console.log(`✅ Found ${avatars.length} avatars.`);
    if (avatars.length > 0) {
      console.log('Sample Avatar:', avatars[0]);
      avatarId = avatars[0].avatar_id;
    }

    const voices = await heyGenService.listVoices();
    console.log(`✅ Found ${voices.length} voices.`);
    if (voices.length > 0) {
      console.log('Sample Voice:', voices[0]);
      voiceId = voices[0].voice_id;
    } else {
      console.warn('⚠️ No voices found. Test might fail if default voice is invalid.');
    }

  } catch (error) {
    console.error('❌ Failed to list resources:', error);
  }

  // 3. Simulate a Render Request (Dry Run)
  console.log('\n🎬 Simulating Render Request...');
  try {
    const result = await avatarEngine.render({
      engine: 'heygen',
      duration: 10,
      config: {
        avatarId: avatarId,
        voiceId: voiceId,
        text: 'Hello! This is a test of the new hyper-realistic avatar system.',
        quality: 'high'
      }
    });

    if (result.type === 'video') {
      console.log('✅ Render initiated successfully!');
      console.log('Job ID:', result.jobId);
      console.log('Status:', result.status);
    } else {
      console.log('❌ Unexpected result type:', result.type);
    }

  } catch (error) {
    console.error('❌ Render failed:', error);
  }
}

// Run the test
testHeyGenIntegration().catch(console.error);
