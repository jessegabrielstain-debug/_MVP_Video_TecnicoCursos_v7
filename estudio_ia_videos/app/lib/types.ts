export interface Slide {
  id: string;
  number: number;
  elements: SlideElement[];
  // Outras propriedades do slide
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  text?: string;
  // Outras propriedades do elemento
}
