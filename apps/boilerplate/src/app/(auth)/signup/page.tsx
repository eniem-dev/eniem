import Signup from "@/features/authentication/components/signup";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Suspense } from "react";
import { getAvailableOAuthProviders } from "@/lib/auth/oauth";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.SignUpPage.metadata.title,
  description: locales.SignUpPage.metadata.description,
});

export default function SignupPage() {
  const availableProviders = getAvailableOAuthProviders();

  return (
    <Suspense>
      <Signup availableProviders={availableProviders} />
    </Suspense>
  );
}
