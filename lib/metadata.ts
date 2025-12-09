import { locales } from "@/locales";
import { env } from "@/config";
import type { Metadata } from "next";

/**
 * Configuration interface for metadata creation
 */
export interface MetadataConfig {
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Keywords for SEO */
  keywords?: string | string[];
  /** Additional metadata overrides */
  openGraph?: Partial<Metadata["openGraph"]>;
  /** Twitter card overrides */
  twitter?: Partial<Metadata["twitter"]>;
  /** Author for SEO */
  author?: string;
  /** Creator for SEO */
  creator?: string;
  /** Twitter creator for SEO */
  twitterCreator?: string;
  /** Publisher for SEO */
  publisher?: string;
  /** Additional metadata fields */
  [key: string]: unknown;
}

/**
 * Base URL for the application
 */
export const baseUrl = env.projectUrl;

/**
 * Loads default metadata from the "metadata" translation namespace
 * @returns Promise<MetadataConfig> Default metadata configuration
 * @example
 * ```typescript
 * export async function generateMetadata() {
 *   const defaultMeta = await getDefaultMetadata();
 *   const locale = await getLocale();
 *
 *   return createMetadata(null, locale, {
 *     ...defaultMeta,
 *     title: "Custom Page Title",
 *   });
 * }
 * ```
 */
export async function getDefaultMetadata(): Promise<MetadataConfig> {
  return {
    title: locales.metadata.title,
    description: locales.metadata.description,
    keywords: locales.metadata.keywords.split(", "),
    author: locales.metadata.author,
    creator: locales.metadata.creator,
    publisher: locales.metadata.publisher,
    twitterCreator: locales.metadata.twitterCreator,
  };
}

/**
 * Creates comprehensive metadata for Next.js pages with SEO optimization
 * @param t - Translation function from next-intl for i18n support (can be null when using default metadata)
 * @param locale - Current locale for language-specific metadata
 * @param config - Configuration object to customize metadata
 * @returns Complete Metadata object for Next.js
 * @example
 * ```typescript
 * // With custom translations
 * export async function generateMetadata() {
 *   const t = await getTranslations("myPage");
 *   const locale = await getLocale();
 *   return createMetadata(t, locale, {
 *     title: t("customTitle"),
 *     description: t("customDescription"),
 *   });
 * }
 *
 * // With default metadata
 * export async function generateMetadata() {
 *   const defaultMeta = await getDefaultMetadata();
 *   const locale = await getLocale();
 *   return createMetadata(null, locale, {
 *     ...defaultMeta,
 *     title: "Custom Page Title",
 *   });
 * }
 * ```
 */
export function createMetadata(config: MetadataConfig = {}): Metadata {
  const {
    title,
    description,
    keywords,
    openGraph = {},
    twitter = {},
    author,
    creator,
    publisher,
    twitterCreator,
    ...additionalConfig
  } = config;

  // Convert keywords to array if it's a string
  const keywordsArray =
    typeof keywords === "string" ? keywords.split(", ").map((k) => k.trim()) : keywords;

  return {
    metadataBase: env.projectUrl ? new URL(env.projectUrl) : new URL("http://localhost:3000"),
    title,
    description,
    keywords: keywordsArray,
    authors: [{ name: author }],
    creator: creator,
    publisher: publisher,
    applicationName: env.appName,

    // Robots and indexing
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Open Graph - Next.js will automatically use opengraph-image.png
    openGraph: {
      type: "website",
      locale: "en",
      siteName: env.appName,
      title: title as string,
      description: description as string,
      ...openGraph,
    },

    // Twitter Cards - Next.js will automatically use twitter-image.png
    twitter: {
      card: "summary_large_image",
      title: title as string,
      description: description as string,
      creator: twitterCreator,
      ...twitter,
    },

    // App icons and manifest
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },

    manifest: "/manifest.json",

    // Verification (add your verification codes here)
    // verification: {
    //   google: "your-google-verification-code",
    //   yandex: "your-yandex-verification-code",
    //   yahoo: "your-yahoo-verification-code",
    // },

    // Additional custom metadata
    ...additionalConfig,
  };
}
