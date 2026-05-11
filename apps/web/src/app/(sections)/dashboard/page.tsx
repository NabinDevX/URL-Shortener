"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { requestOnce } from "@repo/ui";

export default function Dashboard() {
  const [urls, setUrls] = useState<any[]>([]);
  const [, setAnalytics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  const fetchAllAnalytics = useCallback(async (urlsList: any[]): Promise<void> => {
    try {
      const analyticsPromises = urlsList.map((url: any) =>
        axios.get(`/url/analytics/${url.shortId}`, { withCredentials: true }).catch((err) => {
          console.error(`Failed to fetch analytics for ${url.shortId}:`, err);
          return { data: { data: { totalClicks: 0, clicksByDate: [] } } };
        })
      );
      const analyticsResults = await Promise.all(analyticsPromises);
      const analyticsMap: Record<string, any> = {};
      urlsList.forEach((url: any, index: number) => {
        if (analyticsResults[index]) { analyticsMap[url.shortId] = analyticsResults[index].data.data || {}; }
      });
      setAnalytics(analyticsMap);
    } catch (err) { console.error("❌ Error fetching analytics:", err); }
  }, []);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestOnce("url:user:all", () => axios.get("/url/user/all", { withCredentials: true, timeout: 10000 }), 2500);
      const urlsData = response.data.data?.urls || [];
      setUrls(urlsData);
      if (urlsData.length > 0) { await fetchAllAnalytics(urlsData); }
    } catch (err) {
      console.error("❌ Error fetching URLs:", err);
      const axiosError = err as AxiosError<{ message: string; data?: { urls: any[] } }> | unknown;
      if (axiosError instanceof AxiosError) {
        if (axiosError.response?.status === 404 || axiosError.response?.data?.data?.urls?.length === 0) { setUrls([]); }
        else { setError(axiosError.response?.data?.message || "Failed to load URLs"); }
      } else { setError("Failed to load URLs"); }
    } finally { setLoading(false); }
  }, [fetchAllAnalytics]);

  useEffect(() => { if (fetchDone) return; setFetchDone(true); void fetchUrls(); }, [fetchDone, fetchUrls]);

  const totalClicks = urls.reduce((sum: number, url: any) => sum + (url.totalClicks || 0), 0);
  const activeUrls = urls.filter((url: any) => !url.isDeleted).length;
  const top5 = [...urls].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0)).slice(0, 5);
  const maxClicks = top5.length > 0 ? top5[0].totalClicks || 1 : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4" />
          <p className="text-on-surface-variant text-lg font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-on-surface mb-2">Error</h2>
          <p className="text-on-surface-variant mb-6">{error}</p>
          <button onClick={fetchUrls} className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-container transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 sm:space-y-12 sm:p-6 lg:p-8 intro-reveal">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Overview</h1>
        <p className="text-on-surface-variant max-w-xl leading-relaxed">View your link performance for the last 7 days. Upgrade to Pro for detailed demographics and lifetime history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-surface-container-lowest p-6 rounded-3xl border border-transparent hover:border-outline-variant/20 transition-all hover-float">
          <p className="text-sm font-semibold text-on-surface-variant mb-4">Total Clicks</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-headline leading-none">{totalClicks.toLocaleString()}</span>
            {totalClicks > 0 && (<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>)}
          </div>
        </div>
        <div className="md:col-span-1 bg-surface-container-lowest p-6 rounded-3xl border border-transparent hover-float">
          <p className="text-sm font-semibold text-on-surface-variant mb-4">Active Links</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-headline leading-none">{activeUrls}</span>
          </div>
        </div>
        <div className="md:col-span-2 bg-primary-container p-6 rounded-3xl relative overflow-hidden group hover-float">
          <div className="relative z-10">
            <p className="text-sm font-semibold text-primary-fixed mb-4">Pro Feature Insight</p>
            <h3 className="text-xl font-bold text-white mb-2 font-headline">Geographic Breakdown</h3>
            <p className="text-primary-fixed/80 text-sm max-w-60">See exactly where your traffic is coming from down to the city level.</p>
            <button className="mt-4 px-4 py-2 bg-white text-primary text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform">Unlock Analytics</button>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-9xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-4xl border border-white">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-xl font-bold text-on-surface font-headline">Top 5 Short URLs</h2>
                <p className="text-sm text-on-surface-variant">Click distribution by destination</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-white text-xs font-bold text-on-surface rounded-lg shadow-sm border border-outline-variant/10">7 Days</button>
                <button className="px-3 py-1.5 text-xs font-bold text-on-surface-variant rounded-lg hover:bg-white/50 transition-colors opacity-50 cursor-not-allowed">30 Days <span className="material-symbols-outlined text-[10px] ml-1">lock</span></button>
              </div>
            </div>
            <div className="space-y-8">
              {top5.length > 0 ? (
                top5.map((url) => {
                  const clicks = url.totalClicks || 0;
                  const pct = Math.round((clicks / maxClicks) * 100);
                  return (
                    <div key={url.shortId} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-on-surface-variant px-1">
                        <span>/{url.shortId}</span>
                        <span>{clicks} clicks</span>
                      </div>
                      <div className="h-3 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full pro-gradient rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-on-surface-variant text-center py-8">No URLs yet. Create a link to see data here.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest p-8 rounded-4xl border border-outline-variant/10 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold mb-6 font-headline">Audience Insights</h3>
            <div className="space-y-6 flex-1">
              {["devices", "language", "person_search"].map((icon) => (
                <div key={icon} className="flex items-center gap-4 opacity-40 grayscale">
                  <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-surface-container rounded-full mb-2" />
                    <div className="h-1.5 w-16 bg-surface-container-low rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-surface-container space-y-4">
              <div className="flex items-center gap-2 text-tertiary">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-sm font-bold uppercase tracking-wide">Locked Pro Metric</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">Free users only see total click volume. Pro users unlock referral sources, browser types, and OS data.</p>
              <button className="w-full py-3 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-2xl hover:bg-tertiary-fixed-dim transition-colors">Compare Plans</button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface font-headline">Recent Links</h2>
            <p className="text-on-surface-variant text-sm">Managing {activeUrls} of 50 total free links</p>
          </div>
          <Link href="/urls" className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 sm:w-auto pro-gradient">
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Link
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-4xl overflow-hidden border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Short URL</th>
                  <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Original Destination</th>
                  <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Total Clicks</th>
                  <th className="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {urls.slice(0, 5).map((url) => (
                  <tr key={url._id || url.shortId} className="hover:bg-surface-bright transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">link</span>
                        </div>
                        <span className="font-bold text-on-surface">{url.shortId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-on-surface-variant truncate max-w-xs">{url.redirectUrl}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface">{url.totalClicks || 0}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${url.shortId}`); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <span className="material-symbols-outlined text-xl">content_copy</span>
                      </button>
                      <Link href="/urls" className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all inline-block">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
                {urls.length === 0 && (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-sm text-on-surface-variant">No links yet. Create your first short URL!</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {urls.length > 5 && (
            <div className="p-6 bg-surface-container-low flex justify-center">
              <Link href="/urls" className="text-sm font-bold text-primary hover:underline underline-offset-4 decoration-2">View All {urls.length} Links</Link>
            </div>
          )}
        </div>
      </div>

      <div className="pro-gradient p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-primary/30">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white font-headline leading-tight">Scale your brand with<br />Unlimited Links</h2>
            <p className="text-primary-fixed max-w-md font-medium">Get custom domains, bulk shortening, and detailed UTM tracking for your entire marketing team.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="px-8 py-4 bg-white text-primary font-extrabold rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">Start Pro Free Trial</button>
              <button className="px-8 py-4 bg-primary-container text-white font-extrabold rounded-2xl border border-white/20 hover:bg-primary/80 transition-colors">Book a Demo</button>
            </div>
          </div>
          <div className="w-full max-w-xs aspect-square glass-card rounded-4xl p-8 flex flex-col justify-center border border-white/20">
            <div className="space-y-4">
              {["Custom Domains", "API Access", "Priority Support", "Team Workspaces"].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <span className="text-white font-bold">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary-fixed-dim/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
