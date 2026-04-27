import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { ErrorCard } from "@/components/error-card";
import { BillingOverview, getBillingOverviewQuery } from "@/features/billing";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.AccountBillingPage.metadata.title,
  description: locales.AccountBillingPage.metadata.description,
});

export default async function AccountBillingPage() {
  const { data, error } = await getBillingOverviewQuery();

  if (error || !data) {
    return <ErrorCard message={error || locales.errors.serverError} />;
  }

  return <BillingOverview data={data} />;
}
