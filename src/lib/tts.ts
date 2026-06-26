import { useCallback, useEffect, useRef, useState } from "react";
import { useReaderSettings } from "./reader-settings";

// React hook around the Web Speech API. Reads voice / rate / pitch from the
// shared reader settings so changes to the Settings drawer propagate to the
// reader the next time the user starts a fresh utterance.

export type TtsState = "idle" | "speaking";

// Minimal markdown strip — keeps the synth from reading asterisks /
// underscores literally. Tight enough that we don't accidentally drop
// content; TTS only cares about the words, not the formatting.
function stripMarkdown(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments (e.g. song-cue / illustration directives)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [label](url) → label
    .replace(/^[#>\s]+/gm, "") // leading hashes / blockquotes / indent
    .trim();
}

export function useTextToSpeech(text: string): {
  state: TtsState;
  play: () => void;
  stop: () => void;
  /**
   * `true` only when the Web Speech API exists AND the OS has at least one
   * TTS voice available — otherwise calling `speak()` is silently a no-op
   * (Linux without speech-dispatcher / espeak is the typical case), so the
   * caller should hide the control entirely.
   */
  supported: boolean;
} {
  const { settings } = useReaderSettings();
  const [state, setState] = useState<TtsState>("idle");
  const apiSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  // Voices load asynchronously on most browsers — the initial `getVoices()`
  // may return [] then fill in via `voiceschanged`. Track the count so the
  // caller can hide the read-aloud button until voices are actually usable.
  const [hasVoices, setHasVoices] = useState<boolean>(() => {
    if (!apiSupported) return false;
    return window.speechSynthesis.getVoices().length > 0;
  });
  // Track the most-recent utterance so handlers from a discarded utterance
  // (e.g. the user re-clicked Play before the previous one finished) don't
  // race ahead and flip state to "idle" while the new utterance is speaking.
  const activeRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!apiSupported) return;
    const sync = () => setHasVoices(window.speechSynthesis.getVoices().length > 0);
    sync();
    window.speechSynthesis.addEventListener("voiceschanged", sync);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", sync);
    };
  }, [apiSupported]);

  // Reset state + cancel any in-flight speech when the text changes (page
  // nav) and on unmount (leaving the reader entirely). The cleanup runs on
  // text change too, so the cancel covers both transitions.
  useEffect(() => {
    if (!apiSupported) return;
    setState("idle");
    return () => {
      activeRef.current = null;
      window.speechSynthesis.cancel();
    };
  }, [text, apiSupported]);

  const play = useCallback(() => {
    if (!apiSupported) return;
    const body = stripMarkdown(text);
    if (!body) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(body);
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.voiceURI === settings.ttsVoiceURI);
    if (voice) u.voice = voice;
    u.rate = settings.ttsRate;
    u.pitch = settings.ttsPitch;
    u.onend = () => {
      if (activeRef.current === u) setState("idle");
    };
    u.onerror = () => {
      if (activeRef.current === u) setState("idle");
    };
    activeRef.current = u;
    window.speechSynthesis.speak(u);
    setState("speaking");
  }, [text, settings.ttsVoiceURI, settings.ttsRate, settings.ttsPitch, apiSupported]);

  const stop = useCallback(() => {
    if (!apiSupported) return;
    // Invalidate any pending handlers before cancel so the discarded
    // utterance can't post a stale state update after we set idle.
    activeRef.current = null;
    window.speechSynthesis.cancel();
    setState("idle");
  }, [apiSupported]);

  return { state, play, stop, supported: apiSupported && hasVoices };
}
