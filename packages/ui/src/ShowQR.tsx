import React from "react";
import QRCode from "react-qr-code";

export interface ShowQRProps {
  shortUrl: string;
  size?: number;
}

export const ShowQR: React.FC<ShowQRProps> = ({ shortUrl, size = 100 }) => {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest p-3">
      <div
        className="rounded-2xl bg-white p-3"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <QRCode
          value={shortUrl}
          size={size - 24}
          bgColor="#ffffff"
          fgColor="#111827"
          level="H"
        />
      </div>
      <a
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-bold text-primary hover:underline truncate"
        title={shortUrl}
      >
        {shortUrl.length > 20 ? `${shortUrl.substring(0, 20)}...` : shortUrl}
      </a>
    </div>
  );
};
