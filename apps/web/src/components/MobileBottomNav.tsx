"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavLinks = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/urls", icon: "link", label: "Links" },
  { href: "/analytics", icon: "bar_chart", label: "Analytics" },
  { href: "/api", icon: "api", label: "API" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))+1rem)] lg:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2 rounded-[1.75rem] border border-outline-variant/30 bg-surface-container-low/95 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:bg-surface-container/95">
        {mobileNavLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition-all duration-200 ${
              pathname === item.href
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            <span className="leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
