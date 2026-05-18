"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth, useLenis } from "@repo/ui";

import Sidebar from "@/components/Sidebar";

import dynamic from "next/dynamic";

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
  "/signin/",
  "/signup/",
  "/signout/",
  "/forget-password/",
]);

export default function SectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const normalizedPathname =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "") + "/";

  useLenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  const isPublicRoute = PUBLIC_ROUTES.has(normalizedPathname);

  useEffect(() => {
    if (loading || isAuthenticated === null) return;

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/");
      return;
    }

    if (
      isPublicRoute &&
      isAuthenticated &&
      (normalizedPathname === "/" ||
        normalizedPathname === "/signin/" ||
        normalizedPathname === "/signup/")
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isPublicRoute, loading, normalizedPathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" data-shell="app" id="appShell">
      <Sidebar />

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64"
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
