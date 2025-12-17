/**
 * Type declarations for external modules without TypeScript definitions
 * This file provides minimal types to satisfy TypeScript strict mode
 */

// Tesseract.js OCR module
declare module 'tesseract.js' {
  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      lines: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>;
      words: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>;
    };
  }

  export interface Worker {
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(image: string | Buffer | Blob): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  export function createWorker(lang?: string): Promise<Worker>;
}

// CSV Parse sync module
declare module 'csv-parse/sync' {
  export interface ParseOptions {
    columns?: boolean | string[] | ((headers: string[]) => string[]);
    delimiter?: string;
    skip_empty_lines?: boolean;
    trim?: boolean;
    cast?: boolean;
    cast_date?: boolean;
    relax_column_count?: boolean;
    from_line?: number;
    to_line?: number;
    quote?: string | boolean;
    escape?: string;
    comment?: string;
    bom?: boolean;
  }

  export function parse<T = Record<string, unknown>>(
    input: string | Buffer,
    options?: ParseOptions
  ): T[];
}

// PDF Parse module (complementing @types/pdf-parse if needed)
declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFMetadata {
    _metadata?: Record<string, unknown>;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: { pageNumber: number }) => string;
    max?: number;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}

// Fabric.js Canvas Library (loaded dynamically from window)
declare namespace fabric {
  interface IObjectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    angle?: number;
    opacity?: number;
    originX?: string;
    originY?: string;
    scaleX?: number;
    scaleY?: number;
    flipX?: boolean;
    flipY?: boolean;
    visible?: boolean;
    selectable?: boolean;
    evented?: boolean;
    hasControls?: boolean;
    hasBorders?: boolean;
    lockMovementX?: boolean;
    lockMovementY?: boolean;
    lockRotation?: boolean;
    lockScalingX?: boolean;
    lockScalingY?: boolean;
    id?: string;
    name?: string;
  }

  interface ITextOptions extends IObjectOptions {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontStyle?: string;
    textAlign?: string;
    lineHeight?: number;
    charSpacing?: number;
    underline?: boolean;
    overline?: boolean;
    linethrough?: boolean;
    textBackgroundColor?: string;
  }

  interface ICircleOptions extends IObjectOptions {
    radius?: number;
    startAngle?: number;
    endAngle?: number;
  }

  interface IImageOptions extends IObjectOptions {
    crossOrigin?: string;
  }

  class Object {
    id?: string;
    name?: string;
    type?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    opacity?: number;
    fill?: string;
    stroke?: string;
    set(options: Partial<IObjectOptions>): this;
    get(property: string): unknown;
    toObject(propertiesToInclude?: string[]): Record<string, unknown>;
    toJSON(propertiesToInclude?: string[]): string;
    clone(callback?: (clone: Object) => void): void;
    remove(): this;
    bringToFront(): this;
    sendToBack(): this;
    setCoords(): this;
  }

  class Textbox extends Object {
    constructor(text: string, options?: ITextOptions);
    text: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontStyle?: string;
    textAlign?: string;
    enterEditing(): void;
    exitEditing(): void;
    selectAll(): void;
  }

  class Rect extends Object {
    constructor(options?: IObjectOptions);
    rx?: number;
    ry?: number;
  }

  class Circle extends Object {
    constructor(options?: ICircleOptions);
    radius?: number;
  }

  class Image extends Object {
    constructor(element: HTMLImageElement, options?: IImageOptions);
    static fromURL(url: string, callback: (img: Image) => void, options?: IImageOptions): void;
    setSrc(src: string, callback?: () => void): void;
    getElement(): HTMLImageElement;
  }

  class Canvas {
    constructor(element: HTMLCanvasElement | string, options?: ICanvasOptions);
    width?: number;
    height?: number;
    backgroundColor?: string;
    selection?: boolean;
    add(...objects: Object[]): Canvas;
    remove(...objects: Object[]): Canvas;
    clear(): Canvas;
    renderAll(): Canvas;
    requestRenderAll(): void;
    getActiveObject(): Object | null;
    setActiveObject(object: Object): Canvas;
    discardActiveObject(): Canvas;
    getObjects(type?: string): Object[];
    getZoom(): number;
    setZoom(value: number): Canvas;
    zoomToPoint(point: { x: number; y: number }, value: number): Canvas;
    absolutePan(point: { x: number; y: number }): Canvas;
    relativePan(point: { x: number; y: number }): Canvas;
    setBackgroundColor(color: string, callback?: () => void): Canvas;
    setBackgroundImage(image: Image | string, callback?: () => void, options?: IImageOptions): Canvas;
    toDataURL(options?: IDataURLOptions): string;
    toJSON(propertiesToInclude?: string[]): Record<string, unknown>;
    loadFromJSON(json: Record<string, unknown> | string, callback?: () => void): Canvas;
    dispose(): void;
    on(eventName: string, handler: (e: IEvent) => void): Canvas;
    off(eventName: string, handler?: (e: IEvent) => void): Canvas;
    fire(eventName: string, options?: Record<string, unknown>): Canvas;
  }

  interface ICanvasOptions {
    width?: number;
    height?: number;
    backgroundColor?: string;
    selection?: boolean;
    preserveObjectStacking?: boolean;
    renderOnAddRemove?: boolean;
    controlsAboveOverlay?: boolean;
    allowTouchScrolling?: boolean;
    imageSmoothingEnabled?: boolean;
    enableRetinaScaling?: boolean;
  }

  interface IDataURLOptions {
    format?: string;
    quality?: number;
    multiplier?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  }

  interface IEvent {
    e?: MouseEvent | TouchEvent;
    target?: Object;
    subTargets?: Object[];
    button?: number;
    isClick?: boolean;
    pointer?: { x: number; y: number };
    absolutePointer?: { x: number; y: number };
    transform?: {
      target: Object;
      action: string;
      corner: string;
      scaleX: number;
      scaleY: number;
      skewX: number;
      skewY: number;
      offsetX: number;
      offsetY: number;
      originX: string;
      originY: string;
      ex: number;
      ey: number;
      lastX: number;
      lastY: number;
      theta: number;
      width: number;
      shiftKey: boolean;
      altKey: boolean;
    };
  }
}

// Extend Window interface for dynamically loaded fabric
interface Window {
  fabric?: typeof fabric;
}