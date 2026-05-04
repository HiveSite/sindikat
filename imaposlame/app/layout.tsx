import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "imaposla.me",
  description: "Poslovi, kandidati i poslodavci u Crnoj Gori."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-ME" data-theme="light">
      <body>
        <Header />
        <main className="wrap app">{children}</main>
        <MobileNav />
        <Footer />
      </body>
    </html>
  );
}
