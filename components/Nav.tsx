"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButtons from "./AuthButtons";
import ThemeToggle from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Home" },
  {
    label: "Database",
    children: [
      { href: "/pokedex", label: "Pokédex" },
      { href: "/collection", label: "Living Dex" },
      { href: "/items", label: "Items" },
      { href: "/moves", label: "Moves" },
      { href: "/abilities", label: "Abilities" },
    ],
  },
  { href: "/tools", label: "Tools" },
  { href: "/guides", label: "Guides" },
  { href: "/community", label: "Community" },
  { href: "/champions", label: "Champions" },
  { href: "/achievements", label: "Achievements" },
  { href: "/nuzlocke", label: "Nuzlocke" },
  { href: "/shiny-hunts", label: "✨ Hunts" },
  { href: "/news", label: "News" },
] as const;

function PokeballIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <path d="M2 14 A12 12 0 0 1 26 14 Z" fill="#ef4444" />
      <rect x="2" y="12.6" width="24" height="2.8" fill="#1e293b" />
      <circle cx="14" cy="14" r="3.4" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      <circle cx="14" cy="14" r="1.4" fill="#1e293b" />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDbOpen, setMobileDbOpen] = useState(false);

  // Close the mobile menu whenever the route changes (render-time
  // adjustment, not an effect, so no cascading renders).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Let Escape close the mobile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <nav className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-8 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <PokeballIcon />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pokémon Companion
          </span>
        </Link>
        {/* Desktop tabs */}
        <div className="hidden items-center gap-2 sm:flex lg:gap-4">
          {LINKS.map((link) => {
            if ("children" in link) {
              const childActive = link.children.some((c) => isActive(pathname, c.href));
              return (
                <div key={link.label} className="group relative">
                  <button
                    type="button"
                    aria-expanded="false"
                    className={`flex items-center gap-1 border-b-2 px-1 pb-1 text-sm font-medium transition-colors ${
                      childActive
                        ? "border-mint font-semibold text-slate-900 dark:text-slate-100"
                        : "border-transparent text-slate-500 hover:border-stone-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
                    }`}
                  >
                    {link.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="transition-transform group-hover:rotate-180">
                      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </svg>
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 min-w-[160px] translate-y-1 rounded-xl border border-stone-200 bg-white p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-900">
                    {link.children.map((child) => {
                      const active = isActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-1 pb-1 text-sm font-medium transition-colors ${
                  active
                    ? "border-mint font-semibold text-slate-900 dark:text-slate-100"
                    : "border-transparent text-slate-500 hover:border-stone-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AuthButtons />
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-500 sm:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="absolute inset-x-0 top-full border-b border-stone-200 bg-white shadow-lg sm:hidden dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col px-4 py-2">
              {LINKS.map((link) => {
                if ("children" in link) {
                  const childActive = link.children.some((c) => isActive(pathname, c.href));
                  return (
                    <div key={link.label} className="py-1">
                      <button
                        type="button"
                        onClick={() => setMobileDbOpen((v) => !v)}
                        aria-expanded={mobileDbOpen}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                          childActive
                            ? "bg-emerald-50 font-semibold text-slate-900 dark:bg-emerald-950 dark:text-slate-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        }`}
                      >
                        {link.label}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                          className={`transition-transform ${mobileDbOpen ? "rotate-180" : ""}`}
                        >
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </button>
                      {mobileDbOpen && (
                        <div className="mt-1">
                          {link.children.map((child) => {
                            const active = isActive(pathname, child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setMenuOpen(false)}
                                className={`block rounded-lg px-3 py-2.5 pl-6 text-base font-medium transition-colors ${
                                  active
                                    ? "bg-emerald-50 font-semibold text-slate-900 dark:bg-emerald-950 dark:text-slate-100"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                      active
                        ? "bg-emerald-50 font-semibold text-slate-900 dark:bg-emerald-950 dark:text-slate-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Appearance
              </span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
