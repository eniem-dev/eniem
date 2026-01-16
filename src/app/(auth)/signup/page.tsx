import Signup from "@/features/authentication/components/signup";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Suspense } from "react";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.SignUpPage.metadata.title,
  description: locales.SignUpPage.metadata.description,
});

export default function SignupPage() {
  return (
    <Suspense>
      <Signup />
    </Suspense>
  );
}
