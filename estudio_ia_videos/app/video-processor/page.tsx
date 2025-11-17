/**
 * Página do Processador de Vídeo WebAssembly
 */

import VideoProcessorStudio from '@/components/video/video-processor-studio';

export default function VideoProcessorPage() {
  return (
    <div className="min-h-screen bg-background">
      <VideoProcessorStudio
        onVideoProcessed={(blob: Blob, filename: string) => {
          console.log('Vídeo processado:', filename, blob.size, 'bytes');
        }}
      />
    </div>
  );
}

export const metadata = {
  title: 'Processador de Vídeo - Estúdio IA Vídeos',
  description: 'Processe vídeos localmente com WebAssembly e FFmpeg'
};