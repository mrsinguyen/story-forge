/*
 * Resolve an asset path under /public against Vite's BASE_URL.
 *
 * Public assets (image/audio/etc.) live at the site root in dev (/foo.jpg)
 * but get prefixed with the deploy base in production (/<repo>/foo.jpg on
 * GitHub Pages). Vite rewrites root-relative URLs in index.html automatically;
 * dynamic ones (in fixtures, JSX) need to go through this helper.
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
