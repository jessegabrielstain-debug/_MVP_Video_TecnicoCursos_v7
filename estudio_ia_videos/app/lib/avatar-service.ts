import { avatarEngine } from './avatar-engine';
import { AvatarDefinition } from './avatars/avatar-registry';

export type { AvatarDefinition };

export class AvatarService {
  static getAllAvatars(): AvatarDefinition[] {
    return avatarEngine.getAllAvatars();
  }

  static async getAvatars() {
    return avatarEngine.getAllAvatars();
  }

  static async getAvatarById(id: string) {
    return avatarEngine.getAvatar(id);
  }

  static async generateLipSync(text: string, audioUrl: string, duration: number) {
    return avatarEngine.generateLipSyncFrames(text, audioUrl, duration);
  }
}
