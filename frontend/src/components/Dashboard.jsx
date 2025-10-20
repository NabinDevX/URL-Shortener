import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ userData }) => {
  const [urls, setUrls] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const VITE_API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/';

  useEffect(() => {
    fetchUrls();
  }, []);

  // Fetch all URLs
  const fetchUrls = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/v1/url/', {
        withCredentials: true,
        timeout: 10000
      });

      console.log('✅ URLs fetched:', response.data);
      const urlsData = response.data.data || response.data || [];
      setUrls(urlsData);

      // Fetch analytics for each URL
      if (urlsData.length > 0) {
        await fetchAllAnalytics(urlsData);
      }

    } catch (err) {
      console.error('❌ Error fetching URLs:', err);
      setError(err.response?.data?.message || 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics for all URLs
  const fetchAllAnalytics = async (urlsList) => {
    try {
      const analyticsPromises = urlsList.map(url => 
        axios.get('/api/v1/url/analytics/${url.shortId}', {
          withCredentials: true
        }).catch(err => {
          console.error(`Failed to fetch analytics for ${url.shortId}:`, err);
          return { data: { data: { totalClicks: 0, clicksByDate: [] } } };
        })
      );

      const analyticsResults = await Promise.all(analyticsPromises);
      
      const analyticsMap = {};
      urlsList.forEach((url, index) => {
        analyticsMap[url.shortId] = analyticsResults[index].data.data || {};
      });

      setAnalytics(analyticsMap);
      console.log('✅ Analytics fetched:', analyticsMap);

    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
    }
  };

  // Calculate total statistics
  const totalUrls = urls.length;
  const totalClicks = Object.values(analytics).reduce(
    (sum, data) => sum + (data.totalClicks || 0), 
    0
  );
  const activeUrls = urls.filter(url => !url.isDeleted).length;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUrls}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {userData?.name}! 👋
          </h1>
          <p className="text-gray-600">Here's an overview of your shortened URLs</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total URLs */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Total URLs</p>
                <p className="text-4xl font-bold">{totalUrls}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Clicks */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Clicks</p>
                <p className="text-4xl font-bold">{totalClicks}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active URLs */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Active URLs</p>
                <p className="text-4xl font-bold">{activeUrls}</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* URLs List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your URLs</h2>
              <Link
                to="/urls"
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View All URLs
              </Link>
            </div>
          </div>

          {urls.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">🔗</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No URLs Yet</h3>
              <p className="text-gray-600 mb-6">Create your first shortened URL to get started!</p>
              <Link
                to="/urls"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Create URL
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {urls.slice(0, 5).map((url) => {
                const urlAnalytics = analytics[url.shortId] || {};
                const clicks = urlAnalytics.totalClicks || 0;

                return (
                  <div
                    key={url._id || url.shortId}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* URL Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {url.title || url.shortId}
                          </h3>
                          {url.isDeleted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Deleted
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Short URL:</span>
                            <a
                              href={`${window.location.origin}/${url.shortId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800 font-medium truncate"
                            >
                              {window.location.origin}/{url.shortId}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/${url.shortId}`);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              📋
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Original:</span>
                            <a
                              href={url.redirectURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-800 truncate"
                            >
                              {url.redirectURL}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Created: {new Date(url.createdAt).toLocaleDateString()}</span>
                          {url.expiresAt && (
                            <span>Expires: {new Date(url.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-3xl font-bold text-purple-600">{clicks}</p>
                          <p className="text-sm text-gray-500">clicks</p>
                        </div>
                        
                        <button
                          onClick={() => setSelectedUrl(selectedUrl === url.shortId ? null : url.shortId)}
                          className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          {selectedUrl === url.shortId ? 'Hide' : 'View'} Details
                        </button>
                      </div>
                    </div>

                    {/* Detailed Analytics */}
                    {selectedUrl === url.shortId && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Detailed Analytics</h4>
                        
                        {urlAnalytics.clicksByDate && urlAnalytics.clicksByDate.length > 0 ? (
                          <div className="space-y-2">
                            {urlAnalytics.clicksByDate.slice(0, 7).map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-purple-600 h-2 rounded-full"
                                      style={{
                                        width: `${(item.count / Math.max(...urlAnalytics.clicksByDate.map(d => d.count))) * 100}%`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="font-semibold text-gray-800 w-8 text-right">
                                    {item.count}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No analytics data available</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {urls.length > 5 && (
            <div className="px-6 py-4 bg-gray-50 text-center">
              <Link
                to="/urls"
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                View All {urls.length} URLs →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/urls"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Create New URL</h3>
                <p className="text-sm text-gray-600">Shorten a new link</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">View Profile</h3>
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