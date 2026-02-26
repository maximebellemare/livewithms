import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSaveSession } from "@/hooks/useCognitiveSessions";
import { toast } from "sonner";
import { RotateCcw, Trophy } from "lucide-react";
import DifficultySelector, { type Difficulty } from "./DifficultySelector";

const EMOJIS = ["🧠", "💡", "⚡", "🎯", "🔥", "💪", "🌟", "🎨", "🎭", "🌈"];

const PAIR_COUNT: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 8 };
const GRID_COLS: Record<Difficulty, string> = { easy: "grid-cols-4", medium: "grid-cols-4", hard: "grid-cols-4" };

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatchGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const saveSession = useSaveSession();

  const pairCount = PAIR_COUNT[difficulty];

  const initGame = useCallback(() => {
    const pairs = EMOJIS.slice(0, pairCount);
    const deck = [...pairs, ...pairs]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setMatched(0);
    setStartTime(null);
    setGameOver(false);
  }, [pairCount]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleFlip = (id: number) => {
    if (gameOver || selected.length >= 2) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    if (!startTime) setStartTime(Date.now());

    const next = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(next);
    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected;
      if (next[a].emoji === next[b].emoji) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => c.id === a || c.id === b ? { ...c, matched: true } : c));
          const newMatched = matched + 1;
          setMatched(newMatched);
          setSelected([]);
          if (newMatched === pairCount) {
            setGameOver(true);
            const duration = Math.round((Date.now() - (startTime || Date.now())) / 1000);
            const score = Math.max(100 - (moves + 1 - pairCount) * 5 - Math.floor(duration / 5), 10);
            saveSession.mutate({
              game_type: "memory_match",
              score,
              duration_seconds: duration,
              details: { moves: moves + 1, pairs: pairCount, difficulty },
            });
            toast.success(`🧠 Memory Match complete! Score: ${score}`);
          }
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => c.id === a || c.id === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DifficultySelector value={difficulty} onChange={handleDifficultyChange} disabled={!!startTime && !gameOver} />
        <button onClick={initGame} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Moves: <strong className="text-foreground">{moves}</strong></span>
        <span>Pairs: <strong className="text-foreground">{matched}/{pairCount}</strong></span>
      </div>

      <div className={`grid ${GRID_COLS[difficulty]} gap-2`}>
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-xl text-2xl font-bold flex items-center justify-center transition-colors ${
              card.flipped || card.matched
                ? "bg-primary/20 border-2 border-primary/40"
                : "bg-secondary border-2 border-border hover:border-primary/30"
            } ${card.matched ? "opacity-60" : ""}`}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span
                  key="emoji"
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  exit={{ rotateY: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {card.emoji}
                </motion.span>
              ) : (
                <motion.span
                  key="hidden"
                  className="text-muted-foreground/30 text-lg"
                >
                  ?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-center"
        >
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">All pairs found in {moves} moves!</p>
          <button onClick={initGame} className="mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
            Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryMatchGame;
