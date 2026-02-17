import { Brand } from "@/components/brand";

import { routes } from "@/config/routes";
import { locales } from "@/locales";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex justify-center w-full max-w-sm flex-col gap-6">
        <div className="mx-auto">
          <Brand />
        </div>
        {children}
        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          {locales.AuthFooter.agreement}{" "}
          <a href={routes.legal.termsOfService}>{locales.AuthFooter.termsOfService}</a>{" "}
          {locales.AuthFooter.and}{" "}
          <a href={routes.legal.privacy}>{locales.AuthFooter.privacyPolicy}</a>.
        </div>
      </div>
    </div>
  );
}
