import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { uploadFileToS3 } from '@/lib/aws-s3-config';
import { logger } from '@/lib/services/logger-service';
import { Slide } from '@/lib/types';

export class RenderService {
  static async renderVideo(projectId: string, slides: Slide[]) {
    const compositionId = 'MyVideo';
    const entryPoint = path.join(process.cwd(), 'app/remotion/index.ts');
    
    logger.info('RenderService', `Starting render for project ${projectId}`);

    try {
      // 1. Bundle the video
      logger.info('RenderService', 'Bundling video...');
      const bundleLocation = await bundle({
        entryPoint,
        // If you have specific webpack config, you might need to pass it here
        // For Next.js, it usually works out of the box or needs minimal config
      });

      // 2. Select composition to get dimensions/fps
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps: { slides },
      });

      // 3. Render the video
      const outputLocation = path.join(process.cwd(), 'public', 'renders', `${projectId}.mp4`);
      // Ensure directory exists
      const renderDir = path.dirname(outputLocation);
      if (!fs.existsSync(renderDir)) {
        fs.mkdirSync(renderDir, { recursive: true });
      }

      logger.info('RenderService', 'Rendering video...', { durationInFrames: composition.durationInFrames });
      
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation,
        inputProps: { slides },
      });

      logger.info('RenderService', 'Render complete', { outputLocation });

      // 4. Upload to S3
      const fileBuffer = fs.readFileSync(outputLocation);
      const s3Key = `renders/${projectId}-${Date.now()}.mp4`;
      
      logger.info('RenderService', 'Uploading to S3...', { s3Key });
      
      const { url: videoUrl } = await uploadFileToS3(fileBuffer, s3Key, 'video/mp4');

      logger.info('RenderService', 'Upload complete', { videoUrl });
      
      // Clean up local file
      try {
        fs.unlinkSync(outputLocation);
      } catch (e) {
        logger.warn('RenderService', 'Failed to cleanup local file', e);
      }

      return {
        success: true,
        videoUrl,
        s3Key
      };

    } catch (error) {
      logger.error('RenderService', 'Error rendering video', error as Error);
      throw error;
    }
  }
}
