import { locales } from "@/locales";
import { redirect } from "next/navigation";
import { env, routes } from "@/config";
import { createMetadata } from "@/lib/metadata";
import { LandingPageClient } from "./client-page";

export const metadata = createMetadata({
  title: locales.LandingPage.metadata.title,
  description: locales.LandingPage.metadata.description,
});

export default function LandingPage() {
  if (!env.landingMode) redirect(routes.home);

  return <LandingPageClient />;
}
