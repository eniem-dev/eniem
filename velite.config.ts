import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "blog/**/*.mdx",
  schema: s.object({
    title: s.string().max(99),
    description: s.string().max(200),
    date: s.isodate(),
    slug: s.slug("blog"),
    coverImage: s.string().optional(),
    tags: s.array(s.string()).optional(),
    draft: s.boolean().default(false),
    content: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
  },
  collections: { posts },
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
