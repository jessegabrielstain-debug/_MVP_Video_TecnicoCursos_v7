type PreferencePayload = {
  theme?: 'light' | 'dark' | 'system'
  lastTourStep?: string
  onboardingCompleted?: boolean
}

const STORAGE_KEY = 'user-preferences-cache'
let memoryCache: PreferencePayload = {}

const readFromStorage = (): PreferencePayload => {
  if (typeof window === 'undefined') return memoryCache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return memoryCache
    const parsed = JSON.parse(raw)
    memoryCache = { ...memoryCache, ...parsed }
  } catch {
    // ignore
  }
  return memoryCache
}

const persistToStorage = (data: PreferencePayload) => {
  memoryCache = { ...memoryCache, ...data }
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache))
  } catch {
    // ignore storage quota errors
  }
}

export const userPreferencesCache = {
  get: (): PreferencePayload => {
    return readFromStorage()
  },
  update: (payload: PreferencePayload) => {
    persistToStorage(payload)
  },
  clear: () => {
    memoryCache = {}
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  },
}
