"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/community", label: "Feed" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
] as const;

/** Sub-navigation shared by the community pages. */
export default function CommunityTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Community sections"
      className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
