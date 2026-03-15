import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, Pause, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListenButtonProps {
  text: string;
  label?: string;
  className?: string;
}

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Sync state with speechSynthesis events
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
    utter.rate = 0.95;
    utter.pitch = 1;

    // Pick a good voice if available
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
  }, [text, state]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  if (!supported) return null;

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
    </div>
  );
};

export default ListenButton;
