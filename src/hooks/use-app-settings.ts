import { useState } from 'react'
import { toast } from 'sonner'

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: boolean
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: true
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('app-settings')
      return saved ? JSON.parse(saved) : defaultSettings
    } catch {
      return defaultSettings
    }
  })

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('app-settings', JSON.stringify(updated))
    toast.success('Settings updated')
  }

  return {
    settings,
    updateSettings
  }
}