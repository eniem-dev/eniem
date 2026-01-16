"use server";
import { authenticatedActionClient } from "@/lib/safe-action.server";
import { updateImageSchema } from "./settings.schemas";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";
import { uploadImage } from "@/lib/file-upload";

export const updateImageAction = authenticatedActionClient
  .inputSchema(updateImageSchema())
  .action(async ({ parsedInput, ctx }) => {
    const { image } = parsedInput;
    const { session } = ctx;

    try {
      logger.info("Starting image upload", {
        userId: session.user.id,
        fileSize: image.size,
        fileType: image.type,
      });

      const imageUrl = await uploadImage(image, session.user.id);

      logger.info("Image upload successful", {
        userId: session.user.id,
        imageUrl,
      });

      return { imageUrl };
    } catch (error) {
      logger.error("Failed to upload image", {
        userId: session.user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(locales.errors.serverError);
    }
  });
