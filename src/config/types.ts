// Config types for each setup step

export interface ProjectConfig {
  name: string;
  url: string;
  secret: string;
}

export interface AuthConfig {
  enabled: boolean;
  databaseUrl?: string;
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
  organizationId?: string;
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

export type AnalyticsProvider = "plausible" | "posthog" | "none";

export interface AnalyticsConfig {
  enabled: boolean;
  provider?: AnalyticsProvider;
  siteId?: string;
  apiKey?: string;
}

// Complete app configuration
export interface AppConfig {
  project?: ProjectConfig;
  auth?: AuthConfig;
  oauth?: OAuthConfig;
  payment?: PaymentConfig;
  storage?: StorageConfig;
  web3?: Web3Config;
  analytics?: AnalyticsConfig;
}
