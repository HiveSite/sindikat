import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "imaposla.me — Poslovi u Crnoj Gori",
    template: "%s | imaposla.me"
  },
  description: "Oglasi za posao, kandidati i poslodavci u Crnoj Gori. Pronađi posao ili objavi oglas u nekoliko minuta.",
  keywords: ["posao", "oglasi za posao", "zapošljavanje", "Crna Gora", "Podgorica", "kandidati", "firme"],
  metadataBase: new URL("https://imaposla.me"),
  openGraph: {
    siteName: "imaposla.me",
    locale: "sr_ME",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
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
