import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { SuccessBanner } from "@/components/success-banner";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.DashboardPage.metadata.title,
  description: locales.DashboardPage.metadata.description,
});

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  return (
    <div className="space-y-6">
      <Suspense>
        <SuccessBanner />
      </Suspense>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">
          {locales.DashboardPage.welcome}, {user?.name || user?.email}
        </h1>
        <p className="text-muted-foreground">
          {locales.DashboardPage.description}{" "}
          <Link href="https://doc.eniem.dev" className="underline">
            {locales.DashboardPage.documentationLink}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
