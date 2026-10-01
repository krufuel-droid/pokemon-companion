"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButtons from "./AuthButtons";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pokedex", label: "Pokédex" },
  { href: "/tools", label: "Tools" },
  { href: "/community", label: "Community" },
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

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <PokeballIcon />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Pokémon Companion
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 px-1 pb-1 text-sm font-medium transition-colors ${
                  active
                    ? "border-mint font-semibold text-slate-900"
                    : "border-transparent text-slate-500 hover:border-stone-300 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex items-center">
          <AuthButtons />
        </div>
      </nav>
    </header>
  );
}
