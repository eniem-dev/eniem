import Login from "@/features/authentication/components/login";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Suspense } from "react";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.LoginPage.metadata.title,
    description: locales.LoginPage.metadata.description,
  });
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
