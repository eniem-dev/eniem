"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { locales } from "@/locales";
interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountSubLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname();

  const sidebarItems = [
    {
      id: "general",
      label: locales.AccountPage.sidebar.general,
      href: routes.account.general,
    },
    {
      id: "billing",
      label: locales.AccountPage.sidebar.billing,
      href: routes.account.billing,
    },
    {
      id: "usage",
      label: locales.AccountPage.sidebar.usage,
      href: routes.account.usage,
    },
  ];

  return (
    <>
      <div className="flex flex-1 flex-col gap-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{locales.AccountPage.title}</h1>
          <p className="text-muted-foreground mt-2">{locales.AccountPage.description}</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Sidebar */}
          <aside className="xl:w-64 xl:shrink-0">
            <nav className="flex xl:flex-col xl:space-y-2 space-x-2 xl:space-x-0 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0 xl:sticky xl:top-20">
              {sidebarItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "justify-start whitespace-nowrap text-muted-foreground",
                    pathname === item.href ? "text-primary" : ""
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-8">{children}</main>
        </div>
      </div>
    </>
  );
}
