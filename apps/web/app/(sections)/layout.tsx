"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useLenis } from "@repo/ui";

const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const MobileBottomNav = dynamic(() => import("@/components/MobileBottomNav"), {
  ssr: false,
});
const Header = dynamic(() => import("@/components/Header"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
});

const PUBLIC_ROUTES = new Set([
  "/",
  "/signin",
  "/signup",
  "/signout",
  "/forget-password",
]);

export default function SectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useLenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (loading || isAuthenticated === null) return;

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/");
      return;
    }

    if (
      isPublicRoute &&
      isAuthenticated &&
      (pathname === "/" || pathname === "/signin" || pathname === "/signup")
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isPublicRoute, loading, pathname, router]);

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">URL</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface text-2xl font-bold">URLTinier</p>
            <p className="text-on-surface-variant text-lg mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen lg:flex" data-shell="app" id="appShell">
      <Sidebar />

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col"
        id="appShellMain"
      >
        <Header userData={userData} />

        <main className="flex-1 overflow-x-auto pb-[calc(var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))+6rem)] lg:pb-0">
          {children}
        </main>

        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}
