import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { ErrorCard } from "@/components/error-card";
import {
  getCreditsUsageQuery,
  CreditsUsageHistory,
} from "@/features/billing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.UsageHistoryPage.metadata.title,
  description: locales.UsageHistoryPage.metadata.description,
});

export default async function UsageHistoryPage() {
  const { data, error } = await getCreditsUsageQuery();

  if (error || !data) {
    return <ErrorCard message={error || locales.errors.serverError} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locales.UsageHistoryPage.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CreditsUsageHistory
          initialEvents={data.events}
          initialMaxPage={data.pagination.maxPage}
        />
      </CardContent>
    </Card>
  );
}
