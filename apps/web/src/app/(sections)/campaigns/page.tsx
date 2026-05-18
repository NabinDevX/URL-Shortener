"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { requestOnce, SkeletonCard } from "@repo/ui";

type UrlRow = {
  shortId: string;
  redirectUrl: string;
  isDeleted?: boolean;
  totalClicks?: number;
  visitHistory?: Array<{ timestamp: string }>;
};

const getCampaignFromUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const utm = parsed.searchParams.get("utm_campaign");
    return utm && utm.trim().length > 0 ? utm.trim() : null;
  } catch {
    return null;
  }
};

export default function Campaigns() {
  const [urls, setUrls] = useState<UrlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchDone, setFetchDone] = useState(false);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await requestOnce(
        "campaigns:urls",
        () => axios.get("/url/user/all", { withCredentials: true }),
        2500
      );
      setUrls(response.data?.data?.urls || []);
    } catch {
      setUrls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchDone) return;
    setFetchDone(true);
    void fetchUrls();
  }, [fetchDone, fetchUrls]);

  const metrics = useMemo(() => {
    const activeLinks = urls.filter((url) => !url.isDeleted).length;
    const totalClicks = urls.reduce(
      (sum, url) => sum + (url.visitHistory?.length ?? url.totalClicks ?? 0),
      0
    );

    const campaignCounts = new Map<string, number>();
    for (const url of urls) {
      const campaign = getCampaignFromUrl(url.redirectUrl);
      if (!campaign) continue;
      campaignCounts.set(campaign, (campaignCounts.get(campaign) || 0) + 1);
    }

    const topCampaign = Array.from(campaignCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const recentCampaigns = urls
      .map((url) => ({
        shortId: url.shortId,
        redirectUrl: url.redirectUrl,
        campaign: getCampaignFromUrl(url.redirectUrl),
        createdAt: url.visitHistory?.[0]?.timestamp,
      }))
      .filter((row) => Boolean(row.campaign))
      .slice(0, 6);

    return {
      activeLinks,
      totalClicks,
      totalCampaigns: campaignCounts.size,
      topCampaign: topCampaign ? topCampaign[0] : null,
      topCampaignLinks: topCampaign ? topCampaign[1] : 0,
      recentCampaigns,
    };
  }, [urls]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <SkeletonCard hasImage={false} />
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard hasImage={false} />
          <SkeletonCard hasImage={false} />
          <SkeletonCard hasImage={false} />
        </div>
        <SkeletonCard hasImage={false} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm hover-float">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Campaign Center
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Campaign insights are derived from your tracked links and UTM
              parameters.
            </p>
          </div>
          <Link
            href="/urls"
            className="rounded-xl bg-linear-to-br from-primary to-primary-container px-5 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            Manage Links
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm hover-float">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Active Links
          </p>
          <p className="mt-3 text-4xl font-extrabold text-primary">
            {metrics.activeLinks}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Tracked links currently active
          </p>
        </article>

        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm hover-float">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total Clicks
          </p>
          <p className="mt-3 text-4xl font-extrabold text-on-surface">
            {new Intl.NumberFormat("en-US").format(metrics.totalClicks)}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Total tracked visits across all links
          </p>
        </article>

        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm hover-float">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            UTM Campaigns
          </p>
          <p className="mt-3 text-4xl font-extrabold text-tertiary">
            {metrics.totalCampaigns}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {metrics.topCampaign
              ? `Top: ${metrics.topCampaign} (${metrics.topCampaignLinks} links)`
              : "No utm_campaign parameters found"}
          </p>
        </article>
      </section>

      <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-on-surface">
            Recent Campaigns
          </h3>
          <Link
            href="/urls"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all links
          </Link>
        </div>

        {metrics.recentCampaigns.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6 text-sm text-on-surface-variant">
            Add <span className="font-semibold">utm_campaign</span> to your
            destination URLs to see campaign groupings here.
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.recentCampaigns.map((row) => (
              <div
                key={row.shortId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-on-surface">
                    {row.campaign}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {row.redirectUrl}
                  </p>
                </div>
                <Link
                  href="/urls"
                  className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
