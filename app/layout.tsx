import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poké Companion",
  description:
    "Your unofficial Pokémon hub — Pokédex, battle tools, and a trainer community.",
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs during HTML parsing, before first paint: restores the saved
            theme (or prefers-color-scheme) so the page never flashes the
            wrong theme. suppressHydrationWarning lets the DOM win. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PokéComp" />
      </head>
      <body>
        <AuthProvider>
          <PwaRegister />
          <GlobalSearch />
          <Nav />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
