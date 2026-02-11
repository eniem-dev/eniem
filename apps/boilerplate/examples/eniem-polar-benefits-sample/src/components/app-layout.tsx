import { AppNavbar } from "./app-navbar/app-navbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppNavbar />
      <main className="container mx-auto px-4 pt-20">{children}</main>
    </>
  );
}
