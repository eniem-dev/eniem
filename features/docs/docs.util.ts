import { NavigationSection } from "./docs.model";

export const docsNavigation: NavigationSection[] = [
  {
    title: "Introduction",
    url: "/docs",
  },
  {
    title: "Getting Started",
    url: "/docs/getting-started/prerequisites",
    items: [
      {
        title: "Prerequisites",
        url: "/docs/getting-started/prerequisites",
      },
      {
        title: "Installation",
        url: "/docs/getting-started/installation",
      },
    ],
  },
  {
    title: "Guides",
    url: "/docs/guides",
    items: [
      {
        title: "Enable Landing Mode",
        url: "/docs/guides/enable-landing-mode",
      },
      {
        title: "Setup OAuth Provider",
        url: "/docs/guides/setup-oauth",
      },
      {
        title: "Set Up Subscriptions",
        url: "/docs/guides/setup-subscriptions",
      },
      {
        title: "Add Web3 Authentication",
        url: "/docs/guides/add-web3-auth",
      },
      {
        title: "Customize SEO",
        url: "/docs/guides/customize-seo",
      },
      {
        title: "Legal Pages",
        url: "/docs/guides/legal-pages",
      },
      {
        title: "Sell Code via GitHub",
        url: "/docs/guides/sell-code-via-github",
      },
    ],
  },
  {
    title: "Project Configuration",
    url: "/docs/project-configuration",
    items: [
      {
        title: "File Structure",
        url: "/docs/project-configuration/file-structure",
      },
      {
        title: "Page Level Access",
        url: "/docs/project-configuration/page-level-access",
      },
      {
        title: "Locales",
        url: "/docs/project-configuration/locales",
      },
      {
        title: "Config",
        url: "/docs/project-configuration/config",
      },
    ],
  },
  {
    title: "Features",
    url: "/docs/features",
    items: [
      {
        title: "Landing Mode",
        url: "/docs/features/landing-mode",
      },
      {
        title: "Server Utilities",
        url: "/docs/features/server-utilities",
      },
      {
        title: "Error Handling",
        url: "/docs/features/error-handling",
      },
      {
        title: "Emails",
        url: "/docs/features/emails",
      },
      {
        title: "Analytics",
        url: "/docs/features/analytics",
      },
      {
        title: "File Upload",
        url: "/docs/features/file-upload",
      },
    ],
  },
  {
    title: "Authentication",
    url: "/docs/authentication",
    items: [
      {
        title: "Email/Password",
        url: "/docs/authentication/email-password",
      },
      {
        title: "Passwordless",
        url: "/docs/authentication/passwordless",
      },
      {
        title: "OAuth",
        url: "/docs/authentication/oauth",
      },
      {
        title: "SIWE",
        url: "/docs/authentication/siwe",
      },
      {
        title: "Rate Limits",
        url: "/docs/authentication/rate-limits",
      },
      {
        title: "Account deletion",
        url: "/docs/authentication/account-deletion",
      },
    ],
  },
  {
    title: "Payments",
    url: "/docs/payments",
    items: [
      {
        title: "Overview",
        url: "/docs/payments",
      },
      {
        title: "Subscription",
        url: "/docs/payments/subscription",
      },
      {
        title: "One-Time & Benefits",
        url: "/docs/payments/one-time",
      },
    ],
  },
  {
    title: "Deployments",
    url: "/docs/deployments",
    items: [
      {
        title: "Overview",
        url: "/docs/deployments",
      },
      {
        title: "Self Hosted",
        url: "/docs/deployments/self-hosted",
      },
      {
        title: "Managed",
        url: "/docs/deployments/managed",
      },
    ],
  },
  {
    title: "Security",
    url: "/docs/security",
    items: [
      {
        title: "Overview",
        url: "/docs/security",
      },
    ],
  },
  {
    title: "LLM Documentation",
    url: "/llms-full.txt",
  },
];
