import { useEffect, useState } from 'react'
import type { Language } from '../i18n'

export type ThemeMode = 'system' | 'light' | 'dark'

const LANGUAGE_KEY = 'hydrocarbon-namer-language'
const THEME_KEY = 'hydrocarbon-namer-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const readLanguage = (): Language => (localStorage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en')

const readTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

export const usePreferences = () => {
  const [language, setLanguage] = useState<Language>(readLanguage)
  const [theme, setTheme] = useState<ThemeMode>(readTheme)

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.dataset.themeMode = theme
    }

    localStorage.setItem(THEME_KEY, theme)
    applyTheme()
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  return { language, setLanguage, theme, setTheme }
}
