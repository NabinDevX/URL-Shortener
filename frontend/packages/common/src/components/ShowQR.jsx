import { QRCodeCanvas } from "qrcode.react";

const ShowQR = ({ qrCodeDataUrl, shortUrl, size = 256 }) => {
  if (!qrCodeDataUrl) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No QR Code generated yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ✅ Display QR from base64 string */}
      <img
        src={qrCodeDataUrl} // "data:image/png;base64,iVBORw0KG..."
        alt={`QR Code for ${shortUrl}`}
        width={size}
        height={size}
        className="rounded-lg shadow-lg"
      />
      <p className="text-sm text-gray-600 text-center break-all max-w-xs">
        {shortUrl}
      </p>
    </div>
  );
};

export default ShowQR;
