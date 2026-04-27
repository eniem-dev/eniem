import { ErrorCard } from "@/components/error-card";
import { AccountEdition } from "@/features/settings/components/account-edition";
import { auth } from "@/lib/auth/config";
import { locales } from "@/locales";
import { headers } from "next/headers";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.AccountGeneralPage.metadata.title,
  description: locales.AccountGeneralPage.metadata.description,
});

export default async function AccountGeneralPage() {
  const getHeaders = await headers();
  const session = await auth.api.getSession({
    headers: getHeaders,
  });
  const accounts = await auth.api.listUserAccounts({ headers: getHeaders });

  if (!session) {
    return <ErrorCard message={locales.errors.unableToretrieveUser} />;
  }
  const user = session.user;
  const providerId = accounts[0]?.providerId || "credential";
  return <AccountEdition user={user} providerId={providerId} />;
}
