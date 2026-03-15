import { useState, useEffect } from "react";
import axios from "axios";
import { ShowQR, useAuth } from "@myorg/ui";

interface UrlItem {
  _id: string;
  shortId: string;
  redirectUrl: string;
  qrCode?: string;
  totalClicks?: number;
  createdAt: string;
}

const ExtensionDashboard = () => {
  const { userData, logout } = useAuth();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState("");

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/v1/url/user/all", {
        withCredentials: true,
        timeout: 10000,
      });

      const urlsData: UrlItem[] = response.data.data?.urls || [];
      setUrls(urlsData.filter((url) => url.qrCode));
    } catch (error) {
      console.error("Failed to fetch URLs", error);
      setUrls([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortId: string) => {
    const fullUrl = `https://urltinier.app/${shortId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(shortId);
    setTimeout(() => setCopiedUrl(""), 2000);
  };

  const handleLogout = async () => {
    await logout();
  };

  const openWebApp = () => {
    window.open("https://urltinier.app", "_blank");
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white mx-auto mb-3"></div>
          <p className="text-white font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 overflow-y-auto">
      {}
      <div className="bg-white/10 backdrop-blur-sm p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <h1 className="text-white font-bold text-lg">URL Shortener</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          Welcome, {userData?.name}! 👋
        </p>
      </div>

      {}
      <div className="p-4">
        {}
        <button
          onClick={openWebApp}
          className="w-full mb-4 py-3 bg-white text-purple-600 rounded-lg font-bold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
        >
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open Full Web App
        </button>

        {}
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <h2 className="text-gray-800 font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-xl">📱</span>
            Your QR Codes ({urls.length})
          </h2>

          {urls.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-3 block">🔗</span>
              <p className="text-gray-600 text-sm mb-4">No QR codes yet</p>
              <button
                onClick={openWebApp}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Create URLs in Web App
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {urls.map((url) => (
                <div
                  key={url._id}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {}
                    <div className="flex-shrink-0">
                      {url.qrCode && (
                        <ShowQR
                          qrCodeDataUrl={url.qrCode}
                          shortUrl={`https://urltinier.app/${url.shortId}`}
                          size={80}
                        />
                      )}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm mb-1 truncate">
                        {url.shortId}
                      </p>
                      <a
                        href={`https://urltinier.app/${url.shortId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 text-xs truncate block mb-2"
                      >
                        https://urltinier.app/{url.shortId}
                      </a>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(url.shortId)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          {copiedUrl === url.shortId ? "✓ Copied" : "Copy Link"}
                        </button>
                        {url.totalClicks !== undefined && (
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-semibold">
                            {url.totalClicks} clicks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p
                      className="text-xs text-gray-500 truncate"
                      title={url.redirectUrl}
                    >
                      → {url.redirectUrl}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="mt-4 text-center">
          <p className="text-white/70 text-xs">
            Use the web app for full features
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDashboard;
