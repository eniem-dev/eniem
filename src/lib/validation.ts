import { z } from "zod";

// Project name: alphanumeric, kebab-case, 1-64 chars
export const projectNameSchema = z
  .string()
  .min(1, "Project name is required")
  .max(64, "Project name must be 64 characters or less")
  .regex(
    /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    "Project name must be kebab-case (lowercase letters, numbers, hyphens, starting with a letter)"
  );

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => url.startsWith("https://") || url.startsWith("http://"),
    "URL must start with http:// or https://"
  );

// Optional URL (empty string allowed)
export const optionalUrlSchema = z
  .string()
  .refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    "Invalid URL format"
  );

// Generic non-empty string
export const requiredStringSchema = z.string().min(1, "This field is required");

// Validation helper function
export function validate<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message ?? "Invalid value" };
}

// Export schemas as object for convenience
export const schemas = {
  projectName: projectNameSchema,
  url: urlSchema,
  optionalUrl: optionalUrlSchema,
  required: requiredStringSchema,
};
