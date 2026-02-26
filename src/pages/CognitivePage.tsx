import { useState, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, Zap, Hash, TrendingUp, Palette, Type } from "lucide-react";
import MemoryMatchGame from "@/components/cognitive/MemoryMatchGame";
import ReactionTimeGame from "@/components/cognitive/ReactionTimeGame";
import SequenceRecallGame from "@/components/cognitive/SequenceRecallGame";
import StroopChallengeGame from "@/components/cognitive/StroopChallengeGame";
import WordScrambleGame from "@/components/cognitive/WordScrambleGame";
import CognitiveTrends from "@/components/cognitive/CognitiveTrends";
import CognitiveStreakBadge from "@/components/cognitive/CognitiveStreakBadge";
import { useBestScores } from "@/hooks/useCognitiveSessions";

const GAMES = [
  { id: "memory", label: "Memory", icon: <Brain className="h-4 w-4" /> },
  { id: "reaction", label: "Reaction", icon: <Zap className="h-4 w-4" /> },
  { id: "sequence", label: "Sequence", icon: <Hash className="h-4 w-4" /> },
  { id: "stroop", label: "Stroop", icon: <Palette className="h-4 w-4" /> },
  { id: "scramble", label: "Scramble", icon: <Type className="h-4 w-4" /> },
  { id: "trends", label: "Trends", icon: <TrendingUp className="h-4 w-4" /> },
];

const CognitivePage = () => {
  const { data: bestScores } = useBestScores();
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ["cognitive-sessions"] }); }, [queryClient]);

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
            {bestScores.memory_match && (
              <div className="flex-1 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                <Brain className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.memory_match.score}</p>
                <p className="text-[10px] text-muted-foreground">Memory</p>
              </div>
            )}
            {bestScores.reaction_time && (
              <div className="flex-1 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.reaction_time.score}</p>
                <p className="text-[10px] text-muted-foreground">Reaction</p>
              </div>
            )}
            {bestScores.sequence_recall && (
              <div className="flex-1 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                <Hash className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.sequence_recall.score}</p>
                <p className="text-[10px] text-muted-foreground">Sequence</p>
              </div>
            )}
            {bestScores.stroop_challenge && (
              <div className="flex-1 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                <Palette className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.stroop_challenge.score}</p>
                <p className="text-[10px] text-muted-foreground">Stroop</p>
              </div>
            )}
            {bestScores.word_scramble && (
              <div className="flex-1 min-w-[72px] rounded-xl bg-card p-3 shadow-soft text-center">
                <Type className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.word_scramble.score}</p>
                <p className="text-[10px] text-muted-foreground">Scramble</p>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="memory">
          <TabsList className="grid w-full grid-cols-6">
            {GAMES.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="flex items-center gap-1 text-[10px] px-1">
                {g.icon} <span className="hidden sm:inline">{g.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="memory" className="mt-4">
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-3">🧠 Memory Match</h3>
              <p className="text-xs text-muted-foreground mb-4">Find all matching pairs with as few moves as possible.</p>
              <MemoryMatchGame />
            </div>
          </TabsContent>

          <TabsContent value="reaction" className="mt-4">
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-3">⚡ Reaction Time</h3>
              <p className="text-xs text-muted-foreground mb-4">Wait for the green signal, then tap as fast as you can!</p>
              <ReactionTimeGame />
            </div>
          </TabsContent>

          <TabsContent value="sequence" className="mt-4">
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-3">🔢 Sequence Recall</h3>
              <p className="text-xs text-muted-foreground mb-4">Watch and repeat growing number sequences.</p>
              <SequenceRecallGame />
            </div>
          </TabsContent>

          <TabsContent value="stroop" className="mt-4">
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-3">🎨 Stroop Challenge</h3>
              <p className="text-xs text-muted-foreground mb-4">Tap the <strong>ink color</strong> of each word — not what it says! Trains selective attention.</p>
              <StroopChallengeGame />
            </div>
          </TabsContent>

          <TabsContent value="scramble" className="mt-4">
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <h3 className="text-sm font-semibold text-foreground mb-3">📝 Word Scramble</h3>
              <p className="text-xs text-muted-foreground mb-4">Unscramble the letters to form a word. Builds processing speed and word retrieval.</p>
              <WordScrambleGame />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <CognitiveTrends days={30} />
          </TabsContent>
        </Tabs>
      </PullToRefresh>
    </>
  );
};

export default CognitivePage;
