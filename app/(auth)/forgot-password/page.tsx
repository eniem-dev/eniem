import ForgotPassword from "@/features/authentication/components/forgot-password";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.ForgotPasswordPage.metadata.title,
    description: locales.ForgotPasswordPage.metadata.description,
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}