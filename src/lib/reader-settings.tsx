import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type FontFamily = "serif" | "sans";

export type ReaderSettings = {
  fontSize: number; // px
  lineHeight: number; // unitless ratio
  readerWidth: number; // rem
  // Justified body text with auto-hyphenation. Off → left-aligned with no
  // hyphenation, the default for English prose. Both flip together because
  // justify without hyphens produces ugly inter-word gaps.
  justify: boolean;
  // Reader prose typeface. Resolves to the matching `--font-*` token at
  // render time so the choice tracks the design system if those tokens move.
  fontFamily: FontFamily;
  // Read-aloud (Web Speech API) preferences. `ttsVoiceURI === null` means
  // "use whichever voice the browser flags as the OS default" — robust to
  // device differences (Siri on iOS, Google TTS on Android, etc.).
  ttsVoiceURI: string | null;
  ttsRate: number; // 0.5–2, 1 = native
  ttsPitch: number; // 0.5–2, 1 = native
};

const DEFAULTS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.7,
  readerWidth: 42,
  justify: false,
  fontFamily: "serif",
  ttsVoiceURI: null,
  ttsRate: 1,
  ttsPitch: 1,
};

export const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string; cssVar: string }[] = [
  { value: "serif", label: "Serif", cssVar: "var(--font-serif)" },
  { value: "sans", label: "Sans", cssVar: "var(--font-sans)" },
];

export const READER_DEFAULTS = DEFAULTS;

export const READER_BOUNDS = {
  fontSize: { min: 14, max: 22, step: 1 },
  lineHeight: { min: 1.3, max: 2.0, step: 0.05 },
  readerWidth: { min: 32, max: 56, step: 1 },
  ttsRate: { min: 0.5, max: 2, step: 0.05 },
  ttsPitch: { min: 0.5, max: 2, step: 0.05 },
} as const;

const STORAGE_KEY = "story-forge-reader-settings";

function readStorage(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      fontSize:
        typeof parsed.fontSize === "number" && Number.isFinite(parsed.fontSize)
          ? parsed.fontSize
          : DEFAULTS.fontSize,
      lineHeight:
        typeof parsed.lineHeight === "number" && Number.isFinite(parsed.lineHeight)
          ? parsed.lineHeight
          : DEFAULTS.lineHeight,
      readerWidth:
        typeof parsed.readerWidth === "number" && Number.isFinite(parsed.readerWidth)
          ? parsed.readerWidth
          : DEFAULTS.readerWidth,
      justify: typeof parsed.justify === "boolean" ? parsed.justify : DEFAULTS.justify,
      fontFamily:
        parsed.fontFamily === "serif" || parsed.fontFamily === "sans"
          ? parsed.fontFamily
          : DEFAULTS.fontFamily,
      ttsVoiceURI:
        typeof parsed.ttsVoiceURI === "string" || parsed.ttsVoiceURI === null
          ? parsed.ttsVoiceURI
          : DEFAULTS.ttsVoiceURI,
      ttsRate:
        typeof parsed.ttsRate === "number" && Number.isFinite(parsed.ttsRate)
          ? parsed.ttsRate
          : DEFAULTS.ttsRate,
      ttsPitch:
        typeof parsed.ttsPitch === "number" && Number.isFinite(parsed.ttsPitch)
          ? parsed.ttsPitch
          : DEFAULTS.ttsPitch,
    };
  } catch {
    return DEFAULTS;
  }
}

function writeStorage(s: ReaderSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode: silently drop */
  }
}

type Ctx = {
  settings: ReaderSettings;
  set: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  reset: () => void;
};

const ReaderSettingsContext = createContext<Ctx | null>(null);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(() => readStorage());

  useEffect(() => {
    writeStorage(settings);
  }, [settings]);

  const set: Ctx["set"] = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return (
    <ReaderSettingsContext.Provider value={{ settings, set, reset }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings(): Ctx {
  const ctx = useContext(ReaderSettingsContext);
  if (!ctx) throw new Error("useReaderSettings must be used within <ReaderSettingsProvider>");
  return ctx;
}

export function readerSettingsCssVars(s: ReaderSettings): CSSProperties {
  const fontFamily = FONT_FAMILY_OPTIONS.find((o) => o.value === s.fontFamily)?.cssVar;
  return {
    "--reader-font-size": `${s.fontSize / 16}rem`,
    "--reader-line-height": `${s.lineHeight}`,
    "--reader-max-width": `${s.readerWidth}rem`,
    "--reader-text-align": s.justify ? "justify" : "left",
    "--reader-hyphens": s.justify ? "auto" : "manual",
    ...(fontFamily ? { "--reader-font-family": fontFamily } : {}),
  } as CSSProperties;
}
