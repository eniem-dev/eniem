import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  AppConfig,
  ProjectConfig,
  AuthConfig,
  OAuthConfig,
  PaymentConfig,
  StorageConfig,
  Web3Config,
  AnalyticsConfig,
} from "./types.js";

interface ConfigContextValue {
  config: AppConfig;
  setProject: (config: ProjectConfig) => void;
  setAuth: (config: AuthConfig) => void;
  setAuthSecret: (secret: string) => void;
  setOAuth: (config: OAuthConfig) => void;
  setPayment: (config: PaymentConfig) => void;
  setStorage: (config: StorageConfig) => void;
  setWeb3: (config: Web3Config) => void;
  setAnalytics: (config: AnalyticsConfig) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider = ({ children }: ConfigProviderProps) => {
  const [config, setConfig] = useState<AppConfig>({});

  const setProject = useCallback((project: ProjectConfig) => {
    setConfig((prev) => ({ ...prev, project }));
  }, []);

  const setAuth = useCallback((auth: AuthConfig) => {
    setConfig((prev) => ({ ...prev, auth }));
  }, []);

  const setAuthSecret = useCallback((authSecret: string) => {
    setConfig((prev) => ({ ...prev, authSecret }));
  }, []);

  const setOAuth = useCallback((oauth: OAuthConfig) => {
    setConfig((prev) => ({ ...prev, oauth }));
  }, []);

  const setPayment = useCallback((payment: PaymentConfig) => {
    setConfig((prev) => ({ ...prev, payment }));
  }, []);

  const setStorage = useCallback((storage: StorageConfig) => {
    setConfig((prev) => ({ ...prev, storage }));
  }, []);

  const setWeb3 = useCallback((web3: Web3Config) => {
    setConfig((prev) => ({ ...prev, web3 }));
  }, []);

  const setAnalytics = useCallback((analytics: AnalyticsConfig) => {
    setConfig((prev) => ({ ...prev, analytics }));
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        config,
        setProject,
        setAuth,
        setAuthSecret,
        setOAuth,
        setPayment,
        setStorage,
        setWeb3,
        setAnalytics,
      }}
    >
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
