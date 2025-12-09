import { useMemo } from "react";
import Link from "next/link";

import { routes } from "@/config/routes";
import { NavAccount } from "./nav-account";
import { NavMobile } from "./nav-mobile";

import { NavBorder } from "./nav-border";
import { locales } from "@/locales";
import { Brand } from "../brand";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const navLinks = useMemo(() => {
    return [
      {
        label: locales.NavBar.documentation,
        href: routes.docs,
      },
      {
        label: locales.NavBar.pricing,
        href: routes.pricing,
      },
    ];
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <nav
        className="container
        mx-auto flex items-center justify-between p-4"
      >
        <div className=" flex items-center space-x-8">
          <div className="flex items-center space-x-1">
            <Brand />
          </div>
          <div className="text-muted-foreground hidden items-center space-x-2 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-lg"
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <NavAccount />
        </div>
        <NavMobile navLinks={navLinks} />
      </nav>
      <NavBorder />
    </header>
  );
}
