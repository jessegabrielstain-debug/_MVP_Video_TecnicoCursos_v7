export interface Slide {
  id: string;
  number: number;
  order_index: number;
  title?: string;
  content?: string;
  duration: number;
  visualSettings?: {
    backgroundImageUrl?: string;
    backgroundColor?: string;
    [key: string]: unknown;
  };
  elements: SlideElement[];
  // Outras propriedades do slide
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  text?: string;
  // Outras propriedades do elemento
}
