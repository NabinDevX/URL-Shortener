"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { requestOnce } from "@repo/ui";

const Dashboard = ({ userData }: { userData?: any }) => {
  const [urls, setUrls] = useState<any[]>([]);
  const [, setAnalytics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  const fetchAllAnalytics = useCallback(
    async (urlsList: any[]): Promise<void> => {
      try {
        const analyticsPromises = urlsList.map((url: any) =>
          axios
            .get(`/api/v1/url/analytics/${url.shortId}`, {
              withCredentials: true,
            })
            .catch((err) => {
              console.error(
                `Failed to fetch analytics for ${url.shortId}:`,
                err
              );
              return { data: { data: { totalClicks: 0, clicksByDate: [] } } };
            })
        );

        const analyticsResults = await Promise.all(analyticsPromises);

        const analyticsMap: Record<string, any> = {};
        urlsList.forEach((url: any, index: number) => {
          if (analyticsResults[index]) {
            analyticsMap[url.shortId] = analyticsResults[index].data.data || {};
          }
        });

        setAnalytics(analyticsMap);
      } catch (err) {
        console.error("❌ Error fetching analytics:", err);
      }
    },
    []
  );

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestOnce(
        "url:user:all",
        () =>
          axios.get("/api/v1/url/user/all", {
            withCredentials: true,
            timeout: 10000,
          }),
        2500
      );

      const urlsData = response.data.data?.urls || [];
      setUrls(urlsData);

      if (urlsData.length > 0) {
        await fetchAllAnalytics(urlsData);
      }
    } catch (err) {
      console.error("❌ Error fetching URLs:", err);
      const axiosError = err as
        | AxiosError<{ message: string; data?: { urls: any[] } }>
        | unknown;

      if (axiosError instanceof AxiosError) {
        if (
          axiosError.response?.status === 404 ||
          axiosError.response?.data?.data?.urls?.length === 0
        ) {
          setUrls([]);
        } else {
          setError(axiosError.response?.data?.message || "Failed to load URLs");
        }
      } else {
        setError("Failed to load URLs");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchAllAnalytics]);

  useEffect(() => {
    if (fetchDone) return;
    setFetchDone(true);
    void fetchUrls();
  }, [fetchDone, fetchUrls]);

  const totalUrls = urls.length;
  const totalClicks = urls.reduce(
    (sum: number, url: any) => sum + (url.totalClicks || 0),
    0
  );
  const activeUrls = urls.filter((url: any) => !url.isDeleted).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchUrls}
              className="px-6 py-3 bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#667eea] to-[#764ba2] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center text-white">
          <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">
            Welcome back, {userData?.name || userData?.username || "User"}! 👋
          </h1>
          <p className="text-xl text-white/90">
            Here&apos;s an overview of your shortened URLs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Total URLs
                </p>
                <p className="text-5xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  {totalUrls}
                </p>
              </div>
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 rounded-2xl shadow-lg">
                <span className="text-4xl">🔗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Total Clicks
                </p>
                <p className="text-5xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  {totalClicks}
                </p>
              </div>
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 rounded-2xl shadow-lg">
                <span className="text-4xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-2 uppercase tracking-wide">
                  Active URLs
                </p>
                <p className="text-5xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  {activeUrls}
                </p>
              </div>
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 rounded-2xl shadow-lg">
                <span className="text-4xl">✨</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 bg-linear-to-r from-[#667eea] to-[#764ba2]">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Your URLs</h2>
              <Link
                to="/urls"
                className="px-6 py-3 bg-white text-[#667eea] rounded-full font-bold hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Manage URLs
              </Link>
            </div>
          </div>

          {urls.length === 0 ? (
            <div className="p-16 text-center">
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
                <Link
                  to="/urls"
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
                  Create Short URL
                </Link>
                <p className="text-gray-500 text-sm mt-6">
                  Shorten, customize, and track your URLs in one place
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {urls.slice(0, 5).map((url) => {
                const clicks = url.totalClicks || 0;

                return (
                  <div
                    key={url._id || url.shortId}
                    className="p-8 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-linear-to-r from-[#667eea] to-[#764ba2] p-2 rounded-lg">
                            <span className="text-2xl">🔗</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 truncate">
                            {url.shortId}
                          </h3>
                        </div>

                        <div className="space-y-2 ml-12">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 font-semibold">
                              Short URL:
                            </span>
                            <a
                              href={`https://${window.location.host}/s/${url.shortId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#667eea] hover:text-[#764ba2] font-medium truncate transition-colors"
                            >
                              {`${window.location.origin}/s/${url.shortId}`}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `https://${window.location.host}/s/${url.shortId}`
                                );
                              }}
                              className="text-gray-400 hover:text-[#667eea] transition-colors text-lg"
                              title="Copy to clipboard"
                            >
                              📋
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 font-semibold">
                              Original:
                            </span>
                            <a
                              href={url.redirectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-800 truncate transition-colors"
                            >
                              {url.redirectUrl}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4 ml-12 text-xs text-gray-500">
                          <span className="bg-gray-100 px-3 py-1 rounded-full">
                            Created:{" "}
                            {new Date(url.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right bg-linear-to-br from-[#667eea]/10 to-[#764ba2]/10 rounded-2xl p-4">
                          <p className="text-4xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                            {clicks}
                          </p>
                          <p className="text-sm text-gray-500 font-semibold">
                            clicks
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            setSelectedUrl(
                              selectedUrl === url.shortId ? null : url.shortId
                            )
                          }
                          className="px-4 py-2 text-sm bg-linear-to-r from-[#667eea] to-[#764ba2] text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
                        >
                          {selectedUrl === url.shortId ? "Hide" : "View"}{" "}
                          Details
                        </button>
                      </div>
                    </div>

                    {selectedUrl === url.shortId && url.visitHistory && (
                      <div className="mt-6 pt-6 border-t border-gray-200 ml-12">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <span className="text-xl">📈</span>
                          Recent Visits
                        </h4>

                        {url.visitHistory.length > 0 ? (
                          <div className="space-y-2">
                            {url.visitHistory
                              .slice(-7)
                              .reverse()
                              .map((visit: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm bg-linear-to-r from-gray-50 to-gray-100 p-3 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <span className="text-gray-600 font-medium">
                                    {new Date(visit.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">
                            No visits yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {urls.length > 5 && (
            <div className="px-8 py-6 bg-gray-50 text-center border-t border-gray-200">
              <Link
                to="/urls"
                className="text-[#667eea] hover:text-[#764ba2] font-bold text-lg transition-colors inline-flex items-center gap-2"
              >
                View All {urls.length} URLs
                <span className="text-xl">→</span>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/urls"
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Create New URL
                </h3>
                <p className="text-sm text-gray-600">Shorten a new link</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-linear-to-br from-[#667eea] to-[#764ba2] p-5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  View Profile
                </h3>
                <p className="text-sm text-gray-600">Manage your account</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
