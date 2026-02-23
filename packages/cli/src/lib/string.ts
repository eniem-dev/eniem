/**
 * Converts a kebab-case or snake_case string to Title Case.
 *
 * toTitleCase("project-zero") → "Project Zero"
 * toTitleCase("my_cool_app")  → "My Cool App"
 * toTitleCase("dashboard")    → "Dashboard"
 */
export function toTitleCase(input: string): string {
  return input
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Converts a string to kebab-case for use as a slug.
 *
 * toKebabCase("Pro Monthly")  → "pro-monthly"
 * toKebabCase("Hello World!") → "hello-world"
 */
export function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+/, "") // Remove leading hyphens
    .replace(/-+$/, "") // Remove trailing hyphens
    .replace(/-{2,}/g, "-"); // Replace multiple hyphens with single
}
