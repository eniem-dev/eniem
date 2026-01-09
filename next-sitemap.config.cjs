/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://doc.eniem.dev",
  generateRobotsTxt: false, // Cloudflare manages robots.txt
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,

  exclude: ["/llms.mdx/*", "/llms.mdx", "/llms-full.txt", "/og/*"],

  transform: async (config, path) => {
    // Homepage: higher priority
    if (path === "/") {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // Default for docs pages
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
