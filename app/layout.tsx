import "./globals.css";

import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";

export async function generateMetadata() {
  const defaultMeta = await getDefaultMetadata();
  return createMetadata(defaultMeta);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={"en"} suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased `}
      >
        <Providers>
          <Toaster richColors position="top-center" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
