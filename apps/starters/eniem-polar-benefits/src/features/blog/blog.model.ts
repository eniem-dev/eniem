export interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}
