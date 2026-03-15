import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface DownloadableQRCodeProps {
  url: string;
  shortId?: string;
  onDownloadSuccess?: () => void;
}

const DownloadableQRCode: React.FC<DownloadableQRCodeProps> = ({
  url,
  shortId,
  onDownloadSuccess,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-code-${shortId || "download"}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    if (onDownloadSuccess) {
      onDownloadSuccess();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div ref={qrRef}>
        <QRCodeCanvas
          value={url}
          size={192}
          level="H"
          includeMargin={true}
          className="bg-white p-2 rounded-lg shadow-lg dark:bg-gray-800"
        />
      </div>
      <button
        onClick={downloadQRCode}
        className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2"
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download QR Code
      </button>
    </div>
  );
};

export default DownloadableQRCode;
