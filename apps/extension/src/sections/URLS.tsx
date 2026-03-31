import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShortUrlQRCode, requestOnce } from "@repo/ui";
import type {
  UrlItem,
  NewUrlForm,
  CreateUrlPayload,
  Message,
  MessageType,
  AnalyticsMap,
  LoadingMap,
  AxiosErrorResponse,
  FormEvent,
  VisitHistory,
} from "@/types";

const URLS = () => {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);
  const [newUrl, setNewUrl] = useState<NewUrlForm>({
    url: "",
    customShortId: "",
    idLength: 8,
  });
  const [selectedUrlAnalytics, setSelectedUrlAnalytics] =
    useState<AnalyticsMap>({});
  const [loadingAnalytics, setLoadingAnalytics] = useState<LoadingMap>({});

  const [openQrFor, setOpenQrFor] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({ text: "", type: "" });
  const [copiedUrl, setCopiedUrl] = useState("");

  const showMessage = useCallback((text: string, type: MessageType) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  }, []);

  const fetchUrlAnalytics = useCallback(async (shortId: string) => {
    setLoadingAnalytics((prev) => ({ ...prev, [shortId]: true }));
    try {
      const response = await axios.get(`/api/v1/url/analytics/${shortId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSelectedUrlAnalytics((prev) => ({
          ...prev,
          [shortId]: response.data.data,
        }));
      }
    } catch (error) {
      void error;
    } finally {
      setLoadingAnalytics((prev) => ({ ...prev, [shortId]: false }));
    }
  }, []);

  const fetchAllUrls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await requestOnce(
        "url:user:all:includeDeleted:true",
        () =>
          axios.get("/api/v1/url/user/all?includeDeleted=true", {
            withCredentials: true,
          }),
        2500
      );

      if (response.data.success) {
        const urlsData: UrlItem[] = response.data.data?.urls || [];
        setUrls(urlsData);
        if (urlsData.length > 0) {
          urlsData.forEach((url) => {
            void fetchUrlAnalytics(url.shortId);
          });
        }
      }
    } catch (err) {
      const error = err as AxiosErrorResponse;
      if (error.response?.status === 401) {
        navigate("/login");
      }
      if (error.response?.status === 404) {
        setUrls([]);
      } else {
        showMessage(
          error.response?.data?.message || "Failed to load URLs",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fetchUrlAnalytics, navigate, showMessage]);

  useEffect(() => {
    if (fetchDone) return;
    setFetchDone(true);
    void fetchAllUrls();
  }, [fetchDone, fetchAllUrls]);

  const handleDownloadSuccess = (): void => {
    showMessage("QR Code downloaded! 📥", "success");
  };
  const handleCreateUrl = async (e: FormEvent) => {
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
      const customId = newUrl.customShortId.trim();

      if (customId.length < 3) {
        showMessage("Custom short ID must be at least 3 characters", "error");
        return;
      }

      if (customId.length > 20) {
        showMessage("Custom short ID must not exceed 20 characters", "error");
        return;
      }

      const validShortIdRegex = /^[a-zA-Z0-9_-]+$/;
      if (!validShortIdRegex.test(customId)) {
        showMessage(
          "Custom short ID can only contain letters, numbers, hyphens, and underscores",
          "error"
        );
        return;
      }
    }
    if (!newUrl.customShortId && newUrl.idLength) {
      const length = newUrl.idLength;
      if (isNaN(length) || length < 4 || length > 15) {
        showMessage("ID length must be between 4 and 15 characters", "error");
        return;
      }
    }

    setCreating(true);
    try {
      const payload: CreateUrlPayload = {
        url: newUrl.url,
      };
      if (newUrl.customShortId && newUrl.customShortId.trim()) {
        payload.customShortId = newUrl.customShortId.trim();
      }
      if (!newUrl.customShortId && newUrl.idLength) {
        payload.idLength = newUrl.idLength;
      }

      const response = await axios.post("/api/v1/url", payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        const responseData = response.data.data;

        if (responseData.isExisting) {
          showMessage(
            `This URL already exists! Short ID: ${responseData.shortId}`,
            "success"
          );
        } else if (responseData.isCustom) {
          showMessage(
            `Custom short URL created: ${responseData.shortId} 🎉`,
            "success"
          );
        } else {
          showMessage("Short URL created successfully! 🎉", "success");
        }

        setNewUrl({ url: "", customShortId: "", idLength: 8 });
        setShowCreateForm(false);
        fetchAllUrls(); // Refresh the list
      }
    } catch (err) {
      const error = err as AxiosErrorResponse;
      const errorMessage =
        error.response?.data?.message || "Failed to create short URL";
      showMessage(errorMessage, "error");
    } finally {
      setCreating(false);
    }
  };
  const copyToClipboard = (shortId: string) => {
    const fullUrl = `https://urltinier.app/${shortId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(shortId);
    showMessage("Link copied to clipboard! 📋", "success");

    setTimeout(() => {
      setCopiedUrl("");
    }, 2000);
  };
  const handleDeleteUrl = async (shortId: string) => {
    if (!window.confirm("Are you sure you want to delete this URL?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/v1/url/${shortId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        showMessage("URL deleted successfully", "success");
        fetchAllUrls();
      }
    } catch (err) {
      const error = err as AxiosErrorResponse;
      showMessage(
        error.response?.data?.message || "Failed to delete URL",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Loading URLs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 text-white">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-2xl">
            <span className="text-5xl">🔗</span>
          </div>
          <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">
            Manage URLs
          </h1>
          <p className="text-xl text-white/90">
            Create and track your shortened links
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl shadow-lg max-w-4xl mx-auto ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border-2 border-green-300"
                : "bg-red-100 text-red-800 border-2 border-red-300"
            }`}
          >
            <p className="font-semibold flex items-center gap-2">
              <span>{message.type === "success" ? "✅" : "❌"}</span>
              {message.text}
            </p>
          </div>
        )}

        <div className="max-w-4xl mx-auto mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full py-4 px-6 bg-white text-[#667eea] rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group"
          >
            <svg
              className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {showCreateForm ? "Hide Form" : "Create New Short URL"}
          </button>
        </div>

        {showCreateForm && (
          <div className="max-w-4xl mx-auto mb-8 bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">✨</span>
              Create Short URL
            </h2>

            <form onSubmit={handleCreateUrl} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Original URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newUrl.url}
                  onChange={(e) =>
                    setNewUrl({ ...newUrl, url: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                  placeholder="https://example.com/your-long-url"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must start with http:// or https://
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Choose one option below:
                </p>
                <ul className="text-xs text-blue-700 mt-2 ml-6 space-y-1">
                  <li>
                    • Create a <strong>custom short ID</strong> (e.g.,
                    "my-link")
                  </li>
                  <li>
                    • Or let the system generate a random ID with your{" "}
                    <strong>preferred length</strong>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Short ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newUrl.customShortId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[a-zA-Z0-9_-]*$/.test(value)) {
                        setNewUrl({ ...newUrl, customShortId: value });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors"
                    placeholder="my-custom-link"
                    minLength={3}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-20 characters • Letters, numbers, hyphens, underscores
                  </p>
                  {newUrl.customShortId && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 font-semibold">
                        Preview: https://urltinier.app/
                        <span className="font-bold">
                          {newUrl.customShortId}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Random ID Length
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newUrl.idLength}
                      onChange={(e) =>
                        setNewUrl({
                          ...newUrl,
                          idLength: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#667eea] focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                      min={4}
                      max={15}
                      disabled={!!newUrl.customShortId}
                    />
                    {newUrl.customShortId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
                        <span className="text-xs text-gray-500 font-semibold">
                          Disabled (using custom ID)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {newUrl.customShortId
                      ? "Only used when no custom ID is provided"
                      : `Range: 4-15 characters • Current: ${newUrl.idLength} chars`}
                  </p>
                  {!newUrl.customShortId && (
                    <div className="mt-2">
                      <div className="flex gap-2">
                        {[4, 6, 8, 10, 12].map((len) => (
                          <button
                            key={len}
                            type="button"
                            onClick={() =>
                              setNewUrl({ ...newUrl, idLength: len })
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              newUrl.idLength === len
                                ? "bg-[#667eea] text-white shadow-lg"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {len}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {newUrl.customShortId
                        ? "Create Custom URL"
                        : "Create Random URL"}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUrl({ url: "", customShortId: "", idLength: 8 });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {urls.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-2xl p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <span className="text-6xl">🔗</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3">
                  No URLs Yet
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Create your first shortened URL to get started!
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-3 px-10 py-4 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create Your First URL
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-3xl">📊</span>
                  Your URLs ({urls.length})
                </h2>
              </div>

              {urls.map((url) => {
                const analytics = selectedUrlAnalytics[url.shortId];
                const isLoadingAnalytics = loadingAnalytics[url.shortId];
                const fullShortUrl = `https://urltinier.app/${url.shortId}`;

                return (
                  <div
                    key={url._id}
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300"
                  >
                    <div className="bg-linear-to-r from-[#667eea] to-[#764ba2] p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white p-2 rounded-lg shadow-lg">
                              <span className="text-2xl">🔗</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white truncate">
                              {url.shortId}
                            </h3>
                          </div>

                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
                            <p className="text-xs text-white/70 font-semibold mb-2">
                              SHORT URL
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <a
                                href={fullShortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white font-bold text-lg hover:underline flex-1 truncate min-w-0"
                              >
                                {fullShortUrl}
                              </a>
                              <button
                                onClick={() => copyToClipboard(url.shortId)}
                                className="bg-white text-[#667eea] px-4 py-2 rounded-lg font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 shrink-0"
                              >
                                {copiedUrl === url.shortId ? (
                                  <>
                                    <span>✓</span>
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <span>📋</span>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-xs text-white/70 font-semibold mb-2">
                              REDIRECTS TO
                            </p>
                            <a
                              href={url.redirectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/90 hover:text-white transition-colors break-all"
                              title={url.redirectUrl}
                            >
                              {url.redirectUrl}
                            </a>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">📱</span>
                            <h5 className="font-bold text-white text-sm">
                              QR Code
                            </h5>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenQrFor((prev) =>
                                prev === url.shortId ? null : url.shortId
                              )
                            }
                            className="bg-white text-[#667eea] px-4 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
                          >
                            {openQrFor === url.shortId ? "Hide QR" : "Show QR"}
                          </button>

                          {openQrFor === url.shortId ? (
                            <ShortUrlQRCode
                              shortId={url.shortId}
                              size={120}
                              onDownloadSuccess={handleDownloadSuccess}
                            />
                          ) : null}
                        </div>

                        <button
                          onClick={() => handleDeleteUrl(url.shortId)}
                          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 shrink-0"
                          title="Delete URL"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        Analytics
                      </h4>

                      {isLoadingAnalytics ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#667eea]"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                            <p className="text-sm text-blue-600 font-semibold mb-1">
                              Total Clicks
                            </p>
                            <p className="text-3xl font-bold text-blue-700">
                              {analytics?.totalClicks ?? url.totalClicks ?? 0}
                            </p>
                          </div>

                          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                            <p className="text-sm text-green-600 font-semibold mb-1">
                              Created On
                            </p>
                            <p className="text-lg font-bold text-green-700">
                              {new Date(url.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                            <p className="text-sm text-purple-600 font-semibold mb-1">
                              Status
                            </p>
                            <p className="text-lg font-bold text-purple-700">
                              {url.isDeleted ? "🔴 Deleted" : "🟢 Active"}
                            </p>
                          </div>
                        </div>
                      )}

                      {url.visitHistory && url.visitHistory.length > 0 && (
                        <div className="mt-6">
                          <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">🕒</span>
                            Recent Visits (Last{" "}
                            {Math.min(url.visitHistory.length, 5)})
                          </h5>
                          <div className="space-y-2">
                            {url.visitHistory
                              .slice(-5)
                              .reverse()
                              .map((visit: VisitHistory, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <span className="text-sm text-gray-700 font-medium">
                                    {new Date(visit.timestamp).toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                                    Visit #
                                    {(url.visitHistory?.length ?? 0) - index}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default URLS;
