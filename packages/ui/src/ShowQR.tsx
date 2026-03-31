import React from "react";

export interface ShowQRProps {
  qrCodeDataUrl: string;
  shortUrl: string;
  size?: number;
}

export const ShowQR: React.FC<ShowQRProps> = ({
  qrCodeDataUrl,
  shortUrl,
  size = 100,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <img
        src={qrCodeDataUrl}
        alt="QR Code"
        style={{ width: `${size}px`, height: `${size}px` }}
        className="border-2 border-gray-200 rounded"
      />
      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:text-blue-800 truncate"
        title={shortUrl}
      >
        {shortUrl.length > 20 ? `${shortUrl.substring(0, 20)}...` : shortUrl}
      </a>
    </div>
  );
};
