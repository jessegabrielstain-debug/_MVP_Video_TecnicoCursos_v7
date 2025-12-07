/**
 * Fabric.js Singleton
 * 
 * Gerencia instância única do Fabric.js para evitar problemas
 * de múltiplas inicializações e carregamento dinâmico.
 */

import * as fabric from 'fabric';

let fabricInstance: typeof fabric | null = null;

/**
 * Obtém instância singleton do Fabric.js
 */
export function getFabricInstance(): typeof fabric {
  if (!fabricInstance) {
    fabricInstance = fabric;
  }
  return fabricInstance;
}

/**
 * Cria novo canvas Fabric
 */
export function createFabricCanvas(
  element: HTMLCanvasElement | string,
  options?: fabric.CanvasOptions
): fabric.Canvas {
  const fabricLib = getFabricInstance();
  return new fabricLib.Canvas(element, options);
}

/**
 * Cria novo canvas estático Fabric
 */
export function createStaticCanvas(
  element: HTMLCanvasElement | string,
  options?: fabric.CanvasOptions
): fabric.StaticCanvas {
  const fabricLib = getFabricInstance();
  return new fabricLib.StaticCanvas(element, options);
}

// Export re-export do fabric para compatibilidade
export { fabric };
export default getFabricInstance();

export const FabricManager = {
  getInstance: getFabricInstance,
  createCanvas: createFabricCanvas,
  createStaticCanvas: createStaticCanvas
};

export const useFabric = () => {
  return {
    fabric: getFabricInstance(),
    FabricManager
  };
};
