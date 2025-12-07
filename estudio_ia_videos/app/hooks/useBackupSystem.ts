'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRealTimeCollaboration } from './useRealTimeCollaboration';
import type { SerializedProjectState } from './useRealTimeCollaboration';

export interface RestorePreview {
  versionId: string;
  estimatedDuration: number;
  dataSize: number;
  changes: BackupChange[];
  warnings: string[];
}

export interface ProjectBackupPayload {
  id: string;
  timestamp: Date;
  data: SerializedProjectState;
  compressed?: CompressedBackupData;
}

export type CompressedBackupData = string | Record<string, unknown> | Array<unknown>;

// Interfaces para Backup System
export interface BackupVersion {
  id: string;
  projectId: string;
  version: string;
  timestamp: Date;
  size: number;
  type: 'auto' | 'manual' | 'milestone';
  description?: string;
  changes: BackupChange[];
  metadata: {
    author: string;
    device: string;
    platform: string;
    appVersion: string;
  };
  checksum: string;
  compressed: boolean;
  tags: string[];
}

export interface BackupChange {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
  author: string;
}

export interface RestorePoint {
  id: string;
  projectId: string;
  name: string;
  description: string;
  timestamp: Date;
  versionId: string;
  automatic: boolean;
  stable: boolean;
  tags: string[];
}

export interface BackupConfig {
  autoBackup: boolean;
  interval: number; // em minutos
  maxVersions: number;
  compression: boolean;
  cloudSync: boolean;
  incrementalBackup: boolean;
  restorePointInterval: number; // em horas
  retentionPolicy: {
    daily: number; // dias
    weekly: number; // semanas
    monthly: number; // meses
  };
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  type: 'upload' | 'download' | 'conflict';
  message: string;
  timestamp: Date;
  resolved: boolean;
  versionId?: string;
}

export interface BackupStats {
  totalVersions: number;
  totalSize: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  autoBackups: number;
  manualBackups: number;
  restorePoints: number;
  cloudBackups: number;
  localBackups: number;
}

export interface ConflictResolution {
  id: string;
  localVersion: BackupVersion;
  remoteVersion: BackupVersion;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  mergedData?: Record<string, unknown>;
}

export interface UseBackupSystemReturn {
  // Estado
  versions: BackupVersion[];
  restorePoints: RestorePoint[];
  config: BackupConfig;
  syncStatus: SyncStatus;
  stats: BackupStats;
  isBackingUp: boolean;
  isRestoring: boolean;
  
  // Backup
  createBackup: (type: 'auto' | 'manual' | 'milestone', description?: string) => Promise<BackupVersion>;
  createRestorePoint: (name: string, description?: string) => Promise<RestorePoint>;
  scheduleAutoBackup: () => void;
  stopAutoBackup: () => void;
  
  // Restore
  restoreVersion: (versionId: string) => Promise<boolean>;
  restoreToPoint: (restorePointId: string) => Promise<boolean>;
  previewRestore: (versionId: string) => Promise<RestorePreview>;
  
  // Versioning
  getVersionHistory: (projectId: string) => Promise<BackupVersion[]>;
  compareVersions: (versionA: string, versionB: string) => Promise<BackupChange[]>;
  getVersionDiff: (versionId: string) => Promise<BackupChange[]>;
  
  // Cloud Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  
  // Management
  deleteVersion: (versionId: string) => Promise<boolean>;
  deleteOldVersions: (olderThan: Date) => Promise<number>;
  compressVersion: (versionId: string) => Promise<boolean>;
  exportBackup: (versionId: string, format: 'zip' | 'json') => Promise<Blob>;
  importBackup: (file: File) => Promise<BackupVersion>;
  
  // Configuration
  updateConfig: (newConfig: Partial<BackupConfig>) => void;
  resetConfig: () => void;
  
  // Utilities
  calculateStorageUsage: () => Promise<number>;
  cleanupStorage: () => Promise<void>;
  validateBackup: (versionId: string) => Promise<boolean>;
  repairBackup: (versionId: string) => Promise<boolean>;
  
  // Monitoring
  getBackupStats: () => Promise<BackupStats>;
  getHealthStatus: () => Promise<'healthy' | 'warning' | 'error'>;
  
  // Real-time
  onBackupCreated: (callback: (version: BackupVersion) => void) => () => void;
  onRestoreCompleted: (callback: (success: boolean) => void) => () => void;
  onSyncStatusChanged: (callback: (status: SyncStatus) => void) => () => void;
}

export const useBackupSystem = (projectId: string): UseBackupSystemReturn => {
  const [versions, setVersions] = useState<BackupVersion[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    autoBackup: true,
    interval: 15, // 15 minutos
    maxVersions: 50,
    compression: true,
    cloudSync: true,
    incrementalBackup: true,
    restorePointInterval: 2, // 2 horas
    retentionPolicy: {
      daily: 7,
      weekly: 4,
      monthly: 6,
    },
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    syncInProgress: false,
    errors: [],
  });
  const [stats, setStats] = useState<BackupStats>({
    totalVersions: 0,
    totalSize: 0,
    oldestBackup: null,
    newestBackup: null,
    autoBackups: 0,
    manualBackups: 0,
    restorePoints: 0,
    cloudBackups: 0,
    localBackups: 0,
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const { broadcastUpdate } = useRealTimeCollaboration(projectId);
  const autoBackupInterval = useRef<NodeJS.Timeout | null>(null);
  const restorePointInterval = useRef<NodeJS.Timeout | null>(null);
  const eventCallbacks = useRef<{
    onBackupCreated: ((version: BackupVersion) => void)[];
    onRestoreCompleted: ((success: boolean) => void)[];
    onSyncStatusChanged: ((status: SyncStatus) => void)[];
  }>({
    onBackupCreated: [],
    onRestoreCompleted: [],
    onSyncStatusChanged: [],
  });

  const generateRandomId = (prefix: string): string => {
    const randomSegment =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    return `${prefix}_${randomSegment}`;
  };

  // Inicialização
  useEffect(() => {
    loadVersionHistory();
    loadRestorePoints();
    loadConfig();
    setupNetworkMonitoring();
    
    if (config.autoBackup) {
      scheduleAutoBackup();
    }
    
    return () => {
      if (autoBackupInterval.current) {
        clearInterval(autoBackupInterval.current);
      }
      if (restorePointInterval.current) {
        clearInterval(restorePointInterval.current);
      }
    };
  }, [projectId]);

  const loadVersionHistory = useCallback(async () => {
    try {
      // Carregar do localStorage e cloud
      const rawVersions = JSON.parse(
        localStorage.getItem(`backup_versions_${projectId}`) || '[]'
      ) as unknown;

      if (Array.isArray(rawVersions)) {
        const deserialized = rawVersions.map(entry => {
          const version = entry as Partial<BackupVersion> & { timestamp?: string };
          const changes = Array.isArray(version?.changes)
            ? version.changes.map(changeEntry => {
                const change = changeEntry as Partial<BackupChange> & { timestamp?: string };
                return {
                  id: change?.id ?? generateRandomId('change'),
                  type: change?.type ?? 'update',
                  path: change?.path ?? '',
                  oldValue: change?.oldValue,
                  newValue: change?.newValue,
                  timestamp: change?.timestamp ? new Date(change.timestamp) : new Date(),
                  author: change?.author ?? 'unknown',
                } satisfies BackupChange;
              })
            : [];

          return {
            id: version?.id ?? generateRandomId('backup'),
            projectId: version?.projectId ?? projectId,
            version: version?.version ?? 'v0.0.0.0',
            timestamp: version?.timestamp ? new Date(version.timestamp) : new Date(),
            size: typeof version?.size === 'number' ? version.size : 0,
            type: version?.type ?? 'manual',
            description: version?.description,
            changes,
            metadata: version?.metadata ?? {
              author: 'unknown',
              device: 'unknown',
              platform: 'unknown',
              appVersion: 'unknown',
            },
            checksum: version?.checksum ?? '',
            compressed: Boolean(version?.compressed),
            tags: Array.isArray(version?.tags) ? version.tags : [],
          } satisfies BackupVersion;
        });

        setVersions(deserialized);
      }
      
      updateStats();
    } catch (error) {
      console.error('Erro ao carregar histórico de versões:', error);
    }
  }, [projectId]);

  const loadRestorePoints = useCallback(async () => {
    try {
      const rawPoints = JSON.parse(
        localStorage.getItem(`restore_points_${projectId}`) || '[]'
      ) as unknown;

      if (Array.isArray(rawPoints)) {
        const deserialized = rawPoints.map(entry => {
          const point = entry as Partial<RestorePoint> & { timestamp?: string };
          return {
            id: point?.id ?? generateRandomId('restore'),
            projectId: point?.projectId ?? projectId,
            name: point?.name ?? 'Restore Point',
            description: point?.description ?? '',
            timestamp: point?.timestamp ? new Date(point.timestamp) : new Date(),
            versionId: point?.versionId ?? '',
            automatic: Boolean(point?.automatic),
            stable: point?.stable ?? true,
            tags: Array.isArray(point?.tags) ? point.tags : [],
          } satisfies RestorePoint;
        });

        setRestorePoints(deserialized);
      }
    } catch (error) {
      console.error('Erro ao carregar restore points:', error);
    }
  }, [projectId]);

  const loadConfig = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem('backup_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<BackupConfig> | null;
        if (parsed) {
          setConfig(prev => ({
            autoBackup: parsed.autoBackup ?? prev.autoBackup,
            interval: parsed.interval ?? prev.interval,
            maxVersions: parsed.maxVersions ?? prev.maxVersions,
            compression: parsed.compression ?? prev.compression,
            cloudSync: parsed.cloudSync ?? prev.cloudSync,
            incrementalBackup: parsed.incrementalBackup ?? prev.incrementalBackup,
            restorePointInterval: parsed.restorePointInterval ?? prev.restorePointInterval,
            retentionPolicy: {
              daily: parsed.retentionPolicy?.daily ?? prev.retentionPolicy.daily,
              weekly: parsed.retentionPolicy?.weekly ?? prev.retentionPolicy.weekly,
              monthly: parsed.retentionPolicy?.monthly ?? prev.retentionPolicy.monthly,
            },
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  }, []);

  const setupNetworkMonitoring = useCallback(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const createBackup = useCallback(async (
    type: 'auto' | 'manual' | 'milestone',
    description?: string
  ): Promise<BackupVersion> => {
    setIsBackingUp(true);
    
    try {
      // Obter dados do projeto atual
      const projectData = await getCurrentProjectData();

      // Calcular mudanças desde último backup
      const changes = await calculateChanges(projectData);

      const timestamp = new Date();
      const dataSize = calculateDataSize(projectData);

      // Criar nova versão
      const newVersion: BackupVersion = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        version: generateVersionNumber(),
        timestamp,
        size: dataSize,
        type,
        description,
        changes,
        metadata: {
          author: 'current-user', // Obter do contexto de auth
          device: navigator.userAgent,
          platform: navigator.platform,
          appVersion: '1.0.0',
        },
        checksum: await calculateChecksum(projectData),
        compressed: config.compression,
        tags: [],
      };

      const backupPayload: ProjectBackupPayload = {
        id: newVersion.id,
        timestamp,
        data: projectData,
      };

      // Comprimir se necessário
      if (config.compression) {
        const compressedData = await compressData(projectData);
        backupPayload.compressed = compressedData;
      }

      // Salvar localmente
      await saveVersionLocally(newVersion, backupPayload);
      
      // Atualizar lista de versões
      setVersions(prev => {
        const updated = [newVersion, ...prev];
        
        // Aplicar política de retenção
        const retained = applyRetentionPolicy(updated);
        
        // Salvar no localStorage
        localStorage.setItem(
          `backup_versions_${projectId}`,
          JSON.stringify(retained)
        );
        
        return retained;
      });

      // Sync para cloud se habilitado
      if (config.cloudSync && syncStatus.isOnline) {
        syncToCloud();
      }

      // Notificar callbacks
      eventCallbacks.current.onBackupCreated.forEach(callback => {
        callback(newVersion);
      });

      // Broadcast para colaboradores
      broadcastUpdate('backup-created', newVersion);

      updateStats();
      
      return newVersion;
    } finally {
      setIsBackingUp(false);
    }
  }, [projectId, config, syncStatus.isOnline, broadcastUpdate]);

  const createRestorePoint = useCallback(async (
    name: string,
    description?: string
  ): Promise<RestorePoint> => {
    // Criar backup primeiro
    const backup = await createBackup('milestone', `Restore Point: ${name}`);
    
    const restorePoint: RestorePoint = {
      id: `restore_${Date.now()}`,
      projectId,
      name,
      description: description || '',
      timestamp: new Date(),
      versionId: backup.id,
      automatic: false,
      stable: true,
      tags: ['manual'],
    };

    setRestorePoints(prev => {
      const updated = [restorePoint, ...prev];
      localStorage.setItem(
        `restore_points_${projectId}`,
        JSON.stringify(updated)
      );
      return updated;
    });

    return restorePoint;
  }, [projectId, createBackup]);

  const scheduleAutoBackup = useCallback(() => {
    if (autoBackupInterval.current) {
      clearInterval(autoBackupInterval.current);
    }

    autoBackupInterval.current = setInterval(async () => {
      if (config.autoBackup) {
        try {
          await createBackup('auto', 'Backup automático');
        } catch (error) {
          console.error('Erro no backup automático:', error);
        }
      }
    }, config.interval * 60 * 1000); // Converter minutos para ms

    // Agendar restore points automáticos
    if (restorePointInterval.current) {
      clearInterval(restorePointInterval.current);
    }

    restorePointInterval.current = setInterval(async () => {
      try {
        await createRestorePoint(
          `Auto Restore Point ${new Date().toLocaleString()}`,
          'Restore point automático'
        );
      } catch (error) {
        console.error('Erro ao criar restore point automático:', error);
      }
    }, config.restorePointInterval * 60 * 60 * 1000); // Converter horas para ms
  }, [config.autoBackup, config.interval, config.restorePointInterval, createBackup, createRestorePoint]);

  const stopAutoBackup = useCallback(() => {
    if (autoBackupInterval.current) {
      clearInterval(autoBackupInterval.current);
      autoBackupInterval.current = null;
    }
    
    if (restorePointInterval.current) {
      clearInterval(restorePointInterval.current);
      restorePointInterval.current = null;
    }
  }, []);

  const restoreVersion = useCallback(async (versionId: string): Promise<boolean> => {
    setIsRestoring(true);
    
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error('Versão não encontrada');
      }

      // Carregar dados da versão
      const versionData = await loadVersionData(versionId);
      
      if (!versionData) {
        throw new Error('Dados da versão não encontrados');
      }

      // Criar backup do estado atual antes de restaurar
      await createBackup('manual', `Backup antes de restaurar para ${version.version}`);
      
      // Aplicar dados da versão
      await applyVersionData(versionData);
      
      // Notificar callbacks
      eventCallbacks.current.onRestoreCompleted.forEach(callback => {
        callback(true);
      });

      // Broadcast para colaboradores
      broadcastUpdate('version-restored', { versionId, timestamp: new Date() });
      
      return true;
    } catch (error) {
      console.error('Erro ao restaurar versão:', error);
      
      eventCallbacks.current.onRestoreCompleted.forEach(callback => {
        callback(false);
      });
      
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [versions, createBackup, broadcastUpdate]);

  const restoreToPoint = useCallback(async (restorePointId: string): Promise<boolean> => {
    const restorePoint = restorePoints.find(p => p.id === restorePointId);
    if (!restorePoint) {
      throw new Error('Restore point não encontrado');
    }

    return restoreVersion(restorePoint.versionId);
  }, [restorePoints, restoreVersion]);

  const syncToCloud = useCallback(async () => {
    if (!syncStatus.isOnline) {
      throw new Error('Sem conexão com a internet');
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Implementar sync real com Supabase
      const pendingVersions = versions.filter(v => !v.metadata.device.includes('cloud'));
      
      for (const version of pendingVersions) {
        // Upload para cloud storage
        await uploadVersionToCloud(version);
      }

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        pendingUploads: 0,
        syncInProgress: false,
      }));

      eventCallbacks.current.onSyncStatusChanged.forEach(callback => {
        callback(syncStatus);
      });
    } catch (error) {
      console.error('Erro no sync para cloud:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        errors: [...prev.errors, {
          id: `error_${Date.now()}`,
          type: 'upload',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date(),
          resolved: false,
        }],
      }));
    }
  }, [syncStatus.isOnline, versions]);

  const updateStats = useCallback(() => {
    const newStats: BackupStats = {
      totalVersions: versions.length,
      totalSize: versions.reduce((sum, v) => sum + v.size, 0),
      oldestBackup: versions.length > 0 ? new Date(Math.min(...versions.map(v => v.timestamp.getTime()))) : null,
      newestBackup: versions.length > 0 ? new Date(Math.max(...versions.map(v => v.timestamp.getTime()))) : null,
      autoBackups: versions.filter(v => v.type === 'auto').length,
      manualBackups: versions.filter(v => v.type === 'manual').length,
      restorePoints: restorePoints.length,
      cloudBackups: versions.filter(v => v.metadata.device.includes('cloud')).length,
      localBackups: versions.filter(v => !v.metadata.device.includes('cloud')).length,
    };

    setStats(newStats);
  }, [versions, restorePoints]);

  // Funções auxiliares
  const getCurrentProjectData = async () => {
    // Implementar obtenção dos dados atuais do projeto
    return {
      id: projectId,
      timestamp: new Date(),
      data: {}, // Dados reais do projeto
    };
  };

  const calculateChanges = async (
    projectData: SerializedProjectState
  ): Promise<BackupChange[]> => {
    // Implementar cálculo de mudanças
    return [];
  };

  const generateVersionNumber = (): string => {
    const now = new Date();
    return `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${versions.length + 1}`;
  };

  const calculateDataSize = (
    data: SerializedProjectState | CompressedBackupData
  ): number => {
    if (typeof data === 'string') {
      return data.length;
    }

    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  };

  const calculateChecksum = async (
    data: SerializedProjectState | CompressedBackupData
  ): Promise<string> => {
    const encoder = new TextEncoder();
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    const dataBuffer = encoder.encode(serialized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const compressData = async (
    data: SerializedProjectState
  ): Promise<CompressedBackupData> => {
    // Implementar compressão real
    return data;
  };

  const saveVersionLocally = async (
    version: BackupVersion,
    data: ProjectBackupPayload
  ) => {
    const payload = {
      ...data,
      timestamp: data.timestamp.toISOString(),
    };

    localStorage.setItem(`backup_data_${version.id}`, JSON.stringify(payload));
  };

  const loadVersionData = async (
    versionId: string
  ): Promise<ProjectBackupPayload | null> => {
    const data = localStorage.getItem(`backup_data_${versionId}`);
    if (!data) {
      return null;
    }

    try {
      const parsed = JSON.parse(data) as Partial<ProjectBackupPayload> & {
        timestamp?: string;
      };

      return {
        id: parsed?.id ?? versionId,
        timestamp: parsed?.timestamp ? new Date(parsed.timestamp) : new Date(),
        data: (parsed?.data ?? {}) as SerializedProjectState,
        compressed: parsed?.compressed,
      } satisfies ProjectBackupPayload;
    } catch (error) {
      console.error('Erro ao carregar dados do backup:', error);
      return null;
    }
  };

  const applyVersionData = async (payload: ProjectBackupPayload) => {
    // Implementar aplicação dos dados restaurados
    console.log('Aplicando dados da versão:', payload);
  };

  const applyRetentionPolicy = (versions: BackupVersion[]): BackupVersion[] => {
    // Implementar política de retenção
    return versions.slice(0, config.maxVersions);
  };

  const uploadVersionToCloud = async (version: BackupVersion) => {
    // Implementar upload real para Supabase
    console.log('Uploading version to cloud:', version.id);
  };

  const estimateRestoreDuration = (size: number): number => {
    const seconds = Math.ceil(size / 1024);
    return Math.max(15, Math.min(300, seconds));
  };

  const buildRestoreWarnings = (
    version: BackupVersion,
    payload: ProjectBackupPayload
  ): string[] => {
    const warnings: string[] = [];

    if (!payload.data || Object.keys(payload.data).length === 0) {
      warnings.push('Backup vazio ou sem dados detectados.');
    }

    if (version.compressed && !payload.compressed) {
      warnings.push('Backup marcado como comprimido mas dado comprimido ausente.');
    }

    return warnings;
  };

  return {
    // Estado
    versions,
    restorePoints,
    config,
    syncStatus,
    stats,
    isBackingUp,
    isRestoring,
    
    // Backup
    createBackup,
    createRestorePoint,
    scheduleAutoBackup,
    stopAutoBackup,
    
    // Restore
    restoreVersion,
    restoreToPoint,
    previewRestore: async (versionId) => {
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error('Versão não encontrada para preview');
      }

      const payload = await loadVersionData(versionId);
      if (!payload) {
        throw new Error('Dados do backup não encontrados para preview');
      }

      const previewSize = calculateDataSize(payload.compressed ?? payload.data);

      return {
        versionId,
        estimatedDuration: estimateRestoreDuration(previewSize),
        dataSize: previewSize,
        changes: version.changes,
        warnings: buildRestoreWarnings(version, payload),
      } satisfies RestorePreview;
    },
    
    // Versioning
    getVersionHistory: async () => versions,
    compareVersions: async () => [], // Implementar
    getVersionDiff: async () => [], // Implementar
    
    // Cloud Sync
    syncToCloud,
    syncFromCloud: async () => {}, // Implementar
    resolveConflict: async () => {}, // Implementar
    
    // Management
    deleteVersion: async (versionId) => {
      setVersions(prev => prev.filter(v => v.id !== versionId));
      localStorage.removeItem(`backup_data_${versionId}`);
      return true;
    },
    deleteOldVersions: async (olderThan) => {
      const toDelete = versions.filter(v => v.timestamp < olderThan);
      toDelete.forEach(v => localStorage.removeItem(`backup_data_${v.id}`));
      setVersions(prev => prev.filter(v => v.timestamp >= olderThan));
      return toDelete.length;
    },
    compressVersion: async () => true, // Implementar
    exportBackup: async () => new Blob(), // Implementar
    importBackup: async () => ({} as BackupVersion), // Implementar
    
    // Configuration
    updateConfig: (newConfig) => {
      const updated = { ...config, ...newConfig };
      setConfig(updated);
      localStorage.setItem('backup_config', JSON.stringify(updated));
      
      if (updated.autoBackup !== config.autoBackup) {
        if (updated.autoBackup) {
          scheduleAutoBackup();
        } else {
          stopAutoBackup();
        }
      }
    },
    resetConfig: () => {
      const defaultConfig: BackupConfig = {
        autoBackup: true,
        interval: 15,
        maxVersions: 50,
        compression: true,
        cloudSync: true,
        incrementalBackup: true,
        restorePointInterval: 2,
        retentionPolicy: { daily: 7, weekly: 4, monthly: 6 },
      };
      setConfig(defaultConfig);
      localStorage.setItem('backup_config', JSON.stringify(defaultConfig));
    },
    
    // Utilities
    calculateStorageUsage: async () => stats.totalSize,
    cleanupStorage: async () => {}, // Implementar
    validateBackup: async () => true, // Implementar
    repairBackup: async () => true, // Implementar
    
    // Monitoring
    getBackupStats: async () => stats,
    getHealthStatus: async () => 'healthy' as const, // Implementar
    
    // Real-time
    onBackupCreated: (callback) => {
      eventCallbacks.current.onBackupCreated.push(callback);
      return () => {
        eventCallbacks.current.onBackupCreated = 
          eventCallbacks.current.onBackupCreated.filter(cb => cb !== callback);
      };
    },
    onRestoreCompleted: (callback) => {
      eventCallbacks.current.onRestoreCompleted.push(callback);
      return () => {
        eventCallbacks.current.onRestoreCompleted = 
          eventCallbacks.current.onRestoreCompleted.filter(cb => cb !== callback);
      };
    },
    onSyncStatusChanged: (callback) => {
      eventCallbacks.current.onSyncStatusChanged.push(callback);
      return () => {
        eventCallbacks.current.onSyncStatusChanged = 
          eventCallbacks.current.onSyncStatusChanged.filter(cb => cb !== callback);
      };
    },
  };
};