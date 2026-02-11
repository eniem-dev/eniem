"use client";

import { routes } from "@/config/routes";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { CreditCard, Home, LayoutDashboard, LogOut, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { ThemeSelector } from "../theme-selector";
import { useRouter } from "next/navigation";

export function AppNavAccount() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (!session || isPending) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  const { user } = session;

  const signout = async () => {
    await signOut();
    router.replace(routes.auth.login);
  };

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 rounded-full hover:cursor-pointer">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
            <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white"></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg text-muted-foreground"
          side={"bottom"}
          align="end"
          sideOffset={10}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={routes.dashboard}>
                <LayoutDashboard />
                {locales.NavAccount.dashboardLabel}
              </Link>
            </DropdownMenuItem>{" "}
            <DropdownMenuItem asChild>
              <Link href={routes.account.general}>
                <UserCircleIcon />
                {locales.NavAccount.accountLabel}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={routes.account.billing}>
                <CreditCard />
                {locales.NavAccount.billingLabel}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="flex items-center justify-between w-full px-2 py-1.5 text-sm">
            <span>{locales.NavAccount.themeLabel}</span>
            <ThemeSelector />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={routes.homeRedirect}>
              <Home />
              {locales.NavAccount.homePageLabel}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={signout}>
            <LogOut />
            {locales.NavAccount.logoutLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
