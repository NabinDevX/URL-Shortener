"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-container-low px-6 py-4 pb-[calc(var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))+6rem)] text-on-surface-variant dark:bg-surface-container lg:pb-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-xs sm:flex-row sm:text-sm">
        <p>© 2024 URLTinier Inc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link
            href="/api-key-docs"
            className="transition-colors hover:text-primary"
          >
            API Docs
          </Link>
          <a href="#" className="transition-colors hover:text-primary">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
