/**
 * Timeline Toolbar - Enhanced Professional Controls
 * Advanced controls for professional video editing with improved UX
 */

'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTimelineStore } from '@/lib/stores/timeline-store'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Share2,
  Download,
  Upload,
  Clock,
  Layers,
  Eye,
  EyeOff,
  LayoutGrid,
  Save,
  FolderOpen
} from 'lucide-react'

interface TimelineToolbarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoomLevel: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport?: (format: string) => void;
  onImport?: (file: File) => void;
  onZoomChange: (delta: number) => void
  onShowKeyframes: () => void
  showKeyframes: boolean
  readOnly?: boolean
  onPlayPause: () => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  onPlayPause,
  onZoomChange,
  onShowKeyframes,
  showKeyframes,
  readOnly = false
}) => {
  const {
    currentTime,
    isPlaying,
    duration,
    volume,
    zoom,
    canUndo,
    canRedo,
    project,
    setVolume,
    seekTo,
    stop,
    undo,
    redo,
    zoomToFit,
    saveProject,
    addRenderJob
  } = useTimelineStore()

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const frames = Math.floor((time % 1) * (project?.framerate || 30))
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const handleExport = () => {
    if (!project || readOnly) return

    addRenderJob({
      projectId: project.id,
      // @ts-ignore
      settings: {
        format: 'mp4',
        resolution: project.resolution,
        framerate: project.framerate,
        quality: 'good',
        codec: 'h264',
        audio: {
          codec: 'aac',
          bitrate: 128,
          sampleRate: 44100
        }
      } as any,
      status: 'queued',
      progress: 0
    })
  }

  return (
    <div className="timeline-toolbar flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Playback Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => seekTo(0)}
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go to start"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={onPlayPause}
          disabled={readOnly}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={stop}
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Stop"
        >
          <Square size={16} />
        </button>

        <button
          onClick={() => seekTo(duration)}
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Go to end"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Time Display */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm font-mono">
          <Clock size={14} className="text-gray-500" />
          <span className="text-blue-600 dark:text-blue-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-600 dark:text-gray-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Volume2 size={14} className="text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            disabled={readOnly}
            className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="text-xs text-gray-500 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onZoomChange(-0.2)}
          disabled={readOnly || zoom <= 0.1}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(0.2)}
          disabled={readOnly || zoom >= 10}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={zoomToFit}
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Fit to timeline"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* View Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onShowKeyframes}
          disabled={readOnly}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            showKeyframes ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
          }`}
          title="Toggle keyframes panel"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2">
        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={readOnly || !canUndo}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <motion.div
            whileHover={{ rotate: -15 }}
            whileTap={{ scale: 0.9 }}
          >
            ↶
          </motion.div>
        </button>

        <button
          onClick={redo}
          disabled={readOnly || !canRedo}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <motion.div
            whileHover={{ rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            ↷
          </motion.div>
        </button>

        {/* Save */}
        <button
          onClick={saveProject}
          disabled={readOnly}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save project"
        >
          Save
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={readOnly}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          title="Export video"
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        {/* Share */}
        <button
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Share project"
        >
          <Share2 size={16} />
        </button>

        {/* Settings */}
        <button
          disabled={readOnly}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Timeline settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}