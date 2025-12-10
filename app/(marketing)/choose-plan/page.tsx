import { ChoosePlanContent } from "@/components/choose-plan-content";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Suspense } from "react";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.ChoosePlanPage.metadata.title,
    description: locales.ChoosePlanPage.metadata.description,
  });
}

export default function ChoosePlanPage() {
  return (
    <Suspense>
      <ChoosePlanContent />
    </Suspense>
  );
}
