import { useMemo } from "react";

import Link from "next/link";

import { AppNavAccount } from "./app-nav-account";
import { AppNavMobile } from "./app-nav-mobile";

import { AppNavBorder } from "./app-nav-border";
import { Brand } from "../brand";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

export function AppNavbar() {
  const navLinks: { href: string; label: string }[] = useMemo(() => {
    return [];
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <nav
        className="container
        mx-auto flex items-center justify-between p-4"
      >
        <div className=" flex items-center space-x-8">
          <div className="flex items-center space-x-1">
            <Brand isApp={true} />
          </div>
          <div className="text-muted-foreground hidden items-center space-x-2 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-full"
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <AppNavAccount />
        </div>
        <AppNavMobile navLinks={navLinks} />
      </nav>
      <AppNavBorder />
    </header>
  );
}
