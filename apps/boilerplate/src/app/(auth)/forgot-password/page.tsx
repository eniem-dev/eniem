import ForgotPassword from "@/features/authentication/components/forgot-password";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.ForgotPasswordPage.metadata.title,
  description: locales.ForgotPasswordPage.metadata.description,
});

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}