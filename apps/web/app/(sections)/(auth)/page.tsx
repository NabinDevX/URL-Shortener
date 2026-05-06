"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const metrics = [
  { value: "1.2B+", label: "Requests handled", icon: "↗" },
  { value: "99.99%", label: "SLA uptime", icon: "◌" },
  { value: "<15ms", label: "Global latency", icon: "⚡" },
  { value: "100%", label: "Encrypted traffic", icon: "🔒" },
];

const governancePoints = [
  {
    title: "Global DNS",
    description:
      "Edge-cached resolution that sends every visitor to the nearest available region.",
  },
  {
    title: "Auto-Rotation",
    description:
      "Rotate destinations safely for campaign links, temporary assets, and timed launches.",
  },
  {
    title: "API Access Control",
    description:
      "Keep the platform secure with scoped access, auditability, and team permissions.",
  },
];

const footerLinks = [
  {
    title: "Platform",
    links: ["Product", "Analytics", "Mobile", "Enterprise"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Status", "Pricing", "Support"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service"],
  },
];

const StatCard = ({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm">
    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg text-primary">
      {icon}
    </div>
    <p className="text-3xl font-semibold tracking-tight text-slate-950">
      {value}
    </p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

const Welcome = () => {
  const router = useRouter();
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const detectPlatform = async () => {
      if (typeof window !== "undefined" && (window as any).capacitorIsNative) {
        try {
          const capacitor = await import("@capacitor/core");
          if (capacitor.Capacitor) {
            const platformResult = capacitor.Capacitor.getPlatform();
            if (platformResult) {
              setPlatform(platformResult);
              return;
            }
          }
        } catch {
          // Continue to fallback
        }
      }

      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/.test(userAgent)) {
        setPlatform("android");
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform("ios");
      } else {
        setPlatform("web");
      }
    };

    detectPlatform();
  }, []);

  const handleGetStarted = () => router.push("/signup");
  const handleSignIn = () => router.push("/signin");

  const getDownloadButton = () => {
    if (!platform) return null;

    const buttonClass =
      "inline-flex min-w-[5.5rem] flex-col items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700 transition hover:border-slate-300 hover:text-slate-950 sm:min-w-0 sm:px-4 sm:py-2 sm:text-sm";

    if (platform === "android") {
      return (
        <a href="/apk/urltinier.apk" download className={buttonClass}>
          <span>Download</span>
          <span>APK</span>
        </a>
      );
    } else if (platform === "ios") {
      return (
        <a href="/ipa/urltinier.ipa" download className={buttonClass}>
          <span>Download</span>
          <span>IPA</span>
        </a>
      );
    } else {
      return (
        <a href="/extension/urltinier.zip" download className={buttonClass}>
          <span>Download</span>
          <span>Extension</span>
        </a>
      );
    }
  };

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-size-[42px_42px] mask-[linear-gradient(to_bottom,black,transparent_90%)]" />

      <div className="relative flex min-h-svh w-full flex-col px-3 pb-12 sm:px-6 lg:px-8 xl:px-12">
        <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-2 border-b border-white/75 bg-white/85 px-3 py-2.5 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-2xl pt-[calc(var(--safe-area-inset-top,env(safe-area-inset-top,0px))+0.5rem)] sm:gap-3 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-[0_14px_28px_rgba(49,82,201,0.28)] sm:h-11 sm:w-11 sm:text-lg">
              U
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase sm:text-sm sm:tracking-[0.28em]">
                URLTinier
              </p>
              <p className="truncate text-[10px] text-slate-400 sm:text-xs">
                Link infrastructure
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 lg:flex">
            <a
              className="transition-colors hover:text-slate-950"
              href="#platform"
            >
              Platform
            </a>
            <a
              className="transition-colors hover:text-slate-950"
              href="#metrics"
            >
              Metrics
            </a>
            <a
              className="transition-colors hover:text-slate-950"
              href="#enterprise"
            >
              Enterprise
            </a>
            <a
              className="transition-colors hover:text-slate-950"
              href="#footer"
            >
              Resources
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            {getDownloadButton()}
            <button
              onClick={handleSignIn}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold leading-none text-slate-700 transition hover:border-slate-300 hover:text-slate-950 sm:px-4 sm:py-2 sm:text-sm"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-semibold leading-none text-white transition hover:bg-primary-container sm:px-4 sm:py-2 sm:text-sm"
            >
              Sign Up
            </button>
          </div>
        </header>

        <main className="flex-1 pt-22 sm:pt-18">
          <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm sm:px-4 sm:text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                Built for the modern web architect
              </div>

              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Shorten your links, broaden your reach.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-xl sm:leading-8">
                Transform long, complex endpoints into polished short links with
                global routing, real-time analytics, and enterprise-grade
                governance.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-row">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold leading-tight text-center text-white shadow-[0_18px_40px_rgba(49,82,201,0.24)] transition hover:-translate-y-0.5 hover:bg-primary-container sm:min-h-0 sm:w-auto sm:px-6 sm:py-4 sm:text-base"
                >
                  Get Started Now
                </button>
                <button
                  onClick={handleSignIn}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-tight text-center text-slate-700 transition hover:border-slate-300 hover:text-slate-950 sm:min-h-0 sm:w-auto sm:px-6 sm:py-4 sm:text-base"
                >
                  View Demo
                </button>
              </div>

              <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-3">
                {[
                  "Global edge network",
                  "Clean branded URLs",
                  "API-first controls",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-2 lg:mt-0">
              <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-sky-200/50 blur-3xl lg:block" />
              <div className="absolute -right-8 bottom-8 hidden h-28 w-28 rounded-full bg-indigo-200/50 blur-3xl lg:block" />

              <div className="rounded-4xl border border-white/80 bg-white/85 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-4 lg:p-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 text-white sm:px-5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-400 sm:text-xs sm:tracking-[0.32em]">
                    <span>URLTinier Console</span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                      Live
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3 sm:p-4">
                      <p className="text-xs font-medium text-slate-300 sm:text-sm">
                        Complex Endpoint
                      </p>
                      <div className="mt-2 break-all rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-xs text-slate-100 sm:px-4 sm:text-sm">
                        https://console.infrastructure.urltinier.io/v2/analytics/realtime/node-7712-xc9/deployment/active-session-id-889102-global
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="min-w-0 flex-1 rounded-2xl bg-slate-900 px-3 py-3 text-xs text-slate-300 sm:px-4 sm:text-sm">
                          urltinier.io/infra-live
                        </div>
                        <button className="shrink-0 rounded-2xl bg-sky-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-sky-400 sm:text-sm">
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3 sm:p-4">
                      <p className="text-xs font-medium text-slate-300 sm:text-sm">
                        Status
                      </p>
                      <div className="mt-3 space-y-3">
                        <div className="rounded-2xl bg-white/5 px-4 py-3">
                          <p className="text-xl font-semibold text-white sm:text-2xl">
                            99.9%
                          </p>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Uptime
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/5 px-4 py-3">
                          <p className="text-xl font-semibold text-white sm:text-2xl">
                            12ms
                          </p>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                            Global latency
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                      <span>Routing intelligence</span>
                      <span>14 regions</span>
                    </div>
                    <div className="mt-3 h-24 rounded-2xl border border-dashed border-sky-400/30 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] sm:h-28" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="metrics"
            className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {metrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          <section
            id="platform"
            className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
          >
            <div
              id="enterprise"
              className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.06)] sm:p-8"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                Architectural link governance
              </p>
              <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A calm control plane for links that need to scale.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                URLTinier gives product teams a single system for branded short
                links, campaigns, redirects, and analytics without sacrificing
                performance or security.
              </p>

              <div className="mt-8 space-y-4">
                {governancePoints.map((point) => (
                  <div
                    key={point.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-950">
                      {point.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {point.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.06)] sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Enterprise Infrastructure
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  Built for the modern web architect.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Deploy links through CI/CD, manage redirects safely, and keep
                  every campaign observable from one dashboard.
                </p>
                <div className="mt-6 rounded-3xl bg-slate-950 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Health
                  </p>
                  <p className="mt-2 text-3xl font-semibold">TLS 1.3</p>
                  <p className="text-sm text-slate-300">
                    Encrypted traffic across the network
                  </p>
                </div>
              </div>

              <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.06)] sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Mobile-first
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  Responsive from the first tap.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The interface stays light, readable, and touch-friendly on
                  small screens while preserving the same hierarchy as desktop.
                </p>
                <div className="mt-6 rounded-3xl border border-dashed border-sky-200 bg-sky-50 p-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      URLTinier for Android
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      Version 2.4.0
                    </p>
                    <p className="text-sm text-slate-500">
                      12MB download ready for teams.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.06)] sm:p-7 sm:col-span-2">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                      Ready to ship
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Start shortening links with a lighter, faster control
                      surface.
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleGetStarted}
                      className="rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-container"
                    >
                      Get Started Free
                    </button>
                    <button
                      onClick={handleSignIn}
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer
            id="footer"
            className="mt-12 rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.05)] sm:p-8"
          >
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <p className="text-2xl font-semibold tracking-tight text-slate-950">
                  URLTinier
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Advanced link management for the modern web. Built for
                  reliability, speed, and institutional-grade analytics.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {footerLinks.map((group) => (
                  <div key={group.title}>
                    <p className="text-sm font-semibold text-slate-950">
                      {group.title}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-500">
                      {group.links.map((link) => (
                        <li key={link}>
                          <a
                            className="transition hover:text-slate-950"
                            href="#footer"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-400 md:flex md:items-center md:justify-between">
              <p>© 2024 URLTinier. All rights reserved.</p>
              <p className="mt-2 md:mt-0">
                Documentation · Privacy Policy · API Status · Terms of Service
              </p>
            </div>
          </footer>
        </main>
      </div>

      <div className="pointer-events-none absolute left-4 top-24 hidden h-24 w-24 rounded-full border border-sky-200/70 bg-white/60 blur-[1px] lg:block" />
      <div className="pointer-events-none absolute bottom-8 right-8 hidden h-32 w-32 rounded-full bg-sky-200/40 blur-3xl lg:block" />
    </div>
  );
};

export default Welcome;
