import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Hash } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

type Phase = "showing" | "input" | "result";

const START_LENGTH: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 4 };
const SHOW_SPEED: Record<Difficulty, number> = { easy: 800, medium: 600, hard: 450 };

const SequenceRecallGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("result");
  const [level, setLevel] = useState(0);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(0);
  const startTimeRef = useRef(Date.now());
  const saveSession = useSaveSession();

  const speed = SHOW_SPEED[difficulty];

  const showSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setHighlightIdx(-1);
    seq.forEach((_, i) => {
      setTimeout(() => setHighlightIdx(i), (i + 1) * speed);
    });
    setTimeout(() => {
      setHighlightIdx(-1);
      setPhase("input");
      setUserInput([]);
    }, (seq.length + 1) * speed);
  }, [speed]);

  const startGame = useCallback(() => {
    const len = START_LENGTH[difficulty];
    const initial = Array.from({ length: len }, () => Math.floor(Math.random() * 10));
    setSequence(initial);
    setUserInput([]);
    setLevel(1);
    setScore(0);
    setBestLevel(0);
    startTimeRef.current = Date.now();
    showSequence(initial);
  }, [difficulty, showSequence]);

  const handleDigit = (d: number) => {
    if (phase !== "input") return;
    const newInput = [...userInput, d];
    setUserInput(newInput);

    if (newInput.length === sequence.length) {
      const correct = newInput.every((v, i) => v === sequence[i]);
      if (correct) {
        const newScore = score + sequence.length * 10;
        setScore(newScore);
        const newLevel = level + 1;
        setLevel(newLevel);
        if (newLevel > bestLevel) setBestLevel(newLevel);
        const nextSeq = [...sequence, Math.floor(Math.random() * 10)];
        setSequence(nextSeq);
        setTimeout(() => showSequence(nextSeq), 500);
      } else {
        setPhase("result");
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalScore = score + (level > 1 ? (level - 1) * 5 : 0);
        saveSession.mutate({
          game_type: "sequence_recall",
          score: finalScore,
          duration_seconds: duration,
          details: { max_length: sequence.length, levels_completed: level - 1, difficulty },
        });
        toast.success(`🔢 Reached level ${level} — Score: ${finalScore}`);
      }
    }
  };

  const isPlaying = phase === "showing" || phase === "input";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={isPlaying} />
        <button onClick={startGame} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Level: <strong className="text-foreground">{level}</strong></span>
        <span>Score: <strong className="text-foreground">{score}</strong></span>
      </div>

      {phase === "result" && level === 0 && (
        <motion.button
          onClick={startGame}
          className="w-full rounded-2xl bg-secondary border-2 border-border p-12 text-center"
          whileTap={{ scale: 0.98 }}
        >
          <Hash className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground">Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1">Watch the sequence, then repeat it</p>
        </motion.button>
      )}

      {phase === "showing" && (
        <div className="rounded-2xl bg-secondary border-2 border-border p-8 text-center">
          <p className="text-xs text-muted-foreground mb-4">Memorize this sequence</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {sequence.map((d, i) => (
              <motion.div
                key={i}
                className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold transition-colors ${
                  highlightIdx === i
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-card border border-border text-foreground"
                }`}
                animate={highlightIdx === i ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {highlightIdx >= i ? d : "·"}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {phase === "input" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary border-2 border-primary/30 p-6 text-center">
            <p className="text-xs text-muted-foreground mb-3">Your input ({userInput.length}/{sequence.length})</p>
            <div className="flex gap-2 justify-center min-h-[3rem] flex-wrap">
              {sequence.map((_, i) => (
                <div key={i} className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                  i < userInput.length
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-card border border-border text-muted-foreground"
                }`}>
                  {i < userInput.length ? userInput[i] : "·"}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
              <motion.button
                key={d}
                onClick={() => handleDigit(d)}
                className="aspect-square rounded-xl bg-card border border-border text-foreground font-bold text-lg hover:bg-primary/10 hover:border-primary/30 active:bg-primary/20 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {d}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && level > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/30 p-6 text-center"
        >
          <p className="text-lg font-bold text-foreground">Game Over</p>
          <p className="text-sm text-muted-foreground mt-1">
            You reached level <strong className="text-primary">{level}</strong> with a sequence of {sequence.length} digits
          </p>
          <p className="text-2xl font-black text-primary mt-2">{score}</p>
          <p className="text-xs text-muted-foreground">points</p>
          <button onClick={startGame} className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
            Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SequenceRecallGame;
