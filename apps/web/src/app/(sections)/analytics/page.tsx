"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { requestOnce } from "@repo/ui";
import Chart from "chart.js/auto";

type VisitHistory = {
  timestamp: string;
  ipAddress?: string;
  device?: string;
  country?: string;
  isReturnVisitor?: boolean;
};

type UrlRow = {
  shortId: string;
  redirectUrl: string;
  isDeleted?: boolean;
  totalClicks?: number;
  visitHistory?: VisitHistory[];
  createdAt?: string;
};

type AnalyticsData = {
  totalClicks: number;
  activeLinks: number;
  totalUrls: number;
  last30DaysClicks: { labels: string[]; values: number[] };
  radar: { labels: string[]; values: number[] };
  topUrls: Array<{ shortId: string; redirectUrl: string; clicks: number }>;
  recentActivity: Array<{
    shortId: string;
    redirectUrl: string;
    totalClicks: number;
    ipAddress: string;
    device: string;
    location: string;
  }>;
};

const formatDayLabel = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    date
  );

const getDeviceLabel = (device?: string): string =>
  device && device !== "unknown" ? device : "unknown";

export default function Analytics() {
  const [chartMode, setChartMode] = useState<"bar" | "radar">("bar");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalClicks: 0,
    activeLinks: 0,
    totalUrls: 0,
    last30DaysClicks: { labels: [], values: [] },
    radar: { labels: [], values: [] },
    topUrls: [],
    recentActivity: [],
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const buildAnalytics = (urls: UrlRow[]): AnalyticsData => {
    const normalizedUrls = urls.map((url) => ({
      ...url,
      visitHistory: Array.isArray(url.visitHistory) ? url.visitHistory : [],
    }));

    const allVisits = normalizedUrls.flatMap((url) =>
      url.visitHistory.map((visit) => ({ ...visit, shortId: url.shortId }))
    );

    const totalClicks = allVisits.length;
    const activeLinks = normalizedUrls.filter((url) => !url.isDeleted).length;
    const totalUrls = normalizedUrls.length;

    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const dayKeys: string[] = [];
    const clickCounts = new Map<string, number>();

    for (let index = 0; index < 30; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      dayKeys.push(key);
      clickCounts.set(key, 0);
    }

    for (const visit of allVisits) {
      const dayKey = new Date(visit.timestamp).toISOString().slice(0, 10);
      if (clickCounts.has(dayKey)) {
        clickCounts.set(dayKey, (clickCounts.get(dayKey) || 0) + 1);
      }
    }

    const topUrls = normalizedUrls
      .map((url) => ({
        shortId: url.shortId,
        redirectUrl: url.redirectUrl,
        clicks: url.visitHistory.length,
      }))
      .sort((left, right) => right.clicks - left.clicks)
      .slice(0, 5);

    const recentActivity = normalizedUrls
      .map((url) => {
        const latestVisit =
          url.visitHistory.length > 0
            ? url.visitHistory[url.visitHistory.length - 1]
            : undefined;

        return {
          shortId: url.shortId,
          redirectUrl: url.redirectUrl,
          totalClicks: url.visitHistory.length,
          ipAddress: latestVisit?.ipAddress || "—",
          device: getDeviceLabel(latestVisit?.device),
          location: latestVisit?.country || "Unknown",
          lastActivityAt: latestVisit?.timestamp
            ? new Date(latestVisit.timestamp).getTime()
            : 0,
        };
      })
      .sort((left, right) => {
        if (right.lastActivityAt !== left.lastActivityAt) {
          return right.lastActivityAt - left.lastActivityAt;
        }

        if (right.totalClicks !== left.totalClicks) {
          return right.totalClicks - left.totalClicks;
        }

        return left.shortId.localeCompare(right.shortId);
      })
      .slice(0, 24)
      .map((row) => {
        const cleaned = { ...row } as Record<string, unknown>;
        delete cleaned.lastActivityAt;
        return cleaned as AnalyticsData["recentActivity"][number];
      });

    const uniqueIps = new Set(
      allVisits.map((visit) => visit.ipAddress).filter(Boolean)
    ).size;
    const countries = new Set(
      allVisits.map((visit) => visit.country).filter(Boolean)
    ).size;
    const deviceSet = new Set(
      allVisits
        .map((visit) => getDeviceLabel(visit.device))
        .filter((device) => device !== "unknown")
    );
    const returnVisitorCount = allVisits.filter(
      (visit) => visit.isReturnVisitor
    ).length;
    const avgHour = allVisits.length
      ? allVisits.reduce(
          (sum, visit) => sum + new Date(visit.timestamp).getHours(),
          0
        ) / allVisits.length
      : 0;

    return {
      totalClicks,
      activeLinks,
      totalUrls,
      last30DaysClicks: {
        labels: dayKeys.map((key) =>
          formatDayLabel(new Date(`${key}T00:00:00`))
        ),
        values: dayKeys.map((key) => clickCounts.get(key) || 0),
      },
      radar: {
        labels: [
          "Total clicks",
          "Unique IPs",
          "Country diversity",
          "Device diversity",
          "Avg. time",
          "Return visitors %",
        ],
        values: [
          Math.min(100, Math.round((totalClicks / 1000) * 100)),
          Math.min(100, uniqueIps * 12),
          Math.min(100, countries * 20),
          Math.min(100, deviceSet.size * 33),
          Math.min(100, Math.round((avgHour / 23) * 100)),
          totalClicks > 0
            ? Math.round((returnVisitorCount / totalClicks) * 100)
            : 0,
        ],
      },
      topUrls,
      recentActivity,
    };
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const urlsResponse = await requestOnce(
        "analytics:urls",
        () =>
          axios.get("/url/user/all", {
            withCredentials: true,
          }),
        2500
      );

      const urls: UrlRow[] = urlsResponse.data?.data?.urls || [];
      setAnalyticsData(buildAnalytics(urls));
    } catch (e) {
      void e;
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartMode === "bar") {
      const labels = analyticsData.last30DaysClicks.labels;
      const values = analyticsData.last30DaysClicks.values;

      chartRef.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Clicks",
              data: values,
              backgroundColor: "rgba(49, 82, 201, 0.7)",
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
            x: { grid: { display: false } },
          },
        },
      });
    } else {
      const labels = analyticsData.radar.labels;
      const values = analyticsData.radar.values;

      chartRef.current = new Chart(ctx, {
        type: "radar",
        data: {
          labels,
          datasets: [
            {
              label: "Traffic",
              data: values,
              backgroundColor: "rgba(49, 82, 201, 0.2)",
              borderColor: "rgba(49, 82, 201, 0.8)",
              pointBackgroundColor: "#3152c9",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartMode, analyticsData]);

  const topLinkShare =
    analyticsData.topUrls?.[0]?.clicks && analyticsData.totalClicks
      ? `${Math.round((analyticsData.topUrls[0].clicks / Math.max(analyticsData.totalClicks, 1)) * 100)}%`
      : "0%";

  const radarLabels = analyticsData.radar?.labels || [];
  const radarValues = analyticsData.radar?.values || [];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 intro-reveal">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-primary rounded-full" />
            <h2 className="text-2xl font-extrabold tracking-tight font-headline">
              Detailed Link Performance
            </h2>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setChartMode("bar")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                chartMode === "bar"
                  ? "bg-surface-container-lowest shadow-sm text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Bar Chart
            </button>
            <button
              type="button"
              onClick={() => setChartMode("radar")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                chartMode === "radar"
                  ? "bg-surface-container-lowest shadow-sm text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Radar Chart
            </button>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-outline text-sm">
              calendar_today
            </span>
            <span className="text-sm font-medium">Last 30 Days</span>
            <span className="material-symbols-outlined text-outline text-sm">
              expand_more
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined text-outline text-sm">
              devices
            </span>
            <span className="text-sm font-medium">All Devices</span>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-2 text-sm font-bold text-surface shadow-xl transition-all hover:bg-slate-800 sm:w-auto">
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="relative col-span-12 overflow-hidden rounded-[2.5rem] bg-surface-container-low p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold font-headline leading-tight">
                {chartMode === "bar" ? "Click Distribution" : "Traffic Radar"}
              </h3>
              <p className="text-on-surface-variant">
                {chartMode === "bar"
                  ? "Daily clicks over the last 30 days"
                  : "Traffic distribution by device type"}
              </p>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-end">
                <span className="text-3xl font-extrabold text-primary">
                  {analyticsData.totalClicks?.toLocaleString?.() || "0"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Total clicks
                </span>
              </div>
              <div className="h-12 w-px bg-outline-variant/30" />
              <div className="flex flex-col items-end">
                <span className="text-3xl font-extrabold text-tertiary">
                  {topLinkShare}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Top link share
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
            <div className="h-80 sm:h-96">
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-4xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
              <h4 className="mb-4 text-lg font-bold font-headline text-on-surface">
                Radar Metrics
              </h4>
              <div className="space-y-3">
                {radarLabels.map((label: string, index: number) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-surface-container-low p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {label}
                      </span>
                      <span className="text-sm font-extrabold text-on-surface">
                        {radarValues[index] ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
                {radarLabels.length === 0 && (
                  <p className="text-sm text-on-surface-variant">
                    No metrics available yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-4xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
              <h4 className="mb-4 text-lg font-bold font-headline text-on-surface">
                Top URLs
              </h4>
              <div className="space-y-3">
                {analyticsData.topUrls?.length > 0 ? (
                  analyticsData.topUrls.map((url: any) => (
                    <div
                      key={url.shortId}
                      className="rounded-2xl bg-surface-container-low p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-primary">
                            {url.shortId}
                          </p>
                          <p className="truncate text-[11px] text-on-surface-variant">
                            {url.redirectUrl}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                          {url.clicks}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    No clicks recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/5 rounded-full blur-[80px] pointer-events-none" />
        </div>

        <div className="col-span-12 overflow-hidden rounded-4xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
            <h3 className="font-bold text-lg font-headline">
              Recent Link Activity
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-xs text-on-surface-variant font-medium">
                Displaying {analyticsData.recentActivity?.length || 0} of{" "}
                {analyticsData.totalUrls || 0} links
              </span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-surface-container-low rounded">
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                <button className="p-1 hover:bg-surface-container-low rounded">
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Short URL
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
                    Total Clicks
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    IP Address
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Device
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Location
                  </th>
                  <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {analyticsData.recentActivity?.length > 0 ? (
                  analyticsData.recentActivity.map((item: any, idx: number) => (
                    <tr
                      key={idx}
                      className="group transition-colors hover:bg-surface-bright"
                    >
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">
                            {item.shortId}
                          </span>
                          <span className="w-48 truncate text-[10px] text-on-surface-variant">
                            {item.redirectUrl}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="rounded-full bg-secondary-container px-3 py-1 text-sm font-bold text-on-secondary-container">
                          {item.totalClicks?.toLocaleString?.() || 0}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-mono text-on-surface-variant">
                        {item.ipAddress || "—"}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">
                            {item.deviceIcon || "devices"}
                          </span>
                          <span className="text-sm capitalize">
                            {item.device === "unknown"
                              ? "Unknown"
                              : item.device || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="h-3.5 w-5 rounded-sm bg-slate-200" />
                          <span className="text-sm">
                            {item.location || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="material-symbols-outlined text-sm text-outline">
                            more_vert
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-8 py-10 text-center text-sm text-on-surface-variant"
                      colSpan={6}
                    >
                      No recent link activity yet. Create and share a link to
                      see it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-surface-container-low/30 px-4 py-4 text-center sm:px-6 sm:py-5 lg:px-8">
            <button className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary-container">
              View all activity history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
