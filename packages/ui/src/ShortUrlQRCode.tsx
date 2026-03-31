import React, { useState, useEffect } from "react";

export interface ShortUrlQRCodeProps {
  shortId: string;
  size?: number;
  onDownloadSuccess?: () => void;
}

export const ShortUrlQRCode: React.FC<ShortUrlQRCodeProps> = ({
  shortId,
  size = 120,
  onDownloadSuccess,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    `https://urltinier.app/${shortId}`
  )}`;

  const handleDownload = async () => {
    if (!isClient) return;
    setDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-code-${shortId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onDownloadSuccess?.();
    } catch (error) {
      console.error("Failed to download QR code:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="border-2 border-gray-200 rounded overflow-hidden">
        <img
          src={qrCodeUrl}
          alt={`QR code for ${shortId}`}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="block"
        />
      </div>
      <div className="flex gap-2">
        <a
          href={`https://urltinier.app/${shortId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          urltinier.app/{shortId}
        </a>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
          title="Download QR Code"
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </div>
    </div>
  );
};
