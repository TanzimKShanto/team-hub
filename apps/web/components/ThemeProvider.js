'use client'
import { useEffect, useState } from 'react'
import useThemeStore from '@/store/themeStore'

export default function ThemeProvider({ children }) {
  const theme = useThemeStore(s => s.theme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
      const { state } = JSON.parse(stored)
      document.documentElement.classList.add(state?.theme || 'light')
    } else {
      document.documentElement.classList.add('light')
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(theme)
    }
  }, [theme, mounted])

  return children
}