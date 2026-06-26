import { useCallback, useEffect, useRef, useState } from "react";
import { getVolumeAssets } from "@app/library/-volumes";

/**
 * Pre-fetches everything an offline-readable bundle needs into the SW runtime
 * caches. Per-volume bundles cover chapter `.md` files + image assets (cover,
 * opening / closing galleries, chapter illustrations) + the volume's heavy
 * manifest. The characters bundle covers every character portrait. Each URL
 * is fetched and written to the appropriate SW runtime cache so the on-page
 * renderer (and the SW's own cache-first / SWR strategies) find a cached
 * response when the browser is offline.
 *
 *  - Chapter markdown + heavy manifest → `sf-chapters` (SWR at runtime).
 *  - Images → `sf-assets` (CacheFirst at runtime, keyed on the SW's
 *    `request.destination === "image"` rule).
 *
 * Writing the cache entries ourselves makes the offline flow work the
 * same in dev (where the SW isn't registered), prod, and incognito; if
 * the SW is also active, both writes go to the same cache key so the
 * cost is one harmless overwrite per asset.
 *
 * Resync deletes the bundle's URLs from both caches before walking, which
 * guarantees the next fetch hits the network instead of a stale cached
 * copy. Useful when content was updated on the server.
 */

const CHAPTER_CACHE = "sf-chapters";
const ASSET_CACHE = "sf-assets";
const CONCURRENCY = 8;

export type OfflineProgress = { done: number; total: number };

export type OfflineStatus = {
  cached: number;
  total: number;
  /** True when every URL in the bundle is present in cache. */
  complete: boolean;
};

type Task = { url: string; cacheName: string };

async function getVolumeTasks(volumeId: string): Promise<Task[]> {
  const { chapters, images } = await getVolumeAssets(volumeId);
  return [
    ...chapters.map((url) => ({ url, cacheName: CHAPTER_CACHE })),
    ...images.map((url) => ({ url, cacheName: ASSET_CACHE })),
  ];
}

async function openCaches(names: Iterable<string>): Promise<Map<string, Cache>> {
  const map = new Map<string, Cache>();
  if (typeof caches === "undefined") return map;
  for (const name of new Set(names)) {
    try {
      map.set(name, await caches.open(name));
    } catch {
      // The cache for this name will be missing from the map; downstream
      // code treats that as "no cache available" and skips writes/reads.
    }
  }
  return map;
}

async function getTasksStatus(tasks: Task[]): Promise<OfflineStatus> {
  if (tasks.length === 0) return { cached: 0, total: 0, complete: false };
  const caches = await openCaches(tasks.map((t) => t.cacheName));
  let cached = 0;
  await Promise.all(
    tasks.map(async ({ url, cacheName }) => {
      const cache = caches.get(cacheName);
      if (!cache) return;
      const hit = await cache.match(url);
      if (hit) cached += 1;
    }),
  );
  return { cached, total: tasks.length, complete: cached === tasks.length };
}

async function deleteTasksFromCaches(tasks: Task[]): Promise<void> {
  const caches = await openCaches(tasks.map((t) => t.cacheName));
  await Promise.all(
    tasks.map(async ({ url, cacheName }) => {
      const cache = caches.get(cacheName);
      if (cache) await cache.delete(url);
    }),
  );
}

/**
 * Drop every entry from the offline reading caches (`sf-chapters` and
 * `sf-assets`). Audio entries that landed in `sf-assets` while listening
 * online go too. The app shell precache (`workbox-precache-*`) and the
 * tiny `sf-chapter-manifest` are left alone — those aren't offline
 * reading content, and removing them risks the next launch.
 */
export async function wipeOfflineCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  await Promise.all(
    [CHAPTER_CACHE, ASSET_CACHE].map((name) => caches.delete(name).catch(() => false)),
  );
}

// Concurrency-limited walk: fan out CONCURRENCY workers that each pull the
// next task from a shared cursor. Stops early on `signal.aborted`.
async function fetchAll(
  tasks: Task[],
  signal: AbortSignal,
  onProgress: (p: OfflineProgress) => void,
): Promise<void> {
  const cacheMap = await openCaches(tasks.map((t) => t.cacheName));
  let cursor = 0;
  let done = 0;
  const total = tasks.length;
  onProgress({ done, total });

  async function worker() {
    while (!signal.aborted) {
      const idx = cursor++;
      if (idx >= total) return;
      const { url, cacheName } = tasks[idx]!;
      try {
        // `cache: "reload"` skips the browser's HTTP cache so we always
        // get a fresh response. The clone is what we persist; the
        // original is awaited for completion / status checks.
        const res = await fetch(url, { signal, cache: "reload" });
        const cache = cacheMap.get(cacheName);
        if (cache && res.ok) {
          await cache.put(url, res.clone());
        }
      } catch {
        // Swallow per-URL errors — partial progress is fine; the user can
        // re-run the sync. An aborted fetch throws here too; the outer
        // signal check will exit the worker on the next iteration.
      }
      done += 1;
      onProgress({ done, total });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
}

async function runTasks(
  tasks: Task[],
  options: { resync: boolean },
  signal: AbortSignal,
  onProgress: (p: OfflineProgress) => void,
): Promise<void> {
  if (tasks.length === 0) {
    onProgress({ done: 0, total: 0 });
    return;
  }
  if (options.resync) await deleteTasksFromCaches(tasks);
  await fetchAll(tasks, signal, onProgress);
}

// React state for one bundle's sync. The drawer instantiates one of these
// per visible row so progress is per-row without leaking into a global.
export type SyncState =
  | { kind: "idle"; status: OfflineStatus | null }
  | { kind: "downloading"; progress: OfflineProgress }
  | { kind: "complete"; status: OfflineStatus }
  | { kind: "error"; message: string; status: OfflineStatus | null };

export type SyncHandle = {
  state: SyncState;
  download: () => void;
  resync: () => void;
  cancel: () => void;
  refreshStatus: () => Promise<void>;
};

// Generic sync core. `key` identifies the bundle for effect dependency
// tracking; `getTasks` is read through a ref so callers can pass an
// inline arrow without destabilizing the hook.
function useTasksSync(key: string, getTasks: () => Promise<Task[]>): SyncHandle {
  const [state, setState] = useState<SyncState>({ kind: "idle", status: null });
  const controllerRef = useRef<AbortController | null>(null);
  const getTasksRef = useRef(getTasks);
  getTasksRef.current = getTasks;

  const refreshStatus = useCallback(async () => {
    const tasks = await getTasksRef.current();
    const status = await getTasksStatus(tasks);
    setState((prev) =>
      // Don't clobber an in-flight download with a status read.
      prev.kind === "downloading"
        ? prev
        : status.complete
          ? { kind: "complete", status }
          : { kind: "idle", status },
    );
  }, []);

  useEffect(() => {
    void refreshStatus();
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    // `key` is the bundle identity. `refreshStatus` is stable.
  }, [key, refreshStatus]);

  const run = useCallback((mode: "download" | "resync") => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: "downloading", progress: { done: 0, total: 0 } });

    (async () => {
      const tasks = await getTasksRef.current();
      await runTasks(tasks, { resync: mode === "resync" }, controller.signal, (progress) => {
        if (controller.signal.aborted) return;
        setState({ kind: "downloading", progress });
      });
    })()
      .then(async () => {
        if (controller.signal.aborted) return;
        const tasks = await getTasksRef.current();
        const status = await getTasksStatus(tasks);
        setState(status.complete ? { kind: "complete", status } : { kind: "idle", status });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Sync failed";
        setState((prev) => ({
          kind: "error",
          message,
          status: prev.kind === "idle" || prev.kind === "complete" ? prev.status : null,
        }));
      });
  }, []);

  const download = useCallback(() => run("download"), [run]);
  const resync = useCallback(() => run("resync"), [run]);
  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    void refreshStatus();
  }, [refreshStatus]);

  return { state, download, resync, cancel, refreshStatus };
}

export function useOfflineSync(volumeId: string): SyncHandle {
  return useTasksSync(`volume:${volumeId}`, () => getVolumeTasks(volumeId));
}

// Online/offline tracking — drives the drawer's "you're offline, connect to
// sync" hint and disables sync buttons when the device is offline.
//
// `online` / `offline` events are not reliable: some browsers (notably
// Chromium on certain platforms, and DevTools' network throttle toggle)
// don't fire `online` when connectivity returns mid-session, leaving the
// banner stuck until the tab is closed and reopened. `navigator.onLine`
// itself stays correct, so re-sync from it on visibility-change and on a
// low-frequency poll as backstops.
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    document.addEventListener("visibilitychange", sync);
    const interval = window.setInterval(sync, 5000);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      document.removeEventListener("visibilitychange", sync);
      clearInterval(interval);
    };
  }, []);
  return online;
}
