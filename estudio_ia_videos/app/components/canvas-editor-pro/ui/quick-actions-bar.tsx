

'use client'

/**
 * 🚀 Quick Actions Bar - Always Visible Toolbar
 * Essential canvas actions with real-time preview
 * Sprint 22 - Modern UI/UX Overhaul
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { useCanvasTheme } from './theme-provider'
import { toast } from 'react-hot-toast'
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Copy,
  ClipboardList,
  Grid3X3,
  Ruler,
  MousePointer2,
  Hand,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Palette,
  Settings,
  Save,
  Play,
  Download
} from 'lucide-react'

interface FabricObject {
  lockMovementX?: boolean
  lockMovementY?: boolean
  left: number
  top: number
  set: (options: Record<string, unknown>) => void
  clone: (callback: (cloned: FabricObject) => void) => void
  [key: string]: unknown
}

interface Canvas {
  undo?: () => void
  redo?: () => void
  getZoom: () => number
  setZoom: (value: number) => void
  setViewportTransform: (transform: number[]) => void
  getActiveObject: () => FabricObject | null
  discardActiveObject: () => void
  add: (object: FabricObject) => void
  setActiveObject: (object: FabricObject) => void
  requestRenderAll: () => void
  clipboard?: FabricObject
  [key: string]: unknown
}

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  category: 'edit' | 'zoom' | 'align' | 'layer' | 'tools' | 'export'
  disabled?: boolean
  badge?: string | number
}

interface QuickActionsBarProps {
  canvas?: any
  onAction?: (actionId: string, params?: unknown) => void
  selectedObjects?: any[]
  canUndo?: boolean
  canRedo?: boolean
  zoomLevel?: number
}

export default function QuickActionsBar({
  canvas,
  onAction,
  selectedObjects = [],
  canUndo = false,
  canRedo = false,
  zoomLevel = 100
}: QuickActionsBarProps) {
  const { theme, toggleTheme } = useCanvasTheme()
  const [activeCategory, setActiveCategory] = useState<string>('edit')
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [currentTool, setCurrentTool] = useState('select')

  // Define actions based on current context
  const actions: QuickAction[] = [
    // Edit actions
    {
      id: 'undo',
      icon: <Undo2 className="h-4 w-4" />,
      label: 'Desfazer',
      shortcut: 'Ctrl+Z',
      category: 'edit',
      disabled: !canUndo
    },
    {
      id: 'redo',
      icon: <Redo2 className="h-4 w-4" />,
      label: 'Refazer',
      shortcut: 'Ctrl+Y',
      category: 'edit',
      disabled: !canRedo
    },
    {
      id: 'copy',
      icon: <Copy className="h-4 w-4" />,
      label: 'Copiar',
      shortcut: 'Ctrl+C',
      category: 'edit',
      disabled: selectedObjects.length === 0
    },
    {
      id: 'paste',
      icon: <ClipboardList className="h-4 w-4" />,
      label: 'Colar',
      shortcut: 'Ctrl+V',
      category: 'edit'
    },

    // Zoom actions
    {
      id: 'zoom-in',
      icon: <ZoomIn className="h-4 w-4" />,
      label: 'Ampliar',
      shortcut: 'Ctrl++',
      category: 'zoom'
    },
    {
      id: 'zoom-out',
      icon: <ZoomOut className="h-4 w-4" />,
      label: 'Reduzir',
      shortcut: 'Ctrl+-',
      category: 'zoom'
    },
    {
      id: 'fit-to-screen',
      icon: <Maximize className="h-4 w-4" />,
      label: 'Ajustar à Tela',
      shortcut: 'Ctrl+0',
      category: 'zoom'
    },

    // Alignment actions
    {
      id: 'align-left',
      icon: <AlignLeft className="h-4 w-4" />,
      label: 'Alinhar à Esquerda',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'align-center',
      icon: <AlignCenter className="h-4 w-4" />,
      label: 'Alinhar ao Centro',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'align-right',
      icon: <AlignRight className="h-4 w-4" />,
      label: 'Alinhar à Direita',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'align-top',
      icon: <AlignVerticalJustifyStart className="h-4 w-4" />,
      label: 'Alinhar ao Topo',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'align-middle',
      icon: <AlignVerticalJustifyCenter className="h-4 w-4" />,
      label: 'Alinhar ao Meio',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'align-bottom',
      icon: <AlignVerticalJustifyEnd className="h-4 w-4" />,
      label: 'Alinhar à Base',
      category: 'align',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'distribute-horizontal',
      icon: <ArrowLeftRight className="h-4 w-4" />,
      label: 'Distribuir Horizontalmente',
      category: 'align',
      disabled: selectedObjects.length < 3
    },
    {
      id: 'distribute-vertical',
      icon: <ArrowUpDown className="h-4 w-4" />,
      label: 'Distribuir Verticalmente',
      category: 'align',
      disabled: selectedObjects.length < 3
    },

    // Layer actions
    {
      id: 'bring-to-front',
      icon: <ChevronUp className="h-4 w-4" />,
      label: 'Trazer para Frente',
      category: 'layer',
      disabled: selectedObjects.length === 0
    },
    {
      id: 'send-to-back',
      icon: <ChevronDown className="h-4 w-4" />,
      label: 'Enviar para Trás',
      category: 'layer',
      disabled: selectedObjects.length === 0
    },
    {
      id: 'group',
      icon: <Group className="h-4 w-4" />,
      label: 'Agrupar',
      category: 'layer',
      disabled: selectedObjects.length < 2
    },
    {
      id: 'ungroup',
      icon: <Ungroup className="h-4 w-4" />,
      label: 'Desagrupar',
      category: 'layer',
      disabled: selectedObjects.length === 0
    },
    {
      id: 'lock',
      icon: selectedObjects.some((obj: FabricObject) => obj.lockMovementX || obj.lockMovementY) 
        ? <Unlock className="h-4 w-4" />
        : <Lock className="h-4 w-4" />,
      label: selectedObjects.some((obj: FabricObject) => obj.lockMovementX || obj.lockMovementY)
        ? 'Desbloquear'
        : 'Bloquear',
      category: 'layer',
      disabled: selectedObjects.length === 0
    },

    // Tools
    {
      id: 'select',
      icon: <MousePointer2 className="h-4 w-4" />,
      label: 'Selecionar',
      shortcut: 'V',
      category: 'tools'
    },
    {
      id: 'pan',
      icon: <Hand className="h-4 w-4" />,
      label: 'Mover Tela',
      shortcut: 'H',
      category: 'tools'
    },
    {
      id: 'rectangle',
      icon: <Square className="h-4 w-4" />,
      label: 'Retângulo',
      shortcut: 'R',
      category: 'tools'
    },
    {
      id: 'circle',
      icon: <Circle className="h-4 w-4" />,
      label: 'Círculo',
      shortcut: 'O',
      category: 'tools'
    },
    {
      id: 'text',
      icon: <Type className="h-4 w-4" />,
      label: 'Texto',
      shortcut: 'T',
      category: 'tools'
    },
    {
      id: 'image',
      icon: <ImageIcon className="h-4 w-4" />,
      label: 'Imagem',
      shortcut: 'I',
      category: 'tools'
    }
  ]

  const handleAction = useCallback((action: QuickAction) => {
    if (action.disabled) return

    // Handle built-in actions
    switch (action.id) {
      case 'undo':
        canvas?.undo?.()
        toast.success('Ação desfeita')
        break
      case 'redo':
        canvas?.redo?.()
        toast.success('Ação refeita')
        break
      case 'zoom-in':
        if (canvas) {
          const newZoom = Math.min(canvas.getZoom() * 1.1, 5)
          canvas.setZoom(newZoom)
        }
        break
      case 'zoom-out':
        if (canvas) {
          const newZoom = Math.max(canvas.getZoom() * 0.9, 0.1)
          canvas.setZoom(newZoom)
        }
        break
      case 'fit-to-screen':
        if (canvas) {
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
        }
        break
      case 'copy':
        if (canvas && selectedObjects.length > 0) {
          canvas.getActiveObject()?.clone((cloned: FabricObject) => {
            canvas.clipboard = cloned
          })
          toast.success(`${selectedObjects.length} objeto(s) copiado(s)`)
        }
        break
      case 'paste':
        if (canvas?.clipboard) {
          canvas.clipboard.clone((cloned: FabricObject) => {
            canvas.discardActiveObject()
            cloned.set({
              left: cloned.left + 10,
              top: cloned.top + 10,
              evented: true,
            })
            canvas.add(cloned)
            canvas.setActiveObject(cloned)
            canvas.requestRenderAll()
          })
          toast.success('Objeto colado')
        }
        break
      case 'select':
      case 'pan':
      case 'rectangle':
      case 'circle':
      case 'text':
      case 'image':
        setCurrentTool(action.id)
        toast.success(`Ferramenta ${action.label} selecionada`)
        break
      default:
        // Delegate to parent handler
        onAction?.(action.id)
    }
  }, [canvas, selectedObjects, onAction])

  // Filter actions by active category
  const visibleActions = actions.filter(action => 
    activeCategory === 'all' || action.category === activeCategory
  )

  return (
    <div 
      className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2"
      style={{ 
        backgroundColor: theme.colors.toolbar,
        borderColor: theme.colors.border,
        boxShadow: theme.shadows.medium
      }}
    >
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          {/* Category Pills */}
          <div className="flex items-center gap-1 mr-2">
            {['edit', 'zoom', 'align', 'layer', 'tools'].map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="h-7 px-2 text-xs capitalize"
              >
                {category === 'edit' ? 'Editar' :
                 category === 'zoom' ? 'Zoom' :
                 category === 'align' ? 'Alinhar' :
                 category === 'layer' ? 'Camada' :
                 'Ferramentas'}
              </Button>
            ))}
            <Separator orientation="vertical" className="h-6" />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {visibleActions.map((action, index) => (
              <React.Fragment key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === action.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleAction(action)}
                      disabled={action.disabled}
                      className="h-8 w-8 p-0 relative"
                      style={{
                        backgroundColor: currentTool === action.id ? theme.colors.accent : 'transparent',
                        color: currentTool === action.id ? 'white' : theme.colors.text
                      }}
                    >
                      {action.icon}
                      {action.badge && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                        >
                          {action.badge}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-center">
                      <div className="font-medium">{action.label}</div>
                      {action.shortcut && (
                        <div className="text-xs text-muted-foreground">
                          {action.shortcut}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                
                {/* Separator after certain groups */}
                {(index === 1 || index === 4 || index === 7 || index === 15) && (
                  <Separator orientation="vertical" className="h-6 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Zoom Level Display */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-xs font-mono">{Math.round(zoomLevel)}%</span>
            <Slider
              value={[zoomLevel]}
              onValueChange={([value]) => {
                if (canvas) {
                  canvas.setZoom(value / 100)
                }
              }}
              min={10}
              max={500}
              step={10}
              className="w-16"
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Utility Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowGrid(!showGrid)
                    onAction?.('toggle-grid', !showGrid)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grade</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showRulers ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowRulers(!showRulers)
                    onAction?.('toggle-rulers', !showRulers)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Ruler className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Réguas</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-8 w-8 p-0"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alternar Tema</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Export Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.('save')}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.('preview')}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Prévia</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction?.('export')}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Exportar</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Selection Info */}
        {selectedObjects.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedObjects.length} objeto(s) selecionado(s)</span>
              <span>Zoom: {Math.round(zoomLevel)}%</span>
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}

