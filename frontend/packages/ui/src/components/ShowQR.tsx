interface ShowQRProps {
  qrCodeDataUrl: string | null;
  shortUrl: string;
  size?: number;
}

const ShowQR: React.FC<ShowQRProps> = ({
  qrCodeDataUrl,
  shortUrl,
  size = 256,
}) => {
  if (!qrCodeDataUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">
          No QR Code generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={qrCodeDataUrl}
        alt={`QR Code for ${shortUrl}`}
        width={size}
        height={size}
        className="rounded-lg shadow-lg"
      />
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center break-all max-w-xs">
        {shortUrl}
      </p>
    </div>
  );
};

export default ShowQR;
