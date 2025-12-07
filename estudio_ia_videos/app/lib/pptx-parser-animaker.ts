export interface AnimakerElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    rotation?: number;
  };
  animation: {
    type: string;
    duration: number;
    delay: number;
    easing: string;
  };
  interactive: {
    clickable: boolean;
  };
  metadata: {
    originalIndex: number;
    slideId: string;
    elementId: string;
    visible: boolean;
    locked: boolean;
  };
}

export interface AnimakerSlide {
  id: string;
  elements: AnimakerElement[];
  background: {
    type: 'solid' | 'gradient' | 'image';
    value: string;
    opacity?: number;
  };
}

export interface AnimakerProject {
  id: string;
  slides: AnimakerSlide[];
  metadata: {
    title: string;
    author: string;
    createdAt: string;
  };
}
