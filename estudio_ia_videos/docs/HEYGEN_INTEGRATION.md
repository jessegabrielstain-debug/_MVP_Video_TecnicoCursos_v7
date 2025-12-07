# 🎭 Hyper-Realistic Avatar System (HeyGen Integration)

This module enables the generation of professional videos using hyper-realistic AI avatars via the HeyGen API.

## 🚀 Features
- **Cloud Rendering:** Offloads heavy rendering to HeyGen's cloud.
- **Hyper-Realism:** Access to 100+ high-quality avatars.
- **Lip-Sync:** Perfect lip-sync with TTS or uploaded audio.
- **Seamless Integration:** Integrated into the existing `AvatarEngine` orchestration.

## 🛠️ Setup

1. **Get API Key:** Obtain an API Key from [HeyGen](https://app.heygen.com/).
2. **Configure Environment:**
   Add the following to your `.env.local`:
   ```bash
   HEYGEN_API_KEY=your_api_key_here
   ```

## 💻 Usage

### 1. List Available Avatars
```typescript
import { heyGenService } from '@/lib/heygen-service';

const avatars = await heyGenService.listAvatars();
console.log(avatars);
```

### 2. Generate Video (via AvatarEngine)
The `AvatarEngine` automatically handles the routing to HeyGen when `engine: 'heygen'` is specified.

```typescript
import { avatarEngine } from '@/lib/avatar-engine';

const result = await avatarEngine.render({
  engine: 'heygen',
  duration: 10, // Duration in seconds (approx)
  config: {
    avatarId: 'Anna_public_3_20240108',
    text: 'Welcome to our new training course on NR-12 safety standards.',
    quality: 'high',
    background: '#ffffff' // or transparent/green screen
  }
});

if (result.type === 'video') {
  console.log('Job ID:', result.jobId);
  // Poll for status...
}
```

### 3. Check Status
```typescript
const status = await avatarEngine.checkHeyGenStatus(jobId);
if (status.status === 'completed') {
  console.log('Video URL:', status.videoUrl);
}
```

## 🏗️ Architecture

- **`HeyGenService` (`app/lib/heygen-service.ts`):** Direct wrapper around HeyGen API V2.
- **`HeyGenAvatarEngine` (`app/lib/engines/heygen-avatar-engine.ts`):** Adapter implementing the engine interface.
- **`AvatarRegistry` (`app/lib/avatars/avatar-registry.ts`):** Central catalog of avatars (UE5, Local, HeyGen).
- **`AvatarEngine` (`app/lib/avatar-engine.ts`):** Main orchestrator.

## 🧪 Testing
Run the integration test script:
```bash
npx tsx scripts/test-heygen-integration.ts
```
