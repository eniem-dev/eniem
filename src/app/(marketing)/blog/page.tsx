import { posts } from "#site/content";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { PostCard, Pagination } from "@/features/blog";
import { env } from "@/config";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.BlogPage.metadata.title,
  description: locales.BlogPage.metadata.description,
});

const POSTS_PER_PAGE = 10;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  // Filter out drafts in production, show all in development
  const publishedPosts = posts
    .filter((post) => !post.draft || env.isDevelopment)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(publishedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = publishedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          {locales.BlogPage.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {locales.BlogPage.subtitle}
        </p>
      </div>

      {paginatedPosts.length === 0 ? (
        <p className="text-center text-muted-foreground">{locales.BlogPage.noPosts}</p>
      ) : (
        <>
          <div className="grid gap-6 max-w-3xl mx-auto">
            {paginatedPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/blog"
            />
          </div>
        </>
      )}
    </div>
  );
}
