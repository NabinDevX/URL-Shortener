const Error = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl mb-8">Page Not Found</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/welcome"
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition-transform inline-block"
          >
            Go to Welcome Page
          </a>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition-transform inline-block"
          >
            Go to Dashboard Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default Error;
