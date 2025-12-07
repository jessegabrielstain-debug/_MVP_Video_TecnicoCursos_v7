import React from 'react';
import { AbsoluteFill, Sequence, Audio, Img, useVideoConfig, useCurrentFrame, interpolate, spring, staticFile } from 'remotion';

export interface Slide {
  id: string;
  content: string;
  duration: number; // in seconds
  audioUrl?: string;
  backgroundImage?: string;
  title?: string;
}

export interface MyCompositionProps {
  slides: Slide[];
}

const Title: React.FC<{ title: string; delay: number }> = ({ title, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const translateY = spring({
    frame: frame - delay,
    fps,
    from: 50,
    to: 0,
  });

  return (
    <h1 
      className="text-6xl font-bold mb-8 text-slate-900 drop-shadow-sm"
      style={{ opacity, transform: `translateY(${translateY}px)` }}
    >
      {title}
    </h1>
  );
};

const Content: React.FC<{ content: string; delay: number }> = ({ content, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <p 
      className="text-4xl text-slate-700 leading-relaxed max-w-4xl mx-auto"
      style={{ opacity }}
    >
      {content}
    </p>
  );
};

const ProgressBar: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <div className="absolute bottom-0 left-0 h-2 bg-blue-600 z-50" style={{ width: `${width}%` }} />
  );
};

export const MyComposition: React.FC<MyCompositionProps> = ({ slides }) => {
  const { fps, durationInFrames } = useVideoConfig();
  let currentFrame = 0;

  return (
    <AbsoluteFill className="bg-white">
      {/* Background Pattern */}
      <AbsoluteFill className="bg-slate-50">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </AbsoluteFill>

      {slides.map((slide, index) => {
        const slideDurationFrames = Math.round(slide.duration * fps);
        const from = currentFrame;
        currentFrame += slideDurationFrames;

        return (
          <Sequence key={slide.id} from={from} durationInFrames={slideDurationFrames}>
            <AbsoluteFill className="flex items-center justify-center p-20">
              {slide.backgroundImage ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
                   <Img 
                     src={slide.backgroundImage} 
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                   />
                   {/* Overlay for text readability if needed */}
                   {(slide.title || slide.content) && (
                     <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-10">
                        {slide.title && <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">{slide.title}</h1>}
                        {slide.content && <p className="text-4xl text-white/90 max-w-4xl drop-shadow-md">{slide.content}</p>}
                     </div>
                   )}
                </div>
              ) : (
                <div className="text-center z-10">
                  {slide.title && <Title title={slide.title} delay={10} />}
                  {slide.content && <Content content={slide.content} delay={25} />}
                </div>
              )}
              
              {slide.audioUrl && (
                <Audio src={slide.audioUrl.startsWith('/') ? staticFile(slide.audioUrl) : slide.audioUrl} />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      
      {/* Global Elements */}
      <div className="absolute top-10 right-10 flex items-center gap-2 opacity-50">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Estúdio IA</span>
      </div>
      
      <ProgressBar durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

