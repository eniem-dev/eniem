"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { locales } from "@/locales";
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-start justify-center bg-background px-6 pt-20 sm:px-12 lg:px-24">
        <div className="max-w-xl mx-auto">
          <p className="text-sm font-semibold text-destructive">
            {locales.ErrorPage.code}
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            {locales.ErrorPage.title}
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            {locales.ErrorPage.description}
          </p>
          <div className="mt-10 flex items-center gap-6">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RotateCcw className="size-4" />
              {locales.ErrorPage.tryAgain}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="size-4" />
              {locales.ErrorPage.backToHome}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
