import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "@src/components/primitives/toast";
import { forceUpdate } from "@src/lib/pwa";

// 30 minutes is a reasonable balance for a reading app — frequent enough
// that a deploy lands within a session, infrequent enough not to hammer
// the network.
const UPDATE_POLL_MS = 30 * 60 * 1000;

export function PwaUpdateToast() {
  const toast = useToast();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    // Without this, the toast only appears when the browser independently
    // revalidates the SW script — iOS Safari is sluggish about that, so
    // the prompt can take "forever" to show. Drive update probes
    // ourselves on a timer, on tab-visible (returning from background),
    // and on `online` (after a connectivity blip).
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const interval = window.setInterval(() => {
        void registration.update();
      }, UPDATE_POLL_MS);

      const onVisibility = () => {
        if (document.visibilityState === "visible") void registration.update();
      };
      const onOnline = () => {
        void registration.update();
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("online", onOnline);

      // No cleanup wired — `useRegisterSW` doesn't expose one for this
      // hook, and `PwaUpdateToast` lives at the route root for the
      // entire app lifetime, so the listeners can't leak across mounts.
      void interval;
    },
  });

  // Guard against duplicate toasts when state flips back-and-forth (e.g. the
  // user dismisses, then a hot-reload re-runs the effect in dev).
  const firedRefresh = useRef(false);
  const firedOffline = useRef(false);

  useEffect(() => {
    if (!needRefresh || firedRefresh.current) return;
    firedRefresh.current = true;

    toast.add({
      type: "info",
      title: "A new chapter has been printed",
      description: "Reload to see the latest updates to the chronicle.",
      actionProps: {
        children: "Reload",
        onClick: () => {
          setNeedRefresh(false);
          // `updateServiceWorker(true)`'s reload-page argument is a no-op
          // in vite-plugin-pwa v1; the library only reloads via the
          // workbox `controlling` listener, which can stall on iOS. Use
          // `forceUpdate` directly — it knows how to wait for the SW
          // hand-off and how to fall back to the unregister-and-reload
          // nuclear path when iOS clings to disk-cached HTML.
          void forceUpdate();
        },
      },
      onClose: () => {
        firedRefresh.current = false;
        setNeedRefresh(false);
      },
    });
  }, [needRefresh, setNeedRefresh, toast]);

  useEffect(() => {
    if (!offlineReady || firedOffline.current) return;
    firedOffline.current = true;

    toast.add({
      type: "success",
      title: "Reader ready for offline",
      description:
        "The app is cached. To read a volume without a connection, open the Offline drawer and download it.",
      onClose: () => {
        setOfflineReady(false);
      },
    });
  }, [offlineReady, setOfflineReady, toast]);

  return null;
}
