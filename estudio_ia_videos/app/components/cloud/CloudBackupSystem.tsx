/**
 * 🔄 Cloud Backup System - Automated backup and sync management
 * Professional backup automation with multi-provider redundancy
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
import { 
  Shield, 
  RefreshCw, 
  Clock, 
  Archive, 
  Copy,
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Calendar,
  FileText,
  Database,
  Zap,
  Settings,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Cloud,
  Server,
  Activity,
  BarChart3,
  TrendingUp,
  Eye,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  Lock,
  Unlock,
  Globe,
  Wifi,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Backup System Types
interface BackupRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sourceProvider: string;
  targetProviders: string[];
  sourcePaths: string[];
  backupType: BackupType;
  schedule: BackupSchedule;
  retention: RetentionPolicy;
  encryption: EncryptionConfig;
  filters: BackupFilter[];
  lastRun?: Date;
  nextRun?: Date;
  status: BackupStatus;
}

interface BackupJob {
  id: string;
  ruleId: string;
  ruleName: string;
  type: BackupType;
  status: JobStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  stats: BackupStats;
  files: BackupFile[];
}

interface BackupStats {
  totalFiles: number;
  processedFiles: number;
  totalSize: number;
  processedSize: number;
  skippedFiles: number;
  failedFiles: number;
  transferSpeed: number;
  eta: number;
}

interface BackupFile {
  path: string;
  size: number;
  status: FileBackupStatus;
  progress: number;
  error?: string;
}

interface BackupSchedule {
  type: ScheduleType;
  interval: number;
  time?: string;
  days?: number[];
  timezone: string;
  enabled: boolean;
}

interface RetentionPolicy {
  keepDaily: number;
  keepWeekly: number;
  keepMonthly: number;
  keepYearly: number;
  maxVersions: number;
  deleteAfterDays?: number;
}

interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keySize: number;
  passwordProtected: boolean;
}

interface BackupFilter {
  type: FilterType;
  pattern: string;
  include: boolean;
}

interface RestoreJob {
  id: string;
  backupId: string;
  targetPath: string;
  status: JobStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  stats: RestoreStats;
}

interface RestoreStats {
  totalFiles: number;
  restoredFiles: number;
  totalSize: number;
  restoredSize: number;
  failedFiles: number;
  transferSpeed: number;
  eta: number;
}

interface BackupSnapshot {
  id: string;
  ruleId: string;
  createdAt: Date;
  size: number;
  fileCount: number;
  encrypted: boolean;
  checksum: string;
  provider: string;
  path: string;
  metadata: SnapshotMetadata;
}

interface SnapshotMetadata {
  version: string;
  compression: string;
  deduplication: boolean;
  incrementalFrom?: string;
  tags: string[];
}

type BackupType = 'full' | 'incremental' | 'differential' | 'mirror' | 'sync';
type BackupStatus = 'active' | 'paused' | 'error' | 'disabled';
type JobStatus = 'running' | 'completed' | 'failed' | 'paused' | 'queued';
type FileBackupStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'skipped';
type ScheduleType = 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
type FilterType = 'extension' | 'path' | 'size' | 'modified';

interface CloudBackupSystemProps {
  onBackupCompleted?: (job: BackupJob) => void;
  onRestoreCompleted?: (job: RestoreJob) => void;
  onRuleCreated?: (rule: BackupRule) => void;
}

export default function CloudBackupSystem({ 
  onBackupCompleted, 
  onRestoreCompleted, 
  onRuleCreated 
}: CloudBackupSystemProps) {
  const { toast } = useToast();
  const [backupRules, setBackupRules] = useState<BackupRule[]>([]);
  const [activeJobs, setActiveJobs] = useState<BackupJob[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'jobs' | 'snapshots' | 'restore'>('dashboard');
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Initialize demo data
  useEffect(() => {
    const demoRules: BackupRule[] = [
      {
        id: 'rule-1',
        name: 'Daily Video Backup',
        description: 'Backup all video files daily to multiple cloud providers',
        enabled: true,
        sourceProvider: 'aws-s3',
        targetProviders: ['google-cloud', 'azure-blob'],
        sourcePaths: ['/videos/', '/renders/'],
        backupType: 'incremental',
        schedule: {
          type: 'daily',
          interval: 1,
          time: '02:00',
          timezone: 'UTC',
          enabled: true
        },
        retention: {
          keepDaily: 7,
          keepWeekly: 4,
          keepMonthly: 6,
          keepYearly: 2,
          maxVersions: 10
        },
        encryption: {
          enabled: true,
          algorithm: 'AES-256',
          keySize: 256,
          passwordProtected: true
        },
        filters: [
          { type: 'extension', pattern: '.mp4,.mov,.avi', include: true },
          { type: 'size', pattern: '1GB', include: false }
        ],
        lastRun: new Date(Date.now() - 86400000),
        nextRun: new Date(Date.now() + 86400000 - (Date.now() % 86400000)),
        status: 'active'
      },
      {
        id: 'rule-2',
        name: 'Project Archive',
        description: 'Weekly full backup of completed projects',
        enabled: true,
        sourceProvider: 'google-cloud',
        targetProviders: ['aws-s3'],
        sourcePaths: ['/projects/completed/'],
        backupType: 'full',
        schedule: {
          type: 'weekly',
          interval: 1,
          time: '01:00',
          days: [0], // Sunday
          timezone: 'UTC',
          enabled: true
        },
        retention: {
          keepDaily: 0,
          keepWeekly: 8,
          keepMonthly: 12,
          keepYearly: 5,
          maxVersions: 20
        },
        encryption: {
          enabled: true,
          algorithm: 'AES-256',
          keySize: 256,
          passwordProtected: false
        },
        filters: [],
        lastRun: new Date(Date.now() - 86400000 * 7),
        nextRun: new Date(Date.now() + 86400000 * 7 - ((Date.now() % (86400000 * 7)))),
        status: 'active'
      }
    ];

    const demoJobs: BackupJob[] = [
      {
        id: 'job-1',
        ruleId: 'rule-1',
        ruleName: 'Daily Video Backup',
        type: 'incremental',
        status: 'running',
        progress: 67,
        startedAt: new Date(Date.now() - 3600000),
        stats: {
          totalFiles: 245,
          processedFiles: 164,
          totalSize: 12.5 * 1024 * 1024 * 1024, // 12.5GB
          processedSize: 8.4 * 1024 * 1024 * 1024, // 8.4GB
          skippedFiles: 12,
          failedFiles: 2,
          transferSpeed: 45.6 * 1024 * 1024, // 45.6MB/s
          eta: 1800 // 30 minutes
        },
        files: []
      }
    ];

    const demoSnapshots: BackupSnapshot[] = [
      {
        id: 'snapshot-1',
        ruleId: 'rule-1',
        createdAt: new Date(Date.now() - 86400000),
        size: 8.9 * 1024 * 1024 * 1024, // 8.9GB
        fileCount: 234,
        encrypted: true,
        checksum: 'sha256:abc123def456...',
        provider: 'google-cloud',
        path: '/backups/daily-video-backup-2025-10-10/',
        metadata: {
          version: '1.0',
          compression: 'lz4',
          deduplication: true,
          tags: ['video', 'daily', 'incremental']
        }
      },
      {
        id: 'snapshot-2',
        ruleId: 'rule-2',
        createdAt: new Date(Date.now() - 86400000 * 7),
        size: 45.2 * 1024 * 1024 * 1024, // 45.2GB
        fileCount: 1567,
        encrypted: true,
        checksum: 'sha256:def456ghi789...',
        provider: 'aws-s3',
        path: '/backups/project-archive-2025-10-04/',
        metadata: {
          version: '1.0',
          compression: 'gzip',
          deduplication: true,
          tags: ['projects', 'weekly', 'full']
        }
      }
    ];

    setBackupRules(demoRules);
    setActiveJobs(demoJobs);
    setSnapshots(demoSnapshots);
  }, []);

  // Simulate backup job progress
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          const newProgress = Math.min(100, job.progress + Math.random() * 5);
          const isCompleted = newProgress >= 100;
          
          return {
            ...job,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'running',
            stats: {
              ...job.stats,
              processedFiles: Math.floor((newProgress / 100) * job.stats.totalFiles),
              processedSize: Math.floor((newProgress / 100) * job.stats.totalSize),
              transferSpeed: 30 + Math.random() * 40,
              eta: isCompleted ? 0 : Math.ceil((100 - newProgress) * 60)
            },
            completedAt: isCompleted ? new Date() : undefined
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: BackupStatus | JobStatus) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'completed': 
        return 'text-green-400 border-green-500';
      case 'paused':
      case 'queued': 
        return 'text-yellow-400 border-yellow-500';
      case 'error':
      case 'failed': 
        return 'text-red-400 border-red-500';
      case 'disabled': 
        return 'text-gray-400 border-gray-500';
      default: 
        return 'text-gray-400 border-gray-500';
    }
  };

  // Create new backup rule
  const createBackupRule = useCallback((rule: Partial<BackupRule>) => {
    const newRule: BackupRule = {
      id: `rule-${Date.now()}`,
      name: rule.name || 'New Backup Rule',
      description: rule.description || '',
      enabled: true,
      sourceProvider: rule.sourceProvider || '',
      targetProviders: rule.targetProviders || [],
      sourcePaths: rule.sourcePaths || [],
      backupType: rule.backupType || 'incremental',
      schedule: rule.schedule || {
        type: 'daily',
        interval: 1,
        timezone: 'UTC',
        enabled: true
      },
      retention: rule.retention || {
        keepDaily: 7,
        keepWeekly: 4,
        keepMonthly: 6,
        keepYearly: 2,
        maxVersions: 10
      },
      encryption: rule.encryption || {
        enabled: true,
        algorithm: 'AES-256',
        keySize: 256,
        passwordProtected: false
      },
      filters: rule.filters || [],
      status: 'active'
    };

    setBackupRules(prev => [newRule, ...prev]);
    
    if (onRuleCreated) {
      onRuleCreated(newRule);
    }
    
    toast({
      title: "Backup rule created",
      description: `${newRule.name} has been created successfully`
    });
  }, [onRuleCreated, toast]);

  // Start backup job
  const startBackupJob = useCallback((ruleId: string) => {
    const rule = backupRules.find(r => r.id === ruleId);
    if (!rule) return;

    const job: BackupJob = {
      id: `job-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      type: rule.backupType,
      status: 'running',
      progress: 0,
      startedAt: new Date(),
      stats: {
        totalFiles: Math.floor(Math.random() * 500) + 100,
        processedFiles: 0,
        totalSize: (Math.random() * 20 + 5) * 1024 * 1024 * 1024, // 5-25GB
        processedSize: 0,
        skippedFiles: 0,
        failedFiles: 0,
        transferSpeed: 0,
        eta: 0
      },
      files: []
    };

    setActiveJobs(prev => [job, ...prev]);
    
    toast({
      title: "Backup started",
      description: `${rule.name} backup job has been started`
    });
  }, [backupRules, toast]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold">Cloud Backup System</h1>
                <p className="text-gray-400">Automated backup and sync management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                <CheckCircle className="mr-1 h-3 w-3" />
                {backupRules.filter(r => r.enabled).length} Active Rules
              </Badge>
              
              <Badge variant="outline" className={
                activeJobs.filter(j => j.status === 'running').length > 0 
                  ? 'border-blue-500 text-blue-400' 
                  : 'border-gray-500 text-gray-400'
              }>
                {activeJobs.filter(j => j.status === 'running').length > 0 ? (
                  <>
                    <Activity className="mr-1 h-3 w-3 animate-pulse" />
                    {activeJobs.filter(j => j.status === 'running').length} Running
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" />
                    Idle
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsCreatingRule(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
            
            <Button className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Run All
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Backup Rules</p>
                  <p className="text-2xl font-bold">{backupRules.length}</p>
                </div>
                <Archive className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Jobs</p>
                  <p className="text-2xl font-bold">{activeJobs.filter(j => j.status === 'running').length}</p>
                </div>
                <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Snapshots</p>
                  <p className="text-2xl font-bold">{snapshots.length}</p>
                </div>
                <Database className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Backed Up</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(snapshots.reduce((acc, s) => acc + s.size, 0))}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Rules ({backupRules.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Jobs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="snapshots" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Snapshots ({snapshots.length})
              </TabsTrigger>
              <TabsTrigger value="restore" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Restore
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Jobs */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Active Backup Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {activeJobs.filter(j => j.status === 'running').map((job) => (
                        <div key={job.id} className="p-3 bg-gray-700/50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{job.ruleName}</span>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          <Progress value={job.progress} className="h-2 mb-2" />
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>{job.stats.processedFiles}/{job.stats.totalFiles} files</span>
                            <span>{formatFileSize(job.stats.transferSpeed)}/s • {formatDuration(job.stats.eta)} remaining</span>
                          </div>
                        </div>
                      ))}
                      {activeJobs.filter(j => j.status === 'running').length === 0 && (
                        <p className="text-center text-gray-400 py-8">No active backup jobs</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Snapshots */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-green-400" />
                    Recent Snapshots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {snapshots.slice(0, 5).map((snapshot) => (
                      <div key={snapshot.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div>
                          <p className="font-medium">Backup {snapshot.createdAt.toLocaleDateString()}</p>
                          <p className="text-sm text-gray-400">
                            {formatFileSize(snapshot.size)} • {snapshot.fileCount} files
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {snapshot.encrypted && <Lock className="h-4 w-4 text-green-400" />}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Backup Rules Status */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" />
                    Backup Rules Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {backupRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className={getStatusColor(rule.status)}>
                              {rule.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            {rule.backupType} • {rule.schedule.type}
                            {rule.nextRun && ` • Next: ${rule.nextRun.toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => startBackupJob(rule.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Switch checked={rule.enabled} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    Backup Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>System Status</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Healthy
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Last Backup</span>
                      <span className="text-gray-400">2 hours ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Success Rate</span>
                      <span className="text-green-400">98.5%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Storage Used</span>
                      <span className="text-gray-400">{formatFileSize(snapshots.reduce((acc, s) => acc + s.size, 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="p-6">
            <div className="space-y-4">
              {backupRules.map((rule) => (
                <Card key={rule.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge variant="outline" className={getStatusColor(rule.status)}>
                            {rule.status}
                          </Badge>
                          <Badge variant="secondary">
                            {rule.backupType}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-400 mb-4">{rule.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Source</p>
                            <p className="font-medium">{rule.sourceProvider}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Targets</p>
                            <p className="font-medium">{rule.targetProviders.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Schedule</p>
                            <p className="font-medium">{rule.schedule.type}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Encryption</p>
                            <p className="font-medium">
                              {rule.encryption.enabled ? rule.encryption.algorithm : 'Disabled'}
                            </p>
                          </div>
                        </div>
                        
                        {rule.lastRun && (
                          <div className="mt-4 text-sm text-gray-400">
                            Last run: {rule.lastRun.toLocaleString()}
                            {rule.nextRun && ` • Next run: ${rule.nextRun.toLocaleString()}`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Switch checked={rule.enabled} />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startBackupJob(rule.id)}
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Run Now
                        </Button>
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

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="p-6">
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <Card key={job.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{job.ruleName}</h3>
                        <p className="text-gray-400">Started {job.startedAt.toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    
                    <Progress value={job.progress} className="h-2 mb-4" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Progress</p>
                        <p className="font-medium">{job.stats.processedFiles}/{job.stats.totalFiles} files</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Size</p>
                        <p className="font-medium">
                          {formatFileSize(job.stats.processedSize)}/{formatFileSize(job.stats.totalSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Speed</p>
                        <p className="font-medium">{formatFileSize(job.stats.transferSpeed)}/s</p>
                      </div>
                      <div>
                        <p className="text-gray-400">ETA</p>
                        <p className="font-medium">{formatDuration(job.stats.eta)}</p>
                      </div>
                    </div>
                    
                    {(job.stats.skippedFiles > 0 || job.stats.failedFiles > 0) && (
                      <div className="mt-4 flex gap-4 text-sm">
                        {job.stats.skippedFiles > 0 && (
                          <span className="text-yellow-400">
                            {job.stats.skippedFiles} skipped
                          </span>
                        )}
                        {job.stats.failedFiles > 0 && (
                          <span className="text-red-400">
                            {job.stats.failedFiles} failed
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {activeJobs.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No backup jobs</h3>
                  <p className="text-gray-400">Create a backup rule to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Snapshots Tab */}
          <TabsContent value="snapshots" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map((snapshot) => (
                <Card key={snapshot.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-green-400" />
                        <span className="font-medium">Snapshot</span>
                      </div>
                      {snapshot.encrypted && <Lock className="h-4 w-4 text-green-400" />}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span>{snapshot.createdAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size:</span>
                        <span>{formatFileSize(snapshot.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Files:</span>
                        <span>{snapshot.fileCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Provider:</span>
                        <span className="capitalize">{snapshot.provider.replace('-', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-3">
                      {snapshot.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="mr-1 h-3 w-3" />
                        Restore
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Restore Tab */}
          <TabsContent value="restore" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Download className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Restore Manager</h3>
              <p>Restore files and folders from backup snapshots</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}