import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
/* eslint-disable no-restricted-imports */
import type { BillingOrder } from "@/features/billing/models/billing.model";
import type { Downloadable } from "@/features/benefits/models/downloadable.model";
import type { GitHubBenefit } from "@/features/benefits/models/github-benefit.model";
import type { PolarSubscription } from "@/features/subscription/models/subscription.model";
/* eslint-enable no-restricted-imports */

export function mapOrderToBillingOrder(order: Order): BillingOrder {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    productName: order.product?.name ?? null,
    description: order.product?.description || "",
  };
}

interface DownloadableItem {
  file: {
    id: string;
    name: string;
    size: number;
    sizeReadable: string;
    download: { url: string; expiresAt: Date };
  };
}

export function mapDownloadable(item: DownloadableItem): Downloadable {
  return {
    id: item.file.id,
    name: item.file.name,
    size: item.file.size,
    sizeReadable: item.file.sizeReadable,
    downloadUrl: item.file.download.url,
    expiresAt: item.file.download.expiresAt,
  };
}

interface BenefitGrantItem {
  benefit: {
    id: string;
    type: string;
    description?: string;
    properties: unknown;
  };
  properties: unknown;
  isGranted: boolean;
  grantedAt: Date | string | null;
}

export function mapGitHubBenefits(items: BenefitGrantItem[]): GitHubBenefit[] {
  const result: GitHubBenefit[] = [];
  for (const item of items) {
    if (item.benefit.type !== "github_repository") continue;

    const itemProps = (item.properties ?? {}) as {
      repositoryOwner?: string;
      repositoryName?: string;
      permission?: string;
    };
    const benefitProps = (item.benefit.properties ?? {}) as {
      repositoryOwner?: string;
      repositoryName?: string;
    };

    const repositoryOwner =
      itemProps.repositoryOwner || benefitProps.repositoryOwner;
    const repositoryName =
      itemProps.repositoryName || benefitProps.repositoryName;
    const permission = itemProps.permission || "pull";

    if (!repositoryOwner || !repositoryName) continue;

    result.push({
      id: item.benefit.id,
      repositoryOwner,
      repositoryName,
      repositoryUrl: `https://github.com/${repositoryOwner}/${repositoryName}`,
      permission,
      isGranted: item.isGranted,
      grantedAt: item.grantedAt ? new Date(item.grantedAt) : null,
      description: item.benefit.description ?? "",
    });
  }
  return result;
}

export function mapSubscriptionToDomain(
  sub: CustomerStateSubscription
): PolarSubscription {
  return {
    id: sub.id,
    createdAt: sub.createdAt,
    modifiedAt: sub.modifiedAt,
    status: sub.status,
    amount: sub.amount,
    currency: sub.currency,
    recurringInterval: sub.recurringInterval,
    currentPeriodStart: sub.currentPeriodStart ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
    trialStart: sub.trialStart ?? null,
    trialEnd: sub.trialEnd ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canceledAt: sub.canceledAt ?? null,
    startedAt: sub.startedAt ?? null,
    endsAt: sub.endsAt ?? null,
    productId: sub.productId,
    discountId: sub.discountId ?? null,
  };
}
