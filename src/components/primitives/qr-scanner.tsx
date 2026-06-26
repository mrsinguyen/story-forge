import { useEffect, useRef, useState } from "react";
import { CameraIcon, StopIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "./button";
import { cn } from "@src/lib/cn";

type Props = {
  /** Fires once per successful decode. The scanner stops automatically. */
  onDecoded: (text: string) => void;
  /** Optional error callback — also surfaced inline. */
  onError?: (error: Error) => void;
  className?: string;
  /** Video container aspect ratio class — defaults to square. */
  aspectClassName?: string;
  /** Helper text rendered next to the start/stop button. */
  hint?: string;
};

type State =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "running" }
  | { kind: "error"; message: string };

// Minimal structural slice of qr-scanner — full d.ts ships with the
// package but we only touch start/stop/destroy, so we avoid pulling the
// whole module type into every consumer's compile path.
type ScannerInstance = {
  start: () => Promise<void>;
  stop: () => void;
  destroy: () => void;
};

/**
 * Camera-driven QR scanner primitive. Wraps `qr-scanner` (lazy-loaded) so
 * the worker bundle only ships when a scanner mounts.
 *
 * Usage requires a secure context (HTTPS or `localhost`); callers should
 * branch on availability rather than mounting this component blindly on
 * pages that might be served over plain HTTP.
 */
export function QRScanner({
  onDecoded,
  onError,
  className,
  aspectClassName = "aspect-square",
  hint,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  // Tear down on unmount. Without this a tab-switch / dialog-close would
  // leave the camera stream live until GC.
  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  async function start() {
    if (!videoRef.current) return;
    setState({ kind: "starting" });
    try {
      const { default: QrLib } = await import("qr-scanner");
      const scanner = new QrLib(
        videoRef.current,
        (result) => {
          onDecoded(result.data);
          scanner.stop();
          setState({ kind: "idle" });
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
          maxScansPerSecond: 5,
        },
      );
      scannerRef.current = scanner as unknown as ScannerInstance;
      await scanner.start();
      setState({ kind: "running" });
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Camera unavailable");
      setState({ kind: "error", message: e.message });
      onError?.(e);
      scannerRef.current?.destroy();
      scannerRef.current = null;
    }
  }

  function stop() {
    scannerRef.current?.stop();
    setState({ kind: "idle" });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-sm border border-border bg-ink",
          aspectClassName,
        )}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          // muted/playsInline are mandatory for autoplay-on-start in mobile browsers.
          muted
          playsInline
        />
        {state.kind !== "running" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <span className="text-style-caption text-bg">
              {state.kind === "starting" ? "Starting camera…" : "Camera idle"}
            </span>
          </div>
        ) : null}
      </div>

      {state.kind === "error" ? (
        <p className="inline-flex items-start gap-2 text-style-caption text-fg">
          <WarningIcon weight="fill" className="mt-0.5 shrink-0 text-accent" />
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        {state.kind === "running" ? (
          <Button variant="secondary" size="sm" onClick={stop}>
            <StopIcon weight="light" />
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => void start()}
            disabled={state.kind === "starting"}
          >
            <CameraIcon weight="light" />
            {state.kind === "starting" ? "Starting…" : "Start camera"}
          </Button>
        )}
        {hint ? <span className="text-style-caption text-fg-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
