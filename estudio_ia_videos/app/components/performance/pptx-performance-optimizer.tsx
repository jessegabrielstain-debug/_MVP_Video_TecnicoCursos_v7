'use client'

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { FixedSizeList as List, VariableSizeList } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Type,
  Image as ImageIcon,
  Video,
  Mic,
  Clock,
  Zap,
  Activity,
  BarChart3,
  TrendingUp,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'

// Performance monitoring types
interface PerformanceMetrics {
  frameRate: number
  memoryUsage: number
  cpuUsage: number
  renderTime: number
  bundleSizes: {
    main: number
    chunks: number[]
  }
  loadTime: number
  interactionTime: number
  cumulativeLayoutShift: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

interface Slide {
  id: string
  title: string
  duration: number
  content: string
}

interface TimelineItem {
  id: string
  name: string
  type: string
  duration: number
  size: number
  startTime: number
}

interface Asset {
  id: string
  name: string
  type: string
  url: string
  thumbnail?: string
  size: number
}

interface OptimizedComponentProps {
  id: string
  data: unknown[]
  onSelectionChange?: (selection: string[]) => void
  renderItem: (item: unknown, index: number) => React.ReactNode
  itemHeight?: number | ((index: number) => number)
  overscan?: number
  enableVirtualization?: boolean
  enableLazyLoading?: boolean
  chunkSize?: number
}

// Memoized Timeline Item Component
const TimelineItemMemo = memo<{
  item: TimelineItem
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  style?: React.CSSProperties
}>(({ item, index, isSelected, onSelect, style }) => {
  const handleClick = useCallback(() => {
    onSelect(item.id)
  }, [item.id, onSelect])

  return (
    <div style={style}>
      <motion.div
        className={`p-2 border rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
        }`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0" />
          <span className="text-sm font-medium truncate">{item.name}</span>
          <Badge variant="outline" className="ml-auto">
            {item.type}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {item.duration}s • {item.size}KB
        </div>
      </motion.div>
    </div>
  )
})

TimelineItemMemo.displayName = 'TimelineItemMemo'

// Virtualized List Component
const VirtualizedTimelineList = memo<{
  items: TimelineItem[]
  selectedItems: Set<string>
  onSelectionChange: (id: string) => void
  height: number
  itemHeight: number
}>(({ items, selectedItems, onSelectionChange, height, itemHeight }) => {
  const listRef = useRef<List>(null)

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
    if (!item) return null

    return (
      <TimelineItemMemo
        key={item.id}
        item={item}
        index={index}
        isSelected={selectedItems.has(item.id)}
        onSelect={onSelectionChange}
        style={style}
      />
    )
  }, [items, selectedItems, onSelectionChange])

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={5}
      className="scrollbar-thin"
    >
      {Row}
    </List>
  )
})

VirtualizedTimelineList.displayName = 'VirtualizedTimelineList'

// Lazy Loading Image Component
const LazyImage = memo<{
  src: string
  alt: string
  className?: string
  onLoad?: () => void
}>(({ src, alt, className, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  )
})

LazyImage.displayName = 'LazyImage'

// Performance Monitor Component
const PerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 60,
    memoryUsage: 45,
    cpuUsage: 23,
    renderTime: 16.7,
    bundleSizes: {
      main: 2.1,
      chunks: [0.8, 0.5, 0.3]
    },
    loadTime: 1200,
    interactionTime: 150,
    cumulativeLayoutShift: 0.02,
    firstContentfulPaint: 800,
    largestContentfulPaint: 1100
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // Simulate performance monitoring
      setMetrics(prev => ({
        ...prev,
        frameRate: Math.max(30, Math.min(60, prev.frameRate + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 10)),
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 15)),
        renderTime: Math.max(8, Math.min(33, prev.renderTime + (Math.random() - 0.5) * 5))
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500'
    if (value <= thresholds.warning) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getMetricIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (value <= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Activity className="mr-2 h-4 w-4" />
            Performance Monitor
          </CardTitle>
          <Button
            size="sm"
            variant={isMonitoring ? "default" : "outline"}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Pause' : 'Start'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Frame Rate</span>
              {getMetricIcon(60 - metrics.frameRate, { good: 10, warning: 20 })}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={(metrics.frameRate / 60) * 100} className="flex-1" />
              <span className={`text-xs font-mono ${getMetricColor(60 - metrics.frameRate, { good: 10, warning: 20 })}`}>
                {metrics.frameRate.toFixed(1)} fps
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Memory</span>
              {getMetricIcon(metrics.memoryUsage, { good: 50, warning: 70 })}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={metrics.memoryUsage} className="flex-1" />
              <span className={`text-xs font-mono ${getMetricColor(metrics.memoryUsage, { good: 50, warning: 70 })}`}>
                {metrics.memoryUsage.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">CPU Usage</span>
              {getMetricIcon(metrics.cpuUsage, { good: 30, warning: 60 })}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={metrics.cpuUsage} className="flex-1" />
              <span className={`text-xs font-mono ${getMetricColor(metrics.cpuUsage, { good: 30, warning: 60 })}`}>
                {metrics.cpuUsage.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Render Time</span>
              {getMetricIcon(metrics.renderTime, { good: 16.7, warning: 25 })}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={(metrics.renderTime / 33) * 100} className="flex-1" />
              <span className={`text-xs font-mono ${getMetricColor(metrics.renderTime, { good: 16.7, warning: 25 })}`}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Core Web Vitals
          </h4>
          
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="text-center p-2 rounded bg-muted">
              <div className="font-mono text-sm">
                {metrics.firstContentfulPaint}ms
              </div>
              <div className="text-muted-foreground">FCP</div>
            </div>
            
            <div className="text-center p-2 rounded bg-muted">
              <div className="font-mono text-sm">
                {metrics.largestContentfulPaint}ms
              </div>
              <div className="text-muted-foreground">LCP</div>
            </div>
            
            <div className="text-center p-2 rounded bg-muted">
              <div className="font-mono text-sm">
                {metrics.cumulativeLayoutShift.toFixed(3)}
              </div>
              <div className="text-muted-foreground">CLS</div>
            </div>
          </div>
        </div>

        {/* Bundle Analysis */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <HardDrive className="mr-2 h-4 w-4" />
            Bundle Analysis
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Main Bundle</span>
              <span className="font-mono">{metrics.bundleSizes.main.toFixed(1)}MB</span>
            </div>
            
            {metrics.bundleSizes.chunks.map((size, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span>Chunk {index + 1}</span>
                <span className="font-mono">{size.toFixed(1)}MB</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Performance Tips</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start space-x-2">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
              <span>Use virtualization for large lists (&gt;100 items)</span>
            </div>
            <div className="flex items-start space-x-2">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
              <span>Implement lazy loading for images and videos</span>
            </div>
            <div className="flex items-start space-x-2">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
              <span>Use React.memo for expensive components</span>
            </div>
            <div className="flex items-start space-x-2">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
              <span>Debounce user interactions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

// Optimized Editor Component
interface OptimizedPPTXEditorProps {
  slides: Slide[]
  timeline: TimelineItem[]
  assets: Asset[]
  onSlideChange?: (slideId: string) => void
  onTimelineUpdate?: (timeline: TimelineItem[]) => void
}

const OptimizedPPTXEditor = memo<OptimizedPPTXEditorProps>(({
  slides,
  timeline,
  assets,
  onSlideChange,
  onTimelineUpdate
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [viewportHeight, setViewportHeight] = useState(400)
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoized handlers
  const handleSelectionChange = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleSlideSelect = useCallback((slideId: string) => {
    onSlideChange?.(slideId)
  }, [onSlideChange])

  // Memoized computed values
  const sortedTimeline = useMemo(() => {
    return [...timeline].sort((a, b) => a.startTime - b.startTime)
  }, [timeline])

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => asset.type === 'image' || asset.type === 'video')
  }, [assets])

  // Performance-optimized render functions
  const renderSlideItem = useCallback((item: Slide, index: number) => (
    <motion.div
      key={item.id}
      className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
      onClick={() => handleSlideSelect(item.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
        <Type className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium truncate">{item.title}</h3>
      <p className="text-xs text-muted-foreground">{item.duration}s</p>
    </motion.div>
  ), [handleSlideSelect])

  const renderAssetItem = useCallback((item: Asset, index: number) => (
    <div key={item.id} className="relative group">
      <LazyImage
        src={item.thumbnail || item.url}
        alt={item.name}
        className="w-full aspect-square object-cover rounded"
        onLoad={() => logger.debug(`Asset ${item.id} loaded`, { component: 'PPTXPerformanceOptimizer' })}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded" />
      <div className="absolute bottom-1 left-1 right-1">
        <Badge variant="secondary" className="text-xs truncate">
          {item.name}
        </Badge>
      </div>
    </div>
  ), [])

  // Update viewport height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setViewportHeight(Math.max(400, window.innerHeight - rect.top - 100))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  return (
    <div ref={containerRef} className="grid grid-cols-4 gap-4 h-full">
      {/* Slides Panel */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Slides ({slides.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea style={{ height: viewportHeight - 120 }}>
            <div className="space-y-2">
              {slides.map((slide, index) => renderSlideItem(slide, index))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Timeline Panel */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Timeline ({timeline.length} items)</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <VirtualizedTimelineList
            items={sortedTimeline}
            selectedItems={selectedItems}
            onSelectionChange={handleSelectionChange}
            height={viewportHeight - 120}
            itemHeight={60}
          />
        </CardContent>
      </Card>

      {/* Assets Panel */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-sm">Assets ({filteredAssets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea style={{ height: viewportHeight - 120 }}>
            <div className="grid grid-cols-2 gap-2">
              {filteredAssets.map((asset, index) => renderAssetItem(asset, index))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
})

OptimizedPPTXEditor.displayName = 'OptimizedPPTXEditor'

// Main Performance-Optimized Component
interface PPTXPerformanceOptimizerProps {
  projectId: string
  initialData?: {
    slides: Slide[]
    timeline: TimelineItem[]
    assets: Asset[]
  }
  showPerformanceMonitor?: boolean
}

export default function PPTXPerformanceOptimizer({
  projectId,
  initialData = { slides: [], timeline: [], assets: [] },
  showPerformanceMonitor = true
}: PPTXPerformanceOptimizerProps) {
  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  // Optimized data loading with chunking
  const loadData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Simulate chunked data loading
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate mock data for demonstration
      const slides: Slide[] = Array.from({ length: 20 }, (_, i) => ({
        id: `slide-${i}`,
        title: `Slide ${i + 1}`,
        duration: Math.floor(Math.random() * 10) + 3,
        content: `Content for slide ${i + 1}`
      }))

      const timeline: TimelineItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `timeline-${i}`,
        name: `Timeline Item ${i + 1}`,
        type: ['video', 'audio', 'text', 'image'][Math.floor(Math.random() * 4)],
        duration: Math.floor(Math.random() * 5) + 1,
        size: Math.floor(Math.random() * 1000) + 100,
        startTime: i * 2
      }))

      const assets: Asset[] = Array.from({ length: 50 }, (_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i + 1}`,
        type: ['image', 'video'][Math.floor(Math.random() * 2)],
        url: `/assets/placeholder-${i}.jpg`,
        thumbnail: `/assets/thumb-${i}.jpg`,
        size: Math.floor(Math.random() * 5000) + 500
      }))

      setData({ slides, timeline, assets })
      toast.success('Data loaded with performance optimizations')
      
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading with performance optimizations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor />
      )}

      {/* Optimized Editor */}
      <OptimizedPPTXEditor
        slides={data.slides}
        timeline={data.timeline}
        assets={data.assets}
        onSlideChange={(slideId) => logger.debug('Slide changed:', { slideId, component: 'PPTXPerformanceOptimizer' })}
        onTimelineUpdate={(timeline) => logger.debug('Timeline updated:', { length: timeline.length, component: 'PPTXPerformanceOptimizer' })}
      />

      {/* Performance Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">99%</div>
              <div className="text-xs text-muted-foreground">Performance Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{data.slides.length}</div>
              <div className="text-xs text-muted-foreground">Slides Optimized</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">{data.timeline.length}</div>
              <div className="text-xs text-muted-foreground">Timeline Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">2.1MB</div>
              <div className="text-xs text-muted-foreground">Bundle Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}