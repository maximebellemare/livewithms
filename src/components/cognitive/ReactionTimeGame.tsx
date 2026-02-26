import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { Zap, RotateCcw } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

type Phase = "waiting" | "ready" | "go" | "result" | "too-early";

const ROUND_COUNT: Record<Difficulty, number> = { easy: 3, medium: 5, hard: 8 };
const DELAY_RANGE: Record<Difficulty, [number, number]> = {
  easy: [2000, 4000],
  medium: [1500, 3000],
  hard: [800, 2000],
};

const ReactionTimeGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<Phase>("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const goTimestamp = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const saveSession = useSaveSession();

  const rounds = ROUND_COUNT[difficulty];
  const [minDelay, maxDelay] = DELAY_RANGE[difficulty];

  const startRound = useCallback(() => {
    setPhase("ready");
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    timerRef.current = setTimeout(() => {
      goTimestamp.current = Date.now();
      setPhase("go");
    }, delay);
  }, [minDelay, maxDelay]);

  const handleTap = () => {
    if (phase === "waiting") {
      setTimes([]);
      startRound();
      return;
    }

    if (phase === "ready") {
      clearTimeout(timerRef.current);
      setPhase("too-early");
      return;
    }

    if (phase === "go") {
      const reaction = Date.now() - goTimestamp.current;
      setCurrentTime(reaction);
      const newTimes = [...times, reaction];
      setTimes(newTimes);

      if (newTimes.length >= rounds) {
        setPhase("result");
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const best = Math.min(...newTimes);
        const score = Math.max(100 - Math.floor((avg - 200) / 5), 10);
        saveSession.mutate({
          game_type: "reaction_time",
          score,
          duration_seconds: Math.round(newTimes.reduce((a, b) => a + b, 0) / 1000),
          details: { times: newTimes, average_ms: avg, best_ms: best, difficulty },
        });
        toast.success(`⚡ Average: ${avg}ms — Score: ${score}`);
      } else {
        setTimeout(startRound, 1000);
      }
      return;
    }

    if (phase === "too-early" || phase === "result") {
      setPhase("waiting");
    }
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    setPhase("waiting");
    setTimes([]);
    setCurrentTime(0);
  };

  const bgColor = {
    waiting: "bg-secondary",
    ready: "bg-red-500/20 border-red-500/40",
    go: "bg-green-500/20 border-green-500/40",
    "too-early": "bg-red-500/20 border-red-500/40",
    result: "bg-primary/10 border-primary/30",
  }[phase];

  const isPlaying = phase !== "waiting" && phase !== "result";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={isPlaying} />
        <button onClick={reset} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <span className="text-sm text-muted-foreground">
        Round: <strong className="text-foreground">{Math.min(times.length + 1, rounds)}/{rounds}</strong>
      </span>

      <motion.button
        onClick={handleTap}
        className={`w-full rounded-2xl border-2 p-12 text-center transition-colors ${bgColor}`}
        whileTap={{ scale: 0.98 }}
      >
        {phase === "waiting" && (
          <div>
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground">Tap to Start</p>
            <p className="text-xs text-muted-foreground mt-1">Wait for green, then tap as fast as you can</p>
          </div>
        )}
        {phase === "ready" && (
          <div>
            <p className="text-lg font-bold text-red-400">Wait for it...</p>
            <p className="text-xs text-muted-foreground mt-1">Don't tap yet!</p>
          </div>
        )}
        {phase === "go" && (
          <div>
            <p className="text-2xl font-black text-green-400">TAP NOW!</p>
          </div>
        )}
        {phase === "too-early" && (
          <div>
            <p className="text-lg font-bold text-red-400">Too early! 😅</p>
            <p className="text-xs text-muted-foreground mt-1">Tap to try again</p>
          </div>
        )}
        {phase === "result" && (
          <div>
            <p className="text-lg font-bold text-primary">Results</p>
            <p className="text-3xl font-black text-foreground mt-2">
              {Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms
            </p>
            <p className="text-xs text-muted-foreground mt-1">average reaction time</p>
            <p className="text-xs text-muted-foreground">best: {Math.min(...times)}ms</p>
            <p className="text-xs text-primary mt-3">Tap to play again</p>
          </div>
        )}
      </motion.button>

      {times.length > 0 && phase !== "result" && (
        <div className="flex gap-2 justify-center">
          {times.map((t, i) => (
            <span key={i} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionTimeGame;
