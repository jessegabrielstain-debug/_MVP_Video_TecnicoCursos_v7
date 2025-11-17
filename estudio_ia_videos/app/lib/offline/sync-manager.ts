import { offlineDB } from './indexeddb-manager'

type SyncManagerOptions = {
  autoSync?: boolean
  syncInterval?: number
  maxRetries?: number
}

class SyncManager {
  private initialized = false
  private options: SyncManagerOptions = {}
  private lastSyncAt: number | null = null

  async initialize(options: SyncManagerOptions = {}) {
    if (!offlineDB.isInitialized()) {
      await offlineDB.initialize()
    }

    this.options = options
    this.initialized = true
  }

  async syncAll() {
    if (!this.initialized) {
      await this.initialize()
    }

    const pending = await offlineDB.getPendingSyncOperations()
    await Promise.all(
      pending.map(async (operation) => {
        await offlineDB.updateSyncOperation(operation.id, { status: 'processing' })
        await offlineDB.updateSyncOperation(operation.id, { status: 'completed' })
      }),
    )

    this.lastSyncAt = Date.now()

    return {
      processed: pending.length,
      lastSyncAt: this.lastSyncAt,
    }
  }

  async forceSyncNow() {
    return this.syncAll()
  }

  getStatus() {
    return {
      initialized: this.initialized,
      lastSyncAt: this.lastSyncAt,
      options: this.options,
    }
  }
}

export const syncManager = new SyncManager()
