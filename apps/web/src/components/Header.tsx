"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/urls": "Manage URLs",
  "/analytics": "Analytics",
  "/campaigns": "Campaigns",
  "/api": "API Management",
  "/settings": "Settings",
  "/profile": "My Profile",
  "/api-key-docs": "API Docs",
};

const searchPlaceholderMap: Record<string, string> = {
  "/dashboard": "Search links...",
  "/urls": "Search URLs...",
  "/analytics": "Search links...",
  "/campaigns": "Search campaigns...",
  "/api": "Search API docs...",
  "/settings": "Search settings...",
  "/profile": "Search profile...",
  "/api-key-docs": "Search docs...",
};

const planBadgePages = ["/dashboard", "/urls", "/analytics"];

export default function Header({ userData }: { userData?: any }) {
  const currentPath = usePathname();

  const pageTitle = pageTitleMap[currentPath] || "Dashboard";
  const searchPlaceholder =
    searchPlaceholderMap[currentPath] || "Search settings...";
  const showPlanBadge = planBadgePages.includes(currentPath);

  const profileName = userData?.name || "User";
  const profileEmail = userData?.email || "";
  const fallbackAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profileName)}`;
  const profileAvatar =
    typeof userData?.avatar === "string" && userData.avatar.trim().length > 0
      ? userData.avatar
      : fallbackAvatar;

  return (
    <header
      className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant/30 bg-surface-container-low/80 px-4 py-3.5 backdrop-blur-md sm:px-6 lg:px-8 dark:bg-surface-container/85"
      style={{ paddingTop: `max(0.875rem, var(--safe-area-inset-top))` }}
    >
      <div className="flex flex-1 items-center gap-4">
        <h1 className="font-headline text-xl font-bold text-on-surface">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {showPlanBadge && (
          <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 dark:bg-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase text-on-surface-variant dark:text-primary">
              Free Plan
            </span>
          </div>
        )}

        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">search</span>
          </span>
          <input
            className="w-64 rounded-full border-none bg-surface-container py-2 pl-10 pr-4 text-sm text-on-surface transition-all placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 dark:bg-surface-container-low"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>

        <button className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary sm:inline-flex dark:hover:bg-primary/20">
          <span className="material-symbols-outlined">history</span>
        </button>

        <button className="relative hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary sm:inline-flex dark:hover:bg-primary/20">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>

        <div className="hidden h-8 w-px bg-outline-variant/30 sm:block" />

        <div className="group relative">
          <Link
            className="relative block h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-primary-fixed ring-2 ring-transparent transition-all hover:ring-primary/40"
            href="/profile"
          >
            <Image
              alt="User Profile"
              className="object-cover"
              fill
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
              sizes="32px"
              src={profileAvatar}
              unoptimized
            />
          </Link>

          <div className="pointer-events-none absolute right-0 top-10 z-50 w-56 translate-y-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 dark:bg-surface-container">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary-fixed">
                <Image
                  alt={profileName}
                  className="object-cover"
                  fill
                  onError={(event) => {
                    event.currentTarget.src = fallbackAvatar;
                  }}
                  sizes="40px"
                  src={profileAvatar}
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {profileName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {profileEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
