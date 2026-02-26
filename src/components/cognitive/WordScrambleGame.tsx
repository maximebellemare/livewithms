import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy, Check } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const WORD_POOLS: Record<Difficulty, string[]> = {
  easy: ["brain", "sleep", "walk", "rest", "calm", "hope", "care", "mind", "body", "heal", "warm", "cool"],
  medium: ["energy", "memory", "health", "muscle", "breath", "balance", "gentle", "strong", "steady", "active", "motion", "relief"],
  hard: ["cognitive", "exercise", "movement", "recovery", "progress", "strength", "wellness", "mobility", "fatigue", "patience", "flexible", "champion"],
};

const ROUND_COUNT: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 10 };
const TIME_LIMIT: Record<Difficulty, number> = { easy: 30, medium: 25, hard: 20 }; // seconds per word

function scramble(word: string): string {
  const letters = word.split("");
  // Fisher-Yates shuffle — retry if result equals original
  for (let attempt = 0; attempt < 10; attempt++) {
    const shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (shuffled.join("") !== word) return shuffled.join("");
  }
  // Fallback: reverse
  return letters.reverse().join("");
}

const WordScrambleGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [words, setWords] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "skip" | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const saveSession = useSaveSession();

  const rounds = ROUND_COUNT[difficulty];
  const timePerWord = TIME_LIMIT[difficulty];
  const pool = WORD_POOLS[difficulty];

  const setupWord = useCallback((wordList: string[], idx: number) => {
    setScrambled(scramble(wordList[idx]));
    setGuess("");
    setTimeLeft(timePerWord);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [timePerWord]);

  const startGame = useCallback(() => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, rounds);
    setWords(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setSolved(0);
    setSkipped(0);
    setGameOver(false);
    setStarted(true);
    setFeedback(null);
    startTimeRef.current = Date.now();
    setupWord(shuffled, 0);
  }, [pool, rounds, setupWord]);

  // Timer
  useEffect(() => {
    if (!started || gameOver || feedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          handleSkip();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, started, gameOver, feedback]);

  const advance = useCallback((type: "correct" | "wrong" | "skip") => {
    clearInterval(timerRef.current);
    setFeedback(type);
    setTimeout(() => {
      setFeedback(null);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= words.length) {
        setGameOver(true);
        setStarted(false);
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalSolved = type === "correct" ? solved + 1 : solved;
        const finalScore = type === "correct" ? score + 10 + Math.floor(timeLeft * 2) : score;
        saveSession.mutate({
          game_type: "word_scramble",
          score: finalScore,
          duration_seconds: duration,
          details: { rounds, solved: finalSolved, skipped: type === "skip" ? skipped + 1 : skipped, difficulty },
        });
        toast.success(`📝 Word Scramble complete! Score: ${finalScore}`);
      } else {
        setCurrentIdx(nextIdx);
        setupWord(words, nextIdx);
      }
    }, 800);
  }, [currentIdx, words, score, solved, skipped, timeLeft, rounds, saveSession, setupWord]);

  const handleSubmit = useCallback(() => {
    if (!guess.trim()) return;
    const current = words[currentIdx];
    if (guess.toLowerCase().trim() === current) {
      const timeBonus = Math.floor(timeLeft * 2);
      setScore((s) => s + 10 + timeBonus);
      setSolved((s) => s + 1);
      advance("correct");
    } else {
      advance("wrong");
    }
  }, [guess, words, currentIdx, timeLeft, advance]);

  const handleSkip = useCallback(() => {
    setSkipped((s) => s + 1);
    advance("skip");
  }, [advance]);

  const timerPercent = (timeLeft / timePerWord) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={started} />
        <button
          onClick={startGame}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {!started && !gameOver && (
        <motion.button
          onClick={startGame}
          className="w-full rounded-2xl bg-secondary border-2 border-border p-10 text-center"
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-3xl mb-3">📝</p>
          <p className="text-lg font-semibold text-foreground">Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1.5">Unscramble the letters to form a word</p>
        </motion.button>
      )}

      {started && !gameOver && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentIdx + 1}/{rounds}</span>
            <span>Score: <strong className="text-foreground">{score}</strong></span>
            <span>Solved: <strong className="text-foreground">{solved}</strong></span>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                timerPercent > 50 ? "bg-primary" : timerPercent > 25 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Scrambled word */}
          <div className="rounded-2xl bg-card border border-border p-6 text-center">
            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.div
                  key="feedback"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className={`text-xl font-bold ${
                    feedback === "correct" ? "text-green-500" : "text-red-500"
                  }`}>
                    {feedback === "correct" ? "✓ Correct!" : feedback === "skip" ? "⏭ Time's up" : "✗ Not quite"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The word was: <strong className="text-foreground">{words[currentIdx]}</strong>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex gap-1.5 justify-center flex-wrap mb-1">
                    {scrambled.split("").map((letter, i) => (
                      <span
                        key={i}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-lg font-bold text-primary uppercase"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">{scrambled.length} letters</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          {!feedback && (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                autoComplete="off"
                autoCapitalize="off"
              />
              <button
                onClick={handleSubmit}
                disabled={!guess.trim()}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-3 font-medium text-sm disabled:opacity-40 active:scale-95 transition-all"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Skip button */}
          {!feedback && (
            <button
              onClick={handleSkip}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Skip this word →
            </button>
          )}
        </div>
      )}

      {gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/30 p-6 text-center"
        >
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-lg font-bold text-foreground">
            {solved === rounds ? "Perfect!" : `${solved}/${rounds} solved`}
          </p>
          <p className="text-3xl font-black text-primary mt-1">{score}</p>
          <p className="text-xs text-muted-foreground">points</p>
          {skipped > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{skipped} skipped</p>
          )}
          <button
            onClick={startGame}
            className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default WordScrambleGame;
