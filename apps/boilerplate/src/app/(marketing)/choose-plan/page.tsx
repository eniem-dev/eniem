import { ChoosePlanContent } from "@/components/choose-plan-content";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Suspense } from "react";
import { getDisplayProducts } from "@/features/billing";
import { env } from "@/config";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.ChoosePlanPage.metadata.title,
  description: locales.ChoosePlanPage.metadata.description,
});

export default function ChoosePlanPage() {
  const products = getDisplayProducts(env.payment.polarServer);

  return (
    <Suspense>
      <ChoosePlanContent products={products} />
    </Suspense>
  );
}
