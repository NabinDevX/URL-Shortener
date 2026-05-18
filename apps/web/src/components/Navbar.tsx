"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@repo/ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/urls", label: "URLs" },
  { href: "/profile", label: "Profile" },
  { href: "/analytics", label: "Analytics" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
  { href: "/api", label: "API" },
  { href: "/api-key-docs", label: "API Keys" },
];

const Navbar = ({ userData }: { userData?: any }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight text-primary"
          >
            URLTinier
          </Link>
          <span className="text-sm text-on-surface-variant">
            Hi, {userData?.name || "User"}
          </span>
        </div>

        <ul className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    pathname === item.href
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  void e;
                }
                void router.replace("/signin/");
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-error hover:bg-error-container transition-colors"
            >
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
