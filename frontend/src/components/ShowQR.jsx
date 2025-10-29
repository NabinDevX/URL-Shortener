import { QRCodeCanvas } from "qrcode.react";

const ShowQR = ({ qrCodeDataUrl, shortUrl, size = 192 }) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      {qrCodeDataUrl ? (
        // Show saved QR code from backend
        <img 
          src={qrCodeDataUrl} 
          alt={`QR Code for ${shortUrl}`}
          className="bg-white p-2 rounded-lg shadow-lg"
          style={{ width: size, height: size }}
        />
      ) : (
        // Generate QR code on the fly
        <QRCodeCanvas
          value={shortUrl}
          size={size}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={true}
          className="bg-white p-2 rounded-lg shadow-lg"
        />
      )}
      <p className="text-sm text-gray-600 font-medium break-all max-w-xs text-center">
        {shortUrl}
      </p>
    </div>
  );
};

export default ShowQR;