interface ErrorProps {
  title?: string;
  message?: string;
  homeUrl?: string;
  dashboardUrl?: string;
}

const Error: React.FC<ErrorProps> = ({
  title = "404",
  message = "Page Not Found",
  homeUrl = "/welcome",
  dashboardUrl = "/dashboard",
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-600 via-blue-600 to-indigo-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">{title}</h1>
        <p className="text-2xl mb-8">{message}</p>
        <div className="flex gap-4 justify-center">
          <a
            href={homeUrl}
            className="px-6 py-3 bg-white text-purple-600 dark:bg-gray-700 dark:text-white rounded-lg font-bold hover:scale-105 transition-transform inline-block"
          >
            Go to Welcome Page
          </a>
          <a
            href={dashboardUrl}
            className="px-6 py-3 bg-white text-purple-600 dark:bg-gray-700 dark:text-white rounded-lg font-bold hover:scale-105 transition-transform inline-block"
          >
            Go to Dashboard Page
          </a>
        </div>
      </div>
    </div>
  );
};

export default Error;
