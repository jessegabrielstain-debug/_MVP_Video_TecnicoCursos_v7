

'use client'

/**
 * 📐 Smart Guides System - Intelligent Snapping & Alignment
 * Advanced snap-to-grid, object alignment, and measurement tools
 * Sprint 22 - Modern UI/UX Overhaul
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useCanvasTheme } from './theme-provider'
import { toast } from 'react-hot-toast'

interface FabricObject {
  left: number
  top: number
  width: number
  height: number
  getBoundingRect: () => { left: number; top: number; width: number; height: number }
  set: (options: Record<string, unknown>) => void
  [key: string]: unknown
}

interface FabricEvent {
  target?: FabricObject
  selected?: FabricObject[]
  [key: string]: unknown
}

interface Canvas {
  getElement: () => HTMLCanvasElement
  getZoom: () => number
  getWidth: () => number
  getHeight: () => number
  viewportTransform: number[]
  getObjects: () => FabricObject[]
  renderAll: () => void
  on: (event: string, handler: (e: FabricEvent) => void) => void
  off: (event: string, handler?: (e: FabricEvent) => void) => void
  [key: string]: unknown
}

interface Guide {
  type: 'vertical' | 'horizontal'
  position: number
}

interface Measurement {
  from: { x: number; y: number }
  to: { x: number; y: number }
  distance: number
}

interface SnapPoint {
  x: number
  y: number
  type: string
  object: FabricObject
}

// FabricEvent já definida acima

interface GuideOptions {
  snapToGrid: boolean
  snapToObjects: boolean
  showGrid: boolean
  showRulers: boolean
  gridSize: number
  snapDistance: number
  showMeasurements: boolean
}

interface SmartGuidesProps {
  canvas?: Canvas
  options?: Partial<GuideOptions>
  onOptionsChange?: (options: GuideOptions) => void
}

const defaultOptions: GuideOptions = {
  snapToGrid: true,
  snapToObjects: true,
  showGrid: true,
  showRulers: true,
  gridSize: 20,
  snapDistance: 10,
  showMeasurements: true
}

export default function SmartGuides({ 
  canvas, 
  options = {}, 
  onOptionsChange 
}: SmartGuidesProps) {
  const { theme } = useCanvasTheme()
  const [currentOptions, setCurrentOptions] = useState<GuideOptions>({
    ...defaultOptions,
    ...options
  })
  const guidesLayerRef = useRef<HTMLCanvasElement>(null)
  const [activeGuides, setActiveGuides] = useState<Guide[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])

  // Update options
  const updateOptions = useCallback((newOptions: Partial<GuideOptions>) => {
    const updatedOptions = { ...currentOptions, ...newOptions }
    setCurrentOptions(updatedOptions)
    onOptionsChange?.(updatedOptions)
  }, [currentOptions, onOptionsChange])

  // Draw grid
  const drawGrid = useCallback(() => {
    if (!canvas || !currentOptions.showGrid) return
    
    const canvasElement = canvas.getElement()
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return
    
    const zoom = canvas.getZoom()
    const vpt = canvas.viewportTransform
    const gridSize = currentOptions.gridSize * zoom
    
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.strokeStyle = theme.colors.border
    ctx.lineWidth = 1
    
    // Draw vertical lines
    const width = canvas.getWidth()
    const height = canvas.getHeight()
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    
    ctx.restore()
  }, [canvas, currentOptions.showGrid, currentOptions.gridSize, theme.colors.border])

  // Draw rulers
  const drawRulers = useCallback(() => {
    if (!canvas || !currentOptions.showRulers) return
    
    const canvasElement = canvas.getElement()
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return
    
    const zoom = canvas.getZoom()
    const rulerSize = 20
    const tickSize = 5
    const majorTickInterval = 100 * zoom
    const minorTickInterval = 25 * zoom
    
    ctx.save()
    ctx.fillStyle = theme.colors.toolbar
    ctx.strokeStyle = theme.colors.border
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Horizontal ruler
    ctx.fillRect(0, 0, canvas.getWidth(), rulerSize)
    ctx.strokeRect(0, 0, canvas.getWidth(), rulerSize)
    
    for (let x = 0; x <= canvas.getWidth(); x += minorTickInterval) {
      const isMajor = x % majorTickInterval === 0
      ctx.beginPath()
      ctx.moveTo(x, rulerSize)
      ctx.lineTo(x, rulerSize - (isMajor ? tickSize * 2 : tickSize))
      ctx.stroke()
      
      if (isMajor && x > 0) {
        ctx.fillStyle = theme.colors.text
        ctx.fillText(Math.round(x / zoom).toString(), x, rulerSize / 2)
        ctx.fillStyle = theme.colors.toolbar
      }
    }
    
    // Vertical ruler
    ctx.fillRect(0, 0, rulerSize, canvas.getHeight())
    ctx.strokeRect(0, 0, rulerSize, canvas.getHeight())
    
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    for (let y = 0; y <= canvas.getHeight(); y += minorTickInterval) {
      const isMajor = y % majorTickInterval === 0
      ctx.beginPath()
      ctx.moveTo(rulerSize, y)
      ctx.lineTo(rulerSize - (isMajor ? tickSize * 2 : tickSize), y)
      ctx.stroke()
      
      if (isMajor && y > 0) {
        ctx.save()
        ctx.translate(rulerSize / 2, y)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = theme.colors.text
        ctx.fillText(Math.round(y / zoom).toString(), 0, 0)
        ctx.restore()
      }
    }
    
    // Corner square
    ctx.fillStyle = theme.colors.sidebar
    ctx.fillRect(0, 0, rulerSize, rulerSize)
    ctx.strokeRect(0, 0, rulerSize, rulerSize)
    
    ctx.restore()
  }, [canvas, currentOptions.showRulers, theme.colors])

  // Snap to grid function
  const snapToGrid = useCallback((point: { x: number; y: number }) => {
    if (!currentOptions.snapToGrid) return point
    
    const gridSize = currentOptions.gridSize
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    }
  }, [currentOptions.snapToGrid, currentOptions.gridSize])

  // Find snap points from other objects
  const findSnapPoints = useCallback((activeObject: FabricObject, canvas: Canvas) => {
    if (!currentOptions.snapToObjects) return []
    
    const snapPoints: SnapPoint[] = []
    const objects = canvas.getObjects().filter((obj: FabricObject) => obj !== activeObject)
    
    objects.forEach((obj: FabricObject) => {
      const bounds = obj.getBoundingRect()
      
      // Add edge snap points
      snapPoints.push(
        { x: bounds.left, y: bounds.top, type: 'edge', object: obj },
        { x: bounds.left + bounds.width, y: bounds.top, type: 'edge', object: obj },
        { x: bounds.left, y: bounds.top + bounds.height, type: 'edge', object: obj },
        { x: bounds.left + bounds.width, y: bounds.top + bounds.height, type: 'edge', object: obj },
        // Center points
        { x: bounds.left + bounds.width / 2, y: bounds.top, type: 'center', object: obj },
        { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height, type: 'center', object: obj },
        { x: bounds.left, y: bounds.top + bounds.height / 2, type: 'center', object: obj },
        { x: bounds.left + bounds.width, y: bounds.top + bounds.height / 2, type: 'center', object: obj },
        // Center point
        { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, type: 'center', object: obj }
      )
    })
    
    return snapPoints
  }, [currentOptions.snapToObjects])

  // Draw alignment guides
  const drawAlignmentGuides = useCallback(() => {
    if (!canvas || activeGuides.length === 0) return
    
    const canvasElement = canvas.getElement()
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return
    
    ctx.save()
    ctx.strokeStyle = theme.colors.accent
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.globalAlpha = 0.8
    
    activeGuides.forEach(guide => {
      ctx.beginPath()
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.position, 0)
        ctx.lineTo(guide.position, canvas.getHeight())
      } else if (guide.type === 'horizontal') {
        ctx.moveTo(0, guide.position)
        ctx.lineTo(canvas.getWidth(), guide.position)
      }
      ctx.stroke()
    })
    
    ctx.restore()
  }, [canvas, activeGuides, theme.colors.accent])

  // Draw measurements
  const drawMeasurements = useCallback(() => {
    if (!canvas || !currentOptions.showMeasurements || measurements.length === 0) return
    
    const canvasElement = canvas.getElement()
    const ctx = canvasElement.getContext('2d')
    if (!ctx) return
    
    ctx.save()
    ctx.font = '12px monospace'
    ctx.fillStyle = theme.colors.text
    ctx.strokeStyle = theme.colors.accent
    ctx.lineWidth = 1
    
    measurements.forEach(measurement => {
      // Draw measurement line
      ctx.beginPath()
      ctx.moveTo(measurement.from.x, measurement.from.y)
      ctx.lineTo(measurement.to.x, measurement.to.y)
      ctx.stroke()
      
      // Draw measurement text
      const midX = (measurement.from.x + measurement.to.x) / 2
      const midY = (measurement.from.y + measurement.to.y) / 2
      const distance = Math.round(measurement.distance)
      
      ctx.fillStyle = theme.colors.toolbar
      ctx.fillRect(midX - 20, midY - 10, 40, 20)
      ctx.strokeRect(midX - 20, midY - 10, 40, 20)
      
      ctx.fillStyle = theme.colors.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${distance}px`, midX, midY)
    })
    
    ctx.restore()
  }, [canvas, currentOptions.showMeasurements, measurements, theme.colors])

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas) return
    
    const handleObjectMoving = (e: FabricEvent) => {
      const obj = e.target
      if (!obj) return
      
      // Snap to grid
      if (currentOptions.snapToGrid) {
        const snapped = snapToGrid({ x: obj.left, y: obj.top })
        obj.set({ left: snapped.x, top: snapped.y })
      }
      
      // Find snap points
      if (currentOptions.snapToObjects) {
        const snapPoints = findSnapPoints(obj, canvas)
        const objBounds = obj.getBoundingRect()
        const newGuides: Guide[] = []
        
        snapPoints.forEach(point => {
          const distanceX = Math.abs(point.x - (objBounds.left + objBounds.width / 2))
          const distanceY = Math.abs(point.y - (objBounds.top + objBounds.height / 2))
          
          if (distanceX < currentOptions.snapDistance) {
            obj.set({ left: point.x - objBounds.width / 2 })
            newGuides.push({ type: 'vertical', position: point.x })
          }
          
          if (distanceY < currentOptions.snapDistance) {
            obj.set({ top: point.y - objBounds.height / 2 })
            newGuides.push({ type: 'horizontal', position: point.y })
          }
        })
        
        setActiveGuides(newGuides)
      }
      
      canvas.renderAll()
    }
    
    const handleObjectMoved = () => {
      setActiveGuides([])
      setMeasurements([])
    }
    
    const handleSelectionCreated = (e: FabricEvent) => {
      const evt = e
      if (currentOptions.showMeasurements && evt.selected && evt.selected.length > 1) {
        const newMeasurements: Measurement[] = []
        const objects = evt.selected
        
        for (let i = 0; i < objects.length - 1; i++) {
          for (let j = i + 1; j < objects.length; j++) {
            const obj1 = objects[i].getBoundingRect()
            const obj2 = objects[j].getBoundingRect()
            
            const center1 = { 
              x: obj1.left + obj1.width / 2, 
              y: obj1.top + obj1.height / 2 
            }
            const center2 = { 
              x: obj2.left + obj2.width / 2, 
              y: obj2.top + obj2.height / 2 
            }
            
            const distance = Math.sqrt(
              Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
            )
            
            newMeasurements.push({
              from: center1,
              to: center2,
              distance
            })
          }
        }
        
        setMeasurements(newMeasurements)
      }
    }
    
    canvas.on('object:moving', handleObjectMoving)
    canvas.on('object:moved', handleObjectMoved)
    canvas.on('selection:created', handleSelectionCreated)
    canvas.on('selection:updated', handleSelectionCreated)
    canvas.on('selection:cleared', () => setMeasurements([]))
    
    return () => {
      canvas.off('object:moving', handleObjectMoving)
      canvas.off('object:moved', handleObjectMoved)
      canvas.off('selection:created', handleSelectionCreated)
      canvas.off('selection:updated', handleSelectionCreated)
      canvas.off('selection:cleared')
    }
  }, [canvas, currentOptions, snapToGrid, findSnapPoints])

  // Render guides on canvas updates
  useEffect(() => {
    if (!canvas) return
    
    const renderGuides = () => {
      drawGrid()
      drawRulers()
      drawAlignmentGuides()
      drawMeasurements()
    }
    
    canvas.on('after:render', renderGuides)
    renderGuides() // Initial render
    
    return () => {
      canvas.off('after:render', renderGuides)
    }
  }, [canvas, drawGrid, drawRulers, drawAlignmentGuides, drawMeasurements])

  return (
    <div className="smart-guides-overlay absolute inset-0 pointer-events-none">
      {/* Guide controls could be added here */}
    </div>
  )
}

// Export utility functions
export const GuideUtils = {
  snapPointToGrid: (point: { x: number; y: number }, gridSize: number) => ({
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }),
  
  findNearestSnapPoint: (
    point: { x: number; y: number }, 
    snapPoints: Array<{ x: number; y: number }>, 
    threshold: number
  ) => {
    let nearest = null
    let minDistance = threshold
    
    snapPoints.forEach(snap => {
      const distance = Math.sqrt(
        Math.pow(snap.x - point.x, 2) + Math.pow(snap.y - point.y, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearest = snap
      }
    })
    
    return nearest
  },
  
  calculateAlignment: (objects: FabricObject[]) => {
    if (objects.length < 2) return null
    
    const bounds = objects.map(obj => obj.getBoundingRect())
    const alignment = {
      left: Math.min(...bounds.map(b => b.left)),
      right: Math.max(...bounds.map(b => b.left + b.width)),
      top: Math.min(...bounds.map(b => b.top)),
      bottom: Math.max(...bounds.map(b => b.top + b.height)),
      centerX: bounds.reduce((sum, b) => sum + b.left + b.width / 2, 0) / bounds.length,
      centerY: bounds.reduce((sum, b) => sum + b.top + b.height / 2, 0) / bounds.length
    }
    
    return alignment
  }
}

