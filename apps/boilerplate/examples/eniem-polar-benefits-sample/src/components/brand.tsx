import React from "react";

import Link from "next/link";
import { routes } from "@/config/routes";
import { env } from "@/config";

export function Brand({ isApp = false }: { isApp?: boolean }): React.ReactElement {
  return (
    <Link
      href={isApp ? routes.dashboard : routes.home}
      className="flex items-center gap-2 font-medium"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="size-6 text-foreground"
        aria-label="brand logo"
      >
        <rect width="256" height="256" fill="none" />
        <polyline
          points="32 176 128 232 224 176"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
        <polyline
          points="32 128 128 184 224 128"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
        <polygon
          points="32 80 128 136 224 80 128 24 32 80"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="16"
        />
      </svg>
      {env.appName}
    </Link>
  );
}
