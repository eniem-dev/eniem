import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { CustomerStateSubscription } from "@polar-sh/sdk/models/components/customerstatesubscription.js";
import type {
  BillingOrder,
  Downloadable,
  GitHubBenefit,
  PolarSubscription,
} from "./polar-domain";

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

interface GitHubBenefitProperties {
  repositoryOwner?: string;
  repositoryName?: string;
  permission?: string;
}

function readGitHubProps(value: unknown): GitHubBenefitProperties {
  if (typeof value !== "object" || value === null) return {};
  const v = value as Record<string, unknown>;
  return {
    repositoryOwner: typeof v.repositoryOwner === "string" ? v.repositoryOwner : undefined,
    repositoryName: typeof v.repositoryName === "string" ? v.repositoryName : undefined,
    permission: typeof v.permission === "string" ? v.permission : undefined,
  };
}

export function mapGitHubBenefits(items: BenefitGrantItem[]): GitHubBenefit[] {
  return items
    .filter((item) => item.benefit.type === "github_repository")
    .map((item): GitHubBenefit | null => {
      const itemProps = readGitHubProps(item.properties);
      const benefitProps = readGitHubProps(item.benefit.properties);

      const repositoryOwner = itemProps.repositoryOwner || benefitProps.repositoryOwner;
      const repositoryName = itemProps.repositoryName || benefitProps.repositoryName;
      const permission = itemProps.permission || "pull";

      if (!repositoryOwner || !repositoryName) return null;

      return {
        id: item.benefit.id,
        repositoryOwner,
        repositoryName,
        repositoryUrl: `https://github.com/${repositoryOwner}/${repositoryName}`,
        permission,
        isGranted: item.isGranted,
        grantedAt: item.grantedAt ? new Date(item.grantedAt) : null,
        description: item.benefit.description ?? "",
      };
    })
    .filter((b): b is GitHubBenefit => b !== null);
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
