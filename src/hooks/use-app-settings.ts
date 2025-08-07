import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  activeFileId: string | null;
  activeFileName: string | null;
}

const SETTINGS_KEY = 'rca-app-settings';

const defaultSettings: AppSettings = {
  activeFileId: null,
  activeFileName: null,
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, [settings]);

  const setActiveFile = useCallback((fileId: string | null, fileName: string | null) => {
    updateSettings({ activeFileId: fileId, activeFileName: fileName });
  }, [updateSettings]);

  const clearActiveFile = useCallback(() => {
    updateSettings({ activeFileId: null, activeFileName: null });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    setActiveFile,
    clearActiveFile,
    activeFileId: settings.activeFileId,
    activeFileName: settings.activeFileName,
  };
};