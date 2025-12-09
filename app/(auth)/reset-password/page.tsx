import { Suspense } from "react";
import ResetPassword from "@/features/authentication/components/reset-password";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.ResetPasswordPage.metadata.title,
    description: locales.ResetPasswordPage.metadata.description,
  });
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<></>}>
      <ResetPassword />
    </Suspense>
  );
}
