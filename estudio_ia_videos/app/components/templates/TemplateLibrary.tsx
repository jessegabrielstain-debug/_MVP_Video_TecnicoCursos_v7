/**
 * 📚 Template Library - Professional template management system
 * Comprehensive template library with categories, marketplace, and customization
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
  BookOpen, 
  Search, 
  Filter, 
  Grid, 
  List,
  Star, 
  Heart, 
  Download, 
  Upload,
  Eye, 
  Play,
  Pause,
  Edit, 
  Copy,
  Trash2,
  Share2,
  ExternalLink,
  Plus,
  Package,
  Layers,
  Image,
  Video,
  FileText,
  Palette,
  Wand2,
  Sparkles,
  Target,
  Clock,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Settings,
  MoreHorizontal,
  ShoppingCart,
  CreditCard,
  Globe,
  Tag,
  Calendar,
  BarChart3,
  Database,
  Folder,
  FolderOpen,
  Zap,
  Crown,
  Gift,
  Flame,
  Bookmark,
  History,
  ArrowRight,
  ChevronRight,
  X,
  Save,
  PaintBucket,
  Layout,
  Type,
  Music,
  Mic,
  VideoIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Template Library Types
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  subcategory: string;
  tags: string[];
  creator: TemplateCreator;
  thumbnail: string;
  previewUrl: string;
  assets: TemplateAsset[];
  metadata: TemplateMetadata;
  pricing: TemplatePricing;
  stats: TemplateStats;
  requirements: TemplateRequirements;
  versions: TemplateVersion[];
  customizable: CustomizationOptions;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  trending: boolean;
  premium: boolean;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  subcategories: string[];
}

interface TemplateCreator {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  totalSales: number;
  bio: string;
}

interface TemplateAsset {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  size: number;
  duration?: number;
  resolution?: string;
  format: string;
  thumbnail?: string;
}

interface TemplateMetadata {
  duration: number;
  resolution: string;
  fps: number;
  aspectRatio: string;
  fileSize: number;
  complexity: ComplexityLevel;
  style: string[];
  colorScheme: string[];
  mood: string[];
}

interface TemplatePricing {
  type: PricingType;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  license: LicenseType;
  usage: UsageRights;
}

interface TemplateStats {
  downloads: number;
  likes: number;
  views: number;
  rating: number;
  reviews: number;
  bookmarks: number;
  shares: number;
}

interface TemplateRequirements {
  minVersion: string;
  plugins: string[];
  fonts: string[];
  software: string[];
}

interface TemplateVersion {
  id: string;
  version: string;
  releaseDate: Date;
  changelog: string;
  downloadUrl: string;
  deprecated: boolean;
}

interface CustomizationOptions {
  colors: boolean;
  text: boolean;
  images: boolean;
  videos: boolean;
  audio: boolean;
  transitions: boolean;
  effects: boolean;
  timing: boolean;
}

interface TemplateFilter {
  categories: string[];
  priceRange: [number, number];
  duration: [number, number];
  complexity: ComplexityLevel[];
  rating: number;
  tags: string[];
  creator: string;
  featured: boolean;
  trending: boolean;
  premium: boolean;
}

interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: string[];
  creator: string;
  public: boolean;
  featured: boolean;
  thumbnail: string;
  stats: CollectionStats;
}

interface CollectionStats {
  templates: number;
  likes: number;
  views: number;
  followers: number;
}

interface TemplateDownload {
  id: string;
  templateId: string;
  templateName: string;
  downloadedAt: Date;
  version: string;
  license: LicenseType;
  price: number;
  status: DownloadStatus;
}

interface TemplateProject {
  id: string;
  name: string;
  templateId: string;
  customizations: Record<string, unknown>;
  progress: number;
  status: ProjectStatus;
  createdAt: Date;
  lastModified: Date;
}

type AssetType = 'video' | 'image' | 'audio' | 'font' | 'effect' | 'transition' | 'overlay';
type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type PricingType = 'free' | 'paid' | 'subscription' | 'credit';
type LicenseType = 'standard' | 'extended' | 'commercial' | 'editorial';
type UsageRights = 'personal' | 'commercial' | 'unlimited';
type DownloadStatus = 'downloading' | 'completed' | 'failed' | 'expired';
type ProjectStatus = 'draft' | 'in-progress' | 'completed' | 'published';

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'intro',
    name: 'Intros & Outros',
    icon: <Play className="h-5 w-5" />,
    description: 'Professional video intros, outros, and openers',
    color: 'text-blue-400',
    subcategories: ['Logo Reveals', 'Text Intros', 'Cinematic', 'Corporate', 'Gaming']
  },
  {
    id: 'social',
    name: 'Social Media',
    icon: <Share2 className="h-5 w-5" />,
    description: 'Templates optimized for social platforms',
    color: 'text-pink-400',
    subcategories: ['Instagram Stories', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn']
  },
  {
    id: 'business',
    name: 'Business & Corporate',
    icon: <Target className="h-5 w-5" />,
    description: 'Professional business presentations and videos',
    color: 'text-green-400',
    subcategories: ['Presentations', 'Explainer Videos', 'Corporate', 'Marketing', 'Training']
  },
  {
    id: 'education',
    name: 'Education & Training',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Educational content and training materials',
    color: 'text-yellow-400',
    subcategories: ['Courses', 'Tutorials', 'Webinars', 'E-learning', 'Certifications']
  },
  {
    id: 'wedding',
    name: 'Wedding & Events',
    icon: <Heart className="h-5 w-5" />,
    description: 'Beautiful templates for special occasions',
    color: 'text-rose-400',
    subcategories: ['Wedding', 'Birthday', 'Anniversary', 'Holiday', 'Celebration']
  },
  {
    id: 'music',
    name: 'Music & Entertainment',
    icon: <Music className="h-5 w-5" />,
    description: 'Music videos, visualizers, and entertainment',
    color: 'text-purple-400',
    subcategories: ['Music Videos', 'Audio Visualizer', 'Concert', 'Festival', 'DJ']
  }
];

interface TemplateLibraryProps {
  onTemplateSelected?: (template: Template) => void;
  onTemplateDownloaded?: (template: Template) => void;
  onCollectionCreated?: (collection: TemplateCollection) => void;
}

export default function TemplateLibrary({ 
  onTemplateSelected, 
  onTemplateDownloaded, 
  onCollectionCreated 
}: TemplateLibraryProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<TemplateCollection[]>([]);
  const [downloads, setDownloads] = useState<TemplateDownload[]>([]);
  const [projects, setProjects] = useState<TemplateProject[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'collections' | 'downloads' | 'projects' | 'marketplace'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'price'>('popular');
  const [filter, setFilter] = useState<Partial<TemplateFilter>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Initialize demo data
  useEffect(() => {
    const demoCreators = [
      {
        id: 'creator-1',
        name: 'VideoArt Studio',
        avatar: '/avatars/creator1.jpg',
        verified: true,
        rating: 4.9,
        totalSales: 12456,
        bio: 'Professional video template creator with 5+ years experience'
      },
      {
        id: 'creator-2',
        name: 'Motion Design Co',
        avatar: '/avatars/creator2.jpg',
        verified: true,
        rating: 4.8,
        totalSales: 8934,
        bio: 'Award-winning motion graphics and video template studio'
      },
      {
        id: 'creator-3',
        name: 'Creative Studios',
        avatar: '/avatars/creator3.jpg',
        verified: false,
        rating: 4.6,
        totalSales: 3421,
        bio: 'Indie creator specializing in unique video templates'
      }
    ];

    const demoTemplates: Template[] = [
      {
        id: 'template-1',
        name: 'Modern Corporate Intro',
        description: 'Clean and professional corporate intro template with smooth animations and customizable text',
        category: TEMPLATE_CATEGORIES[2], // Business
        subcategory: 'Corporate',
        tags: ['corporate', 'clean', 'professional', 'intro', 'business'],
        creator: demoCreators[0],
        thumbnail: '/templates/corporate-intro-thumb.jpg',
        previewUrl: '/templates/corporate-intro-preview.mp4',
        assets: [
          {
            id: 'asset-1',
            type: 'video',
            name: 'main-template.mp4',
            url: '/templates/corporate-intro.mp4',
            size: 45 * 1024 * 1024, // 45MB
            duration: 15,
            resolution: '1920x1080',
            format: 'mp4'
          },
          {
            id: 'asset-2',
            type: 'image',
            name: 'logo-placeholder.png',
            url: '/templates/logo-placeholder.png',
            size: 2 * 1024 * 1024, // 2MB
            resolution: '1920x1080',
            format: 'png'
          }
        ],
        metadata: {
          duration: 15,
          resolution: '1920x1080',
          fps: 30,
          aspectRatio: '16:9',
          fileSize: 47 * 1024 * 1024,
          complexity: 'intermediate',
          style: ['modern', 'clean', 'minimalist'],
          colorScheme: ['blue', 'white', 'gray'],
          mood: ['professional', 'corporate', 'serious']
        },
        pricing: {
          type: 'paid',
          price: 29.99,
          originalPrice: 39.99,
          discount: 25,
          currency: 'USD',
          license: 'commercial',
          usage: 'commercial'
        },
        stats: {
          downloads: 3456,
          likes: 892,
          views: 15678,
          rating: 4.8,
          reviews: 234,
          bookmarks: 567,
          shares: 123
        },
        requirements: {
          minVersion: '2.0.0',
          plugins: ['Motion Graphics Pack'],
          fonts: ['Roboto', 'Open Sans'],
          software: ['After Effects', 'Premiere Pro']
        },
        versions: [
          {
            id: 'v1',
            version: '1.2.0',
            releaseDate: new Date('2025-10-01'),
            changelog: 'Added new color variations and improved animations',
            downloadUrl: '/downloads/template-1-v1.2.0.zip',
            deprecated: false
          }
        ],
        customizable: {
          colors: true,
          text: true,
          images: true,
          videos: false,
          audio: true,
          transitions: true,
          effects: true,
          timing: true
        },
        createdAt: new Date('2025-09-15'),
        updatedAt: new Date('2025-10-01'),
        featured: true,
        trending: true,
        premium: false
      },
      {
        id: 'template-2',
        name: 'Social Media Story Pack',
        description: 'Complete Instagram stories pack with 20+ animated templates for social media marketing',
        category: TEMPLATE_CATEGORIES[1], // Social Media
        subcategory: 'Instagram Stories',
        tags: ['instagram', 'stories', 'social media', 'pack', 'animated'],
        creator: demoCreators[1],
        thumbnail: '/templates/social-stories-thumb.jpg',
        previewUrl: '/templates/social-stories-preview.mp4',
        assets: [
          {
            id: 'asset-3',
            type: 'video',
            name: 'story-pack.zip',
            url: '/templates/story-pack.zip',
            size: 125 * 1024 * 1024, // 125MB
            duration: 300, // 5 minutes total
            resolution: '1080x1920',
            format: 'zip'
          }
        ],
        metadata: {
          duration: 300,
          resolution: '1080x1920',
          fps: 30,
          aspectRatio: '9:16',
          fileSize: 125 * 1024 * 1024,
          complexity: 'beginner',
          style: ['trendy', 'colorful', 'dynamic'],
          colorScheme: ['rainbow', 'gradient', 'vibrant'],
          mood: ['energetic', 'fun', 'youthful']
        },
        pricing: {
          type: 'paid',
          price: 19.99,
          currency: 'USD',
          license: 'standard',
          usage: 'commercial'
        },
        stats: {
          downloads: 8234,
          likes: 1456,
          views: 32145,
          rating: 4.9,
          reviews: 567,
          bookmarks: 1023,
          shares: 289
        },
        requirements: {
          minVersion: '1.8.0',
          plugins: [],
          fonts: ['Montserrat', 'Poppins'],
          software: ['After Effects']
        },
        versions: [
          {
            id: 'v2',
            version: '2.1.0',
            releaseDate: new Date('2025-10-05'),
            changelog: 'Added 5 new story templates and improved mobile optimization',
            downloadUrl: '/downloads/template-2-v2.1.0.zip',
            deprecated: false
          }
        ],
        customizable: {
          colors: true,
          text: true,
          images: true,
          videos: true,
          audio: true,
          transitions: false,
          effects: true,
          timing: false
        },
        createdAt: new Date('2025-08-20'),
        updatedAt: new Date('2025-10-05'),
        featured: true,
        trending: false,
        premium: true
      },
      {
        id: 'template-3',
        name: 'Wedding Slideshow Romantic',
        description: 'Beautiful romantic wedding slideshow template with elegant transitions and love-themed animations',
        category: TEMPLATE_CATEGORIES[4], // Wedding
        subcategory: 'Wedding',
        tags: ['wedding', 'romantic', 'slideshow', 'elegant', 'love'],
        creator: demoCreators[2],
        thumbnail: '/templates/wedding-slideshow-thumb.jpg',
        previewUrl: '/templates/wedding-slideshow-preview.mp4',
        assets: [
          {
            id: 'asset-4',
            type: 'video',
            name: 'wedding-template.mp4',
            url: '/templates/wedding-template.mp4',
            size: 89 * 1024 * 1024, // 89MB
            duration: 120, // 2 minutes
            resolution: '1920x1080',
            format: 'mp4'
          },
          {
            id: 'asset-5',
            type: 'audio',
            name: 'romantic-music.mp3',
            url: '/templates/romantic-music.mp3',
            size: 8 * 1024 * 1024, // 8MB
            duration: 120,
            format: 'mp3'
          }
        ],
        metadata: {
          duration: 120,
          resolution: '1920x1080',
          fps: 24,
          aspectRatio: '16:9',
          fileSize: 97 * 1024 * 1024,
          complexity: 'advanced',
          style: ['romantic', 'elegant', 'cinematic'],
          colorScheme: ['pink', 'gold', 'white'],
          mood: ['romantic', 'emotional', 'heartwarming']
        },
        pricing: {
          type: 'paid',
          price: 49.99,
          currency: 'USD',
          license: 'extended',
          usage: 'commercial'
        },
        stats: {
          downloads: 1987,
          likes: 743,
          views: 9876,
          rating: 4.7,
          reviews: 156,
          bookmarks: 432,
          shares: 87
        },
        requirements: {
          minVersion: '2.2.0',
          plugins: ['Romantic Effects Pack', 'Transition Bundle'],
          fonts: ['Great Vibes', 'Dancing Script'],
          software: ['After Effects', 'Premiere Pro']
        },
        versions: [
          {
            id: 'v3',
            version: '1.5.0',
            releaseDate: new Date('2025-09-20'),
            changelog: 'Enhanced romantic effects and added customizable photo slots',
            downloadUrl: '/downloads/template-3-v1.5.0.zip',
            deprecated: false
          }
        ],
        customizable: {
          colors: true,
          text: true,
          images: true,
          videos: true,
          audio: true,
          transitions: true,
          effects: true,
          timing: true
        },
        createdAt: new Date('2025-08-01'),
        updatedAt: new Date('2025-09-20'),
        featured: false,
        trending: true,
        premium: true
      }
    ];

    const demoCollections: TemplateCollection[] = [
      {
        id: 'collection-1',
        name: 'Corporate Video Pack',
        description: 'Complete collection of professional corporate video templates',
        templates: ['template-1'],
        creator: 'VideoArt Studio',
        public: true,
        featured: true,
        thumbnail: '/collections/corporate-pack-thumb.jpg',
        stats: {
          templates: 15,
          likes: 456,
          views: 3421,
          followers: 789
        }
      },
      {
        id: 'collection-2',
        name: 'Social Media Bundle',
        description: 'Ultimate social media templates for all platforms',
        templates: ['template-2'],
        creator: 'Motion Design Co',
        public: true,
        featured: true,
        thumbnail: '/collections/social-bundle-thumb.jpg',
        stats: {
          templates: 25,
          likes: 892,
          views: 7654,
          followers: 1234
        }
      }
    ];

    const demoDownloads: TemplateDownload[] = [
      {
        id: 'download-1',
        templateId: 'template-1',
        templateName: 'Modern Corporate Intro',
        downloadedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        version: '1.2.0',
        license: 'commercial',
        price: 29.99,
        status: 'completed'
      },
      {
        id: 'download-2',
        templateId: 'template-2',
        templateName: 'Social Media Story Pack',
        downloadedAt: new Date(Date.now() - 86400000), // 1 day ago
        version: '2.1.0',
        license: 'standard',
        price: 19.99,
        status: 'completed'
      }
    ];

    const demoProjects: TemplateProject[] = [
      {
        id: 'project-1',
        name: 'Company Introduction Video',
        templateId: 'template-1',
        customizations: {
          companyName: 'TechCorp Solutions',
          primaryColor: '#3B82F6',
          logoUrl: '/logos/techcorp.png'
        },
        progress: 85,
        status: 'in-progress',
        createdAt: new Date(Date.now() - 86400000 * 3),
        lastModified: new Date(Date.now() - 3600000 * 2)
      },
      {
        id: 'project-2',
        name: 'Instagram Stories Campaign',
        templateId: 'template-2',
        customizations: {
          brandColors: ['#FF6B6B', '#4ECDC4'],
          productImages: ['/products/product1.jpg', '/products/product2.jpg']
        },
        progress: 100,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000 * 5),
        lastModified: new Date(Date.now() - 86400000 * 2)
      }
    ];

    setTemplates(demoTemplates);
    setCollections(demoCollections);
    setDownloads(demoDownloads);
    setProjects(demoProjects);
  }, []);

  // Filter templates based on current filters
  const filteredTemplates = templates.filter(template => {
    // Search query filter
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && template.category.id !== selectedCategory) {
      return false;
    }

    // Other filters...
    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.stats.downloads - a.stats.downloads;
      case 'recent':
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case 'rating':
        return b.stats.rating - a.stats.rating;
      case 'price':
        return a.pricing.price - b.pricing.price;
      default:
        return 0;
    }
  });

  // Handle template download
  const handleTemplateDownload = useCallback((template: Template) => {
    const download: TemplateDownload = {
      id: `download-${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      downloadedAt: new Date(),
      version: template.versions[0]?.version || '1.0.0',
      license: template.pricing.license,
      price: template.pricing.price,
      status: 'downloading'
    };

    setDownloads(prev => [download, ...prev]);

    // Simulate download progress
    setTimeout(() => {
      setDownloads(prev => prev.map(d => 
        d.id === download.id 
          ? { ...d, status: 'completed' }
          : d
      ));

      toast({
        title: "Template downloaded",
        description: `${template.name} has been downloaded successfully`
      });

      if (onTemplateDownloaded) {
        onTemplateDownloaded(template);
      }
    }, 2000);
  }, [onTemplateDownloaded, toast]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    if (onTemplateSelected) {
      onTemplateSelected(template);
    }
  }, [onTemplateSelected]);

  // Format price
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get complexity color
  const getComplexityColor = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case 'beginner': return 'text-green-400 border-green-500';
      case 'intermediate': return 'text-yellow-400 border-yellow-500';
      case 'advanced': return 'text-orange-400 border-orange-500';
      case 'expert': return 'text-red-400 border-red-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">Template Library</h1>
                <p className="text-gray-400">Professional video templates and assets</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                <Package className="mr-1 h-3 w-3" />
                {templates.length} Templates
              </Badge>
              
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Crown className="mr-1 h-3 w-3" />
                {templates.filter(t => t.premium).length} Premium
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Upload Template
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates, creators, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TEMPLATE_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.icon}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse ({sortedTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Collections ({collections.length})
              </TabsTrigger>
              <TabsTrigger value="downloads" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                My Downloads ({downloads.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                My Projects ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Marketplace
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Browse Tab */}
          <TabsContent value="browse" className="p-6">
            <div className="space-y-6">
              {/* Featured Templates */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-xl font-bold">Featured Templates</h2>
                </div>
                
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {sortedTemplates.filter(t => t.featured).map((template) => (
                    <Card key={template.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                      <div className="relative">
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-48 object-cover rounded-t-lg bg-gray-700"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-t-lg" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {template.featured && (
                            <Badge className="bg-yellow-500 text-black">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                          {template.premium && (
                            <Badge className="bg-purple-500">
                              <Crown className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setPreviewOpen(true)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm line-clamp-1">{template.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-yellow-400">
                            <Star className="h-3 w-3 fill-current" />
                            {template.stats.rating}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={template.creator.avatar}
                              alt={template.creator.name}
                              className="w-5 h-5 rounded-full bg-gray-600"
                            />
                            <span className="text-xs text-gray-400">{template.creator.name}</span>
                            {template.creator.verified && (
                              <CheckCircle className="h-3 w-3 text-blue-400" />
                            )}
                          </div>
                          <Badge variant="outline" className={getComplexityColor(template.metadata.complexity)}>
                            {template.metadata.complexity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <span>{template.metadata.duration}s • {template.metadata.resolution}</span>
                          <span>{formatFileSize(template.metadata.fileSize)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {template.pricing.type === 'free' ? (
                              <span className="text-green-400 font-semibold">Free</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                {template.pricing.originalPrice && (
                                  <span className="text-gray-500 line-through text-xs">
                                    {formatPrice(template.pricing.originalPrice)}
                                  </span>
                                )}
                                <span className="text-white font-semibold">
                                  {formatPrice(template.pricing.price)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleTemplateSelect(template)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" onClick={() => handleTemplateDownload(template)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* All Templates */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">All Templates</h2>
                  <span className="text-gray-400">{sortedTemplates.length} templates found</span>
                </div>
                
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {sortedTemplates.map((template) => (
                    <Card key={template.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                      {/* Similar template card structure as above */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">
                            {template.pricing.type === 'free' ? 'Free' : formatPrice(template.pricing.price)}
                          </span>
                          <Button size="sm" onClick={() => handleTemplateDownload(template)}>
                            <Download className="mr-1 h-3 w-3" />
                            Get
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <img
                      src={collection.thumbnail}
                      alt={collection.name}
                      className="w-full h-32 object-cover rounded mb-3 bg-gray-700"
                    />
                    <h3 className="font-semibold mb-2">{collection.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{collection.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{collection.stats.templates} templates</span>
                      <span>{collection.stats.likes} likes</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Downloads Tab */}
          <TabsContent value="downloads" className="p-6">
            <div className="space-y-4">
              {downloads.map((download) => (
                <Card key={download.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{download.templateName}</h3>
                        <p className="text-sm text-gray-400">
                          Downloaded {download.downloadedAt.toLocaleDateString()} • 
                          Version {download.version} • 
                          {download.license} license
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          download.status === 'completed' ? 'default' :
                          download.status === 'downloading' ? 'secondary' :
                          'destructive'
                        }>
                          {download.status}
                        </Badge>
                        {download.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="p-6">
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-gray-400">
                          Created {project.createdAt.toLocaleDateString()} • 
                          Last modified {project.lastModified.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        project.status === 'completed' ? 'default' :
                        project.status === 'in-progress' ? 'secondary' :
                        'outline'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Edit className="mr-1 h-3 w-3" />
                        Continue Editing
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Template Marketplace</h3>
              <p>Buy and sell professional video templates</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}