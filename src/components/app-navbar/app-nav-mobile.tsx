"use client";

import { MenuIcon } from "lucide-react";
import React, { useState } from "react";
import { AppNavAccountMobile } from "./app-nav-account-mobile";

import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

export function AppNavMobile({
  navLinks,
}: {
  navLinks: { label: string; href: string }[];
}): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="xl:hidden ">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MenuIcon />
      </Button>
      {isOpen && (
        <div className="text-muted-foreground absolute left-0 right-0 top-17 h-screen w-screen border-t border-border bg-background px-4 pt-4">
          <div className="border-b border-border pb-4">
            <AppNavAccountMobile />
          </div>
          <div className="pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "flex items-center justify-start w-full px-4"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
