import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Eniem Documentation',
    template: '%s | Eniem Docs',
  },
  description: 'Documentation for Eniem - The opinionated Next.js boilerplate with BetterAuth and Polar.',
  openGraph: {
    title: 'Eniem Documentation',
    description: 'Documentation for Eniem - The opinionated Next.js boilerplate with BetterAuth and Polar.',
    siteName: 'Eniem Docs',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
