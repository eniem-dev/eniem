import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 pt-20 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
