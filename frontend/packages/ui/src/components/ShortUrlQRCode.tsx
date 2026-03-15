import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface ShortUrlQRCodeProps {
  shortId: string;
  baseUrl?: string;
  size?: number;
  showDownloadButton?: boolean;
  onDownloadSuccess?: () => void;
}

const ShortUrlQRCode: React.FC<ShortUrlQRCodeProps> = ({
  shortId,
  baseUrl = "https://urltinier.app",
  size = 120,
  showDownloadButton = true,
  onDownloadSuccess,
}) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const shortUrl = `${baseUrl}/${shortId}`;

  const handleDownload = () => {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) {
      return;
    }

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-code-${shortId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    if (onDownloadSuccess) {
      onDownloadSuccess();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={qrContainerRef} className="bg-white p-2 rounded-lg">
        <QRCodeCanvas
          value={shortUrl}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={true}
        />
      </div>

      <p className="text-xs text-center text-white break-all max-w-[180px]">
        {shortUrl}
      </p>

      {showDownloadButton ? (
        <button
          type="button"
          onClick={handleDownload}
          className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      ) : null}
    </div>
  );
};

export default ShortUrlQRCode;
