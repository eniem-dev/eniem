export const env = {
  // Project Configuration
  projectUrl:
    process.env.PROJECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "MyApp",

  // Better Auth Configuration
  betterAuth: {
    secret: process.env.BETTER_AUTH_SECRET,
    url:
      process.env.BETTER_AUTH_URL || process.env.PROJECT_URL || "http://localhost:3000",
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },

  // OAuth Configuration
  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    },
  },

  // Environment
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Landing Mode
  landingMode: process.env.LANDING_MODE === "true",

  // Storage Configuration (DigitalOcean Spaces)
  storage: {
    endpoint: process.env.DIGITALOCEAN_SPACES_ENDPOINT,
    region: process.env.DIGITALOCEAN_SPACES_REGION,
    bucket: process.env.DIGITALOCEAN_SPACES_BUCKET,
    accessKeyId: process.env.DIGITALOCEAN_SPACES_ACCESS_KEY_ID,
    secretAccessKey: process.env.DIGITALOCEAN_SPACES_SECRET_ACCESS_KEY,
    cdn: process.env.DIGITALOCEAN_SPACES_CDN,
  },

  // File Upload Configuration
  upload: {
    provider: (process.env.FILE_UPLOAD_PROVIDER || "database") as "database" | "digitalocean",
    maxFileSizeMB: Number(process.env.MAX_FILE_SIZE_MB) || 1,
    maxFileSizeBytes: (Number(process.env.MAX_FILE_SIZE_MB) || 1) * 1024 * 1024,
  },

  payment: {
    polarAccessToken: process.env.POLAR_ACCESS_TOKEN,
    polarServer: (process.env.POLAR_SERVER || "sandbox") as "sandbox" | "production",
    polarWebhookSecret: process.env.POLAR_WEBHOOK_SECRET || "",
    polarOrganizationId: process.env.POLAR_ORGANIZATION_ID,
  },

  // Email Configuration (Resend)
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.EMAIL_FROM_ADDRESS || "no-reply@myapp.example.com",
    brandLogoUrl: process.env.EMAIL_BRAND_LOGO_URL,
  },

  // Analytics Configuration
  analytics: {
    provider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "umami") as
      | "umami"
      | "posthog"
      | "none",
    // Umami
    umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    umamiHost: process.env.NEXT_PUBLIC_UMAMI_HOST || "https://cloud.umami.is",
    // PostHog
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
  },

  // Support Configuration
  support: {
    email: process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_ADDRESS || "support@myapp.example.com",
  },
} as const;
