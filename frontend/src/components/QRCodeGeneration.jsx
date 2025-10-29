import { QRCodeCanvas } from "qrcode.react";
import { forwardRef, useImperativeHandle, useRef } from "react";

const QRCodeGeneration = forwardRef(({ url, size = 256 }, ref) => {
  const canvasRef = useRef(null);

  // Expose generateQRCode method to parent component
  useImperativeHandle(ref, () => ({
    generateQRCode: () => {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (!canvas) {
        throw new Error('QR Code canvas not found');
      }
      // Convert canvas to base64 data URL
      return canvas.toDataURL('image/png');
    }
  }));

  return (
    <div ref={canvasRef} style={{ display: 'none' }}>
      <QRCodeCanvas
        value={url}
        size={size}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"H"}
        includeMargin={true}
      />
    </div>
  );
});

QRCodeGeneration.displayName = 'QRCodeGeneration';

export default QRCodeGeneration;
