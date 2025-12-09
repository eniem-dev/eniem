import fs from "fs/promises";
import path from "path";
import { docsNavigation } from "@/features/docs/docs.util";
import { locales } from "@/locales";
import { env } from "@/config";

interface DocEntry {
  title: string;
  url: string;
  depth: number;
}

/**
 * Flattens the navigation structure into an ordered list
 */
export function flattenNavigation(): DocEntry[] {
  const entries: DocEntry[] = [];
  const seenUrls = new Set<string>();

  for (const section of docsNavigation) {
    if (!seenUrls.has(section.url)) {
      entries.push({
        title: section.title,
        url: section.url,
        depth: 1,
      });
      seenUrls.add(section.url);
    }

    if (section.items) {
      for (const item of section.items) {
        if (!seenUrls.has(item.url)) {
          entries.push({
            title: item.title,
            url: item.url,
            depth: 2,
          });
          seenUrls.add(item.url);
        }
      }
    }
  }

  return entries;
}

/**
 * Converts a docs URL to its file path
 */
export function urlToFilePath(url: string): string {
  return path.join(process.cwd(), "app/(docs)", url, "page.mdx");
}

/**
 * Strips MDX-specific syntax from content
 */
export function cleanMdxContent(content: string): string {
  let cleaned = content;

  // Remove import statements
  cleaned = cleaned.replace(/^import\s+.*?;?\s*$/gm, "");

  // Remove export statements
  cleaned = cleaned.replace(/^export\s+.*?;?\s*$/gm, "");

  // Remove JSX self-closing tags (e.g., <Component />)
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*\s*\/>/g, "");

  // Remove JSX opening/closing tags with content
  cleaned = cleaned.replace(
    /<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g,
    ""
  );

  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Reads and cleans MDX content from a file
 */
export async function readAndCleanMdx(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return cleanMdxContent(content);
  } catch {
    return "";
  }
}

/**
 * Generates the complete llms-full.txt content
 */
export async function generateLlmsFullText(): Promise<string> {
  const entries = flattenNavigation();
  const sections: string[] = [];

  // Header
  sections.push(`# ${env.appName} Documentation\n`);
  sections.push(`> ${locales.metadata.description}\n`);
  sections.push(`> Generated: ${new Date().toISOString()}\n`);
  sections.push(`> Source: ${env.projectUrl}/docs\n`);
  sections.push("---\n");

  // Process each documentation entry
  for (const entry of entries) {
    const filePath = urlToFilePath(entry.url);
    const content = await readAndCleanMdx(filePath);

    if (!content) continue;

    // Add section header based on depth
    if (entry.depth === 1) {
      sections.push(`\n## ${entry.title}\n`);
    } else {
      sections.push(`\n### ${entry.title}\n`);
    }

    // Remove H1 from content if it matches the title
    const contentWithoutTitle = content
      .replace(/^#\s+.*\n+/, "")
      .trim();

    sections.push(contentWithoutTitle);
    sections.push("\n\n---\n");
  }

  // Footer
  sections.push("\n## Additional Resources\n");
  sections.push(`- Full documentation: ${env.projectUrl}/docs\n`);
  sections.push(`- Contact: ${locales.metadata.author}\n`);

  return sections.join("\n");
}
