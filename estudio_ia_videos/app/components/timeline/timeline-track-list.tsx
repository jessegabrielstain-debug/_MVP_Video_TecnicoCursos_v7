/**
 * Timeline Track List - Lista de tracks e layers na lateral
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { TimelineTrack, TimelineLayer, TimelineElement } from '@/lib/types/timeline-types'

interface TimelineTrackListProps {
  tracks: TimelineTrack[]
  onLayerClick: (layerId: string, event: React.MouseEvent) => void
  selectedLayers: string[]
  readOnly?: boolean
}

export const TimelineTrackList: React.FC<TimelineTrackListProps> = ({
  tracks,
  onLayerClick,
  selectedLayers,
  readOnly = false
}) => {
  const handleLayerToggleVisible = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (readOnly) return
    // TODO: Toggle layer visibility
  }

  const handleLayerToggleMute = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (readOnly) return
    // TODO: Toggle layer mute
  }

  const handleLayerToggleLock = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (readOnly) return
    // TODO: Toggle layer lock
  }

  const getTrackTypeColor = (type: string) => {
    switch (type) {
      case 'main':
        return 'border-blue-400'
      case 'audio':
        return 'border-green-400'
      case 'subtitle':
        return 'border-yellow-400'
      case 'effect':
        return 'border-purple-400'
      default:
        return 'border-gray-400'
    }
  }

  const getLayerTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 dark:bg-blue-900/20'
      case 'audio':
        return 'bg-green-100 dark:bg-green-900/20'
      case 'overlay':
        return 'bg-purple-100 dark:bg-purple-900/20'
      case 'subtitle':
        return 'bg-yellow-100 dark:bg-yellow-900/20'
      case '3d-scene':
        return 'bg-pink-100 dark:bg-pink-900/20'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="timeline-track-list w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {tracks.map((track) => (
        <div key={track.id} className="track-group border-b border-gray-200 dark:border-gray-700">
          {/* Track Header */}
          <div className={`track-header p-3 bg-white dark:bg-gray-900 border-l-4 ${getTrackTypeColor(track.type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {track.name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {track.type}
                </span>
              </div>
              
              {!readOnly && (
                <div className="flex items-center space-x-1">
                  <button
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Add layer"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Track settings"
                  >
                    <span className="text-xs">⚙️</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Layers */}
          <div className="layers">
            {track.layers.map((layer: TimelineLayer) => {
              const isSelected = selectedLayers.includes(layer.id)
              const isParentFolded = layer.parentId && tracks.some(t => 
                t.layers.some((l: TimelineLayer) => l.id === layer.parentId && l.folded)
              )

              if (isParentFolded) return null

              return (
                <motion.div
                  key={layer.id}
                  className={`layer-item p-2 cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
                    getLayerTypeColor(layer.type)
                  } ${
                    isSelected ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ height: `${layer.height}px`, minHeight: '40px' }}
                  onClick={(event) => onLayerClick(layer.id, event)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {/* Fold Toggle (if has children) */}
                      {track.layers.some((l: TimelineLayer) => l.parentId === layer.id) && (
                        <button className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                          {layer.folded ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}

                      {/* Layer Color */}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: layer.color }}
                      />

                      {/* Layer Name */}
                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                        {layer.name}
                      </span>

                      {/* Element Count */}
                      {layer.elements.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                          {layer.elements.length}
                        </span>
                      )}
                    </div>

                    {/* Layer Controls */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={(event) => handleLayerToggleVisible(layer.id, event)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-70 hover:opacity-100"
                        title={layer.visible ? "Hide layer" : "Show layer"}
                      >
                        {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>

                      {/* Mute button (for audio layers) */}
                      {(layer.type === 'audio' || layer.elements.some((el: TimelineElement) => el.type === 'audio')) && (
                        <button
                          onClick={(event) => handleLayerToggleMute(layer.id, event)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-70 hover:opacity-100"
                          title="Toggle mute"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}

                      <button
                        onClick={(event) => handleLayerToggleLock(layer.id, event)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-70 hover:opacity-100"
                        title={layer.locked ? "Unlock layer" : "Lock layer"}
                      >
                        {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>

                      {!readOnly && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5">
                          <button
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title="Duplicate layer"
                          >
                            <Copy size={10} />
                          </button>
                          <button
                            className="p-1 hover:bg-red-200 dark:hover:bg-red-600 rounded text-red-600"
                            title="Delete layer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer Type Indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-current opacity-30" />
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Add Track Button */}
      {!readOnly && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Plus size={16} className="mx-auto text-gray-500" />
            <span className="text-sm text-gray-500 block mt-1">Add Track</span>
          </button>
        </div>
      )}
    </div>
  )
}