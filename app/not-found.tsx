import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata({
    ...defaultMeta,
    title: locales.NotFoundPage.metadata.title,
    description: locales.NotFoundPage.metadata.description,
  });
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-start justify-center bg-background px-6 pt-20 sm:px-12 lg:px-24">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-primary">
            {locales.NotFoundPage.code}
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            {locales.NotFoundPage.title}
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            {locales.NotFoundPage.description}
          </p>
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="size-4" />
              {locales.NotFoundPage.backToHome}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
