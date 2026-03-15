import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListenButtonProps {
  text: string;
  label?: string;
  className?: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

const stripMarkdown = (md: string): string =>
  md
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-\d]+[.)]\s*/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();

const ListenButton = ({ text, label = "Listen", className }: ListenButtonProps) => {
  const [state, setState] = useState<"idle" | "speaking" | "paused">("idle");
  const [supported, setSupported] = useState(true);
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const check = () => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setState("idle");
      }
    };
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = useCallback(() => {
    const synth = window.speechSynthesis;

    if (state === "paused") {
      synth.resume();
      setState("speaking");
      return;
    }

    synth.cancel();

    const plainText = stripMarkdown(text);
    const utter = new SpeechSynthesisUtterance(plainText);
    utter.rate = speed;
    utter.pitch = 1;

    const voices = synth.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")
    ) || voices.find((v) => v.lang.startsWith("en") && !v.localService) || voices.find((v) => v.lang.startsWith("en"));

    if (preferred) utter.voice = preferred;

    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");

    utteranceRef.current = utter;
    synth.speak(utter);
    setState("speaking");
  }, [text, state, speed]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev as typeof SPEEDS[number]);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      // If currently speaking, restart with new speed
      if (state === "speaking" || state === "paused") {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          const synth = window.speechSynthesis;
          const plainText = stripMarkdown(text);
          const utter = new SpeechSynthesisUtterance(plainText);
          utter.rate = next;
          utter.pitch = 1;
          const voices = synth.getVoices();
          const preferred = voices.find(
            (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")
          ) || voices.find((v) => v.lang.startsWith("en") && !v.localService) || voices.find((v) => v.lang.startsWith("en"));
          if (preferred) utter.voice = preferred;
          utter.onend = () => setState("idle");
          utter.onerror = () => setState("idle");
          utteranceRef.current = utter;
          synth.speak(utter);
          setState("speaking");
        }, 50);
      }
      return next;
    });
  }, [state, text]);

  if (!supported) return null;

  const speedLabel = speed === 1 ? "1×" : `${speed}×`;

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      {state === "idle" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {label}
        </Button>
      )}

      {state === "speaking" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="h-7 gap-1.5 text-xs text-primary"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Square className="h-3 w-3" />
          </Button>
        </>
      )}

      {state === "paused" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlay}
            className="h-7 gap-1.5 text-xs text-primary animate-pulse"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Resume
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Square className="h-3 w-3" />
          </Button>
        </>
      )}

      {/* Speed selector - always visible */}
      <Button
        variant="outline"
        size="sm"
        onClick={cycleSpeed}
        className="h-6 px-1.5 text-[10px] font-mono font-semibold text-muted-foreground border-border hover:text-primary min-w-[36px]"
        title="Change reading speed"
      >
        {speedLabel}
      </Button>
    </div>
  );
};

export default ListenButton;
