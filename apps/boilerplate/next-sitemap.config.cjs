/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://myapp.example.com",
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,

  // Pages to exclude from sitemap
  exclude: [
    "/api/*", // API routes
  ],

  // Custom transformation for specific pages
  transform: async (config, path) => {
    // Homepage gets highest priority
    if (path === "/") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // Pricing page gets high priority
    if (path === "/pricing") {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }

    // Authentication pages get medium priority
    if (path.startsWith("/login") || path.startsWith("/signup")) {
      return {
        loc: path,
        changefreq: "monthly",
        priority: 0.6,
        lastmod: new Date().toISOString(),
      };
    }

    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },

  // robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "*",
        disallow: ["/api/", "/admin/", "/me/"],
      },
    ],
    additionalSitemaps: [
      // Add dynamic sitemaps here when implemented
      // 'https://myapp.example.com/server-sitemap-blog.xml',
      // 'https://myapp.example.com/server-sitemap-products.xml',
    ],
  },
};
