import { useEffect } from 'react'
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const useThemeStore = create<ThemeStore>((set) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'system',
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () =>
    set((state) => {
      if (state.theme === 'light') return { theme: 'dark' }
      if (state.theme === 'dark') return { theme: 'system' }
      return { theme: 'light' }
    }),
}))

// Apply theme on initial load
applyTheme(useThemeStore.getState().theme)

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore()

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return { theme, setTheme, toggleTheme }
}
