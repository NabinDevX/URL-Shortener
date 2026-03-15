import { QRCodeCanvas } from "qrcode.react";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";

export interface QRCodeGenerationHandle {
  generateQRCode: () => string;
}

interface QRCodeGenerationProps {
  url: string;
  size?: number;
}

const QRCodeGeneration = forwardRef<
  QRCodeGenerationHandle,
  QRCodeGenerationProps
>(({ url, size = 256 }, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, [url]);
  useImperativeHandle(ref, () => ({
    generateQRCode: () => {
      if (!isReady) {
        throw new Error("QR Code not ready yet");
      }

      const canvas = canvasRef.current?.querySelector("canvas");
      if (!canvas) {
        throw new Error("QR Code canvas not found");
      }
      return canvas.toDataURL("image/png");
    },
  }));

  return (
    <div
      ref={canvasRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: "0",
        opacity: 0,
        pointerEvents: "none",
        width: size,
        height: size,
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
