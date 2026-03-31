"use client";

import React from "react";

const DownloadExtension: React.FC = () => {
  const handleDownload = () => {
    window.location.href = "/download/extension";
  };

  return (
    <div className="p-4">
      <button
        onClick={handleDownload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Download Extension
      </button>
    </div>
  );
};

export default DownloadExtension;
