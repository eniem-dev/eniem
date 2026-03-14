import { posts } from "#site/content";
import { env } from "@/config";

export function getPublishedPosts() {
  return posts
    .filter((post) => !post.draft || env.isDevelopment)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
