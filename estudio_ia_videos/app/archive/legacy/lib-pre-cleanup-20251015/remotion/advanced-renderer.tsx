/**
 * 🎬 Renderizador Avançado de Elementos
 * Sistema integrado de templates, animações e transições
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { RenderedElement } from '../types/remotion-types';
import { 
  ANIMATION_TEMPLATES, 
  AnimationTemplateName 
} from './animation-templates';

interface AdvancedElementRendererProps {
  element: RenderedElement;
  animationTemplate?: AnimationTemplateName;
  customProps?: Record<string, unknown>;
}

export const AdvancedElementRenderer: React.FC<AdvancedElementRendererProps> = ({
  element,
  animationTemplate = 'fadeInScale',
  customProps = {}
}) => {
  const globalFrame = useCurrentFrame();

  // Verificar se elemento está visível no frame atual
  if (globalFrame < element.startFrame || globalFrame > element.endFrame) {
    return null;
  }

  // Selecionar template de animação
  const TemplateComponent = ANIMATION_TEMPLATES[animationTemplate];

  // Props combinadas
  const elementWithProps = {
    ...element,
    props: { ...element.props, ...customProps }
  };

  return (
    <TemplateComponent
      element={elementWithProps}
      globalFrame={globalFrame}
    />
  );
};

/**
 * Container de elementos com gerenciamento de camadas
 */
interface ElementLayerProps {
  elements: RenderedElement[];
  layerEffects?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
}

export const ElementLayer: React.FC<ElementLayerProps> = ({
  elements,
  layerEffects = {}
}) => {
  const frame = useCurrentFrame();

  // Criar filtro CSS baseado nos efeitos
  const filterStyle = Object.entries(layerEffects)
    .filter(([_, value]) => value !== undefined)
    .map(([effect, value]) => {
      switch (effect) {
        case 'blur':
          return `blur(${value}px)`;
        case 'brightness':
          return `brightness(${value})`;
        case 'contrast':
          return `contrast(${value})`;
        case 'saturation':
          return `saturate(${value})`;
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        filter: filterStyle || 'none'
      }}
    >
      {elements
        .filter(element => frame >= element.startFrame && frame <= element.endFrame)
        .sort((a, b) => (a.style.zIndex as number || 0) - (b.style.zIndex as number || 0))
        .map(element => (
          <AdvancedElementRenderer
            key={element.id}
            element={element}
            animationTemplate={getAnimationTemplate(element)}
          />
        ))}
    </div>
  );
};

/**
 * Determina o template de animação baseado no tipo e propriedades do elemento
 */
function getAnimationTemplate(element: RenderedElement): AnimationTemplateName {
  // Verificar se há template customizado nas propriedades
  if (element.props.animationTemplate) {
    return element.props.animationTemplate as AnimationTemplateName;
  }

  // Template padrão baseado no tipo
  switch (element.type) {
    case 'text':
      return 'typewriter';
    case 'image':
      return 'fadeInScale';
    case 'video':
      return 'slideIn';
    case 'shape':
      return 'pulse';
    default:
      return 'fadeInScale';
  }
}

/**
 * Renderizador de background com efeitos
 */
interface BackgroundRendererProps {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  effects?: {
    particles?: boolean;
    gradient?: {
      from: string;
      to: string;
      direction?: 'horizontal' | 'vertical' | 'diagonal';
    };
    noise?: number;
  };
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  backgroundColor = '#000000',
  backgroundImage,
  backgroundVideo,
  effects = {}
}) => {
  const frame = useCurrentFrame();

  // Criar gradiente se especificado
  let backgroundStyle: React.CSSProperties = {
    backgroundColor
  };

  if (effects.gradient) {
    const { from, to, direction = 'horizontal' } = effects.gradient;
    let gradientDirection = 'to right';
    
    switch (direction) {
      case 'vertical':
        gradientDirection = 'to bottom';
        break;
      case 'diagonal':
        gradientDirection = 'to bottom right';
        break;
    }

    backgroundStyle.background = `linear-gradient(${gradientDirection}, ${from}, ${to})`;
  }

  // Efeito de ruído
  if (effects.noise && effects.noise > 0) {
    const noiseOpacity = Math.random() * effects.noise;
    backgroundStyle.filter = `contrast(${1 + noiseOpacity}) brightness(${1 + noiseOpacity * 0.1})`;
  }

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        ...backgroundStyle
      }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.8
          }}
          alt="Background"
        />
      )}

      {/* Background Video */}
      {backgroundVideo && (
        <video
          src={backgroundVideo}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.7
          }}
          muted
          loop
        />
      )}

      {/* Particles Effect */}
      {effects.particles && (
        <ParticleEffect frame={frame} />
      )}
    </div>
  );
};

/**
 * Efeito de partículas simples
 */
const ParticleEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.2
    }));
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      {particles.map(particle => {
        const currentY = (particle.y + frame * particle.speed) % 100;
        
        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${currentY}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              opacity: particle.opacity
            }}
          />
        );
      })}
    </div>
  );
};