import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppConfig } from "./types.js";

interface ConfigContextValue {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider = ({ children }: ConfigProviderProps) => {
  const [config, setConfig] = useState<AppConfig>({});

  const updateConfig = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
