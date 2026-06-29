import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  READER_DEFAULTS,
  readStorage,
  writeStorage,
  type ReaderSettings,
} from "./reader-settings-config";

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

  const reset = useCallback(() => setSettings(READER_DEFAULTS), []);

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
