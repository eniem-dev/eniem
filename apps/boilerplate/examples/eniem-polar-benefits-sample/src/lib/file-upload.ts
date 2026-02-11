import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/config";
import { logger } from "./logger";
import { locales } from "@/locales";

/**
 * Storage client for DigitalOcean Spaces (S3-compatible)
 * Configured with environment variables for endpoint, region, and credentials
 */
const s3Client = new S3Client({
  endpoint: env.storage.endpoint,
  region: env.storage.region,
  credentials: {
    accessKeyId: env.storage.accessKeyId || "",
    secretAccessKey: env.storage.secretAccessKey || "",
  },
  forcePathStyle: false,
});

/**
 * Generates a unique file name with timestamp
 * @param originalName - Original file name from upload
 * @returns Timestamped file name
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${timestamp}-${sanitizedName}`;
}

/**
 * Uploads an image to DigitalOcean Spaces
 * Files are stored in environment-specific folders (prod/no-prod)
 *
 * @param file - File object to upload
 * @param userId - User ID for organizing uploads
 * @returns Public URL of uploaded file
 *
 * @example
 * ```typescript
 * const imageUrl = await uploadImage(file, "user-123");
 * // Returns: https://bucket.nyc3.digitaloceanspaces.com/prod/users/user-123/1234567890-image.jpg
 * ```
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const { bucket, endpoint, region, cdn } = env.storage;

  if (!bucket || !endpoint || !region) {
    logger.error("Missing storage configuration", {
      bucket,
      endpoint,
      region,
    });
    throw new Error(locales.errors.storageNotConfigured);
  }

  const fileName = generateFileName(file.name);
  const folder = env.isProduction ? "prod" : "no-prod";
  const key = `${folder}/users/${userId}/${fileName}`;

  try {
    logger.info("Starting file upload to DigitalOcean Spaces", {
      userId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      key,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const publicUrl = `${cdn}/${key}`;

    logger.info("File uploaded successfully", {
      userId,
      publicUrl,
      key,
    });

    return publicUrl;
  } catch (error) {
    logger.error("Failed to upload file to DigitalOcean Spaces", {
      userId,
      fileName,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(locales.errors.fileUploadFailed);
  }
}
