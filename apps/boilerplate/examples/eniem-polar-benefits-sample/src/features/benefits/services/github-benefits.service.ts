import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { GitHubBenefit } from "../models/github-benefit.model";

export async function getGitHubBenefits(userId: string): Promise<GitHubBenefit[]> {
  try {
    logger.info("Creating customer session for GitHub benefits", { userId });

    const customerSession = await polarClient.customerSessions.create({
      externalCustomerId: userId,
    });

    logger.info("Customer session created", {
      userId,
      tokenPreview: customerSession.token.substring(0, 10),
    });

    const response = await polarClient.customerPortal.benefitGrants.list(
      { customerSession: customerSession.token },
      {}
    );

    const { result } = response;

    logger.info("Benefit grants fetched", {
      userId,
      count: result.items?.length || 0,
    });

    const benefits: GitHubBenefit[] = [];

    if (result.items) {
      for (const item of result.items) {
        if (item.benefit.type === "github_repository") {
          logger.info("Processing GitHub repository benefit", {
            userId,
            benefitId: item.benefit.id,
            isGranted: item.isGranted,
          });

          // Properties come from item.properties when granted, or item.benefit.properties as fallback
          const itemProperties = item.properties as {
            repositoryOwner?: string;
            repositoryName?: string;
            permission?: string;
          };

          const benefitProperties = item.benefit.properties as {
            repositoryOwner?: string;
            repositoryName?: string;
          };

          // Use granted properties first, fallback to benefit properties
          const repositoryOwner =
            itemProperties.repositoryOwner || benefitProperties.repositoryOwner;
          const repositoryName =
            itemProperties.repositoryName || benefitProperties.repositoryName;
          const permission = itemProperties.permission || "pull";

          if (repositoryOwner && repositoryName) {
            benefits.push({
              id: item.benefit.id,
              repositoryOwner,
              repositoryName,
              repositoryUrl: `https://github.com/${repositoryOwner}/${repositoryName}`,
              permission,
              isGranted: item.isGranted,
              grantedAt: item.grantedAt ? new Date(item.grantedAt) : null,
              description: item.benefit.description,
            });
          }
        }
      }
    }

    logger.info("GitHub benefits processed", {
      userId,
      count: benefits.length,
    });

    return benefits;
  } catch (error) {
    logger.error("Failed to fetch GitHub benefits", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
