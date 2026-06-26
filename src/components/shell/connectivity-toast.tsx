import { useEffect, useRef } from "react";
import { useToast } from "@src/components/primitives/toast";
import { useOnlineStatus } from "@src/lib/offline";

// Fires a small toast on online ↔ offline transitions so the user gets
// non-blocking feedback when connectivity changes. Initial mount is skipped —
// we only want a toast when the state actually changes, not on every page load.
//
// The `prevOnline` ref is load-bearing: `useToast()` returns a fresh manager
// reference each render, and `toast.add()` triggers a Provider state update
// that re-renders every consumer. Depending on `toast` alone would re-fire the
// effect on its own state update → infinite "Maximum update depth" loop.
// Gating on the previous value means the effect is a no-op unless `online`
// actually transitioned.
export function ConnectivityToast() {
  const online = useOnlineStatus();
  const toast = useToast();
  const prevOnline = useRef<boolean | null>(null);

  useEffect(() => {
    if (prevOnline.current === null) {
      prevOnline.current = online;
      return;
    }
    if (prevOnline.current === online) return;
    prevOnline.current = online;
    if (online) {
      toast.add({ type: "success", title: "Back online" });
    } else {
      toast.add({ type: "error", title: "You're offline" });
    }
  }, [online, toast]);

  return null;
}
