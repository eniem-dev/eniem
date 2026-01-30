"use client";

import { routes } from "@/config/routes";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button, buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { CreditCard, Home, LayoutDashboard, LogOut, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { ThemeSelector } from "../theme-selector";

export function AppNavAccountMobile() {
  const { data: session, isPending } = useSession();

  if (!session || isPending) {
    return (
      <div className="flex flex-col space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="flex flex-col items-center space-y-4 text-muted-foreground">
      <div className="flex flex-row-reverse items-center justify-between w-full px-4">
        <Avatar className="h-5 w-5 rounded-full hover:cursor-pointer">
          <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
          <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white"></AvatarFallback>
        </Avatar>
        <span className="text-foreground font-medium">{user?.name}</span>
      </div>

      <Link
        href={routes.dashboard}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "flex flex-row-reverse items-center justify-between w-full"
        )}
      >
        <LayoutDashboard className="size-5" />
        {locales.NavAccount.dashboardLabel}
      </Link>
      <Link
        href={routes.account.general}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "flex flex-row-reverse items-center justify-between w-full"
        )}
      >
        <UserCircleIcon className="size-5" />
        {locales.NavAccount.accountLabel}
      </Link>
      <Link
        href={routes.account.billing}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "flex flex-row-reverse items-center justify-between w-full"
        )}
      >
        <CreditCard className="size-5" />
        {locales.NavAccount.billingLabel}
      </Link>
      <div className="flex flex-row-reverse items-center justify-between w-full px-4">
        <ThemeSelector />
        <span>{locales.NavAccount.themeLabel}</span>
      </div>
      <Link
        href={routes.homeRedirect}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          "flex flex-row-reverse items-center justify-between w-full"
        )}
      >
        <Home className="size-5" />
        {locales.NavAccount.homePageLabel}
      </Link>
      <Button
        onClick={() => signOut()}
        variant="ghost"
        size="lg"
        className="flex w-full flex-row-reverse items-center justify-between"
      >
        <LogOut className="size-5" />
        {locales.NavAccount.logoutLabel}
      </Button>
    </div>
  );
}
