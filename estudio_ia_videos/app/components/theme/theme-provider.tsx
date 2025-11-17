
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { userPreferencesCache } from '@/lib/cache-system'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme'
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Carregar tema salvo
    const preferences = userPreferencesCache.get()
    const savedTheme = preferences.theme ?? defaultTheme
    setTheme(savedTheme)
  }, [defaultTheme])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateActualTheme = () => {
      const newActualTheme = theme === 'system' ? 
        (mediaQuery.matches ? 'dark' : 'light') : theme as 'light' | 'dark'
      
      setActualTheme(newActualTheme)
      
      root.classList.remove('light', 'dark')
      root.classList.add(newActualTheme)
      
      // Adicionar classe para transições suaves
      root.style.setProperty('--theme-transition', 'background-color 0.3s ease, border-color 0.3s ease')
    }

    updateActualTheme()

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateActualTheme)
      return () => mediaQuery.removeEventListener('change', updateActualTheme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      userPreferencesCache.update({ theme: newTheme })
    },
    actualTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className="transition-colors duration-300">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme Toggle Component
export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme()

  return (
    <button
      onClick={() => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
      }}
      className="relative p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
      title={`Tema atual: ${theme}`}
    >
      {actualTheme === 'dark' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
      {theme === 'system' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
      )}
    </button>
  )
}
