"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { docsNavigation } from "../docs.util";
import { NavigationSection } from "../docs.model";
import { env, routes } from "@/config";
import { Brand } from "@/components/brand";
import Link from "next/link";

interface DocsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navigation?: NavigationSection[];
}

export function DocsSidebar({ navigation = docsNavigation, ...props }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Brand />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((section) => (
              <SidebarMenuItem key={section.title}>
                <SidebarMenuButton asChild>
                  <a href={section.url} className="font-medium">
                    {section.title}
                  </a>
                </SidebarMenuButton>
                {section.items?.length ? (
                  <SidebarMenuSub>
                    {section.items.map((item) => {
                      const isActive = pathname === item.url;
                      return (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
