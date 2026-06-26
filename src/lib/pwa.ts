/**
 * Force the app to the latest published version.
 *
 * iOS Safari is the difficult case: a plain `location.reload()` often
 * serves disk-cached HTML, and `reg.update()` returns *before* a new SW
 * has finished installing — so naively posting `SKIP_WAITING` and
 * reloading races the install.
 *
 * Two paths:
 *  - **Light**: there's already a waiting SW (the toast prompt path). Post
 *    `SKIP_WAITING`, wait for `controllerchange` (capped at 2s), reload.
 *  - **Nuclear**: nothing is waiting yet (the menu "Reload for updates"
 *    path or a slow network at toast time). Unregister every SW and wipe
 *    only the `workbox-precache-*` caches, so the next navigation has no
 *    SW interception and goes straight to the network. App-data caches
 *    (`sf-chapters`, `sf-assets`, `sf-chapter-manifest`) survive so
 *    downloaded offline reading content stays available.
 */
export async function forceUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    // Kick the update fetch in parallel so a pending check has the best
    // chance of finishing before we decide which path to take.
    await Promise.all(regs.map((r) => r.update().catch(() => undefined)));

    const waiting = regs.flatMap((r) => (r.waiting ? [r.waiting] : []));

    if (waiting.length > 0) {
      // Light path. Set up the controller-change listener *before*
      // posting SKIP_WAITING so we don't race the activation.
      const controllerChange = new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
      });
      for (const w of waiting) w.postMessage({ type: "SKIP_WAITING" });
      // Cap the wait — iOS sometimes drags activation. Reloading anyway
      // is fine; the new SW will be picked up on the next navigation.
      await Promise.race([controllerChange, new Promise<void>((r) => setTimeout(r, 2000))]);
    } else {
      // Nuclear path. Unregister every SW so the next navigation has no
      // interception. Wipe only the precache (app shell) — leave app-data
      // caches intact.
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.startsWith("workbox-precache")).map((k) => caches.delete(k)),
        );
      } catch {
        // Cache API can be unavailable in some private modes — not fatal.
      }
    }
  } catch {
    // Any unexpected error: fall through to a plain reload. Better to
    // attempt the refresh than to swallow the click.
  }

  window.location.reload();
}
