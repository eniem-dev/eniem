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
