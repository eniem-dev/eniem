import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { locales } from "@/locales";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ChevronLeft className="size-4" />
          {locales.Pagination.previous}
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeft className="size-4" />
          {locales.Pagination.previous}
        </span>
      )}

      <span className="text-sm text-muted-foreground">
        {locales.Pagination.pageOf
          .replace("{current}", String(currentPage))
          .replace("{total}", String(totalPages))}
      </span>

      {hasNext ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {locales.Pagination.next}
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50"
          )}
        >
          {locales.Pagination.next}
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
