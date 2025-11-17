
'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { 
  Download, Settings, Film, Upload, Check, X, Clock, 
  Play, Pause, Volume2, Monitor, Smartphone, Tablet,
  FileVideo, FileImage, Music, Share2, Eye, Save
} from 'lucide-react'

interface ExportJob {
  id: string
  name: string
  format: string
  quality: string
  resolution: string
  fps: number
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  estimatedTime?: number
  fileSize?: string
  downloadUrl?: string
  createdAt: Date
}

interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif' | 'png_sequence' | 'jpeg_sequence'
  quality: 'high' | 'medium' | 'low' | 'custom'
  resolution: '4k' | '1080p' | '720p' | '480p' | 'custom'
  customWidth?: number
  customHeight?: number
  fps: number
  bitrate?: number
  audioCodec: 'aac' | 'mp3' | 'opus'
  videoCodec: 'h264' | 'h265' | 'vp9'
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow'
  crf: number
  includeAudio: boolean
  audioQuality: number
}

const ProfessionalExportPipeline: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [selectedPreset, setSelectedPreset] = useState<'web' | 'mobile' | 'presentation' | 'social' | 'custom'>('web')
  
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: 'high',
    resolution: '1080p',
    fps: 30,
    bitrate: 5000,
    audioCodec: 'aac',
    videoCodec: 'h264',
    preset: 'medium',
    crf: 20,
    includeAudio: true,
    audioQuality: 128
  })

  const isFormatValue = (value: string): value is ExportSettings['format'] => {
    return value === 'mp4' || value === 'webm' || value === 'gif' || value === 'png_sequence' || value === 'jpeg_sequence'
  }

  const isQualityValue = (value: string): value is ExportSettings['quality'] => {
    return value === 'high' || value === 'medium' || value === 'low' || value === 'custom'
  }

  const isResolutionValue = (value: string): value is ExportSettings['resolution'] => {
    return value === '4k' || value === '1080p' || value === '720p' || value === '480p' || value === 'custom'
  }

  const isVideoCodecValue = (value: string): value is ExportSettings['videoCodec'] => {
    return value === 'h264' || value === 'h265' || value === 'vp9'
  }

  const isPresetValue = (value: string): value is ExportSettings['preset'] => {
    return value === 'ultrafast' || value === 'fast' || value === 'medium' || value === 'slow' || value === 'veryslow'
  }

  const isAudioCodecValue = (value: string): value is ExportSettings['audioCodec'] => {
    return value === 'aac' || value === 'mp3' || value === 'opus'
  }
  
  // Preset configurations
  const presets = {
    web: {
      name: 'Web Optimized',
      description: 'Best for web playback and streaming',
      icon: <Monitor className="h-4 w-4" />,
      settings: {
        format: 'mp4' as const,
        quality: 'high' as const,
        resolution: '1080p' as const,
        fps: 30,
        bitrate: 3000,
        videoCodec: 'h264' as const,
        preset: 'medium' as const,
        crf: 23
      }
    },
    mobile: {
      name: 'Mobile Friendly',
      description: 'Optimized for mobile devices',
      icon: <Smartphone className="h-4 w-4" />,
      settings: {
        format: 'mp4' as const,
        quality: 'medium' as const,
        resolution: '720p' as const,
        fps: 30,
        bitrate: 1500,
        videoCodec: 'h264' as const,
        preset: 'fast' as const,
        crf: 26
      }
    },
    presentation: {
      name: 'Presentation',
      description: 'High quality for presentations',
      icon: <Monitor className="h-4 w-4" />,
      settings: {
        format: 'mp4' as const,
        quality: 'high' as const,
        resolution: '1080p' as const,
        fps: 30,
        bitrate: 8000,
        videoCodec: 'h264' as const,
        preset: 'slow' as const,
        crf: 18
      }
    },
    social: {
      name: 'Social Media',
      description: 'Optimized for social platforms',
      icon: <Share2 className="h-4 w-4" />,
      settings: {
        format: 'mp4' as const,
        quality: 'medium' as const,
        resolution: '1080p' as const,
        fps: 30,
        bitrate: 2500,
        videoCodec: 'h264' as const,
        preset: 'fast' as const,
        crf: 24
      }
    },
    custom: {
      name: 'Custom',
      description: 'Configure your own settings',
      icon: <Settings className="h-4 w-4" />,
      settings: settings
    }
  }
  
  // Apply preset
  const applyPreset = (preset: keyof typeof presets) => {
    if (preset === 'custom') return
    
    setSettings(prev => ({
      ...prev,
      ...presets[preset].settings
    }))
    setSelectedPreset(preset)
  }
  
  // Get resolution dimensions
  const getResolutionDimensions = (resolution: string) => {
    switch (resolution) {
      case '4k': return { width: 3840, height: 2160 }
      case '1080p': return { width: 1920, height: 1080 }
      case '720p': return { width: 1280, height: 720 }
      case '480p': return { width: 854, height: 480 }
      case 'custom': return { width: settings.customWidth || 1920, height: settings.customHeight || 1080 }
      default: return { width: 1920, height: 1080 }
    }
  }
  
  // Estimate file size
  const estimateFileSize = (durationSeconds: number): string => {
    const bitrate = settings.bitrate || 5000
    const audioRate = settings.includeAudio ? (settings.audioQuality || 128) : 0
    const totalBitrate = bitrate + audioRate
    const sizeBytes = (totalBitrate * 1000 * durationSeconds) / 8
    
    if (sizeBytes < 1024 * 1024) {
      return `${Math.round(sizeBytes / 1024)} KB`
    } else if (sizeBytes < 1024 * 1024 * 1024) {
      return `${Math.round(sizeBytes / (1024 * 1024))} MB`
    } else {
      return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
  }
  
  // Start export
  const startExport = useCallback(async () => {
    setIsExporting(true)
    
    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      name: `Training Video Export`,
      format: settings.format,
      quality: settings.quality,
      resolution: settings.resolution,
      fps: settings.fps,
      status: 'processing',
      progress: 0,
      estimatedTime: 120, // 2 minutes
      createdAt: new Date()
    }
    
    setExportJobs(prev => [...prev, newJob])
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.status === 'processing') {
          const newProgress = Math.min(job.progress + Math.random() * 10, 100)
          
          if (newProgress >= 100) {
            return {
              ...job,
              status: 'completed',
              progress: 100,
              fileSize: estimateFileSize(60), // Assume 1 minute video
              downloadUrl: `/exports/${job.id}.${settings.format}`
            }
          }
          
          return { ...job, progress: newProgress }
        }
        return job
      }))
    }, 500)
    
    // Stop simulation after completion
    setTimeout(() => {
      clearInterval(interval)
      setIsExporting(false)
    }, 12000)
    
  }, [settings, exportJobs])
  
  // Download exported file
  const downloadFile = (job: ExportJob) => {
    if (job.downloadUrl) {
      // In real implementation, this would trigger actual download
      console.log('Downloading:', job.downloadUrl)
    }
  }
  
  // Preview settings
  const previewSettings = () => {
    const dimensions = getResolutionDimensions(settings.resolution)
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Format:</span>
          <span>{settings.format.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Resolution:</span>
          <span>{dimensions.width} × {dimensions.height}</span>
        </div>
        <div className="flex justify-between">
          <span>Frame Rate:</span>
          <span>{settings.fps} fps</span>
        </div>
        <div className="flex justify-between">
          <span>Video Codec:</span>
          <span>{settings.videoCodec.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Bitrate:</span>
          <span>{settings.bitrate} kbps</span>
        </div>
        {settings.includeAudio && (
          <div className="flex justify-between">
            <span>Audio:</span>
            <span>{settings.audioCodec.toUpperCase()} @ {settings.audioQuality} kbps</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Est. File Size:</span>
          <span>{estimateFileSize(60)}</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex h-full">
      {/* Settings Panel */}
      <div className="w-96 bg-white dark:bg-gray-800 border-r overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Export Settings</h2>
          
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-4">
              {/* Preset Selection */}
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(presets) as Array<keyof typeof presets>).map(preset => (
                  <Card
                    key={preset}
                    className={`cursor-pointer transition-colors ${
                      selectedPreset === preset 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {presets[preset].icon}
                      </div>
                      <div className="font-medium text-sm">{presets[preset].name}</div>
                      <div className="text-xs text-gray-500 mt-1">{presets[preset].description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Quick Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Output Format</Label>
                  <select
                    value={settings.format}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isFormatValue(value)) {
                        setSettings(prev => ({ ...prev, format: value }))
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                  >
                    <option value="mp4">MP4 (Recommended)</option>
                    <option value="webm">WebM</option>
                    <option value="gif">GIF Animation</option>
                    <option value="png_sequence">PNG Sequence</option>
                  </select>
                </div>
                
                <div>
                  <Label>Quality</Label>
                  <select
                    value={settings.quality}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isQualityValue(value)) {
                        setSettings(prev => ({ ...prev, quality: value }))
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                  >
                    <option value="high">High Quality</option>
                    <option value="medium">Medium Quality</option>
                    <option value="low">Low Quality (Faster)</option>
                  </select>
                </div>
                
                <div>
                  <Label>Resolution</Label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isResolutionValue(value)) {
                        setSettings(prev => ({ ...prev, resolution: value }))
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                  >
                    <option value="4k">4K Ultra HD (3840×2160)</option>
                    <option value="1080p">Full HD (1920×1080)</option>
                    <option value="720p">HD (1280×720)</option>
                    <option value="480p">SD (854×480)</option>
                  </select>
                </div>
                
                <div>
                  <Label>Frame Rate</Label>
                  <select
                    value={settings.fps}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10)
                      if (!Number.isNaN(value)) {
                        setSettings(prev => ({ ...prev, fps: value }))
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                  >
                    <option value="24">24 fps (Cinematic)</option>
                    <option value="30">30 fps (Standard)</option>
                    <option value="60">60 fps (Smooth)</option>
                  </select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label>Video Codec</Label>
                <select
                  value={settings.videoCodec}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isVideoCodecValue(value)) {
                      setSettings(prev => ({ ...prev, videoCodec: value }))
                    }
                  }}
                  className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                >
                  <option value="h264">H.264 (Compatible)</option>
                  <option value="h265">H.265 (Efficient)</option>
                  <option value="vp9">VP9 (Open Source)</option>
                </select>
              </div>
              
              <div>
                <Label>Bitrate (kbps)</Label>
                <Slider
                  value={[settings.bitrate || 5000]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, bitrate: value }))}
                  min={500}
                  max={20000}
                  step={500}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">{settings.bitrate} kbps</div>
              </div>
              
              <div>
                <Label>CRF (Quality)</Label>
                <Slider
                  value={[settings.crf]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, crf: value }))}
                  min={0}
                  max={51}
                  step={1}
                  className="mt-2"
                />
                <div className="text-sm text-gray-500 mt-1">
                  CRF {settings.crf} ({settings.crf < 18 ? 'Lossless' : settings.crf < 23 ? 'High' : settings.crf < 28 ? 'Medium' : 'Low'} Quality)
                </div>
              </div>
              
              <div>
                <Label>Encoding Speed</Label>
                <select
                  value={settings.preset}
                  onChange={(e) => {
                    const value = e.target.value
                    if (isPresetValue(value)) {
                      setSettings(prev => ({ ...prev, preset: value }))
                    }
                  }}
                  className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                >
                  <option value="ultrafast">Ultra Fast (Lower Quality)</option>
                  <option value="fast">Fast</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="slow">Slow (Better Quality)</option>
                  <option value="veryslow">Very Slow (Best Quality)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAudio"
                  checked={settings.includeAudio}
                  onChange={(e) => setSettings({...settings, includeAudio: e.target.checked})}
                />
                <Label htmlFor="includeAudio">Include Audio</Label>
              </div>
              
              {settings.includeAudio && (
                <>
                  <div>
                    <Label>Audio Codec</Label>
                    <select
                        value={settings.audioCodec}
                        onChange={(e) => {
                          const value = e.target.value
                          if (isAudioCodecValue(value)) {
                            setSettings(prev => ({ ...prev, audioCodec: value }))
                          }
                        }}
                      className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                    >
                      <option value="aac">AAC (Recommended)</option>
                      <option value="mp3">MP3</option>
                      <option value="opus">Opus</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Audio Quality (kbps)</Label>
                    <Slider
                      value={[settings.audioQuality]}
                      onValueChange={([value]) => setSettings({...settings, audioQuality: value})}
                      min={64}
                      max={320}
                      step={32}
                      className="mt-2"
                    />
                    <div className="text-sm text-gray-500 mt-1">{settings.audioQuality} kbps</div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {previewSettings()}
            </CardContent>
          </Card>
          
          {/* Export Button */}
          <Button
            className="w-full mt-6"
            onClick={startExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </div>
      </div>
      
      {/* Export Queue and Preview */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="queue" className="h-full">
          <div className="border-b">
            <TabsList className="m-4">
              <TabsTrigger value="queue">Export Queue</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="queue" className="flex-1 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Export Queue</h3>
                {exportJobs.length > 0 && (
                  <Button size="sm" variant="outline">
                    Clear Completed
                  </Button>
                )}
              </div>
              
              {exportJobs.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Film className="h-12 w-12 mx-auto" />
                  </div>
                  <h4 className="font-medium text-gray-600 dark:text-gray-300 mb-2">
                    No exports yet
                  </h4>
                  <p className="text-sm text-gray-500">
                    Configure your settings and start your first export
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {exportJobs.map(job => (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              job.status === 'completed' ? 'bg-green-500' :
                              job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                              job.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <h4 className="font-medium">{job.name}</h4>
                              <div className="text-sm text-gray-500">
                                {job.format.toUpperCase()} • {job.resolution} • {job.fps}fps
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {job.status === 'completed' && job.downloadUrl && (
                              <Button size="sm" onClick={() => downloadFile(job)}>
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            
                            {job.status === 'processing' && (
                              <Button size="sm" variant="outline">
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {job.status === 'processing' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Progress</span>
                              <span>{Math.round(job.progress)}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                            {job.estimatedTime && (
                              <div className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Estimated time remaining: {Math.round((100 - job.progress) / 100 * job.estimatedTime / 60)} minutes
                              </div>
                            )}
                          </div>
                        )}
                        
                        {job.status === 'completed' && (
                          <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                            <div className="flex items-center">
                              <Check className="h-4 w-4 mr-1" />
                              Export completed
                            </div>
                            {job.fileSize && <span>File size: {job.fileSize}</span>}
                          </div>
                        )}
                        
                        {job.status === 'failed' && (
                          <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                            <X className="h-4 w-4 mr-1" />
                            Export failed
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 p-6">
            <div className="h-full flex items-center justify-center">
              <Card className="p-8 text-center max-w-md">
                <div className="text-gray-400 mb-4">
                  <Eye className="h-12 w-12 mx-auto" />
                </div>
                <h4 className="font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Preview Coming Soon
                </h4>
                <p className="text-sm text-gray-500">
                  Real-time preview of your video will be available here
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProfessionalExportPipeline
