import { routes } from "@/config/routes";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";

import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { HomePageContent } from "@/components/home-page-content";
import { getDisplayProducts } from "@/features/billing";
import { env } from "@/config";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.HomePage.metadata.title,
  description: locales.HomePage.metadata.description,
});

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(routes.home);
  }

  const products = getDisplayProducts(env.payment.polarServer);

  return <HomePageContent products={products} />;
}
