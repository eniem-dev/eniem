import Link from "next/link";
import { cn } from "@/lib/utils";

export function PoweredByBadge({ className }: { className?: string }) {
  return (
    <Link
      href="https://eniem.dev"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "flex items-center gap-1.5 px-2.5 py-1.5",
        "bg-background/80 backdrop-blur-sm border rounded-full",
        "text-xs text-muted-foreground",
        "hover:bg-background hover:text-foreground",
        "transition-all duration-200",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        className="h-3.5 w-3.5"
        fill="currentColor"
        aria-hidden="true"
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
      <span>Powered by eniem.dev</span>
    </Link>
  );
}
