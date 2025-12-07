
'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Guide {
  type: 'horizontal' | 'vertical'
  position: number
  objects: string[] // IDs dos objetos alinhados
  color: string
}

/** Interface para objeto Fabric.js */
interface FabricObject {
  id?: string;
  name?: string;
  getBoundingRect: () => { left: number; top: number; width: number; height: number };
  set: (props: Record<string, number>) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
}

/** Interface para Canvas Fabric.js */
interface FabricCanvas {
  getObjects: () => FabricObject[];
  add: (obj: unknown) => void;
  remove: (obj: unknown) => void;
  renderAll: () => void;
  on: (event: string, handler: (e: { target: FabricObject }) => void) => void;
  off: (event: string, handler: (e: { target: FabricObject }) => void) => void;
  width?: number;
  height?: number;
}

interface SmartGuidesProps {
  canvas: FabricCanvas | null;
  enabled: boolean;
  snapDistance: number;
}

export function SmartGuides({ canvas, enabled, snapDistance = 5 }: SmartGuidesProps) {
  const guidesRef = useRef<Guide[]>([])
  const [activeGuides, setActiveGuides] = useState<Guide[]>([])
  
  useEffect(() => {
    if (!canvas || !enabled) return
    
    const handleObjectMoving = (e: { target: FabricObject }) => {
      const movingObject = e.target
      if (!movingObject) return
      
      const guides: Guide[] = []
      const objects = canvas.getObjects().filter((obj) => obj !== movingObject)
      
      // Calcular guides horizontais e verticais
      objects.forEach((obj) => {
        const objBounds = obj.getBoundingRect()
        const movingBounds = movingObject.getBoundingRect()
        
        // Guide vertical (alinhamento horizontal)
        const leftAlign = Math.abs(objBounds.left - movingBounds.left)
        const centerAlign = Math.abs((objBounds.left + objBounds.width/2) - (movingBounds.left + movingBounds.width/2))
        const rightAlign = Math.abs((objBounds.left + objBounds.width) - (movingBounds.left + movingBounds.width))
        
        if (leftAlign < snapDistance) {
          guides.push({
            type: 'vertical',
            position: objBounds.left,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#ff6b6b'
          })
          movingObject.set({ left: objBounds.left })
        } else if (centerAlign < snapDistance) {
          const centerX = objBounds.left + objBounds.width/2 - movingBounds.width/2
          guides.push({
            type: 'vertical',
            position: objBounds.left + objBounds.width/2,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#4ecdc4'
          })
          movingObject.set({ left: centerX })
        } else if (rightAlign < snapDistance) {
          const rightX = objBounds.left + objBounds.width - movingBounds.width
          guides.push({
            type: 'vertical',
            position: objBounds.left + objBounds.width,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#45b7d1'
          })
          movingObject.set({ left: rightX })
        }
        
        // Guide horizontal (alinhamento vertical)
        const topAlign = Math.abs(objBounds.top - movingBounds.top)
        const middleAlign = Math.abs((objBounds.top + objBounds.height/2) - (movingBounds.top + movingBounds.height/2))
        const bottomAlign = Math.abs((objBounds.top + objBounds.height) - (movingBounds.top + movingBounds.height))
        
        if (topAlign < snapDistance) {
          guides.push({
            type: 'horizontal',
            position: objBounds.top,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#ff6b6b'
          })
          movingObject.set({ top: objBounds.top })
        } else if (middleAlign < snapDistance) {
          const centerY = objBounds.top + objBounds.height/2 - movingBounds.height/2
          guides.push({
            type: 'horizontal',
            position: objBounds.top + objBounds.height/2,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#4ecdc4'
          })
          movingObject.set({ top: centerY })
        } else if (bottomAlign < snapDistance) {
          const bottomY = objBounds.top + objBounds.height - movingBounds.height
          guides.push({
            type: 'horizontal',
            position: objBounds.top + objBounds.height,
            objects: [obj.id || '', movingObject.id || ''],
            color: '#45b7d1'
          })
          movingObject.set({ top: bottomY })
        }
      })
      
      guidesRef.current = guides
      setActiveGuides([...guides])
      renderGuides()
    }
    
    const handleObjectMoved = () => {
      clearGuides()
      setActiveGuides([])
    }
    
    const renderGuides = () => {
      // Remover guides anteriores
      clearGuides()
      
      // Desenhar novas guides - implementação simplificada para não depender do Fabric.js
      guidesRef.current.forEach(guide => {
        try {
          // Criar linha usando API genérica de canvas
          if (canvas.add) {
            const lineCoords = guide.type === 'vertical' 
              ? [guide.position, 0, guide.position, canvas.height || 600]
              : [0, guide.position, canvas.width || 800, guide.position]
            
            // Implementação genérica sem dependência do Fabric.js específico
            const line = {
              stroke: guide.color,
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
              excludeFromExport: true,
              name: 'smart-guide',
              coords: lineCoords
            }
            
            canvas.add(line)
          }
        } catch (error) {
          console.warn('Error rendering guide:', error)
        }
      })
      
      if (canvas.renderAll) {
        canvas.renderAll()
      }
    }
    
    const clearGuides = () => {
      try {
        if (canvas.getObjects) {
          const guides = canvas.getObjects().filter((obj) => obj.name === 'smart-guide')
          guides.forEach((guide) => {
            if (canvas.remove) {
              canvas.remove(guide)
            }
          })
        }
      } catch (error) {
        console.warn('Error clearing guides:', error)
      }
    }
    
    if (canvas.on) {
      canvas.on('object:moving', handleObjectMoving)
      canvas.on('object:moved', handleObjectMoved)
    }
    
    return () => {
      if (canvas.off) {
        canvas.off('object:moving', handleObjectMoving)
        canvas.off('object:moved', handleObjectMoved)
      }
      clearGuides()
    }
  }, [canvas, enabled, snapDistance])
  
  return null // Componente apenas funcional
}

// Hook para usar smart guides
export function useSmartGuides(canvas: FabricCanvas | null) {
  const [enabled, setEnabled] = useState(true)
  const [snapDistance, setSnapDistance] = useState(5)
  
  return {
    enabled,
    setEnabled,
    snapDistance,
    setSnapDistance,
    component: <SmartGuides canvas={canvas} enabled={enabled} snapDistance={snapDistance} />
  }
}
