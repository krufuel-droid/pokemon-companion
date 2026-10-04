"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/useUnreadCount";

const TABS = [
  { href: "/community", label: "Feed" },
  { href: "/community/showcase", label: "✨ Showcase" },
  { href: "/community/trades", label: "Trade Board" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
] as const;

/** Sub-navigation shared by the community pages. */
export default function CommunityTabs() {
  const pathname = usePathname();
  const unread = useUnreadCount();
  return (
    <nav
      aria-label="Community sections"
      className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-slate-800"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const showBadge = tab.href === "/messages" && unread > 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {tab.label}
            {showBadge && (
              <span
                aria-label={`${unread} unread messages`}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
