import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { THEME_INIT_SCRIPT } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokémon Companion",
  description:
    "Your unofficial Pokémon hub — Pokédex, battle tools, and a trainer community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs during HTML parsing, before first paint: restores the saved
            theme (or prefers-color-scheme) so the page never flashes the
            wrong theme. suppressHydrationWarning lets the DOM win. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>
          <Nav />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
