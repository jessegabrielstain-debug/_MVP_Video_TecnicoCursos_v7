'use client'

import { useEffect, useRef } from 'react'
import { fabric } from 'fabric'

type CanvasEditorProps = {
  slide: any
  onChange: (updates: any) => void
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
    elements.forEach((el: any) => {
      if (el.type === 'text' && el.content) {
        const t = new fabric.Text(el.content, { left: el.x || 100, top: el.y || 100, fontSize: 24 })
        canvas.add(t)
      }
    })
    canvas.on('object:modified', () => {
      const objs = canvas.getObjects().map(o => ({ type: o.type, left: o.left, top: o.top, angle: (o as any).angle, text: (o as any).text }))
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
