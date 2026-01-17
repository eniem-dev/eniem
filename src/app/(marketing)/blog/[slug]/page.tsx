import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "#site/content";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { PostContent, PostHeader } from "@/features/blog";
import type { BlogPostPageProps } from "@/features/blog";
import { env, routes } from "@/config";
import { ChevronLeft } from "lucide-react";

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
      title: locales.BlogPostPage.notFound,
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
        href={routes.blog}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ChevronLeft className="size-4" />
        {locales.BlogPostPage.backToBlog}
      </Link>

      <PostHeader
        date={post.date}
        title={post.title}
        description={post.description}
        tags={post.tags}
      />

      <PostContent code={post.content} />
    </div>
  );
}
