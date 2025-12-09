import { offlineDB } from '@/lib/offline/indexeddb-manager'
import { syncManager } from '@/lib/offline/sync-manager'
import { logger } from '@/lib/logger'

type OfflineStatus = {
  storageUsedBytes: number
  storageLimitBytes: number
  pendingSync: number
  lastSync?: number | null
}

class PWAManager {
  private initialized = false
  private lastSync: number | null = null

  async initialize() {
    if (this.initialized) return

    await offlineDB.initialize()
    await syncManager.initialize({ autoSync: true })

    if (typeof window !== 'undefined') {
      logger.info('PWA manager initialized (stub)', { component: 'PWAManager' })
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        this.storageSnapshot = {
          storageUsedBytes: estimate.usage ?? 0,
          storageLimitBytes: estimate.quota ?? 0,
          pendingSync: (await offlineDB.getPendingSyncOperations()).length,
          lastSync: this.lastSync,
        }
      }
    }

    this.initialized = true
  }

  private storageSnapshot: OfflineStatus = {
    storageUsedBytes: 0,
    storageLimitBytes: 0,
    pendingSync: 0,
    lastSync: null,
  }

  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async getOfflineStatus(): Promise<OfflineStatus> {
    if (typeof window !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const pending = await offlineDB.getPendingSyncOperations()
      this.storageSnapshot = {
        storageUsedBytes: estimate.usage ?? this.storageSnapshot.storageUsedBytes,
        storageLimitBytes: estimate.quota ?? this.storageSnapshot.storageLimitBytes,
        pendingSync: pending.length,
        lastSync: this.lastSync,
      }
    }

    return this.storageSnapshot
  }

  async forceSyncNow() {
    await syncManager.syncAll()
    this.lastSync = Date.now()
  }

  isInitialized() {
    return this.initialized
  }
}

export const pwaManager = new PWAManager()
