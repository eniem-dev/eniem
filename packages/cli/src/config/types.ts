// Config types for each setup step

export interface ProjectConfig {
  name: string;
  appName?: string;
}

export interface AuthConfig {
  enabled: boolean;
}

export interface OAuthProvider {
  clientId: string;
  clientSecret: string;
}

export interface OAuthConfig {
  github?: OAuthProvider;
  twitter?: OAuthProvider;
}

export interface PaymentConfig {
  enabled: boolean;
  accessToken?: string;
  server?: "sandbox" | "production";
  webhookSecret?: string;
}

export interface StorageConfig {
  enabled: boolean;
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

export interface Web3Config {
  enabled: boolean;
  walletConnectProjectId?: string;
}

export type AnalyticsProvider = "umami" | "posthog" | "none";

export interface AnalyticsConfig {
  enabled: boolean;
  provider?: AnalyticsProvider;
  siteId?: string;
  hostUrl?: string;
}

// Complete app configuration
export interface AppConfig {
  project?: ProjectConfig;
  auth?: AuthConfig;
  authSecret?: string;
  oauth?: OAuthConfig;
  payment?: PaymentConfig;
  storage?: StorageConfig;
  web3?: Web3Config;
  analytics?: AnalyticsConfig;
}
