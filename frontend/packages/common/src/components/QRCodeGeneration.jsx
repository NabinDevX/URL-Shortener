import { QRCodeCanvas } from "qrcode.react";
import { forwardRef, useImperativeHandle, useRef } from "react";

const QRCodeGeneration = forwardRef(({ url, size = 256 }, ref) => {
  const canvasRef = useRef(null);

  // Expose generateQRCode method to parent component
  useImperativeHandle(ref, () => ({
    generateQRCode: () => {
      const canvas = canvasRef.current?.querySelector("canvas");
      if (!canvas) {
        throw new Error("QR Code canvas not found");
      }
      // ✅ Already converts to base64 string
      // Returns: "data:image/png;base64,iVBORw0KG..."
      return canvas.toDataURL("image/png");
    },
  }));

  return (
    <div
      ref={canvasRef}
      style={{
        position: "absolute",
        left: "-9999px",
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
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

QRCodeGeneration.displayName = "QRCodeGeneration";

export default QRCodeGeneration;
