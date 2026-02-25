import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onTranscript: (text: string) => void;
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceJournalButton = ({ onTranscript }: Props) => {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);

  const isSupported = !!SpeechRecognition;

  const start = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interimText += transcript;
        }
      }
      setInterim(interimText);

      if (finalText.trim()) {
        onTranscript(finalText.trim());
        finalText = "";
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please enable it in your browser settings.");
      }
      setListening(false);
      setInterim("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.success("Listening… speak freely", { duration: 2000 });
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  if (!isSupported) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={listening ? stop : start}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
          listening
            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        title={listening ? "Stop recording" : "Start voice input"}
      >
        {listening ? (
          <>
            <Square className="h-3 w-3 animate-pulse" />
            Stop recording
          </>
        ) : (
          <>
            <Mic className="h-3 w-3" />
            Voice input
          </>
        )}
      </button>
      {listening && interim && (
        <p className="text-[10px] text-muted-foreground italic animate-pulse px-1">
          "{interim}…"
        </p>
      )}
    </div>
  );
};

export default VoiceJournalButton;
