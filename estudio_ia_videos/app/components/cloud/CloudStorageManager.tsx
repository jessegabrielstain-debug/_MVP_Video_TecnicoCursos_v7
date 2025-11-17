/**
 * ☁️ Cloud Storage Manager - Multi-provider cloud storage integration
 * Professional cloud storage management with AWS S3, Google Cloud, Azure support
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
  Cloud, 
  Upload, 
  Download, 
  Folder, 
  File, 
  FileVideo,
  FileImage,
  FileAudio,
  FileText,
  Archive,
  Database,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  Shield,
  Zap,
  Globe,
  Server,
  HardDrive,
  Clock,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Loader2,
  PlayCircle,
  PauseCircle,
  X,
  Plus,
  Link,
  Users,
  Lock,
  Unlock,
  Star,
  Heart,
  BookOpen,
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  Wifi,
  WifiOff,
  CloudOff,
  Package,
  Layers,
  Grid,
  CloudDrizzle,
  CloudSnow,
  CloudRain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Cloud Storage Types
interface CloudProvider {
  id: string;
  name: string;
  type: ProviderType;
  icon: React.ReactNode;
  status: ProviderStatus;
  config: ProviderConfig;
  usage: StorageUsage;
  features: CloudFeature[];
}

interface ProviderConfig {
  accessKey?: string;
  secretKey?: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
  projectId?: string;
  keyFile?: string;
  containerName?: string;
  accountName?: string;
  accountKey?: string;
}

interface StorageUsage {
  used: number;
  total: number;
  files: number;
  bandwidth: number;
  requests: number;
}

interface CloudFile {
  id: string;
  name: string;
  path: string;
  type: FileType;
  size: number;
  mimeType: string;
  provider: string;
  uploadedAt: Date;
  lastModified: Date;
  url: string;
  cdnUrl?: string;
  metadata: FileMetadata;
  permissions: FilePermissions;
  tags: string[];
  versions: FileVersion[];
}

interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  fps?: number;
  codec?: string;
  format?: string;
  checksum: string;
  thumbnailUrl?: string;
}

interface FilePermissions {
  public: boolean;
  shared: boolean;
  downloadable: boolean;
  expiration?: Date;
  accessUsers: string[];
}

interface FileVersion {
  id: string;
  version: number;
  size: number;
  uploadedAt: Date;
  url: string;
  changes: string;
}

interface UploadJob {
  id: string;
  file: File;
  provider: string;
  path: string;
  progress: number;
  status: UploadStatus;
  speed: number;
  eta: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

interface DownloadJob {
  id: string;
  fileId: string;
  fileName: string;
  provider: string;
  progress: number;
  status: DownloadStatus;
  speed: number;
  eta: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

interface SyncRule {
  id: string;
  name: string;
  enabled: boolean;
  sourceProvider: string;
  targetProvider: string;
  sourcePath: string;
  targetPath: string;
  syncType: SyncType;
  schedule: string;
  filters: string[];
  lastSync?: Date;
  nextSync?: Date;
}

interface CDNConfig {
  enabled: boolean;
  provider: string;
  domain: string;
  cacheControl: string;
  compression: boolean;
  imageOptimization: boolean;
  videoStreaming: boolean;
}

type ProviderType = 'aws-s3' | 'google-cloud' | 'azure-blob' | 'cloudflare-r2' | 'digitalocean';
type ProviderStatus = 'connected' | 'disconnected' | 'error' | 'syncing';
type FileType = 'video' | 'image' | 'audio' | 'document' | 'archive' | 'other';
type UploadStatus = 'queued' | 'uploading' | 'completed' | 'failed' | 'paused';
type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
type SyncType = 'one-way' | 'two-way' | 'mirror' | 'backup';
type CloudFeature = 'cdn' | 'versioning' | 'encryption' | 'backup' | 'streaming' | 'analytics';

const CLOUD_PROVIDERS: Partial<CloudProvider>[] = [
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    type: 'aws-s3',
    icon: <CloudRain className="h-5 w-5 text-orange-400" />,
    features: ['cdn', 'versioning', 'encryption', 'backup', 'streaming', 'analytics']
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud Storage',
    type: 'google-cloud',
    icon: <CloudSnow className="h-5 w-5 text-blue-400" />,
    features: ['cdn', 'versioning', 'encryption', 'backup', 'analytics']
  },
  {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    type: 'azure-blob',
    icon: <CloudDrizzle className="h-5 w-5 text-cyan-400" />,
    features: ['cdn', 'versioning', 'encryption', 'backup', 'streaming']
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    type: 'cloudflare-r2',
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    features: ['cdn', 'encryption', 'backup']
  }
];

interface CloudStorageManagerProps {
  onFileUploaded?: (file: CloudFile) => void;
  onFileDownloaded?: (file: CloudFile) => void;
  onProviderConnected?: (provider: CloudProvider) => void;
}

export default function CloudStorageManager({ 
  onFileUploaded, 
  onFileDownloaded, 
  onProviderConnected 
}: CloudStorageManagerProps) {
  const { toast } = useToast();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [downloadJobs, setDownloadJobs] = useState<DownloadJob[]>([]);
  const [syncRules, setSyncRules] = useState<SyncRule[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'providers' | 'sync' | 'cdn'>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [cdnConfig, setCdnConfig] = useState<CDNConfig>({
    enabled: false,
    provider: '',
    domain: '',
    cacheControl: 'public, max-age=31536000',
    compression: true,
    imageOptimization: true,
    videoStreaming: true
  });

  // Initialize demo data
  useEffect(() => {
    const demoProviders: CloudProvider[] = [
      {
        id: 'aws-s3',
        name: 'Amazon S3',
        type: 'aws-s3',
        icon: <CloudRain className="h-5 w-5 text-orange-400" />,
        status: 'connected',
        config: {
          accessKey: 'AKIA***********',
          secretKey: '*********************',
          region: 'us-east-1',
          bucket: 'my-video-bucket'
        },
        usage: {
          used: 2.4 * 1024 * 1024 * 1024, // 2.4GB
          total: 100 * 1024 * 1024 * 1024, // 100GB
          files: 1234,
          bandwidth: 45.6 * 1024 * 1024 * 1024, // 45.6GB
          requests: 89012
        },
        features: ['cdn', 'versioning', 'encryption', 'backup', 'streaming', 'analytics']
      },
      {
        id: 'google-cloud',
        name: 'Google Cloud Storage',
        type: 'google-cloud',
        icon: <CloudSnow className="h-5 w-5 text-blue-400" />,
        status: 'connected',
        config: {
          projectId: 'my-video-project',
          keyFile: 'service-account.json',
          bucket: 'video-storage-bucket'
        },
        usage: {
          used: 1.8 * 1024 * 1024 * 1024, // 1.8GB
          total: 50 * 1024 * 1024 * 1024, // 50GB
          files: 856,
          bandwidth: 23.4 * 1024 * 1024 * 1024, // 23.4GB
          requests: 34567
        },
        features: ['cdn', 'versioning', 'encryption', 'backup', 'analytics']
      },
      {
        id: 'azure-blob',
        name: 'Azure Blob Storage',
        type: 'azure-blob',
        icon: <CloudDrizzle className="h-5 w-5 text-cyan-400" />,
        status: 'disconnected',
        config: {
          accountName: 'mystorageaccount',
          accountKey: '*********************',
          containerName: 'videos'
        },
        usage: {
          used: 0,
          total: 25 * 1024 * 1024 * 1024, // 25GB
          files: 0,
          bandwidth: 0,
          requests: 0
        },
        features: ['cdn', 'versioning', 'encryption', 'backup', 'streaming']
      }
    ];

    const demoFiles: CloudFile[] = [
      {
        id: 'file-1',
        name: 'intro-video-final.mp4',
        path: '/videos/intros/',
        type: 'video',
        size: 145 * 1024 * 1024, // 145MB
        mimeType: 'video/mp4',
        provider: 'aws-s3',
        uploadedAt: new Date(Date.now() - 86400000),
        lastModified: new Date(Date.now() - 86400000),
        url: 'https://my-video-bucket.s3.amazonaws.com/videos/intros/intro-video-final.mp4',
        cdnUrl: 'https://cdn.example.com/videos/intros/intro-video-final.mp4',
        metadata: {
          width: 1920,
          height: 1080,
          duration: 45,
          bitrate: 8000,
          fps: 30,
          codec: 'h264',
          format: 'mp4',
          checksum: 'sha256:abc123...',
          thumbnailUrl: 'https://cdn.example.com/thumbnails/intro-video-final.jpg'
        },
        permissions: {
          public: true,
          shared: true,
          downloadable: true,
          accessUsers: []
        },
        tags: ['intro', 'final', 'hd'],
        versions: [
          {
            id: 'v1',
            version: 1,
            size: 145 * 1024 * 1024,
            uploadedAt: new Date(Date.now() - 86400000),
            url: 'https://my-video-bucket.s3.amazonaws.com/videos/intros/intro-video-final.mp4',
            changes: 'Initial upload'
          }
        ]
      },
      {
        id: 'file-2',
        name: 'product-demo-4k.mov',
        path: '/videos/demos/',
        type: 'video',
        size: 892 * 1024 * 1024, // 892MB
        mimeType: 'video/quicktime',
        provider: 'google-cloud',
        uploadedAt: new Date(Date.now() - 3600000 * 12),
        lastModified: new Date(Date.now() - 3600000 * 8),
        url: 'https://storage.googleapis.com/video-storage-bucket/videos/demos/product-demo-4k.mov',
        metadata: {
          width: 3840,
          height: 2160,
          duration: 120,
          bitrate: 50000,
          fps: 60,
          codec: 'prores',
          format: 'mov',
          checksum: 'sha256:def456...',
          thumbnailUrl: 'https://storage.googleapis.com/video-storage-bucket/thumbnails/product-demo-4k.jpg'
        },
        permissions: {
          public: false,
          shared: true,
          downloadable: true,
          expiration: new Date(Date.now() + 86400000 * 7),
          accessUsers: ['user1@example.com', 'user2@example.com']
        },
        tags: ['demo', '4k', 'product'],
        versions: [
          {
            id: 'v2',
            version: 2,
            size: 892 * 1024 * 1024,
            uploadedAt: new Date(Date.now() - 3600000 * 8),
            url: 'https://storage.googleapis.com/video-storage-bucket/videos/demos/product-demo-4k.mov',
            changes: 'Updated with new scenes'
          },
          {
            id: 'v1',
            version: 1,
            size: 756 * 1024 * 1024,
            uploadedAt: new Date(Date.now() - 3600000 * 12),
            url: 'https://storage.googleapis.com/video-storage-bucket/videos/demos/product-demo-4k-v1.mov',
            changes: 'Initial upload'
          }
        ]
      }
    ];

    setProviders(demoProviders);
    setFiles(demoFiles);
    setSelectedProvider(demoProviders[0].id);
  }, []);

  // Simulate upload process
  const simulateUpload = useCallback((job: UploadJob) => {
    const interval = setInterval(() => {
      setUploadJobs(prev => prev.map(j => {
        if (j.id === job.id && j.status === 'uploading') {
          const newProgress = Math.min(100, j.progress + Math.random() * 15);
          const isCompleted = newProgress >= 100;
          
          return {
            ...j,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'uploading',
            speed: 5 + Math.random() * 10, // MB/s
            eta: isCompleted ? 0 : Math.ceil((100 - newProgress) / 10),
            completedAt: isCompleted ? new Date() : undefined
          };
        }
        return j;
      }));
      
      const currentJob = uploadJobs.find(j => j.id === job.id);
      if (currentJob?.progress >= 100) {
        clearInterval(interval);
        
        // Add file to files list
        const newFile: CloudFile = {
          id: `file-${Date.now()}`,
          name: job.file.name,
          path: job.path,
          type: getFileType(job.file.type),
          size: job.file.size,
          mimeType: job.file.type,
          provider: job.provider,
          uploadedAt: new Date(),
          lastModified: new Date(),
          url: `https://example.com/${job.path}/${job.file.name}`,
          metadata: {
            checksum: `sha256:${Math.random().toString(36)}`
          },
          permissions: {
            public: false,
            shared: false,
            downloadable: true,
            accessUsers: []
          },
          tags: [],
          versions: []
        };
        
        setFiles(prev => [newFile, ...prev]);
        
        if (onFileUploaded) {
          onFileUploaded(newFile);
        }
        
        toast({
          title: "Upload concluído",
          description: `${job.file.name} foi enviado com sucesso`
        });
      }
    }, 500);
  }, [uploadJobs, onFileUploaded, toast]);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null, provider: string) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const job: UploadJob = {
        id: `upload-${Date.now()}-${Math.random()}`,
        file,
        provider,
        path: getUploadPath(file.type),
        progress: 0,
        status: 'uploading',
        speed: 0,
        eta: 0,
        startedAt: new Date()
      };
      
      setUploadJobs(prev => [job, ...prev]);
      simulateUpload(job);
    });
  }, [simulateUpload]);

  // Get file type from MIME type
  const getFileType = (mimeType: string): FileType => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  };

  // Get upload path based on file type
  const getUploadPath = (mimeType: string): string => {
    const fileType = getFileType(mimeType);
    switch (fileType) {
      case 'video': return '/videos/uploads';
      case 'image': return '/images/uploads';
      case 'audio': return '/audio/uploads';
      case 'document': return '/documents/uploads';
      case 'archive': return '/archives/uploads';
      default: return '/misc/uploads';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get file icon
  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'video': return <FileVideo className="h-5 w-5 text-purple-400" />;
      case 'image': return <FileImage className="h-5 w-5 text-green-400" />;
      case 'audio': return <FileAudio className="h-5 w-5 text-blue-400" />;
      case 'document': return <FileText className="h-5 w-5 text-orange-400" />;
      case 'archive': return <Archive className="h-5 w-5 text-red-400" />;
      default: return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: ProviderStatus) => {
    switch (status) {
      case 'connected': return 'text-green-400 border-green-500';
      case 'disconnected': return 'text-gray-400 border-gray-500';
      case 'error': return 'text-red-400 border-red-500';
      case 'syncing': return 'text-blue-400 border-blue-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    return file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Cloud Storage Manager</h1>
                <p className="text-gray-400">Multi-provider cloud storage integration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                <Database className="mr-1 h-3 w-3" />
                {files.length} Files
              </Badge>
              
              <Badge variant="outline" className="border-green-500 text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                {providers.filter(p => p.status === 'connected').length} Connected
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      {provider.icon}
                      {provider.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'video/*,image/*,audio/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  handleFileUpload(target.files, selectedProvider);
                };
                input.click();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {providers.slice(0, 4).map((provider) => (
            <Card key={provider.id} className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{provider.name}</p>
                    <p className="text-lg font-bold">
                      {formatFileSize(provider.usage.used)} / {formatFileSize(provider.usage.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.icon}
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(provider.status)}
                    >
                      {provider.status}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={(provider.usage.used / provider.usage.total) * 100} 
                  className="h-1 mt-2" 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Files ({files.length})
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload ({uploadJobs.filter(j => j.status !== 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Providers
              </TabsTrigger>
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Sync & Backup
              </TabsTrigger>
              <TabsTrigger value="cdn" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                CDN & Delivery
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Files Tab */}
          <TabsContent value="files" className="p-6">
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              {/* Files Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {file.metadata.thumbnailUrl && (
                        <div className="mb-3">
                          <img
                            src={file.metadata.thumbnailUrl}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded bg-gray-700"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                        
                        {file.metadata.duration && (
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{formatDuration(file.metadata.duration)}</span>
                          </div>
                        )}
                        
                        {file.metadata.width && file.metadata.height && (
                          <div className="flex justify-between">
                            <span>Resolution:</span>
                            <span>{file.metadata.width}×{file.metadata.height}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span>Provider:</span>
                          <span className="capitalize">{file.provider.replace('-', ' ')}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{file.uploadedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-3">
                        {file.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share2 className="mr-1 h-3 w-3" />
                          Share
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <Cloud className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-gray-400">Upload some files to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="p-6">
            <div className="space-y-6">
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
                <p className="text-gray-400 mb-4">Support for videos, images, and audio files</p>
                <Button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'video/*,image/*,audio/*';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      handleFileUpload(target.files, selectedProvider);
                    };
                    input.click();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Select Files
                </Button>
              </div>

              {/* Upload Jobs */}
              {uploadJobs.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Upload Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uploadJobs.map((job) => (
                        <div key={job.id} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{job.file.name}</span>
                              <Badge variant={
                                job.status === 'completed' ? 'default' :
                                job.status === 'failed' ? 'destructive' :
                                'secondary'
                              }>
                                {job.status}
                              </Badge>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>{formatFileSize(job.file.size)} • {job.provider}</span>
                              <span>
                                {job.status === 'uploading' && `${job.speed.toFixed(1)} MB/s • ${job.eta}s remaining`}
                                {job.status === 'completed' && 'Upload completed'}
                                {job.status === 'failed' && job.error}
                              </span>
                            </div>
                          </div>
                          {job.status === 'uploading' && (
                            <Button size="sm" variant="outline">
                              <PauseCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(job.status === 'completed' || job.status === 'failed') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setUploadJobs(prev => prev.filter(j => j.id !== job.id))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((provider) => (
                <Card key={provider.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {provider.icon}
                      {provider.name}
                      <Badge variant="outline" className={getStatusColor(provider.status)}>
                        {provider.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {provider.usage.files} files • {formatFileSize(provider.usage.used)} used
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span>{Math.round((provider.usage.used / provider.usage.total) * 100)}%</span>
                      </div>
                      <Progress value={(provider.usage.used / provider.usage.total) * 100} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Bandwidth</p>
                        <p className="font-medium">{formatFileSize(provider.usage.bandwidth)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Requests</p>
                        <p className="font-medium">{provider.usage.requests.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Features</Label>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={provider.status === 'connected' ? 'destructive' : 'default'}
                        className="flex-1"
                      >
                        {provider.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sync & Backup Rules</h3>
              <p>Configure automatic synchronization between providers</p>
            </div>
          </TabsContent>

          {/* CDN Tab */}
          <TabsContent value="cdn" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">CDN & Content Delivery</h3>
              <p>Optimize content delivery with CDN integration</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}