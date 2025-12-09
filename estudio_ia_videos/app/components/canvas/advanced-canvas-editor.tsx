
'use client';

/**
 * 🖼️ Advanced Canvas Editor with Fabric.js
 * Features: Drag, resize, rotate, layers, undo/redo, text editing, shapes
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
// ✅ CORRIGIDO: Removido import direto, usando singleton
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type * as Fabric from 'fabric';

let fabric: typeof Fabric | null = null;
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  MousePointer,
  Trash2,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Upload,
  Download,
  Copy,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';

interface FabricTextObject {
  type: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  underline?: boolean;
  set: (property: string, value: unknown) => void;
}

interface AdvancedCanvasEditorProps {
  slideId: string;
  initialData?: Record<string, unknown>;
  width?: number;
  height?: number;
  onSave?: (canvasData: Record<string, unknown>) => void;
}

export default function AdvancedCanvasEditor({
  slideId,
  initialData,
  width = 1920,
  height = 1080,
  onSave
}: AdvancedCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<Fabric.Object | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const [zoom, setZoom] = useState<number>(1);
  const [tool, setTool] = useState<'select' | 'text' | 'shape'>('select');

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    // ✅ CORRIGIDO: Carrega Fabric.js via singleton
    const initCanvas = async () => {
      try {
        if (!fabric) {
          const { FabricManager } = await import('@/lib/fabric-singleton')
          // @ts-ignore - FabricManager returns any currently
          fabric = FabricManager.getInstance()
        }

        if (!fabric) return

        // @ts-ignore
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: width,
          height: height,
          backgroundColor: '#ffffff',
          preserveObjectStacking: true,
        });

        fabricRef.current = canvas;

        // Load initial data
        if (initialData) {
          canvas.loadFromJSON(initialData, () => {
            canvas.renderAll();
          });
        }

        // Event listeners
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setSelectedObject(null));
        canvas.on('object:modified', saveState);
        canvas.on('object:added', saveState);
        canvas.on('object:removed', saveState);

        // Initial state
        saveState();
      } catch (error) {
        logger.error('Failed to load Fabric.js', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedCanvasEditor' });
      }
    }

    initCanvas()

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, []);

  // Handle object selection
  const handleSelection = useCallback((e: any) => {
    if (e.selected && e.selected.length > 0) {
      setSelectedObject(e.selected[0]);
    } else {
      setSelectedObject(null);
    }
  }, []);

  // Save canvas state for undo/redo
  const saveState = useCallback(() => {
    if (!fabricRef.current) return;

    const json = JSON.stringify(fabricRef.current.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(json);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  }, [historyStep]);

  // Undo
  const undo = useCallback(() => {
    if (historyStep <= 0 || !fabricRef.current) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    
    fabricRef.current.loadFromJSON(history[newStep], () => {
      fabricRef.current?.renderAll();
    });
  }, [history, historyStep]);

  // Redo
  const redo = useCallback(() => {
    if (historyStep >= history.length - 1 || !fabricRef.current) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    
    fabricRef.current.loadFromJSON(history[newStep], () => {
      fabricRef.current?.renderAll();
    });
  }, [history, historyStep]);

  // Add text
  const addText = useCallback(() => {
    if (!fabricRef.current || !fabric) return;

    const text = new fabric.IText('Digite seu texto aqui', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
    toast.success('Texto adicionado');
  }, []);

  // Add shape
  const addShape = useCallback((type: 'rect' | 'circle' | 'triangle') => {
    if (!fabricRef.current || !fabric) return;

    let shape: Fabric.Object;

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 200,
          height: 150,
          fill: '#3b82f6',
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 75,
          fill: '#10b981',
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 150,
          height: 150,
          fill: '#f59e0b',
        });
        break;
    }

    fabricRef.current.add(shape);
    fabricRef.current.setActiveObject(shape);
    fabricRef.current.renderAll();
    toast.success('Forma adicionada');
  }, []);

  // Add image
  const addImage = useCallback((file: File) => {
    if (!fabricRef.current || !fabric) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // @ts-ignore
      fabric?.Image.fromURL(e.target?.result as string, (img: any) => {
        img.scaleToWidth(300);
        img.set({ left: 100, top: 100 });
        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        fabricRef.current?.renderAll();
        toast.success('Imagem adicionada');
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;

    fabricRef.current.remove(selectedObject);
    fabricRef.current.renderAll();
    toast.success('Objeto removido');
  }, [selectedObject]);

  // Duplicate selected object
  const duplicateSelected = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;

    // @ts-ignore
    selectedObject.clone((cloned: Fabric.Object) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      });
      fabricRef.current?.add(cloned);
      fabricRef.current?.setActiveObject(cloned);
      fabricRef.current?.renderAll();
      toast.success('Objeto duplicado');
    });
  }, [selectedObject]);

  // Change text properties
  const changeTextProperty = useCallback((property: string, value: unknown) => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;

    (selectedObject as unknown as FabricTextObject).set(property, value);
    fabricRef.current?.renderAll();
  }, [selectedObject]);

  // Change object color
  const changeColor = useCallback((color: string) => {
    if (!selectedObject) return;

    if (selectedObject.type === 'i-text') {
      (selectedObject as unknown as FabricTextObject).set('fill', color);
    } else {
      selectedObject.set('fill', color);
    }
    fabricRef.current?.renderAll();
  }, [selectedObject]);

  // Zoom in/out
  const handleZoom = useCallback((delta: number) => {
    if (!fabricRef.current) return;

    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    setZoom(newZoom);
    fabricRef.current.setZoom(newZoom);
    fabricRef.current.renderAll();
  }, [zoom]);

  // Bring to front/back
  const bringToFront = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.bringObjectToFront(selectedObject);
    fabricRef.current.renderAll();
  }, [selectedObject]);

  const sendToBack = useCallback(() => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.sendObjectToBack(selectedObject);
    fabricRef.current.renderAll();
  }, [selectedObject]);

  // Save canvas data
  const save = useCallback(() => {
    if (!fabricRef.current) return;

    const canvasData = fabricRef.current.toJSON();
    onSave?.(canvasData);
    toast.success('Canvas salvo com sucesso');
  }, [onSave]);

  // Export as image
  const exportAsImage = useCallback(() => {
    if (!fabricRef.current) return;

    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `slide-${slideId}.png`;
    link.href = dataURL;
    link.click();
    toast.success('Imagem exportada');
  }, [slideId]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b">
        {/* Tools */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant={tool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTool('select')}
            title="Selecionar"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addText}
            title="Adicionar Texto"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        {/* Shapes */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addShape('rect')}
            title="Retângulo"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addShape('circle')}
            title="Círculo"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addShape('triangle')}
            title="Triângulo"
          >
            <Triangle className="w-4 h-4" />
          </Button>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyStep <= 0}
            title="Desfazer"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            title="Refazer"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={duplicateSelected}
            disabled={!selectedObject}
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteSelected}
            disabled={!selectedObject}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Layers */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={bringToFront}
            disabled={!selectedObject}
            title="Trazer para frente"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={sendToBack}
            disabled={!selectedObject}
            title="Enviar para trás"
          >
            <Layers className="w-4 h-4 rotate-180" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(-0.1)}
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom(0.1)}
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Export */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={exportAsImage}
            title="Exportar como Imagem"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={save}
          >
            Salvar
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="border-2 border-gray-200 shadow-lg" style={{ display: 'inline-block' }}>
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Properties Panel */}
        {selectedObject && (
          <Card className="w-80 m-4 p-4 overflow-auto">
            <h3 className="font-semibold mb-4">Propriedades</h3>

            {/* Text Properties */}
            {selectedObject.type === 'i-text' && (
              <div className="space-y-4">
                <div>
                  <Label>Fonte</Label>
                  <Input
                    type="number"
                    value={(selectedObject as unknown as FabricTextObject).fontSize}
                    onChange={(e) => changeTextProperty('fontSize', parseInt(e.target.value))}
                    min={8}
                    max={200}
                  />
                </div>

                <div>
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={(selectedObject as unknown as FabricTextObject).fill as string}
                    onChange={(e) => changeColor(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('fontWeight', 
                      (selectedObject as unknown as FabricTextObject).fontWeight === 'bold' ? 'normal' : 'bold'
                    )}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('fontStyle',
                      (selectedObject as unknown as FabricTextObject).fontStyle === 'italic' ? 'normal' : 'italic'
                    )}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('underline',
                      !(selectedObject as unknown as FabricTextObject).underline
                    )}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('textAlign', 'left')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('textAlign', 'center')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeTextProperty('textAlign', 'right')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Shape Properties */}
            {['rect', 'circle', 'triangle'].includes(selectedObject.type || '') && (
              <div className="space-y-4">
                <div>
                  <Label>Cor de Preenchimento</Label>
                  <Input
                    type="color"
                    value={(selectedObject as unknown as FabricTextObject).fill as string}
                    onChange={(e) => changeColor(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Opacidade</Label>
                  <Slider
                    value={[(selectedObject.opacity || 1) * 100]}
                    onValueChange={([value]) => {
                      selectedObject.set('opacity', value / 100);
                      fabricRef.current?.renderAll();
                    }}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            )}

            {/* Common Properties */}
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <Label>Posição X</Label>
                <Input
                  type="number"
                  value={Math.round(selectedObject.left || 0)}
                  onChange={(e) => {
                    selectedObject.set('left', parseInt(e.target.value));
                    fabricRef.current?.renderAll();
                  }}
                />
              </div>

              <div>
                <Label>Posição Y</Label>
                <Input
                  type="number"
                  value={Math.round(selectedObject.top || 0)}
                  onChange={(e) => {
                    selectedObject.set('top', parseInt(e.target.value));
                    fabricRef.current?.renderAll();
                  }}
                />
              </div>

              <div>
                <Label>Rotação (graus)</Label>
                <Slider
                  value={[selectedObject.angle || 0]}
                  onValueChange={([value]) => {
                    selectedObject.set('angle', value);
                    fabricRef.current?.renderAll();
                  }}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
