"use client";

import { useEffect, useState } from "react";
import { useCallback } from "react";
import axios, { AxiosError } from "axios";
import { Link } from "react-router-dom";

type ApiKeyResponse = {
  apiKey?: string;
  isApiEnabled?: boolean;
  apiRateLimit?: {
    usageCount?: number;
    limit?: number;
    resetAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export default function ApiPanel() {
  const [apiData, setApiData] = useState<ApiKeyResponse>({});
  const [message, setMessage] = useState("");

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const loadApiData = useCallback(async () => {
    try {
      const response = await axios.get("/api/v1/user/api-key", {
        withCredentials: true,
      });
      setApiData(response.data?.data || {});
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      showMessage(
        axiosError.response?.data?.message || "Failed to fetch API key details."
      );
    }
  }, []);

  useEffect(() => {
    void loadApiData();
  }, [loadApiData]);

  const handleCopy = async () => {
    if (!apiData.apiKey) {
      showMessage("No API key to copy.");
      return;
    }

    await navigator.clipboard.writeText(apiData.apiKey);
    showMessage("API key copied.");
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Regenerate API key? Old key will stop working.")) {
      return;
    }

    try {
      await axios.post(
        "/api/v1/user/regenerate-api-key",
        {},
        { withCredentials: true }
      );
      showMessage("API key regenerated successfully.");
      await loadApiData();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      showMessage(
        axiosError.response?.data?.message || "Failed to regenerate API key."
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface">
              Create and Manage APIs
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Manage your API key, rotate credentials, and test endpoints
              quickly.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            to="/api-key-docs"
          >
            <span className="material-symbols-outlined text-base">
              description
            </span>
            API Key Docs
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            API Key
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Use this key in the x-api-key header for protected API requests.
          </p>

          <div className="mt-5 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              Current Key
            </p>
            <code className="block break-all rounded-lg bg-black/90 px-3 py-2 text-xs text-white">
              {apiData.apiKey || "Loading..."}
            </code>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                Key Status
              </p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {apiData.isApiEnabled ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                Rate Limit Usage
              </p>
              <p className="mt-1 text-sm font-bold text-on-surface">
                {apiData.apiRateLimit?.usageCount ?? 0} /{" "}
                {apiData.apiRateLimit?.limit ?? 0}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
              onClick={handleCopy}
              type="button"
            >
              Copy Key
            </button>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              onClick={handleRegenerate}
              type="button"
            >
              Regenerate Key
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Quick Start
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Use your API key to call URLTinier endpoints from your app.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Generate Short URL
              </p>
              <pre className="overflow-x-auto rounded-xl bg-black/90 p-4 text-xs text-white">
                <code>{`curl -X POST "/api/v1/url/shorten" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"url":"https://example.com"}'`}</code>
              </pre>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Fetch My URLs
              </p>
              <pre className="overflow-x-auto rounded-xl bg-black/90 p-4 text-xs text-white">
                <code>{`curl -X GET "/api/v1/url/my-urls?page=1&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <p className="text-xs rounded-lg bg-surface-container-high px-3 py-2 text-on-surface-variant">
          {message}
        </p>
      ) : null}
    </div>
  );
}
