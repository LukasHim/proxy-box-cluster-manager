'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Config = {
  apiEndpoint: string;
  authToken: string;
  targetUuid: string;
  commandType: string;
  commandData: string;
  theme: 'system' | 'dark' | 'light';
  language: 'system' | 'en' | 'zh';
};

type ConfigContextType = Config & {
  updateConfig: (partial: Partial<Config>) => void;
  getConfig: () => Config;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'proxy-box-cluster-manager/config';

const DEFAULT_CONFIG: Config = {
  apiEndpoint: '/api',
  authToken: '',
  targetUuid: '',
  commandType: '',
  commandData: '',
  theme: 'system',
  language: 'system',
};

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({
          apiEndpoint: parsed.apiEndpoint || DEFAULT_CONFIG.apiEndpoint,
          authToken: parsed.authToken || DEFAULT_CONFIG.authToken,
          targetUuid: parsed.targetUuid || DEFAULT_CONFIG.targetUuid,
          commandType: parsed.commandType || DEFAULT_CONFIG.commandType,
          commandData: parsed.commandData || DEFAULT_CONFIG.commandData,
          theme: parsed.theme || DEFAULT_CONFIG.theme,
          language: parsed.language || DEFAULT_CONFIG.language,
        });
      } catch (e) {
        console.error('Failed to parse config from storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateConfig = (partial: Partial<Config>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getConfig = () => config;

  if (!isLoaded) return null;

  return <ConfigContext.Provider value={{ ...config, updateConfig, getConfig }}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
