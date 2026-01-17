import "./globals.css";

import { AnalyticsScript } from "@/components/analytics/analytics-script";
import { PoweredByBadge } from "@/components/powered-by-badge";
import { Providers } from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

export const metadata = createMetadata(getDefaultMetadata());

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
          <AnalyticsScript />
          <Toaster richColors position="top-center" />
          {children}
          <PoweredByBadge />
        </Providers>
      </body>
    </html>
  );
}
