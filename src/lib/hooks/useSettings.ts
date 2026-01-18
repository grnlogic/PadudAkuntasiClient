'use client';

import { useState, useEffect, useCallback } from 'react';
import { settingsAPI, SystemSetting, SettingsObject } from '../api';

export function useSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsObject, setSettingsObject] = useState<SettingsObject>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsAPI.getAll();
      
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings as object
  const loadSettingsObject = useCallback(async () => {
    try {
      const response = await settingsAPI.getObject();
      
      if (response.success && response.data) {
        setSettingsObject(response.data);
      }
    } catch (err: any) {
      console.error('Error loading settings object:', err);
    }
  }, []);

  // Get single setting by key
  const getSetting = useCallback((key: string): any => {
    return settingsObject[key];
  }, [settingsObject]);

  // Update setting
  const updateSetting = useCallback(async (key: string, value: string | number | boolean) => {
    try {
      const response = await settingsAPI.update(key, value);
      
      if (response.success) {
        // Refresh settings after update
        await loadSettings();
        await loadSettingsObject();
        return true;
      } else {
        throw new Error(response.message || 'Failed to update setting');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating setting');
      throw err;
    }
  }, [loadSettings, loadSettingsObject]);

  // Reset setting to default
  const resetSetting = useCallback(async (key: string) => {
    try {
      const response = await settingsAPI.reset(key);
      
      if (response.success) {
        await loadSettings();
        await loadSettingsObject();
        return true;
      } else {
        throw new Error(response.message || 'Failed to reset setting');
      }
    } catch (err: any) {
      setError(err.message || 'Error resetting setting');
      throw err;
    }
  }, [loadSettings, loadSettingsObject]);

  // Export settings
  const exportSettings = useCallback(async () => {
    try {
      const response = await settingsAPI.export();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to export settings');
      }
    } catch (err: any) {
      setError(err.message || 'Error exporting settings');
      throw err;
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadSettings();
    loadSettingsObject();
  }, [loadSettings, loadSettingsObject]);

  return {
    settings,
    settingsObject,
    loading,
    error,
    getSetting,
    updateSetting,
    resetSetting,
    exportSettings,
    refresh: () => {
      loadSettings();
      loadSettingsObject();
    },
  };
}

// Hook untuk get single setting value dengan type-safe
export function useSetting<T = any>(key: string, defaultValue?: T): T | undefined {
  const { settingsObject, loading } = useSettings();
  
  if (loading) {
    return defaultValue;
  }
  
  return (settingsObject[key] as T) ?? defaultValue;
}
