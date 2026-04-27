import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { syncSubscriptionFromPolar } from "@/features/billing";
import { routes } from "@/config/routes";

interface SuccessPageProps {
  searchParams: Promise<{ checkout_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { checkout_id } = await searchParams;

  if (!checkout_id) {
    redirect(routes.dashboard);
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(routes.auth.login);
  }

  await syncSubscriptionFromPolar(session.user.id);

  redirect(`${routes.dashboard}?success=true&checkout_id=${checkout_id}`);
}
