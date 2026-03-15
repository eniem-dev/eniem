"use client";

import { routes } from "@/config/routes";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button, buttonVariants } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { CreditCard, LayoutDashboard, LogOut, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

import { signOut, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { ThemeSelector } from "../theme-selector";

export function NavAccountMobile() {
  const { data: session, isPending } = useSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center space-y-4 pb-4">
        <Link
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
          href={routes.auth.signup}
        >
          {locales.NavAccount.signup}
        </Link>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          href={routes.auth.login}
        >
          {locales.NavAccount.login}
        </Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col space-y-4">
        <Link
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
          href={routes.dashboard}
        >
          {locales.NavAccount.dashboardLabel}
        </Link>
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
      <div className="border-b border-border pb-4 w-full">
        <Link
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
          href={routes.dashboard}
        >
          {locales.NavAccount.dashboardLabel}
        </Link>
      </div>

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
