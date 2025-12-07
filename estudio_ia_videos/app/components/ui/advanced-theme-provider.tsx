'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'pro' | 'system'

interface ThemeColors {
  canvas: string
  toolbar: string
  sidebar: string
  accent: string
  text: string
  textSecondary: string
  border: string
  background: string
  surface: string
}

const themes: Record<Exclude<Theme, 'system'>, ThemeColors> = {
  light: {
    canvas: '#ffffff',
    toolbar: '#f8f9fa',
    sidebar: '#f1f3f4',
    accent: '#6366f1',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    background: '#ffffff',
    surface: '#f9fafb'
  },
  dark: {
    canvas: '#1a1a1a',
    toolbar: '#2d2d2d',
    sidebar: '#242424',
    accent: '#8b5cf6',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: '#374151',
    background: '#111111',
    surface: '#1f1f1f'
  },
  pro: {
    canvas: '#0f0f23',
    toolbar: '#1a1a2e',
    sidebar: '#16213e',
    accent: '#e94560',
    text: '#eeeeff',
    textSecondary: '#9ca3af',
    border: '#2d3748',
    background: '#0a0a1a',
    surface: '#141428'
  }
}

interface ThemeContextType {
  theme: Theme
  actualTheme: Exclude<Theme, 'system'>
  colors: ThemeColors
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function AdvancedThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  
  // Detectar tema do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Carregar tema salvo
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedTheme = localStorage.getItem('canvas-editor-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])
  
  // Salvar tema
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('canvas-editor-theme', newTheme)
    }
  }
  
  const actualTheme = theme === 'system' ? systemTheme : theme
  const colors = themes[actualTheme]
  const themeInlineStyle = {
    background: colors.background,
    color: colors.text,
    '--theme-canvas': colors.canvas,
    '--theme-toolbar': colors.toolbar,
    '--theme-sidebar': colors.sidebar,
    '--theme-accent': colors.accent,
    '--theme-text': colors.text,
    '--theme-textSecondary': colors.textSecondary,
    '--theme-border': colors.border,
    '--theme-background': colors.background,
    '--theme-surface': colors.surface
  } as React.CSSProperties
  
  // Aplicar CSS variables
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
  }, [colors])
  
  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'pro']
    const currentIndex = themeOrder.indexOf(actualTheme)
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
    handleSetTheme(nextTheme)
  }
  
  return (
    <ThemeContext.Provider value={{
      theme,
      actualTheme,
      colors,
      setTheme: handleSetTheme,
      toggleTheme
    }}>
      <div className={`theme-${actualTheme}`} style={themeInlineStyle}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within AdvancedThemeProvider')
  }
  return context
}

// Componente de seleção de tema
export function ThemeSelector() {
  const { theme, setTheme, actualTheme } = useTheme()
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-surface">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded ${actualTheme === 'light' ? 'bg-accent text-white' : 'bg-transparent'}`}
        title="Tema Claro"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded ${actualTheme === 'dark' ? 'bg-accent text-white' : 'bg-transparent'}`}
        title="Tema Escuro"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme('pro')}
        className={`p-2 rounded ${actualTheme === 'pro' ? 'bg-accent text-white' : 'bg-transparent'}`}
        title="Tema Profissional"
      >
        💼
      </button>
    </div>
  )
}
