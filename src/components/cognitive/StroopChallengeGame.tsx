import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const COLORS = [
  { name: "Red", tw: "text-red-500" },
  { name: "Blue", tw: "text-blue-500" },
  { name: "Green", tw: "text-green-500" },
  { name: "Yellow", tw: "text-yellow-500" },
  { name: "Purple", tw: "text-purple-500" },
  { name: "Orange", tw: "text-orange-500" },
];

interface StroopItem {
  word: string;
  displayColor: typeof COLORS[number];
  correctColor: typeof COLORS[number];
}

const ROUND_COUNT: Record<Difficulty, number> = { easy: 8, medium: 12, hard: 20 };
const TIME_LIMIT: Record<Difficulty, number> = { easy: 5, medium: 3.5, hard: 2 }; // seconds per item

function generateItem(congruent: boolean): StroopItem {
  const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  let displayColor = wordColor;
  if (!congruent) {
    const others = COLORS.filter((c) => c.name !== wordColor.name);
    displayColor = others[Math.floor(Math.random() * others.length)];
  }
  return { word: wordColor.name, displayColor, correctColor: displayColor };
}

function generateChoices(correct: typeof COLORS[number]): typeof COLORS[number][] {
  const others = COLORS.filter((c) => c.name !== correct.name);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...shuffled, correct].sort(() => Math.random() - 0.5);
  return choices;
}

const StroopChallengeGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [items, setItems] = useState<StroopItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [choices, setChoices] = useState<typeof COLORS[number][]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const saveSession = useSaveSession();

  const rounds = ROUND_COUNT[difficulty];
  const timePerItem = TIME_LIMIT[difficulty];

  const startGame = useCallback(() => {
    // Generate items — mostly incongruent for challenge
    const newItems: StroopItem[] = [];
    for (let i = 0; i < rounds; i++) {
      newItems.push(generateItem(Math.random() < 0.25)); // 25% congruent
    }
    setItems(newItems);
    setCurrentIdx(0);
    setScore(0);
    setErrors(0);
    setGameOver(false);
    setStarted(true);
    setFeedback(null);
    setTimeLeft(timePerItem);
    setChoices(generateChoices(newItems[0].correctColor));
    startTimeRef.current = Date.now();
  }, [rounds, timePerItem]);

  // Timer per item
  useEffect(() => {
    if (!started || gameOver || feedback) return;
    setTimeLeft(timePerItem);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time's up for this item — count as error
          handleAnswer(null);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [currentIdx, started, gameOver, feedback, timePerItem]);

  const handleAnswer = useCallback((chosen: typeof COLORS[number] | null) => {
    clearInterval(timerRef.current);
    const current = items[currentIdx];
    const isCorrect = chosen && chosen.name === current.correctColor.name;

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 10);
      setScore((s) => s + 10 + timeBonus);
      setFeedback("correct");
    } else {
      setErrors((e) => e + 1);
      setFeedback("wrong");
    }

    setTimeout(() => {
      setFeedback(null);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= items.length) {
        setGameOver(true);
        setStarted(false);
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalScore = isCorrect ? score + 10 + Math.floor(timeLeft * 10) : score;
        const finalErrors = isCorrect ? errors : errors + 1;
        saveSession.mutate({
          game_type: "stroop_challenge",
          score: finalScore,
          duration_seconds: duration,
          details: { rounds, errors: finalErrors, difficulty },
        });
        toast.success(`🎨 Stroop complete! Score: ${finalScore}`);
      } else {
        setCurrentIdx(nextIdx);
        setChoices(generateChoices(items[nextIdx].correctColor));
      }
    }, 500);
  }, [currentIdx, items, score, errors, timeLeft, rounds, saveSession]);

  const currentItem = items[currentIdx];
  const timerPercent = (timeLeft / timePerItem) * 100;

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
          <p className="text-3xl mb-3">🎨</p>
          <p className="text-lg font-semibold text-foreground">Tap to Start</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] mx-auto">
            Tap the <strong>ink color</strong> of each word — ignore what the word says!
          </p>
        </motion.button>
      )}

      {started && currentItem && !gameOver && (
        <div className="space-y-4">
          {/* Progress & stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{currentIdx + 1}/{rounds}</span>
            <span>Score: <strong className="text-foreground">{score}</strong></span>
            <span>Errors: <strong className="text-foreground">{errors}</strong></span>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${
                timerPercent > 50 ? "bg-primary" : timerPercent > 25 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Word display */}
          <div className="rounded-2xl bg-card border border-border p-8 text-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {feedback ? (
                <motion.div
                  key="feedback"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-2xl font-bold ${
                    feedback === "correct" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {feedback === "correct" ? "✓ Correct!" : "✗ Wrong"}
                </motion.div>
              ) : (
                <motion.p
                  key={currentIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`text-4xl font-black select-none ${currentItem.displayColor.tw}`}
                >
                  {currentItem.word}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Color choices */}
          <div className="grid grid-cols-2 gap-2">
            {choices.map((color) => (
              <motion.button
                key={color.name}
                onClick={() => !feedback && handleAnswer(color)}
                disabled={!!feedback}
                className={`rounded-xl border-2 border-border py-3 px-4 font-semibold text-sm transition-all
                  hover:border-primary/40 active:scale-95 disabled:opacity-60 ${color.tw}`}
                whileTap={{ scale: 0.95 }}
              >
                <span className={`inline-block h-3 w-3 rounded-full mr-2 ${color.tw.replace("text-", "bg-")}`} />
                {color.name}
              </motion.button>
            ))}
          </div>
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
            {errors === 0 ? "Perfect run!" : `${rounds - errors}/${rounds} correct`}
          </p>
          <p className="text-3xl font-black text-primary mt-1">{score}</p>
          <p className="text-xs text-muted-foreground">points</p>
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

export default StroopChallengeGame;
