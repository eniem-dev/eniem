import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import React from "react";
import { ThemeSelector } from "./theme-selector";
import { Button } from "./ui/button";
import { locales } from "@/locales";
import { routes } from "@/config/routes";

export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-border/40 py-6 md:px-8 md:py-0">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            {locales.Footer.builtWith}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href={routes.legal.termsOfService} className="hover:text-foreground transition-colors">
              {locales.Footer.termsOfService}
            </Link>
            <Link href={routes.legal.privacy} className="hover:text-foreground transition-colors">
              {locales.Footer.privacyPolicy}
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <a href="https://x.com/0xTiby" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Twitter className="h-4 w-4" />
              </Button>
            </a>
            <a href="https://github.com/0xtiby/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4" />
              </Button>
            </a>
            <ThemeSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
