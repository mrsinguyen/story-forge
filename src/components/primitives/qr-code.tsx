import { useEffect, useState } from "react";
import { cn } from "@src/lib/cn";

type Props = {
  /** Payload to encode. Re-renders the QR whenever it changes. */
  data: string;
  /** Render size in pixels (the inner QR canvas; outer `<img>` matches). */
  size?: number;
  /** QR error-correction level — higher levels reduce capacity. */
  errorCorrection?: "L" | "M" | "Q" | "H";
  /** Quiet-zone thickness, in QR modules. */
  margin?: number;
  /** Alt text for the rendered `<img>`. */
  alt?: string;
  className?: string;
  /** Rendered when the encoder fails (typically: payload too large). */
  fallback?: React.ReactNode;
};

/**
 * Pure presentational QR. Encodes `data` to a PNG data URL via the
 * `qrcode` lib (lazy-loaded so it stays out of the main bundle until a QR
 * actually mounts). Returns `fallback` if encoding throws — the realistic
 * cause is payload size exceeding QR Version 40 capacity at the chosen
 * error-correction level.
 */
export function QRCode({
  data,
  size = 320,
  errorCorrection = "L",
  margin = 1,
  alt = "QR code",
  className,
  fallback = null,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDataUrl(null);

    void (async () => {
      try {
        const { default: QrLib } = await import("qrcode");
        const url = await QrLib.toDataURL(data, {
          errorCorrectionLevel: errorCorrection,
          margin,
          width: size,
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [data, errorCorrection, margin, size]);

  if (failed) return <>{fallback}</>;
  if (!dataUrl) {
    // Reserve the space so the layout doesn't jump when the data URL arrives.
    return (
      <div
        aria-hidden
        className={cn("rounded-sm border border-border bg-white", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-sm border border-border bg-white p-2", className)}
    />
  );
}
