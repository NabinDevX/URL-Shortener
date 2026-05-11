"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@repo/ui";

const navLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/urls", icon: "link", label: "My Links" },
  { href: "/analytics", icon: "bar_chart", label: "Analytics" },
  { href: "/campaigns", icon: "campaign", label: "Campaigns" },
  { href: "/api", icon: "api", label: "API" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      id="appSidebar"
      className="group hidden flex-col gap-2 overflow-y-auto border-r border-slate-200 bg-slate-50 p-3 dark:border-outline-variant dark:bg-surface-container-low lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:p-4"
    >
      {/* Brand */}
      <div className="mb-6 px-1 lg:mb-8 lg:px-2">
        <div className="sidebar-header-row flex items-center justify-between gap-2">
          <div className="sidebar-brand-wrap flex min-w-0 items-center gap-3">
            <div className="sidebar-brand-icon pro-gradient flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <span className="material-symbols-outlined text-sm">link</span>
            </div>
            <span className="sidebar-label hidden truncate font-headline text-xl font-bold text-indigo-600 dark:text-primary lg:inline">
              URLTinier Pro
            </span>
          </div>
        </div>
        <p className="sidebar-label mt-1 hidden text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-on-surface-variant lg:block">
          Enterprise Workspace
        </p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link flex items-center justify-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 lg:justify-start ${
              isActive(item.href)
                ? "bg-white text-indigo-600 shadow-sm dark:bg-primary dark:text-on-primary"
                : "text-slate-500 hover:bg-slate-100 hover:translate-x-1 dark:text-on-surface-variant dark:hover:bg-primary/20"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="sidebar-label hidden lg:inline">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-4 border-t border-slate-200 pt-4 pl-1 pr-2 dark:border-outline-variant">
        {/* Plan Card */}
        <div className="sidebar-label hidden rounded-xl bg-indigo-600 p-4 text-white dark:bg-primary hover-float lg:block">
          <p className="mb-1 text-xs font-bold opacity-80">CURRENT PLAN</p>
          <p className="font-headline text-lg font-bold">Pro Plan</p>
          <button className="mt-3 w-full rounded-lg bg-white/20 py-2 text-xs font-bold transition-colors hover:bg-white/30 dark:bg-on-primary/15 dark:hover:bg-on-primary/25">
            Upgrade to Pro
          </button>
        </div>

        <div className="sidebar-bottom space-y-1 pl-1">
          <a
            href="#"
            className="sidebar-link flex items-center justify-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sky-400 transition-all duration-200 hover:bg-sky-500/10 hover:translate-x-1 hover:text-sky-300 dark:text-sky-300 dark:hover:bg-sky-500/15 lg:justify-start"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="sidebar-label hidden lg:inline">Support</span>
          </a>
          <Link
            href="/api-key-docs"
            className="sidebar-link flex items-center justify-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-amber-400 transition-all duration-200 hover:bg-amber-500/10 hover:translate-x-1 hover:text-amber-300 dark:text-amber-300 dark:hover:bg-amber-500/15 lg:justify-start"
          >
            <span className="material-symbols-outlined">description</span>
            <span className="sidebar-label hidden lg:inline">Docs</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await logout();
              } catch {
                // ignore
              }
              void router.replace("/signin/");
            }}
            className="sidebar-link flex items-center justify-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-400 transition-all duration-200 hover:bg-rose-500/10 hover:translate-x-1 hover:text-rose-300 dark:text-rose-300 dark:hover:bg-rose-500/15 lg:justify-start"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="sidebar-label hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
