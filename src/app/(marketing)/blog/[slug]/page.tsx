import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "#site/content";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { PostContent } from "@/features/blog";
import { env } from "@/config";
import { ChevronLeft } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return createMetadata({
      ...getDefaultMetadata(),
      title: "Post Not Found",
    });
  }

  return createMetadata({
    ...getDefaultMetadata(),
    title: locales.BlogPostPage.metadata.titleTemplate.replace("%s", post.title),
    description: post.description,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  // 404 for invalid slugs or drafts in production
  if (!post || (post.draft && env.isProduction)) {
    notFound();
  }

  return (
    <div className="py-16 max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ChevronLeft className="size-4" />
        {locales.BlogPostPage.backToBlog}
      </Link>

      <header className="mb-8">
        <time
          dateTime={post.date}
          className="text-sm text-muted-foreground"
        >
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{post.description}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <PostContent code={post.content} />
    </div>
  );
}
