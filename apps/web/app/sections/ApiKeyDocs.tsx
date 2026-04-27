"use client";

import { Link } from "react-router-dom";

export default function ApiKeyDocs() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface">
              Custom API Key Documentation
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Use your generated x-api-key to access protected URLTinier APIs.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
            to="/api"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to API Panel
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <h3 className="font-headline text-xl font-bold text-on-surface">
          Authentication Header
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Include your API key in every protected request.
        </p>

        <div className="mt-5 rounded-xl border border-outline-variant/30 bg-black/90 p-4 text-xs text-white">
          <pre>
            <code>x-api-key: YOUR_API_KEY</code>
          </pre>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            1) Generate Short URL
          </h3>
          <div className="mt-5 rounded-xl border border-outline-variant/30 bg-black/90 p-4 text-xs text-white overflow-x-auto">
            <pre>
              <code>{`curl -X POST "/api/v1/url/shorten" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url":"https://example.com"}'`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            2) List My URLs
          </h3>
          <div className="mt-5 rounded-xl border border-outline-variant/30 bg-black/90 p-4 text-xs text-white overflow-x-auto">
            <pre>
              <code>{`curl -X GET "/api/v1/url/my-urls?page=1&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8 lg:col-span-2">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            3) Check API Key Rate-Limit Usage
          </h3>
          <div className="mt-5 rounded-xl border border-outline-variant/30 bg-black/90 p-4 text-xs text-white overflow-x-auto">
            <pre>
              <code>{`curl -X GET "/api/v1/user/api-rate-limit" \\
  -H "x-api-key: YOUR_API_KEY"`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <h3 className="font-headline text-xl font-bold text-on-surface">
          Error Notes
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
          <li>401/403: Invalid or missing x-api-key.</li>
          <li>429: API key rate limit exceeded.</li>
          <li>400: Invalid request payload.</li>
        </ul>
      </section>
    </div>
  );
}
