import Link from "next/link";
import { Button } from "@/components/ui/button";
import { locales } from "@/locales";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">{locales.NotFoundPage.code}</h1>
      <p className="text-muted-foreground">
        {locales.PublicBoardView.boardNotFound}
      </p>
      <Button asChild variant="outline">
        <Link href={routes.home}>{locales.NotFoundPage.backToHome}</Link>
      </Button>
    </div>
  );
}
