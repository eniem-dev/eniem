import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/config";
import { prisma } from "@/lib/db";
import { logger } from "./logger";
import { locales } from "@/locales";

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
 * Creates a lazy S3 client — only initialized when DigitalOcean provider is used.
 * Avoids errors when DO env vars are missing in database-only setups.
 */
function getS3Client(): S3Client {
  return new S3Client({
    endpoint: env.storage.endpoint,
    region: env.storage.region,
    credentials: {
      accessKeyId: env.storage.accessKeyId || "",
      secretAccessKey: env.storage.secretAccessKey || "",
    },
    forcePathStyle: false,
  });
}

/**
 * Uploads an image using the configured provider (database or DigitalOcean Spaces).
 *
 * @param file - File object to upload
 * @param userId - User ID for organizing uploads
 * @returns Public URL of uploaded file
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const { provider } = env.upload;

  switch (provider) {
    case "database":
      return uploadToDatabase(file, userId);
    case "digitalocean":
      return uploadToDigitalOcean(file, userId);
    default:
      throw new Error(
        `Invalid FILE_UPLOAD_PROVIDER: "${provider}". Valid options: "database", "digitalocean"`
      );
  }
}

async function uploadToDatabase(file: File, userId: string): Promise<string> {
  try {
    logger.info("Starting file upload to database", {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const record = await prisma.file.create({
      data: {
        base64Data,
        mimeType: file.type,
        userId,
      },
    });

    const publicUrl = `/api/files/${record.id}`;

    logger.info("File uploaded to database successfully", {
      userId,
      publicUrl,
      fileId: record.id,
    });

    return publicUrl;
  } catch (error) {
    logger.error("Failed to upload file to database", {
      userId,
      fileName: file.name,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(locales.errors.fileUploadFailed);
  }
}

async function uploadToDigitalOcean(file: File, userId: string): Promise<string> {
  const { bucket, endpoint, region, cdn } = env.storage;

  if (!bucket || !endpoint || !region) {
    logger.error("Missing storage configuration", { bucket, endpoint, region });
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

    const s3Client = getS3Client();
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
