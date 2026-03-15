import { useCallback, useRef, useState } from "react";

/**
 * Lightweight hook for real-time voice narration during exercises.
 * Uses the Web Speech API (SpeechSynthesis).
 * Speaks short phrases announcing phase transitions.
 */
export const useVoiceNarration = () => {
  const [enabled, setEnabled] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const lastSpoken = useRef("");

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported) return;
      // Avoid repeating the exact same phrase back-to-back
      if (text === lastSpoken.current) return;
      lastSpoken.current = text;

      const synth = window.speechSynthesis;
      synth.cancel(); // stop any current utterance

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.volume = 0.8;

      const voices = synth.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ||
        voices.find((v) => v.lang.startsWith("en") && !v.localService) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;

      synth.speak(utter);
    },
    [enabled, supported],
  );

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      lastSpoken.current = "";
    }
  }, [supported]);

  return { enabled, setEnabled, speak, stop, supported };
};
