/**
 * 🌐 CDN Integration - Content Delivery Network management
 * Professional CDN integration with multi-provider support and optimization
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Globe, 
  Zap, 
  Activity, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Clock, 
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  Server,
  Shield,
  Image,
  Video,
  FileText,
  Download,
  Upload,
  Copy,
  ExternalLink,
  Target,
  Gauge,
  Timer,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Trash2,
  Edit,
  Plus,
  X,
  Search,
  Filter,
  MoreHorizontal,
  LineChart,
  PieChart,
  Users,
  Database,
  HardDrive,
  Network,
  Layers,
  Package,
  Sparkles,
  Cpu,
  Memory,
  Route,
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// CDN Integration Types
interface CDNProvider {
  id: string;
  name: string;
  type: CDNType;
  status: CDNStatus;
  config: CDNConfig;
  usage: CDNUsage;
  performance: CDNPerformance;
  features: CDNFeature[];
  regions: CDNRegion[];
}

interface CDNConfig {
  domain: string;
  originUrl: string;
  sslEnabled: boolean;
  compressionEnabled: boolean;
  cacheControl: string;
  ttl: number;
  customHeaders: Record<string, string>;
  geoBlocking: GeoBlockingConfig;
  rateLimiting: RateLimitConfig;
}

interface GeoBlockingConfig {
  enabled: boolean;
  blockedCountries: string[];
  allowedCountries: string[];
  blockType: 'blacklist' | 'whitelist';
}

interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  windowSize: number;
}

interface CDNUsage {
  bandwidth: number;
  requests: number;
  cacheHitRatio: number;
  storage: number;
  edgeRequests: number;
  originRequests: number;
}

interface CDNPerformance {
  averageLatency: number;
  p95Latency: number;
  availability: number;
  errorRate: number;
  throughput: number;
  cacheEfficiency: number;
}

interface CDNRegion {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  latency: number;
  requests: number;
  bandwidth: number;
  cacheHitRatio: number;
}

interface CDNCacheRule {
  id: string;
  name: string;
  enabled: boolean;
  pattern: string;
  ttl: number;
  cacheControl: string;
  bypassOrigin: boolean;
  priority: number;
}

interface CDNOptimization {
  id: string;
  name: string;
  type: OptimizationType;
  enabled: boolean;
  config: OptimizationConfig;
  impact: PerformanceImpact;
}

interface OptimizationConfig {
  imageCompression?: ImageCompressionConfig;
  videoOptimization?: VideoOptimizationConfig;
  minification?: MinificationConfig;
  brotliCompression?: CompressionConfig;
}

interface ImageCompressionConfig {
  quality: number;
  format: 'webp' | 'avif' | 'auto';
  progressive: boolean;
  resize: boolean;
  maxWidth: number;
  maxHeight: number;
}

interface VideoOptimizationConfig {
  adaptiveBitrate: boolean;
  formats: string[];
  presets: string[];
  thumbnailGeneration: boolean;
}

interface MinificationConfig {
  css: boolean;
  js: boolean;
  html: boolean;
  removeComments: boolean;
}

interface CompressionConfig {
  level: number;
  types: string[];
  minSize: number;
}

interface PerformanceImpact {
  sizeReduction: number;
  speedIncrease: number;
  estimatedSavings: number;
}

interface CDNAnalytics {
  timeRange: string;
  metrics: CDNMetrics;
  topContent: ContentStats[];
  topRegions: RegionStats[];
  errorLogs: CDNError[];
}

interface CDNMetrics {
  totalRequests: number;
  bandwidth: number;
  cacheHitRatio: number;
  averageLatency: number;
  errorRate: number;
  uniqueVisitors: number;
}

interface ContentStats {
  path: string;
  requests: number;
  bandwidth: number;
  cacheHitRatio: number;
  contentType: string;
}

interface RegionStats {
  region: string;
  requests: number;
  bandwidth: number;
  latency: number;
  errorRate: number;
}

interface CDNError {
  id: string;
  timestamp: Date;
  region: string;
  statusCode: number;
  path: string;
  userAgent: string;
  message: string;
}

type CDNType = 'cloudflare' | 'cloudfront' | 'fastly' | 'keycdn' | 'bunnycdn';
type CDNStatus = 'active' | 'inactive' | 'error' | 'configuring';
type CDNFeature = 'ssl' | 'compression' | 'image-optimization' | 'video-streaming' | 'geo-blocking' | 'ddos-protection' | 'analytics';
type OptimizationType = 'image' | 'video' | 'css' | 'js' | 'compression';

interface CDNIntegrationProps {
  onProviderConnected?: (provider: CDNProvider) => void;
  onOptimizationApplied?: (optimization: CDNOptimization) => void;
}

export default function CDNIntegration({ 
  onProviderConnected, 
  onOptimizationApplied 
}: CDNIntegrationProps) {
  const { toast } = useToast();
  const [providers, setProviders] = useState<CDNProvider[]>([]);
  const [cacheRules, setCacheRules] = useState<CDNCacheRule[]>([]);
  const [optimizations, setOptimizations] = useState<CDNOptimization[]>([]);
  const [analytics, setAnalytics] = useState<CDNAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'cache' | 'optimization' | 'analytics'>('overview');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Initialize demo data
  useEffect(() => {
    const demoProviders: CDNProvider[] = [
      {
        id: 'cloudflare-1',
        name: 'Cloudflare CDN',
        type: 'cloudflare',
        status: 'active',
        config: {
          domain: 'cdn.myvideoapp.com',
          originUrl: 'https://myvideoapp.com',
          sslEnabled: true,
          compressionEnabled: true,
          cacheControl: 'public, max-age=31536000',
          ttl: 86400,
          customHeaders: {
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff'
          },
          geoBlocking: {
            enabled: false,
            blockedCountries: [],
            allowedCountries: [],
            blockType: 'blacklist'
          },
          rateLimiting: {
            enabled: true,
            requestsPerSecond: 100,
            burstSize: 200,
            windowSize: 60
          }
        },
        usage: {
          bandwidth: 2.4 * 1024 * 1024 * 1024 * 1024, // 2.4TB
          requests: 45600000,
          cacheHitRatio: 94.5,
          storage: 145 * 1024 * 1024 * 1024, // 145GB
          edgeRequests: 43122000,
          originRequests: 2478000
        },
        performance: {
          averageLatency: 45,
          p95Latency: 89,
          availability: 99.98,
          errorRate: 0.02,
          throughput: 15600,
          cacheEfficiency: 94.5
        },
        features: ['ssl', 'compression', 'image-optimization', 'ddos-protection', 'analytics'],
        regions: [
          { id: 'us-east', name: 'US East', code: 'US-E', enabled: true, latency: 23, requests: 15600000, bandwidth: 890 * 1024 * 1024 * 1024, cacheHitRatio: 95.2 },
          { id: 'eu-west', name: 'EU West', code: 'EU-W', enabled: true, latency: 34, requests: 12400000, bandwidth: 756 * 1024 * 1024 * 1024, cacheHitRatio: 93.8 },
          { id: 'asia-pacific', name: 'Asia Pacific', code: 'AP', enabled: true, latency: 67, requests: 8900000, bandwidth: 534 * 1024 * 1024 * 1024, cacheHitRatio: 92.1 }
        ]
      },
      {
        id: 'cloudfront-1',
        name: 'Amazon CloudFront',
        type: 'cloudfront',
        status: 'active',
        config: {
          domain: 'd1234567890.cloudfront.net',
          originUrl: 'https://my-s3-bucket.s3.amazonaws.com',
          sslEnabled: true,
          compressionEnabled: true,
          cacheControl: 'public, max-age=86400',
          ttl: 86400,
          customHeaders: {},
          geoBlocking: {
            enabled: true,
            blockedCountries: ['CN', 'RU'],
            allowedCountries: [],
            blockType: 'blacklist'
          },
          rateLimiting: {
            enabled: false,
            requestsPerSecond: 0,
            burstSize: 0,
            windowSize: 0
          }
        },
        usage: {
          bandwidth: 1.8 * 1024 * 1024 * 1024 * 1024, // 1.8TB
          requests: 34200000,
          cacheHitRatio: 89.3,
          storage: 98 * 1024 * 1024 * 1024, // 98GB
          edgeRequests: 30546600,
          originRequests: 3653400
        },
        performance: {
          averageLatency: 78,
          p95Latency: 156,
          availability: 99.95,
          errorRate: 0.05,
          throughput: 12400,
          cacheEfficiency: 89.3
        },
        features: ['ssl', 'compression', 'geo-blocking', 'analytics'],
        regions: [
          { id: 'us-west', name: 'US West', code: 'US-W', enabled: true, latency: 45, requests: 11300000, bandwidth: 645 * 1024 * 1024 * 1024, cacheHitRatio: 90.1 },
          { id: 'eu-central', name: 'EU Central', code: 'EU-C', enabled: true, latency: 56, requests: 9800000, bandwidth: 567 * 1024 * 1024 * 1024, cacheHitRatio: 88.7 }
        ]
      }
    ];

    const demoCacheRules: CDNCacheRule[] = [
      {
        id: 'rule-1',
        name: 'Video Files',
        enabled: true,
        pattern: '*.mp4,*.mov,*.avi',
        ttl: 86400 * 7, // 7 days
        cacheControl: 'public, max-age=604800',
        bypassOrigin: false,
        priority: 1
      },
      {
        id: 'rule-2',
        name: 'Images',
        enabled: true,
        pattern: '*.jpg,*.png,*.gif,*.webp',
        ttl: 86400 * 30, // 30 days
        cacheControl: 'public, max-age=2592000',
        bypassOrigin: false,
        priority: 2
      },
      {
        id: 'rule-3',
        name: 'Static Assets',
        enabled: true,
        pattern: '*.css,*.js,*.woff,*.woff2',
        ttl: 86400 * 365, // 1 year
        cacheControl: 'public, max-age=31536000',
        bypassOrigin: false,
        priority: 3
      }
    ];

    const demoOptimizations: CDNOptimization[] = [
      {
        id: 'opt-1',
        name: 'Image Compression',
        type: 'image',
        enabled: true,
        config: {
          imageCompression: {
            quality: 85,
            format: 'webp',
            progressive: true,
            resize: true,
            maxWidth: 1920,
            maxHeight: 1080
          }
        },
        impact: {
          sizeReduction: 65,
          speedIncrease: 35,
          estimatedSavings: 1200
        }
      },
      {
        id: 'opt-2',
        name: 'Video Optimization',
        type: 'video',
        enabled: true,
        config: {
          videoOptimization: {
            adaptiveBitrate: true,
            formats: ['mp4', 'webm'],
            presets: ['720p', '1080p', '4K'],
            thumbnailGeneration: true
          }
        },
        impact: {
          sizeReduction: 45,
          speedIncrease: 25,
          estimatedSavings: 2800
        }
      },
      {
        id: 'opt-3',
        name: 'Brotli Compression',
        type: 'compression',
        enabled: true,
        config: {
          brotliCompression: {
            level: 6,
            types: ['text/html', 'text/css', 'application/javascript', 'application/json'],
            minSize: 1024
          }
        },
        impact: {
          sizeReduction: 25,
          speedIncrease: 15,
          estimatedSavings: 450
        }
      }
    ];

    const demoAnalytics: CDNAnalytics = {
      timeRange: '24h',
      metrics: {
        totalRequests: 2456000,
        bandwidth: 450 * 1024 * 1024 * 1024, // 450GB
        cacheHitRatio: 92.3,
        averageLatency: 52,
        errorRate: 0.03,
        uniqueVisitors: 145600
      },
      topContent: [
        { path: '/videos/intro.mp4', requests: 89000, bandwidth: 45 * 1024 * 1024 * 1024, cacheHitRatio: 95, contentType: 'video/mp4' },
        { path: '/images/hero.jpg', requests: 156000, bandwidth: 2.3 * 1024 * 1024 * 1024, cacheHitRatio: 98, contentType: 'image/jpeg' },
        { path: '/assets/app.js', requests: 234000, bandwidth: 890 * 1024 * 1024, cacheHitRatio: 99, contentType: 'application/javascript' }
      ],
      topRegions: [
        { region: 'US East', requests: 890000, bandwidth: 167 * 1024 * 1024 * 1024, latency: 23, errorRate: 0.01 },
        { region: 'EU West', requests: 650000, bandwidth: 123 * 1024 * 1024 * 1024, latency: 34, errorRate: 0.02 },
        { region: 'Asia Pacific', requests: 456000, bandwidth: 89 * 1024 * 1024 * 1024, latency: 67, errorRate: 0.05 }
      ],
      errorLogs: []
    };

    setProviders(demoProviders);
    setCacheRules(demoCacheRules);
    setOptimizations(demoOptimizations);
    setAnalytics(demoAnalytics);
    setSelectedProvider(demoProviders[0].id);
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Get status color
  const getStatusColor = (status: CDNStatus) => {
    switch (status) {
      case 'active': return 'text-green-400 border-green-500';
      case 'inactive': return 'text-gray-400 border-gray-500';
      case 'error': return 'text-red-400 border-red-500';
      case 'configuring': return 'text-yellow-400 border-yellow-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  // Apply optimization
  const applyOptimization = useCallback((optimization: CDNOptimization) => {
    setOptimizations(prev => prev.map(opt => 
      opt.id === optimization.id 
        ? { ...opt, enabled: !opt.enabled }
        : opt
    ));

    toast({
      title: optimization.enabled ? "Optimization disabled" : "Optimization enabled",
      description: `${optimization.name} has been ${optimization.enabled ? 'disabled' : 'enabled'}`
    });

    if (onOptimizationApplied) {
      onOptimizationApplied({ ...optimization, enabled: !optimization.enabled });
    }
  }, [onOptimizationApplied, toast]);

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">CDN Integration</h1>
                <p className="text-gray-400">Content Delivery Network Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                <Server className="mr-1 h-3 w-3" />
                {providers.filter(p => p.status === 'active').length} Active
              </Badge>
              
              <Badge variant="outline" className="border-green-500 text-green-400">
                <Zap className="mr-1 h-3 w-3" />
                {optimizations.filter(o => o.enabled).length} Optimizations
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add CDN
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Requests</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.metrics.totalRequests)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Bandwidth</p>
                    <p className="text-2xl font-bold">{formatFileSize(analytics.metrics.bandwidth)}</p>
                  </div>
                  <Upload className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cache Hit</p>
                    <p className="text-2xl font-bold">{analytics.metrics.cacheHitRatio.toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Latency</p>
                    <p className="text-2xl font-bold">{analytics.metrics.averageLatency}ms</p>
                  </div>
                  <Timer className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Visitors</p>
                    <p className="text-2xl font-bold">{formatNumber(analytics.metrics.uniqueVisitors)}</p>
                  </div>
                  <Users className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Providers ({providers.length})
              </TabsTrigger>
              <TabsTrigger value="cache" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Cache Rules ({cacheRules.length})
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Optimization ({optimizations.filter(o => o.enabled).length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Overview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-green-400" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedProviderData && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Availability</span>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedProviderData.performance.availability} className="w-20 h-2" />
                            <span className="text-green-400">{selectedProviderData.performance.availability}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Cache Efficiency</span>
                          <div className="flex items-center gap-2">
                            <Progress value={selectedProviderData.performance.cacheEfficiency} className="w-20 h-2" />
                            <span className="text-blue-400">{selectedProviderData.performance.cacheEfficiency}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Average Latency</span>
                          <span className="text-orange-400">{selectedProviderData.performance.averageLatency}ms</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Error Rate</span>
                          <span className={selectedProviderData.performance.errorRate < 0.1 ? 'text-green-400' : 'text-red-400'}>
                            {selectedProviderData.performance.errorRate}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Regions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    Top Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.topRegions.map((region, index) => (
                      <div key={region.region} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{region.region}</p>
                            <p className="text-sm text-gray-400">
                              {formatNumber(region.requests)} requests
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatFileSize(region.bandwidth)}</p>
                          <p className="text-gray-400">{region.latency}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Optimizations */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    Active Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {optimizations.filter(opt => opt.enabled).map((optimization) => (
                      <div key={optimization.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div>
                          <p className="font-medium">{optimization.name}</p>
                          <p className="text-sm text-gray-400">
                            {optimization.impact.sizeReduction}% size reduction
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-green-400">+{optimization.impact.speedIncrease}% speed</p>
                          <p className="text-gray-400">${optimization.impact.estimatedSavings}/mo saved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cache Rules Status */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-400" />
                    Cache Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cacheRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-gray-400">{rule.pattern}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          <Switch checked={rule.enabled} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((provider) => (
                <Card key={provider.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      {provider.name}
                      <Badge variant="outline" className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {provider.config.domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Requests</p>
                        <p className="font-medium">{formatNumber(provider.usage.requests)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bandwidth</p>
                        <p className="font-medium">{formatFileSize(provider.usage.bandwidth)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cache Hit</p>
                        <p className="font-medium">{provider.usage.cacheHitRatio}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Latency</p>
                        <p className="font-medium">{provider.performance.averageLatency}ms</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Features</Label>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Regions ({provider.regions.length})</Label>
                      <div className="space-y-1">
                        {provider.regions.slice(0, 3).map((region) => (
                          <div key={region.id} className="flex items-center justify-between text-sm">
                            <span>{region.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{region.latency}ms</span>
                              <Switch checked={region.enabled} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Settings className="mr-1 h-3 w-3" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="p-6">
            <div className="space-y-4">
              {cacheRules.map((rule) => (
                <Card key={rule.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">
                            Priority {rule.priority}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Pattern</p>
                            <p className="font-medium">{rule.pattern}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">TTL</p>
                            <p className="font-medium">{Math.round(rule.ttl / 86400)} days</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Cache Control</p>
                            <p className="font-medium">{rule.cacheControl.split(',')[0]}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Bypass Origin</p>
                            <p className="font-medium">{rule.bypassOrigin ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Switch checked={rule.enabled} />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="p-6">
            <div className="space-y-4">
              {optimizations.map((optimization) => (
                <Card key={optimization.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{optimization.name}</h3>
                          <Badge variant={optimization.enabled ? 'default' : 'secondary'}>
                            {optimization.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">
                            {optimization.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-400">Size Reduction</p>
                            <p className="font-medium text-green-400">{optimization.impact.sizeReduction}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Speed Increase</p>
                            <p className="font-medium text-blue-400">+{optimization.impact.speedIncrease}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Monthly Savings</p>
                            <p className="font-medium text-purple-400">${optimization.impact.estimatedSavings}</p>
                          </div>
                        </div>
                        
                        {optimization.config.imageCompression && (
                          <div className="text-sm text-gray-400">
                            Quality: {optimization.config.imageCompression.quality}% • 
                            Format: {optimization.config.imageCompression.format} • 
                            Max size: {optimization.config.imageCompression.maxWidth}×{optimization.config.imageCompression.maxHeight}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Switch 
                          checked={optimization.enabled} 
                          onCheckedChange={() => applyOptimization(optimization)}
                        />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">CDN Analytics</h3>
              <p>Detailed performance analytics and insights</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}