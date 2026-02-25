import { useState, useCallback } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, Zap, Hash, TrendingUp } from "lucide-react";
import MemoryMatchGame from "@/components/cognitive/MemoryMatchGame";
import ReactionTimeGame from "@/components/cognitive/ReactionTimeGame";
import SequenceRecallGame from "@/components/cognitive/SequenceRecallGame";
import CognitiveTrends from "@/components/cognitive/CognitiveTrends";
import CognitiveStreakBadge from "@/components/cognitive/CognitiveStreakBadge";
import { useBestScores } from "@/hooks/useCognitiveSessions";

const GAMES = [
  { id: "memory", label: "Memory", icon: <Brain className="h-4 w-4" /> },
  { id: "reaction", label: "Reaction", icon: <Zap className="h-4 w-4" /> },
  { id: "sequence", label: "Sequence", icon: <Hash className="h-4 w-4" /> },
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
        <CognitiveStreakBadge />
        {/* Best scores summary */}
        {bestScores && Object.keys(bestScores).length > 0 && (
          <div className="flex gap-2">
            {bestScores.memory_match && (
              <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
                <Brain className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.memory_match.score}</p>
                <p className="text-[10px] text-muted-foreground">Memory Best</p>
              </div>
            )}
            {bestScores.reaction_time && (
              <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
                <Zap className="h-4 w-4 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.reaction_time.score}</p>
                <p className="text-[10px] text-muted-foreground">Reaction Best</p>
              </div>
            )}
            {bestScores.sequence_recall && (
              <div className="flex-1 rounded-xl bg-card p-3 shadow-soft text-center">
                <Hash className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{bestScores.sequence_recall.score}</p>
                <p className="text-[10px] text-muted-foreground">Sequence Best</p>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="memory">
          <TabsList className="grid w-full grid-cols-4">
            {GAMES.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="flex items-center gap-1.5 text-xs">
                {g.icon} {g.label}
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

          <TabsContent value="trends" className="mt-4">
            <CognitiveTrends days={30} />
          </TabsContent>
        </Tabs>
      </PullToRefresh>
    </>
  );
};

export default CognitivePage;
