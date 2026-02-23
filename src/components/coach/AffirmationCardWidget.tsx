import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, Shuffle, Star } from "lucide-react";

const AFFIRMATIONS = [
  "I am more than my diagnosis. I am resilient, capable, and whole.",
  "My body is doing its best, and I honour it with patience and care.",
  "I deserve rest without guilt. Rest is productive.",
  "I am allowed to have good days without fear of what comes next.",
  "My worth is not measured by what I can accomplish today.",
  "I adapt, I adjust, I keep going — at my own pace.",
  "Asking for help is a sign of strength, not weakness.",
  "I choose to focus on what I can do, not what I can't.",
  "Every small step forward counts. Progress is progress.",
  "I am not a burden. I am a person worthy of love and support.",
  "My feelings are valid, even when others don't fully understand.",
  "I give myself permission to take things one moment at a time.",
  "I am brave for facing each day, even the difficult ones.",
  "My journey is unique, and I don't need to compare it to anyone else's.",
  "I trust myself to handle whatever today brings.",
  "Difficult days don't erase my progress. I am still moving forward.",
];

export const detectAffirmation = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /affirmation\s*(card|exercise|practice)/i.test(lower) ||
    /positive\s*affirmation/i.test(lower) ||
    /here\s*(are|is)\s*(some|a|a few)\s*affirmation/i.test(lower) ||
    /rotating\s*affirmation/i.test(lower) ||
    /daily\s*affirmation/i.test(lower) ||
    (lower.includes("affirmation") && (lower.includes("tailored") || lower.includes("for you") || lower.includes("to keep")))
  );
};

const AffirmationCardWidget = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * AFFIRMATIONS.length));
  const [direction, setDirection] = useState(0);
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("ms-affirmation-favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });
  const [showFavs, setShowFavs] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("ms-affirmation-favorites", JSON.stringify([...favorites]));
    } catch {}
  }, [favorites]);

  const navigate = useCallback((dir: number) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + AFFIRMATIONS.length) % AFFIRMATIONS.length);
  }, []);

  const shuffle = useCallback(() => {
    setDirection(1);
    setIndex(Math.floor(Math.random() * AFFIRMATIONS.length));
  }, []);

  const toggleFavorite = useCallback(() => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, [index]);

  const isFav = favorites.has(index);
  const favList = [...favorites];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Affirmation Cards</p>
            <p className="text-[11px] text-muted-foreground">{AFFIRMATIONS.length} affirmations · {favorites.size} saved</p>
          </div>
        </div>
        {favorites.size > 0 && (
          <button
            onClick={() => setShowFavs((p) => !p)}
            className={`text-[11px] px-2 py-1 rounded-md transition-colors ${showFavs ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {showFavs ? "All" : "Saved"}
          </button>
        )}
      </div>

      {/* Affirmation card */}
      <div className="relative min-h-[100px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.p
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="text-sm text-foreground text-center leading-relaxed px-4 italic"
          >
            "{AFFIRMATIONS[index]}"
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFavorite}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all active:scale-95 ${
            isFav ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
          aria-label={isFav ? "Remove from saved" : "Save affirmation"}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-primary" : ""}`} />
        </button>
        <button
          onClick={shuffle}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform"
          aria-label="Shuffle"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Saved list */}
      {showFavs && favList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border pt-3 space-y-2"
        >
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Saved Affirmations</p>
          {favList.map((i) => (
            <button
              key={i}
              onClick={() => { setDirection(1); setIndex(i); setShowFavs(false); }}
              className="block w-full text-left text-xs text-foreground/80 hover:text-foreground leading-relaxed py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              "{AFFIRMATIONS[i]}"
            </button>
          ))}
        </motion.div>
      )}

      <p className="text-[10px] text-muted-foreground/50 text-center">
        {index + 1} / {AFFIRMATIONS.length}
      </p>
    </div>
  );
};

export default AffirmationCardWidget;
