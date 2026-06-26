/**
 * Compact transport encoding for export bundles.
 *
 * Optimized for QR scannability: the QR payload goes through three
 * size-saving steps before becoming the encoder input.
 *
 *  1. **Schema-aware key shortening.** The bundle's known keys are
 *     remapped to single-character aliases before serialization. JSON keys
 *     are the largest source of repetition in this shape, and pre-shrinking
 *     them gives compression a smaller dictionary to build over.
 *  2. **deflate-raw.** Same algorithm as gzip, no header bytes — saves
 *     ~10–20 B that gzip's framing would otherwise add.
 *  3. **base45 (RFC 9285).** Its alphabet (`0-9 A-Z $%*+-./:`) is exactly
 *     the QR Code "alphanumeric" set, so the QR encoder picks the
 *     alphanumeric mode (5.5 bits/char) instead of the byte mode
 *     (8 bits/char) it would use for base64. ~25% denser per QR module
 *     at the QR layer alone.
 *
 * The clipboard channel still copies plain JSON — eyeballable, pasteable
 * into a JSON tool. The QR is the size-constrained channel and is the
 * only place this codec runs.
 *
 * On import, `decodeImportText` is the only thing the rest of the app
 * needs to call: it transparently passes plain JSON through, and decodes
 * anything carrying the marker. Modern browsers ship `CompressionStream`
 * / `DecompressionStream` natively so no dep is needed.
 */

const COMPRESSED_MARKER = "EVCH2:";

// Single-character aliases for every known key. Each key maps to a
// distinct character so the substitution is bijective without needing
// position-based context tracking. New Dexie fields need an entry here
// and in `KEY_LONG_MAP` (auto-derived); `transformKeys` leaves unknown
// keys untouched, so a missed alias degrades gracefully (just slightly
// larger payload).
const KEY_SHORT_MAP: Record<string, string> = {
  schema: "$",
  version: "v",
  exportedAt: "e",
  data: "d",
  chapterProgress: "PG",
  bookmarks: "BM",
  notes: "NT",
  reactions: "RX",
  readerSettings: "RS",
  chapterId: "c",
  pageNumber: "p",
  seriesId: "i",
  volumeId: "o",
  pagesRead: "r",
  totalPages: "g",
  lastReadAt: "l",
  body: "y",
  createdAt: "a",
  updatedAt: "u",
  label: "b",
  targetType: "t",
  targetId: "x",
  kind: "k",
  fontSize: "F",
  lineHeight: "H",
  readerWidth: "W",
};

const KEY_LONG_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_SHORT_MAP).map(([long, short]) => [short, long]),
);

function transformKeys(value: unknown, map: Record<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => transformKeys(v, map));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[map[k] ?? k] = transformKeys(v, map);
    }
    return out;
  }
  return value;
}

// RFC 9285 base45 alphabet. Order matters — the index is the value.
const BASE45_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const BASE45_REVERSE = new Map<string, number>();
for (let i = 0; i < BASE45_ALPHABET.length; i++) {
  BASE45_REVERSE.set(BASE45_ALPHABET[i]!, i);
}

function base45Encode(buf: Uint8Array): string {
  let out = "";
  let i = 0;
  while (i + 1 < buf.length) {
    // Pair of bytes → 16-bit integer → three base45 digits (low to high).
    const x = buf[i]! * 256 + buf[i + 1]!;
    const c = x % 45;
    const d = Math.floor(x / 45) % 45;
    const e = Math.floor(x / 2025) % 45;
    out += BASE45_ALPHABET[c] + BASE45_ALPHABET[d] + BASE45_ALPHABET[e];
    i += 2;
  }
  if (i < buf.length) {
    // Lone trailing byte → two base45 digits.
    const x = buf[i]!;
    const c = x % 45;
    const d = Math.floor(x / 45) % 45;
    out += BASE45_ALPHABET[c] + BASE45_ALPHABET[d];
  }
  return out;
}

function base45Decode(str: string): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i + 2 < str.length) {
    const a = BASE45_REVERSE.get(str[i]!);
    const b = BASE45_REVERSE.get(str[i + 1]!);
    const c = BASE45_REVERSE.get(str[i + 2]!);
    if (a == null || b == null || c == null) throw new Error("Invalid base45 character.");
    const x = a + b * 45 + c * 2025;
    if (x > 0xffff) throw new Error("Base45 triplet overflows 16-bit.");
    out.push(Math.floor(x / 256), x % 256);
    i += 3;
  }
  if (i + 1 < str.length) {
    const a = BASE45_REVERSE.get(str[i]!);
    const b = BASE45_REVERSE.get(str[i + 1]!);
    if (a == null || b == null) throw new Error("Invalid base45 character.");
    const x = a + b * 45;
    if (x > 0xff) throw new Error("Base45 final pair overflows 8-bit.");
    out.push(x);
    i += 2;
  }
  if (i !== str.length) throw new Error("Base45 input has invalid length.");
  return new Uint8Array(out);
}

export async function encodeForQr(json: string): Promise<string> {
  // Re-parse to apply the key-shortening transform structurally. Cheap
  // for our payload sizes; avoids brittle string substitution.
  const shortened = JSON.stringify(transformKeys(JSON.parse(json), KEY_SHORT_MAP));
  const stream = new Blob([shortened]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  return COMPRESSED_MARKER + base45Encode(buf);
}

/**
 * Strip the marker if present and reverse the encode pipeline; otherwise
 * return the input trimmed. Throws with a user-readable message on
 * decode failure so the import dialog can surface it inline.
 */
export async function decodeImportText(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed.startsWith(COMPRESSED_MARKER)) return trimmed;
  const body = trimmed.slice(COMPRESSED_MARKER.length);

  let buf: Uint8Array;
  try {
    buf = base45Decode(body);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown";
    throw new Error(`Compressed snapshot is corrupted (${detail}).`);
  }

  let inflated: string;
  try {
    const stream = new Blob([buf as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    inflated = await new Response(stream).text();
  } catch {
    throw new Error("Compressed snapshot couldn't be decompressed.");
  }

  // Restore long keys before handing back to the parse step.
  let parsed: unknown;
  try {
    parsed = JSON.parse(inflated);
  } catch {
    throw new Error("Compressed snapshot is not valid JSON after decompression.");
  }
  return JSON.stringify(transformKeys(parsed, KEY_LONG_MAP));
}
