type SyncOperationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type SyncOperation = {
  id: string
  type: string
  data?: Record<string, unknown>
  status: SyncOperationStatus
  retries: number
  lastError?: string
}

class IndexedDBManager {
  private initialized = false
  private projects = new Map<string, Record<string, unknown>>()
  private settings = new Map<string, unknown>()
  private operations: SyncOperation[] = []

  async initialize() {
    if (this.initialized) return
    this.initialized = true
  }

  isInitialized() {
    return this.initialized
  }

  async getStorageStats() {
    return {
      usage: this.projects.size,
      pendingSync: this.operations.filter((op) => op.status !== 'completed').length,
      lastUpdatedAt: this.settings.get('lastSyncDate') ?? null,
    }
  }

  async saveProject(project: Record<string, unknown> & { id?: string }) {
    if (!project?.id) return
    this.projects.set(project.id, project)
  }

  async getProject(id: string) {
    return this.projects.get(id) ?? null
  }

  async saveSetting(key: string, value: unknown) {
    this.settings.set(key, value)
  }

  async getSetting<T = unknown>(key: string): Promise<T | null> {
    return (this.settings.get(key) as T) ?? null
  }

  async queueSyncOperation(operation: Omit<SyncOperation, 'status' | 'retries'>) {
    const finalOp: SyncOperation = {
      ...operation,
      status: 'pending',
      retries: 0,
    }
    this.operations.push(finalOp)
    return finalOp
  }

  async getPendingSyncOperations() {
    return this.operations.filter((op) => op.status === 'pending')
  }

  async updateSyncOperation(id: string, patch: Partial<SyncOperation>) {
    const target = this.operations.find((op) => op.id === id)
    if (!target) return
    Object.assign(target, patch)
  }

  async clearCompletedSyncOperations() {
    const before = this.operations.length
    this.operations = this.operations.filter((op) => op.status !== 'completed')
    return before - this.operations.length
  }
}

export const offlineDB = new IndexedDBManager()
