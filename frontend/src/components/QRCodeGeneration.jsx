import { QRCodeCanvas } from "qrcode.react";

const QRCodeGenerator = ({ url, size = 200 }) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <QRCodeCanvas
        value={url}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}
        includeMargin={true}
        className="bg-white p-2 rounded-lg shadow-lg"
      />
      <p className="text-sm text-gray-600 font-medium">{url}</p>
    </div>
  );
};

export default QRCodeGenerator;
