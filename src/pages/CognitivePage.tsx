import { useState, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { Brain, Zap, Hash, TrendingUp, Palette, Type, Grid3X3, Eye, Link, Target, LayoutGrid, ChevronDown } from "lucide-react";
import MemoryMatchGame from "@/components/cognitive/MemoryMatchGame";
import ReactionTimeGame from "@/components/cognitive/ReactionTimeGame";
import SequenceRecallGame from "@/components/cognitive/SequenceRecallGame";
import StroopChallengeGame from "@/components/cognitive/StroopChallengeGame";
import WordScrambleGame from "@/components/cognitive/WordScrambleGame";
import SymbolDigitGame from "@/components/cognitive/SymbolDigitGame";
import NBackGame from "@/components/cognitive/NBackGame";
import TrailMakingGame from "@/components/cognitive/TrailMakingGame";
import PatternRecognitionGame from "@/components/cognitive/PatternRecognitionGame";
import GoNoGoGame from "@/components/cognitive/GoNoGoGame";
import CognitiveTrends from "@/components/cognitive/CognitiveTrends";
import CognitiveStreakBadge from "@/components/cognitive/CognitiveStreakBadge";
import { useBestScores } from "@/hooks/useCognitiveSessions";
import { motion, AnimatePresence } from "framer-motion";

const GAMES = [
  { id: "memory", label: "Memory Match", icon: <Brain className="h-5 w-5" />, emoji: "🧠", desc: "Find all matching pairs with as few moves as possible.", component: <MemoryMatchGame /> },
  { id: "reaction", label: "Reaction Time", icon: <Zap className="h-5 w-5" />, emoji: "⚡", desc: "Wait for green, then tap as fast as you can!", component: <ReactionTimeGame /> },
  { id: "sequence", label: "Sequence Recall", icon: <Hash className="h-5 w-5" />, emoji: "🔢", desc: "Watch and repeat growing number sequences.", component: <SequenceRecallGame /> },
  { id: "stroop", label: "Stroop Challenge", icon: <Palette className="h-5 w-5" />, emoji: "🎨", desc: "Tap the ink color — not what it says!", component: <StroopChallengeGame /> },
  { id: "scramble", label: "Word Scramble", icon: <Type className="h-5 w-5" />, emoji: "📝", desc: "Unscramble letters to form a word.", component: <WordScrambleGame /> },
  { id: "symbol", label: "Symbol Digit", icon: <Grid3X3 className="h-5 w-5" />, emoji: "🔣", desc: "Match symbols to digits — mirrors the SDMT clinical test.", component: <SymbolDigitGame /> },
  { id: "nback", label: "N-Back", icon: <LayoutGrid className="h-5 w-5" />, emoji: "🧠", desc: "Tap when the letter matches N steps ago.", component: <NBackGame /> },
  { id: "trails", label: "Trail Making", icon: <Link className="h-5 w-5" />, emoji: "🔗", desc: "Connect numbers/letters in order.", component: <TrailMakingGame /> },
  { id: "pattern", label: "Pattern Recognition", icon: <Eye className="h-5 w-5" />, emoji: "👁", desc: "Spot the odd one out in each grid.", component: <PatternRecognitionGame /> },
  { id: "gonogo", label: "Go / No-Go", icon: <Target className="h-5 w-5" />, emoji: "🎯", desc: "Tap for green, hold for red.", component: <GoNoGoGame /> },
];

const GAME_TYPE_MAP: Record<string, { icon: React.ReactNode; label: string }> = {
  memory_match: { icon: <Brain className="h-4 w-4 text-primary" />, label: "Memory" },
  reaction_time: { icon: <Zap className="h-4 w-4 text-primary" />, label: "Reaction" },
  sequence_recall: { icon: <Hash className="h-4 w-4 text-primary" />, label: "Sequence" },
  stroop_challenge: { icon: <Palette className="h-4 w-4 text-primary" />, label: "Stroop" },
  word_scramble: { icon: <Type className="h-4 w-4 text-primary" />, label: "Scramble" },
  symbol_digit: { icon: <Grid3X3 className="h-4 w-4 text-primary" />, label: "Symbol" },
  n_back: { icon: <LayoutGrid className="h-4 w-4 text-primary" />, label: "N-Back" },
  trail_making: { icon: <Link className="h-4 w-4 text-primary" />, label: "Trails" },
  pattern_recognition: { icon: <Eye className="h-4 w-4 text-primary" />, label: "Pattern" },
  go_no_go: { icon: <Target className="h-4 w-4 text-primary" />, label: "Go/No-Go" },
};

const GameCard = ({ game }: { game: typeof GAMES[number] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-card border border-border shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {game.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{game.emoji} {game.label}</p>
          <p className="text-xs text-muted-foreground truncate">{game.desc}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {game.component}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CognitivePage = () => {
  const { data: bestScores } = useBestScores();
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ["cognitive-sessions"] }); }, [queryClient]);
  const [showTrends, setShowTrends] = useState(false);

  return (
    <>
      <SEOHead title="Cognitive Games" description="Exercise your brain with fun mini-games and track cognitive trends." />
      <PageHeader title="Cognitive Games" subtitle="Train your brain 🧠" showBack />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4 space-y-4 animate-fade-in">
        {/* MS cognitive health explainer */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/40 to-card p-4 border border-primary/10">
          <h3 className="text-sm font-semibold text-foreground mb-1.5">Why brain games for MS?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Up to 65% of people with MS experience cognitive changes — especially in memory, processing speed, and attention. Regular cognitive exercise can help build <strong className="text-foreground font-medium">neuroplasticity</strong>, strengthen neural pathways, and maintain mental sharpness over time. Think of it as physiotherapy for your brain.
          </p>
        </div>

        <CognitiveStreakBadge />

        {/* Best scores summary */}
        {bestScores && Object.keys(bestScores).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(bestScores).map(([gameType, session]) => {
              const meta = GAME_TYPE_MAP[gameType];
              if (!meta) return null;
              return (
                <div key={gameType} className="flex-shrink-0 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                  <div className="mx-auto mb-1 flex justify-center">{meta.icon}</div>
                  <p className="text-lg font-bold text-foreground">{session.score}</p>
                  <p className="text-[10px] text-muted-foreground">{meta.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Trends toggle */}
        <button
          onClick={() => setShowTrends((s) => !s)}
          className="w-full flex items-center gap-2 rounded-xl bg-card border border-border p-3 hover:bg-secondary/50 transition-colors"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground flex-1 text-left">📊 Trends & Progress</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showTrends ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {showTrends && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <CognitiveTrends days={30} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* All games */}
        <div className="space-y-3">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </PullToRefresh>
    </>
  );
};

export default CognitivePage;
