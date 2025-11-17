'use client';

import React from 'react';

interface VideoProcessorStudioProps {
  onVideoProcessed: (blob: Blob, filename: string) => void;
}

const VideoProcessorStudio: React.FC<VideoProcessorStudioProps> = ({ onVideoProcessed }) => {
  return (
    <div>
      <h1>Video Processor Studio</h1>
      <p>Componente para o estúdio de processamento de vídeo.</p>
    </div>
  );
};

export default VideoProcessorStudio;
