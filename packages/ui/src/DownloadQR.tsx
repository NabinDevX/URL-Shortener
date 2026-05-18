import React, { useCallback, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import axios, { AxiosError } from "axios";

export interface DownloadQRProps {
  shortId: string;
  size?: number;
  baseUrl?: string;
  apiPrefix?: string;
  initiallySaved?: boolean;
  persistToApi?: boolean;
  onDownloadSuccess?: () => void;
  onSaveSuccess?: () => void;
  onError?: (message: string) => void;
}

const defaultBaseUrl = "https://urltinier.app";

function getRuntimeBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl) return explicitBaseUrl.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return defaultBaseUrl;
}

async function downloadSvgAsPng(
  svgElement: SVGSVGElement,
  filename: string,
  size: number
): Promise<void> {
  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8",
  });

  const url = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to render QR image"));
      image.src = url;
    });

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = size * scale;
    canvas.height = size * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create canvas context");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) reject(new Error("Failed to encode PNG"));
        else resolve(b);
      }, "image/png");
    });

    const downloadUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(downloadUrl);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const DownloadQR: React.FC<DownloadQRProps> = ({
  shortId,
  size = 160,
  baseUrl,
  apiPrefix = "",
  initiallySaved = false,
  persistToApi = true,
  onDownloadSuccess,
  onSaveSuccess,
  onError,
}) => {
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);

  const shortUrl = useMemo(() => {
    const base = getRuntimeBaseUrl(baseUrl);
    return `${base}/${shortId}`;
  }, [baseUrl, shortId]);

  const persistGenerated = useCallback(async () => {
    await axios.patch(
      `${apiPrefix}/url/update/${encodeURIComponent(shortId)}`,
      {
        shortId,
        qrCode: shortUrl,
      },
      { withCredentials: true }
    );
  }, [apiPrefix, shortId, shortUrl]);

  const handleAction = useCallback(async () => {
    if (!shortId) return;
    if (busy) return;

    setBusy(true);
    try {
      if (!saved && persistToApi) {
        await persistGenerated();
        setSaved(true);
        onSaveSuccess?.();
        return;
      }

      const svg = qrContainerRef.current?.querySelector(
        "svg"
      ) as SVGSVGElement | null;
      if (!svg) throw new Error("QR is not ready yet");

      await downloadSvgAsPng(svg, `${shortId}-qr.png`, size);
      onDownloadSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }> | unknown;
      const msg =
        axiosError instanceof AxiosError
          ? axiosError.response?.data?.message || "Failed to generate QR"
          : err instanceof Error
            ? err.message
            : "Failed to generate QR";
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    onDownloadSuccess,
    onError,
    onSaveSuccess,
    persistGenerated,
    persistToApi,
    saved,
    shortId,
    size,
  ]);

  const buttonLabel = saved ? "Download QR Code" : "Generate & Save QR";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl bg-surface-container-lowest p-4">
        <div
          className="rounded-2xl bg-white p-4"
          style={{ width: size, height: size }}
        >
          <div ref={qrContainerRef}>
            <QRCode
              value={shortUrl}
              size={size - 32}
              bgColor="#ffffff"
              fgColor="#111827"
              level="H"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-primary hover:underline"
        >
          {shortUrl}
        </a>

        <button
          type="button"
          onClick={handleAction}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-tertiary px-4 text-sm font-bold text-on-tertiary transition-colors hover:bg-tertiary-fixed disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">
            {saved ? "download" : "qr_code_2"}
          </span>
          {busy ? "Please wait..." : buttonLabel}
        </button>
      </div>
    </div>
  );
};
