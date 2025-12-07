import React from 'react';
import { Composition } from 'remotion';
import { MyComposition, MyCompositionProps } from './Composition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyComposition as any}
        durationInFrames={30 * 60} // Fallback duration
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          slides: [
            {
              id: '1',
              title: 'Slide 1',
              content: 'Welcome to Remotion',
              duration: 5,
            },
          ],
        }}
        calculateMetadata={async ({ props }) => {
          const fps = 30;
          const totalDurationInSeconds = props.slides.reduce((acc, slide) => acc + (slide.duration || 5), 0);
          return {
            durationInFrames: Math.ceil(totalDurationInSeconds * fps),
            props,
          };
        }}
      />
    </>
  );
};
