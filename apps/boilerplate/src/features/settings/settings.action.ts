"use server";
import { authed } from "@/lib/handler";
import { updateImageSchema } from "./settings.schemas";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";
import { uploadImage } from "@/lib/file-upload";

export const updateImageAction = authed
  .input(updateImageSchema())
  .action(async ({ input, user }) => {
    const { image } = input;

    try {
      logger.info("Starting image upload", {
        userId: user.id,
        fileSize: image.size,
        fileType: image.type,
      });

      const imageUrl = await uploadImage(image, user.id);

      logger.info("Image upload successful", {
        userId: user.id,
        imageUrl,
      });

      return { imageUrl };
    } catch (error) {
      logger.error("Failed to upload image", {
        userId: user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(locales.errors.serverError);
    }
  });
