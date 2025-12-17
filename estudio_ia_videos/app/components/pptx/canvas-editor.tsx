'use client'

import { useEffect, useRef } from 'react'
import * as fabric from 'fabric'

// Extended Fabric.Object type with common properties
interface ExtendedFabricObject extends fabric.Object {
  text?: string
}

interface SlideElement {
  type: string
  content?: string
  x?: number
  y?: number
}

interface SlideData {
  elements?: SlideElement[]
}

interface CanvasElementUpdate {
  type?: string
  left?: number
  top?: number
  angle?: number
  text?: string
}

type CanvasEditorProps = {
  slide: SlideData
  onChange: (updates: { elements: CanvasElementUpdate[] }) => void
}

export function CanvasEditor({ slide, onChange }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!canvasRef.current || initialized.current) return
    initialized.current = true
    const canvas = new fabric.Canvas(canvasRef.current, { backgroundColor: '#ffffff', preserveObjectStacking: true })
    fabricRef.current = canvas
    canvas.setWidth(960)
    canvas.setHeight(540)
    const elements = Array.isArray(slide.elements) ? slide.elements : []
    elements.forEach((el: SlideElement) => {
      if (el.type === 'text' && el.content) {
        const t = new fabric.Text(el.content, { left: el.x || 100, top: el.y || 100, fontSize: 24 })
        canvas.add(t)
      }
    })
    canvas.on('object:modified', () => {
      const objs: CanvasElementUpdate[] = canvas.getObjects().map((o: fabric.Object) => {
        const extObj = o as ExtendedFabricObject
        return { type: o.type, left: o.left, top: o.top, angle: o.angle, text: extObj.text }
      })
      onChange({ elements: objs })
    })
    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [slide, onChange])

  return (
    <div className="border rounded-md overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  )
}
