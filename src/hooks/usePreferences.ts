import { useCallback, useEffect, useState } from 'react'
import type { Language } from '../i18n'

export type Theme = 'light' | 'dark'

const LANGUAGE_KEY = 'hydrocarbon-namer-language'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const readLanguage = (): Language => (localStorage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en')
const systemTheme = (): Theme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

export const usePreferences = () => {
  const [language, setLanguage] = useState<Language>(readLanguage)
  const [theme, setTheme] = useState<Theme>(systemTheme)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const syncWithSystem = () => setTheme(systemTheme())
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncWithSystem()
    }

    syncWithSystem()
    media.addEventListener('change', syncWithSystem)
    document.addEventListener('visibilitychange', syncWhenVisible)
    return () => {
      media.removeEventListener('change', syncWithSystem)
      document.removeEventListener('visibilitychange', syncWhenVisible)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { language, setLanguage, theme, toggleTheme }
}
