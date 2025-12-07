// Stub module - system settings for admin panel

// Interface antiga usada por alguns componentes
export interface SystemSettingsData {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  backgroundColor: string
  textColor: string
  logoUrl?: string
  faviconUrl?: string
  companyName: string
  tagline?: string
  fontFamily: string
  subtitle?: string
  websiteUrl?: string
  supportEmail?: string
  documentTitle?: string
  version?: string
  isActive?: boolean
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
}

export interface SystemSettings {
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  branding: {
    logoUrl: string
    faviconUrl: string
    companyName: string
    tagline: string
  }
  features: {
    analyticsEnabled: boolean
    notificationsEnabled: boolean
    aiAssistantEnabled: boolean
    collaborationEnabled: boolean
  }
  defaults: {
    language: string
    timezone: string
    dateFormat: string
    videoQuality: string
  }
}

export const defaultSystemSettings: SystemSettings = {
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#6366F1',
    accentColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  },
  branding: {
    logoUrl: '/logo.png',
    faviconUrl: '/favicon.ico',
    companyName: 'TécnicoCursos',
    tagline: 'Educação profissional de qualidade'
  },
  features: {
    analyticsEnabled: true,
    notificationsEnabled: true,
    aiAssistantEnabled: true,
    collaborationEnabled: true
  },
  defaults: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    videoQuality: '1080p'
  }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  // In production, this would fetch from database
  return defaultSystemSettings
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  // In production, this would update database
  return { ...defaultSystemSettings, ...settings }
}
