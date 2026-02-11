"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { locales } from "@/locales";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    {
      name: "system",
      icon: Monitor,
      label: locales.ThemeSelector.system,
    },
    {
      name: "light",
      icon: Sun,
      label: locales.ThemeSelector.light,
    },
    {
      name: "dark",
      icon: Moon,
      label: locales.ThemeSelector.dark,
    },
  ] as const;

  return (
    <div className="flex items-center bg-background border border-border rounded-full px-1">
      {themes.map((themeOption) => {
        const Icon = themeOption.icon;
        const isSelected = mounted && theme === themeOption.name;

        return (
          <Button
            key={themeOption.name}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(themeOption.name)}
            title={themeOption.label}
            className={cn(
              "h-6 w-6 p-0 rounded-full text-muted-foreground hover:bg-background",
              isSelected && "bg-accent border border-border text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
