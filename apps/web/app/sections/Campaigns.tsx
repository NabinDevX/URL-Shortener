"use client";

import { Link } from "react-router-dom";

export default function Campaigns() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Campaign Center
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Build, monitor, and optimize marketing campaigns powered by
              URLTinier links.
            </p>
          </div>
          <button className="rounded-xl bg-linear-to-br from-primary to-primary-container px-5 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02]">
            Create Campaign
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Active Campaigns
          </p>
          <p className="mt-3 text-4xl font-extrabold text-primary">12</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            3 launching this week
          </p>
        </article>

        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total Clicks
          </p>
          <p className="mt-3 text-4xl font-extrabold text-on-surface">84.2K</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            +18% versus last month
          </p>
        </article>

        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Conversion Rate
          </p>
          <p className="mt-3 text-4xl font-extrabold text-tertiary">6.4%</p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Best channel: Newsletter
          </p>
        </article>
      </section>

      <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-on-surface">
            Recent Campaigns
          </h3>
          <Link
            to="/urls"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all links
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div>
              <p className="font-semibold text-on-surface">Q2 Product Launch</p>
              <p className="text-xs text-on-surface-variant">
                utm_campaign=q2_launch
              </p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
              Running
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div>
              <p className="font-semibold text-on-surface">
                Creator Partnership Drive
              </p>
              <p className="text-xs text-on-surface-variant">
                utm_campaign=creator_drive
              </p>
            </div>
            <span className="rounded-full bg-tertiary/15 px-3 py-1 text-xs font-bold text-tertiary">
              Scheduled
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
            <div>
              <p className="font-semibold text-on-surface">
                Holiday Retargeting
              </p>
              <p className="text-xs text-on-surface-variant">
                utm_campaign=holiday_retargeting
              </p>
            </div>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
              Draft
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
