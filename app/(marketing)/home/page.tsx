import { routes } from "@/config/routes";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { HomePageContent } from "@/components/home-page-content";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.HomePage.metadata.title,
    description: locales.HomePage.metadata.description,
  });
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(routes.home);
  }
  return <HomePageContent />;
}
