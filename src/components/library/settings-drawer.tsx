import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PlayIcon, StopIcon, XIcon } from "@phosphor-icons/react";
import { Drawer } from "@src/components/primitives/drawer";
import { Button } from "@src/components/primitives/button";
import { IconButton } from "@src/components/primitives/icon-button";
import { ScrollArea } from "@src/components/primitives/scroll-area";
import { Select } from "@src/components/primitives/select";
import { Slider } from "@src/components/primitives/slider";
import { Switch } from "@src/components/primitives/switch";
import {
  FONT_FAMILY_OPTIONS,
  READER_BOUNDS,
  readerSettingsCssVars,
} from "@src/lib/reader-settings-config";
import { useReaderSettings } from "@src/lib/reader-settings";
import { cn } from "@src/lib/cn";

const PREVIEW_TEXT = `The princess of Lucifenia, only fourteen years old, watched her kingdom turn to ruin while the servant who shared her face stood at her side.

"Now, kneel before me." Her voice was small, but Allen heard it as if it filled the throne room.`;

export function SettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, set, reset } = useReaderSettings();

  const cssVars = readerSettingsCssVars(settings);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Popup side="right" className="gap-0 p-0">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <Drawer.Title>Reader Settings</Drawer.Title>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close settings"
              onClick={() => onOpenChange(false)}
            >
              <XIcon weight="light" />
            </IconButton>
          </header>

          <ScrollArea className="flex-1">
            <div className="px-6 py-5 flex flex-col gap-6">
              <div style={cssVars} className="bg-surface border border-border rounded-sm p-4">
                <span className="block text-style-eyebrow text-fg-muted mb-2">Preview</span>
                <p className="text-style-reader-prose text-fg whitespace-pre-line">
                  {PREVIEW_TEXT}
                </p>
              </div>

              <SettingRow label="Font" value={settings.fontFamily === "serif" ? "Serif" : "Sans"}>
                <div
                  role="radiogroup"
                  aria-label="Reader font family"
                  className="flex items-stretch gap-1 rounded-sm border border-border p-1"
                >
                  {FONT_FAMILY_OPTIONS.map((opt) => {
                    const active = settings.fontFamily === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => set("fontFamily", opt.value)}
                        style={{ fontFamily: opt.cssVar }}
                        className={cn(
                          "flex-1 rounded-sm px-3 py-1.5 text-style-body transition-colors",
                          "outline-accent outline-offset-2",
                          "focus:outline-none focus-visible:outline-2",
                          active
                            ? "bg-accent-soft text-fg"
                            : "text-fg-muted hover:bg-accent-soft/50 hover:text-fg",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </SettingRow>

              <SettingRow label="Font size" value={`${settings.fontSize}px`}>
                <Slider
                  aria-label="Font size"
                  value={settings.fontSize}
                  onValueChange={(v) => set("fontSize", v as number)}
                  min={READER_BOUNDS.fontSize.min}
                  max={READER_BOUNDS.fontSize.max}
                  step={READER_BOUNDS.fontSize.step}
                />
              </SettingRow>

              <SettingRow label="Line height" value={settings.lineHeight.toFixed(2)}>
                <Slider
                  aria-label="Line height"
                  value={settings.lineHeight}
                  onValueChange={(v) => set("lineHeight", v as number)}
                  min={READER_BOUNDS.lineHeight.min}
                  max={READER_BOUNDS.lineHeight.max}
                  step={READER_BOUNDS.lineHeight.step}
                />
              </SettingRow>

              <SettingRow label="Reader width" value={`${settings.readerWidth}rem`}>
                <Slider
                  aria-label="Reader width"
                  value={settings.readerWidth}
                  onValueChange={(v) => set("readerWidth", v as number)}
                  min={READER_BOUNDS.readerWidth.min}
                  max={READER_BOUNDS.readerWidth.max}
                  step={READER_BOUNDS.readerWidth.step}
                />
              </SettingRow>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-style-body text-fg">Justify text</span>
                  <span className="text-style-caption text-fg-muted">
                    Justified alignment with auto hyphenation.
                  </span>
                </div>
                <Switch
                  aria-label="Justify text"
                  checked={settings.justify}
                  onCheckedChange={(checked) => set("justify", checked)}
                />
              </div>

              <TtsSection />

              <div className="border-t border-border pt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={reset}>
                  Reset to defaults
                </Button>
              </div>
            </div>
          </ScrollArea>
        </Drawer.Popup>
      </Drawer.Portal>
    </Drawer>
  );
}

function SettingRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-style-body text-fg">{label}</span>
        <span className="text-style-caption text-fg-muted tabular-nums">{value}</span>
      </div>
      {children}
    </div>
  );
}

const TTS_SAMPLE = "The clock at the heart of the chronicle ticked on, indifferent to her cruelty.";

// Read-aloud (Web Speech API) controls — voice picker, rate, pitch, plus a
// Test button that speaks a sample using the current settings. Stored on the
// shared reader-settings context so the reader picks them up automatically.
function TtsSection() {
  const { settings, set } = useReaderSettings();
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  // `speechSynthesis.getVoices()` is async on most browsers — it may return
  // an empty list initially and populate later via `voiceschanged`.
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const items = useMemo(
    () => [
      { value: "", label: "System default" },
      ...voices.map((v) => ({
        value: v.voiceURI,
        label: `${v.name} (${v.lang})${v.default ? " · default" : ""}`,
      })),
    ],
    [voices],
  );

  function test() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(TTS_SAMPLE);
    const voice = voices.find((v) => v.voiceURI === settings.ttsVoiceURI);
    if (voice) u.voice = voice;
    u.rate = settings.ttsRate;
    u.pitch = settings.ttsPitch;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <div className="border-t border-border pt-5 flex flex-col gap-4">
      <span className="text-style-eyebrow text-fg-muted">Read aloud</span>

      {!supported ? (
        <p className="text-style-caption text-fg-muted italic">
          Web Speech API isn't supported in this browser.
        </p>
      ) : (
        <>
          <SettingRow
            label="Voice"
            value={voices.length === 0 ? "None installed" : `${voices.length} available`}
          >
            <Select
              value={settings.ttsVoiceURI ?? ""}
              onValueChange={(v) => set("ttsVoiceURI", (v as string) || null)}
              disabled={voices.length === 0}
              items={items}
            >
              <Select.Trigger>
                <Select.Value placeholder="System default" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup>
                    <Select.List>
                      {items.map((item) => (
                        <Select.Item key={item.value} value={item.value}>
                          <Select.ItemIndicator />
                          <Select.ItemText>{item.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select>
          </SettingRow>

          <SettingRow label="Rate" value={`${settings.ttsRate.toFixed(2)}×`}>
            <Slider
              aria-label="Speech rate"
              value={settings.ttsRate}
              onValueChange={(v) => set("ttsRate", v as number)}
              min={READER_BOUNDS.ttsRate.min}
              max={READER_BOUNDS.ttsRate.max}
              step={READER_BOUNDS.ttsRate.step}
            />
          </SettingRow>

          <SettingRow label="Pitch" value={settings.ttsPitch.toFixed(2)}>
            <Slider
              aria-label="Speech pitch"
              value={settings.ttsPitch}
              onValueChange={(v) => set("ttsPitch", v as number)}
              min={READER_BOUNDS.ttsPitch.min}
              max={READER_BOUNDS.ttsPitch.max}
              step={READER_BOUNDS.ttsPitch.step}
            />
          </SettingRow>

          <div className="flex">
            {speaking ? (
              <Button variant="secondary" size="sm" onClick={stop}>
                <StopIcon weight="light" />
                Stop
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={test} disabled={voices.length === 0}>
                <PlayIcon weight="light" />
                Test
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
