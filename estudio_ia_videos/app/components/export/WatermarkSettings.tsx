/**
 * 🎨 Watermark Settings Component
 * UI for configuring video watermarks
 */

'use client'

import React, { useState, useRef } from 'react'
import {
  WatermarkConfig,
  WatermarkType,
  WatermarkPosition,
  WatermarkAnimation,
  DEFAULT_WATERMARK_PRESETS,
  DEFAULT_TEXT_STYLE,
  DEFAULT_PADDING,
  ImageWatermarkConfig,
  TextWatermarkConfig,
} from '@/types/watermark.types'

interface WatermarkSettingsProps {
  /** Current watermark configuration */
  config: WatermarkConfig | null
  
  /** Callback when config changes */
  onChange: (config: WatermarkConfig | null) => void
  
  /** Show in compact mode */
  compact?: boolean
}

export function WatermarkSettings({ config, onChange, compact = false }: WatermarkSettingsProps) {
  const [watermarkType, setWatermarkType] = useState<WatermarkType>(
    config?.type || WatermarkType.IMAGE
  )
  const [showPresets, setShowPresets] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle preset selection
  const handlePresetSelect = (preset: typeof DEFAULT_WATERMARK_PRESETS[0]) => {
    onChange(preset.config)
    setWatermarkType(preset.config.type)
    setShowPresets(false)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      
      const newConfig: ImageWatermarkConfig = {
        type: WatermarkType.LOGO,
        imageUrl,
        width: 150,
        height: 'auto',
        maintainAspectRatio: true,
        position: WatermarkPosition.BOTTOM_RIGHT,
        opacity: 0.7,
        padding: { ...DEFAULT_PADDING },
      }
      
      onChange(newConfig)
    }
    reader.readAsDataURL(file)
  }

  // Handle text watermark creation
  const handleCreateTextWatermark = () => {
    const newConfig: TextWatermarkConfig = {
      type: WatermarkType.TEXT,
      text: 'Sua Marca Aqui',
      style: { ...DEFAULT_TEXT_STYLE },
      position: WatermarkPosition.BOTTOM_RIGHT,
      opacity: 0.8,
      padding: { ...DEFAULT_PADDING },
    }
    
    onChange(newConfig)
    setWatermarkType(WatermarkType.TEXT)
  }

  // Handle config updates
  const updateConfig = <K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) => {
    if (!config) return
    onChange({ ...config, [key]: value })
  }

  // Handle opacity change
  const handleOpacityChange = (value: number) => {
    updateConfig('opacity', value / 100)
  }

  // Handle position change
  const handlePositionChange = (position: WatermarkPosition) => {
    updateConfig('position', position)
  }

  // Remove watermark
  const handleRemoveWatermark = () => {
    onChange(null)
  }

  if (!config) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Marca D'água</h3>
          <span className="text-xs text-gray-500">Desabilitado</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm"
          >
            📷 Adicionar Logo
          </button>
          
          <button
            onClick={handleCreateTextWatermark}
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition text-sm"
          >
            📝 Adicionar Texto
          </button>
        </div>

        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        >
          ⭐ Escolher Preset
        </button>

        {showPresets && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {DEFAULT_WATERMARK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition"
              >
                <div className="font-semibold text-sm">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Marca D'água</h3>
        <button
          onClick={handleRemoveWatermark}
          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
        >
          🗑️ Remover
        </button>
      </div>

      {/* Type indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
          {config.type === WatermarkType.TEXT ? '📝 Texto' : '📷 Imagem'}
        </span>
      </div>

      {/* Text Content (if text watermark) */}
      {config.type === WatermarkType.TEXT && (
        <div>
          <label className="block text-xs font-medium mb-1">Texto</label>
          <input
            type="text"
            value={config.text}
            onChange={(e) => {
              const newConfig = { ...config, text: e.target.value } as TextWatermarkConfig
              onChange(newConfig)
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            placeholder="Digite o texto..."
          />
        </div>
      )}

      {/* Font Size (if text watermark) */}
      {config.type === WatermarkType.TEXT && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Tamanho da Fonte: {config.style.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="72"
            value={config.style.fontSize}
            onChange={(e) => {
              const newStyle = { ...config.style, fontSize: parseInt(e.target.value) }
              onChange({ ...config, style: newStyle })
            }}
            className="w-full"
          />
        </div>
      )}

      {/* Position */}
      <div>
        <label className="block text-xs font-medium mb-2">Posição</label>
        <div className="grid grid-cols-3 gap-1">
          {[
            WatermarkPosition.TOP_LEFT,
            WatermarkPosition.TOP_CENTER,
            WatermarkPosition.TOP_RIGHT,
            WatermarkPosition.CENTER_LEFT,
            WatermarkPosition.CENTER,
            WatermarkPosition.CENTER_RIGHT,
            WatermarkPosition.BOTTOM_LEFT,
            WatermarkPosition.BOTTOM_CENTER,
            WatermarkPosition.BOTTOM_RIGHT,
          ].map((position) => (
            <button
              key={position}
              onClick={() => handlePositionChange(position)}
              className={`
                p-2 text-xs rounded transition
                ${
                  config.position === position
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {position.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Opacidade: {Math.round(config.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(config.opacity * 100)}
          onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Width (if image watermark) */}
      {(config.type === WatermarkType.IMAGE || config.type === WatermarkType.LOGO) &&
        config.width !== 'auto' && (
          <div>
            <label className="block text-xs font-medium mb-1">
              Largura: {config.width}px
            </label>
            <input
              type="range"
              min="50"
              max="500"
              value={config.width}
              onChange={(e) => {
                const newConfig = { ...config, width: parseInt(e.target.value) } as ImageWatermarkConfig
                onChange(newConfig)
              }}
              className="w-full"
            />
          </div>
        )}

      {/* Padding */}
      {!compact && (
        <div>
          <label className="block text-xs font-medium mb-2">Margens</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={config.padding.top}
                onChange={(e) => {
                  const newPadding = { ...config.padding, top: parseInt(e.target.value) || 0 }
                  updateConfig('padding', newPadding)
                }}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder="Top"
              />
            </div>
            <div>
              <input
                type="number"
                value={config.padding.right}
                onChange={(e) => {
                  const newPadding = { ...config.padding, right: parseInt(e.target.value) || 0 }
                  updateConfig('padding', newPadding)
                }}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder="Right"
              />
            </div>
            <div>
              <input
                type="number"
                value={config.padding.bottom}
                onChange={(e) => {
                  const newPadding = { ...config.padding, bottom: parseInt(e.target.value) || 0 }
                  updateConfig('padding', newPadding)
                }}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder="Bottom"
              />
            </div>
            <div>
              <input
                type="number"
                value={config.padding.left}
                onChange={(e) => {
                  const newPadding = { ...config.padding, left: parseInt(e.target.value) || 0 }
                  updateConfig('padding', newPadding)
                }}
                className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs"
                placeholder="Left"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-gray-900 rounded-lg p-4 aspect-video relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-2">🎬</div>
            <div className="text-xs">Preview do Vídeo</div>
          </div>
        </div>
        
        {/* Watermark preview */}
        <div
          className="absolute text-white text-sm"
          style={{
            opacity: config.opacity,
            ...getPreviewPosition(config.position, config.padding),
          }}
        >
          {config.type === WatermarkType.TEXT ? (
            <span style={{ fontSize: `${config.style.fontSize / 4}px` }}>
              {config.text}
            </span>
          ) : (
            <div className="bg-white/50 px-2 py-1 rounded text-xs">Logo</div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Get preview position styles
 */
function getPreviewPosition(
  position: WatermarkPosition,
  padding: { top: number; right: number; bottom: number; left: number }
) {
  const styles: React.CSSProperties = {}

  switch (position) {
    case WatermarkPosition.TOP_LEFT:
      styles.top = `${padding.top / 4}px`
      styles.left = `${padding.left / 4}px`
      break
    case WatermarkPosition.TOP_CENTER:
      styles.top = `${padding.top / 4}px`
      styles.left = '50%'
      styles.transform = 'translateX(-50%)'
      break
    case WatermarkPosition.TOP_RIGHT:
      styles.top = `${padding.top / 4}px`
      styles.right = `${padding.right / 4}px`
      break
    case WatermarkPosition.CENTER_LEFT:
      styles.top = '50%'
      styles.left = `${padding.left / 4}px`
      styles.transform = 'translateY(-50%)'
      break
    case WatermarkPosition.CENTER:
      styles.top = '50%'
      styles.left = '50%'
      styles.transform = 'translate(-50%, -50%)'
      break
    case WatermarkPosition.CENTER_RIGHT:
      styles.top = '50%'
      styles.right = `${padding.right / 4}px`
      styles.transform = 'translateY(-50%)'
      break
    case WatermarkPosition.BOTTOM_LEFT:
      styles.bottom = `${padding.bottom / 4}px`
      styles.left = `${padding.left / 4}px`
      break
    case WatermarkPosition.BOTTOM_CENTER:
      styles.bottom = `${padding.bottom / 4}px`
      styles.left = '50%'
      styles.transform = 'translateX(-50%)'
      break
    case WatermarkPosition.BOTTOM_RIGHT:
      styles.bottom = `${padding.bottom / 4}px`
      styles.right = `${padding.right / 4}px`
      break
  }

  return styles
}
