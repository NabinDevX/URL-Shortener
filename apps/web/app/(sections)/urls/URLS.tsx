"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { ShortUrlQRCode, requestOnce } from "@repo/ui";

const URLS = () => {
  const router = useRouter();
  const [urls, setUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [newUrl, setNewUrl] = useState<{
    url: string;
    customShortId: string;
    idLength: number | string;
  }>({ url: "", customShortId: "", idLength: 8 });
  const [selectedUrlAnalytics, setSelectedUrlAnalytics] = useState<
    Record<string, any>
  >({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<
    Record<string, boolean>
  >({});
  const [openQrFor, setOpenQrFor] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: "",
    type: "",
  });
  const [copiedUrl, setCopiedUrl] = useState<string>("");

  const showMessage = useCallback((text: string, type: string): void => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  }, []);

  const fetchUrlAnalytics = useCallback(
    async (shortId: string): Promise<void> => {
      setLoadingAnalytics((prev) => ({ ...prev, [shortId]: true }));
      try {
        const response = await axios.get(`/url/analytics/${shortId}`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setSelectedUrlAnalytics((prev) => ({
            ...prev,
            [shortId]: response.data.data,
          }));
        }
      } catch (error) {
        console.error(`Error fetching analytics for ${shortId}:`, error);
      } finally {
        setLoadingAnalytics((prev) => ({ ...prev, [shortId]: false }));
      }
    },
    []
  );

  const fetchAllUrls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await requestOnce(
        "url:user:all:includeDeleted:true",
        () =>
          axios.get("/url/user/all?includeDeleted=true", {
            withCredentials: true,
          }),
        2500
      );
      if (response.data.success) {
        const urlsData = response.data.data?.urls || [];
        setUrls(urlsData);
        if (urlsData.length > 0) {
          urlsData.forEach((url: any) => {
            void fetchUrlAnalytics(url.shortId);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching URLs:", error);
      const axiosError = error as AxiosError<{ message: string }> | unknown;
      if (axiosError instanceof AxiosError) {
        if (axiosError.response?.status === 401) router.push("/signin");
        if (axiosError.response?.status === 404) setUrls([]);
        else
          showMessage(
            axiosError.response?.data?.message || "Failed to load URLs",
            "error"
          );
      } else {
        showMessage("Failed to load URLs", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUrlAnalytics, router, showMessage]);

  useEffect(() => {
    if (fetchDone) return;
    setFetchDone(true);
    void fetchAllUrls();
  }, [fetchAllUrls, fetchDone]);

  const handleDownloadSuccess = () =>
    showMessage("QR Code downloaded! 📥", "success");

  const handleCreateUrl = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!newUrl.url) {
      showMessage("Please enter a URL", "error");
      return;
    }
    try {
      const parsedUrl = new URL(newUrl.url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        showMessage("URL must start with http:// or https://", "error");
        return;
      }
    } catch {
      showMessage(
        "Please enter a valid URL (include http:// or https://)",
        "error"
      );
      return;
    }
    if (newUrl.customShortId) {
      const c = newUrl.customShortId.trim();
      if (c.length < 3) {
        showMessage("Custom short ID must be at least 3 characters", "error");
        return;
      }
      if (c.length > 20) {
        showMessage("Custom short ID must not exceed 20 characters", "error");
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(c)) {
        showMessage(
          "Custom short ID can only contain letters, numbers, hyphens, and underscores",
          "error"
        );
        return;
      }
    }
    if (!newUrl.customShortId && newUrl.idLength) {
      const length = parseInt(String(newUrl.idLength));
      if (isNaN(length) || length < 4 || length > 15) {
        showMessage("ID length must be between 4 and 15 characters", "error");
        return;
      }
    }
    setCreating(true);
    try {
      const payload: {
        url: string;
        customShortId?: string;
        idLength?: number;
      } = { url: newUrl.url };
      if (newUrl.customShortId?.trim())
        payload.customShortId = newUrl.customShortId.trim();
      if (!newUrl.customShortId && newUrl.idLength)
        payload.idLength = parseInt(String(newUrl.idLength));
      const response = await axios.post("/url", payload, {
        withCredentials: true,
      });
      if (response.data.success) {
        const d = response.data.data;
        if (d.isExisting)
          showMessage(
            `This URL already exists! Short ID: ${d.shortId}`,
            "success"
          );
        else if (d.isCustom)
          showMessage(`Custom short URL created: ${d.shortId} 🎉`, "success");
        else showMessage("Short URL created successfully! 🎉", "success");
        setNewUrl({ url: "", customShortId: "", idLength: 8 });
        setShowCreateForm(false);
        fetchAllUrls();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }> | unknown;
      let errorMessage = "Failed to create short URL";
      if (axiosError instanceof AxiosError) {
        const status = axiosError.response?.status;
        const backendMessage = axiosError.response?.data?.message;
        if (status === 409) {
          errorMessage = newUrl.customShortId?.trim()
            ? "That custom short ID is already taken."
            : backendMessage || "This URL already exists.";
        } else if (backendMessage) errorMessage = backendMessage;
      }
      showMessage(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (shortId: string): void => {
    const domain =
      process.env.NEXT_PUBLIC_DOMAIN || `https://${window.location.host}`;
    navigator.clipboard.writeText(`${domain}/s/${shortId}`);
    setCopiedUrl(shortId);
    showMessage("Link copied to clipboard! 📋", "success");
    setTimeout(() => setCopiedUrl(""), 2000);
  };

  const handleDeleteUrl = async (shortId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this URL?")) return;
    try {
      const response = await axios.delete(`/url/${shortId}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        showMessage("URL deleted successfully", "success");
        fetchAllUrls();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }> | unknown;
      let errorMessage = "Failed to delete URL";
      if (
        axiosError instanceof AxiosError &&
        axiosError.response?.data?.message
      )
        errorMessage = axiosError.response.data.message;
      showMessage(errorMessage, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4" />
          <p className="text-on-surface-variant text-lg font-semibold">
            Loading URLs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      {/* Toast */}
      {message.text && (
        <div
          className={`fixed bottom-6 right-6 z-50 animate-fade-in rounded-xl px-4 py-3 text-sm font-semibold shadow-xl border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>
            {message.type === "success" ? "✅" : "❌"} {message.text}
          </span>
        </div>
      )}

      {/* Create Section */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 glass-card rounded-4xl p-8 shadow-sm border border-white/40">
          <h3 className="text-xl font-bold font-headline mb-2">
            Create New Short Link
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            Paste your long URL below and get a short, trackable link instantly.
          </p>

          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-linear-to-tr from-primary to-primary-container text-white px-8 py-3.5 font-bold transition-transform hover:scale-[1.01]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Create New Short URL
            </button>
          ) : (
            <form onSubmit={handleCreateUrl} className="space-y-5">
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="originalUrl"
                >
                  Original URL <span className="text-error">*</span>
                </label>
                <input
                  id="originalUrl"
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="url"
                  value={newUrl.url}
                  onChange={(e) =>
                    setNewUrl({ ...newUrl, url: e.target.value })
                  }
                  placeholder="https://example.com/very-long-url"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    htmlFor="customId"
                  >
                    Custom Short ID (Optional)
                  </label>
                  <input
                    id="customId"
                    className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    type="text"
                    value={newUrl.customShortId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^[a-zA-Z0-9_-]*$/.test(v))
                        setNewUrl({ ...newUrl, customShortId: v });
                    }}
                    placeholder="my-custom-link"
                    minLength={3}
                    maxLength={20}
                  />
                  {newUrl.customShortId && (
                    <p className="mt-1 text-xs text-primary font-medium">
                      Preview: {window.location.host}/s/{newUrl.customShortId}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    htmlFor="idLen"
                  >
                    Random ID Length
                  </label>
                  <input
                    id="idLen"
                    className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    type="number"
                    value={newUrl.idLength}
                    onChange={(e) =>
                      setNewUrl({ ...newUrl, idLength: e.target.value })
                    }
                    min="4"
                    max="15"
                    disabled={!!newUrl.customShortId}
                  />
                  {!newUrl.customShortId && (
                    <div className="flex gap-1.5 mt-2">
                      {[4, 6, 8, 10, 12].map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() =>
                            setNewUrl({ ...newUrl, idLength: len })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            parseInt(String(newUrl.idLength)) === len
                              ? "bg-primary text-white"
                              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 h-11.5 bg-linear-to-tr from-primary to-primary-container text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : newUrl.customShortId
                      ? "Create Custom URL"
                      : "Shorten Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUrl({ url: "", customShortId: "", idLength: 8 });
                  }}
                  className="px-5 rounded-xl bg-surface-container-high text-on-surface-variant font-bold hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-4xl p-8 shadow-sm flex flex-col items-center justify-center text-center premium-border">
          <div className="bg-surface-container-low p-6 rounded-2xl mb-4 relative">
            <span className="material-symbols-outlined text-tertiary text-5xl">
              qr_code_2
            </span>
            <div className="absolute -top-2 -right-2 bg-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              PRO
            </div>
          </div>
          <h4 className="font-bold mb-1">Live QR Generation</h4>
          <p className="text-xs text-on-surface-variant">
            Real-time QR tracking for print campaigns
          </p>
        </div>
      </div>

      {/* URL List */}
      <div className="bg-surface-container-lowest rounded-4xl overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <h3 className="font-bold text-lg font-headline">
            Your URLs ({urls.length})
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">
            {urls.filter((u) => !u.isDeleted).length} active
          </span>
        </div>

        {urls.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-surface-container-low rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                link_off
              </span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">
              No URLs Yet
            </h3>
            <p className="text-on-surface-variant mb-6">
              Create your first shortened URL above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container">
            {urls.map((url) => {
              const analytics = selectedUrlAnalytics[url.shortId] || {};
              const isLoadingA = loadingAnalytics[url.shortId];
              const domain =
                process.env.NEXT_PUBLIC_DOMAIN ||
                `https://${window.location.host}`;
              const fullShortUrl = `${domain}/s/${url.shortId}`;

              return (
                <div
                  key={url._id}
                  className="p-4 sm:p-6 lg:px-8 hover:bg-surface-bright transition-colors"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Link Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">
                            link
                          </span>
                        </div>
                        <div className="min-w-0">
                          <a
                            href={fullShortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-bold hover:underline truncate block"
                          >
                            {fullShortUrl}
                          </a>
                          <p
                            className="text-xs text-on-surface-variant truncate"
                            title={url.redirectUrl}
                          >
                            {url.redirectUrl}
                          </p>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap gap-3">
                        <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                          {isLoadingA
                            ? "…"
                            : analytics.totalClicks ||
                              url.totalClicks ||
                              0}{" "}
                          clicks
                        </span>
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
                          {new Date(url.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${url.isDeleted ? "bg-error-container text-error" : "bg-emerald-50 text-emerald-700"}`}
                        >
                          {url.isDeleted ? "Deleted" : "Active"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(url.shortId)}
                        className={`p-2.5 rounded-xl transition-all ${copiedUrl === url.shortId ? "bg-emerald-100 text-emerald-600" : "bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-primary/10"}`}
                        title="Copy"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {copiedUrl === url.shortId ? "check" : "content_copy"}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setOpenQrFor((prev) =>
                            prev === url.shortId ? null : url.shortId
                          )
                        }
                        className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 transition-all"
                        title="QR Code"
                      >
                        <span className="material-symbols-outlined text-xl">
                          qr_code_2
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteUrl(url.shortId)}
                        className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-xl">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code Expand */}
                  {openQrFor === url.shortId && (
                    <div className="mt-4 flex justify-center animate-scale-in">
                      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
                        <ShortUrlQRCode
                          shortId={url.shortId}
                          size={150}
                          onDownloadSuccess={handleDownloadSuccess}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default URLS;
