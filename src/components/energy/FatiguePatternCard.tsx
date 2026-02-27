import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import PremiumInsightPreview from "@/components/premium/PremiumInsightPreview";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingDown, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Calendar } from "lucide-react";

interface Pattern {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  icon: string;
}

interface FatigueAnalysis {
  patterns: Pattern[];
  worst_day: string;
  best_day: string;
  pacing_tips: string[];
  summary: string;
  error?: string;
  message?: string;
}

function useFatiguePatterns() {
  const { user } = useAuth();
  return useQuery<FatigueAnalysis>({
    queryKey: ["fatigue-patterns", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fatigue-patterns");
      if (error) throw error;
      if (data?.error === "insufficient_data") return data;
      if (data?.error) throw new Error(data.error);
      return data as FatigueAnalysis;
    },
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1 hour cache
    retry: false,
  });
}

const severityStyles = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-yellow-500/30 bg-yellow-500/5",
  low: "border-green-500/30 bg-green-500/5",
};

const severityDot = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const FatiguePatternContent = () => {
  const { data: analysis, isLoading, error } = useFatiguePatterns();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-40 bg-muted animate-pulse rounded" />
            <div className="h-3 w-56 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Couldn't analyze fatigue patterns. Try again later.</span>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  // Insufficient data state
  if (analysis.error === "insufficient_data") {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fatigue Pattern Analysis</h3>
            <p className="text-xs text-muted-foreground">{analysis.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-orange-500/5 via-card to-card p-4 shadow-soft border border-orange-500/10 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
          <Activity className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Fatigue Pattern Analysis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{analysis.summary}</p>
        </div>
      </div>

      {/* Best / Worst day badges */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-[10px] font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Best Day</span>
          </div>
          <p className="text-sm font-bold text-foreground">{analysis.best_day}</p>
        </div>
        <div className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">Worst Day</span>
          </div>
          <p className="text-sm font-bold text-foreground">{analysis.worst_day}</p>
        </div>
      </div>

      {/* Patterns */}
      <div className="space-y-2">
        {analysis.patterns.slice(0, expanded ? undefined : 2).map((pattern, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${severityStyles[pattern.severity]} transition-colors`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none mt-0.5">{pattern.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{pattern.title}</h4>
                  <span className={`h-1.5 w-1.5 rounded-full ${severityDot[pattern.severity]}`} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{pattern.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      {analysis.patterns.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline w-full"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Show fewer" : `Show all ${analysis.patterns.length} patterns`}
        </button>
      )}

      {/* Pacing tips */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Pacing Recommendations</span>
        </div>
        <ul className="space-y-1.5">
          {analysis.pacing_tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
              <Calendar className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

const FatiguePatternCard = () => {
  return (
    <PremiumInsightPreview
      title="Fatigue Pattern Analysis"
      description="Discover your weekly fatigue rhythms and get personalized pacing strategies."
    >
      <FatiguePatternContent />
    </PremiumInsightPreview>
  );
};

export default FatiguePatternCard;