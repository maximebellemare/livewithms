import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import PremiumInsightPreview from "@/components/premium/PremiumInsightPreview";
import { motion } from "framer-motion";
import { Brain, Sparkles, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { toast } from "sonner";

interface ForecastActivity {
  name: string;
  spoon_cost: number;
  priority: "must-do" | "should-do" | "optional";
}

interface Forecast {
  recommended_spoons: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  key_factors: string[];
  suggested_activities: ForecastActivity[];
  tip: string;
}

function useForecast() {
  const { user } = useAuth();
  return useQuery<Forecast>({
    queryKey: ["energy-forecast", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("energy-forecast");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as Forecast;
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 min cache
    retry: false,
  });
}

const confidenceColors = {
  high: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-orange-600 dark:text-orange-400",
};

const priorityStyles = {
  "must-do": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  "should-do": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  "optional": "bg-secondary text-muted-foreground border-border",
};

interface Props {
  onApplyBudget?: (spoons: number) => void;
  onAddActivity?: (name: string, cost: number) => void;
}

const ForecastContent = ({ onApplyBudget, onAddActivity }: Props) => {
  const { data: forecast, isLoading, error } = useForecast();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Couldn't generate forecast. Try again later.</span>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-soft border border-primary/10 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">AI Energy Forecast</h3>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">{forecast.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Main prediction */}
      <div className="flex items-center gap-4">
        <div className="flex-1 rounded-lg bg-background/80 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{forecast.recommended_spoons} 🥄</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Recommended budget</p>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className={`text-xs font-semibold capitalize ${confidenceColors[forecast.confidence]}`}>
              {forecast.confidence}
            </span>
          </div>
          {onApplyBudget && (
            <button
              onClick={() => {
                onApplyBudget(forecast.recommended_spoons);
                toast.success(`Budget set to ${forecast.recommended_spoons} spoons`);
              }}
              className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Apply this budget
            </button>
          )}
        </div>
      </div>

      {/* Key factors */}
      <div className="flex flex-wrap gap-1.5">
        {forecast.key_factors.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground border border-border">
            <Zap className="h-2.5 w-2.5" />
            {f}
          </span>
        ))}
      </div>

      {/* Expand for activities */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline w-full"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "View"} suggested activities ({forecast.suggested_activities.length})
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="space-y-1.5"
        >
          {forecast.suggested_activities.map((act, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${priorityStyles[act.priority]}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{act.name}</span>
                <span className="text-[10px] opacity-70 capitalize">({act.priority.replace("-", " ")})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{act.spoon_cost} 🥄</span>
                {onAddActivity && (
                  <button
                    onClick={() => {
                      onAddActivity(act.name, act.spoon_cost);
                      toast.success(`Added "${act.name}"`);
                    }}
                    className="rounded-md bg-background/80 border border-border px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted active:scale-95 transition-all"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Tip */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 mt-2">
            <p className="text-xs text-foreground leading-relaxed">
              💡 <span className="font-medium">Today's tip:</span> {forecast.tip}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const EnergyForecastCard = ({ onApplyBudget, onAddActivity }: Props) => {
  return (
    <PremiumInsightPreview
      title="AI Energy Forecaster"
      description="Get personalized daily energy predictions based on your symptom trends and history."
    >
      <ForecastContent onApplyBudget={onApplyBudget} onAddActivity={onAddActivity} />
    </PremiumInsightPreview>
  );
};

export default EnergyForecastCard;
