import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { Downloadable } from "../models/downloadable.model";

export async function getDownloadables(userId: string): Promise<Downloadable[]> {
  try {
    logger.info("Creating customer session for downloadables", { userId });

    const customerSession = await polarClient.customerSessions.create({
      externalCustomerId: userId,
    });

    logger.info("Customer session created", {
      userId,
      tokenPreview: customerSession.token.substring(0, 10),
    });

    const response = await polarClient.customerPortal.downloadables.list(
      { customerSession: customerSession.token },
      {}
    );

    const { result } = response;

    logger.info("Downloadables fetched", {
      userId,
      count: result.items?.length || 0,
    });

    const files: Downloadable[] =
      result.items?.map((item) => ({
        id: item.file.id,
        name: item.file.name,
        size: item.file.size,
        sizeReadable: item.file.sizeReadable,
        downloadUrl: item.file.download.url,
        expiresAt: item.file.download.expiresAt,
      })) || [];

    return files;
  } catch (error) {
    logger.error("Failed to fetch downloadables", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
