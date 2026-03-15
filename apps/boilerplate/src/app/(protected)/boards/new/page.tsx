import { Suspense } from "react";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { env } from "@/config";
import { BoardForm } from "@/features/boards/components/BoardForm";
import { SubscriptionGate } from "@/features/boards/components/SubscriptionGate";
import { getSubscriptionQuery } from "@/features/subscription";
import { getDisplayProducts } from "@/features/subscription";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.CreateBoardPage.metadata.title,
  description: locales.CreateBoardPage.metadata.description,
});

export default async function CreateBoardPage() {
  const { data: subscription } = await getSubscriptionQuery();
  const isActive = subscription?.status === "active";

  if (!isActive) {
    const products = getDisplayProducts(env.payment.polarServer);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Suspense>
          <SubscriptionGate products={products} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold">
        {locales.CreateBoardPage.metadata.title}
      </h1>
      <BoardForm />
    </div>
  );
}
