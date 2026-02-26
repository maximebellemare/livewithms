import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Wand2, Brain, Pill, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePremium } from "@/hooks/usePremium";
import { useProfile } from "@/hooks/useProfile";
import PremiumGate from "@/components/PremiumGate";
import {
  useDietPlans, useUserDietPlan, useUpdateWeeklySelections,
  type Recipe, type WeeklySelections,
} from "@/hooks/useDietPlans";

export default function AIMealPlanner() {
  const { isPremium } = usePremium();
  const { data: plans = [] } = useDietPlans();
  const { data: userPlan } = useUserDietPlan();
  const { data: profile } = useProfile();
  const updateWeekly = useUpdateWeeklySelections();
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState("");

  const plan = plans.find(p => p.id === userPlan?.plan_id);

  if (!isPremium) {
    return <PremiumGate feature="AI Meal Planner" />;
  }

  if (!plan || !userPlan) {
    return (
      <div className="rounded-xl bg-card border border-border p-4 shadow-soft text-center">
        <Wand2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Select a diet plan first, then use AI to auto-fill your weekly meals.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-planner", {
        body: {
          recipes: plan.recipes,
          diet_name: plan.name,
          preferences: preferences.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generatedPlan = data.plan as WeeklySelections;
      await updateWeekly.mutateAsync({
        userDietPlanId: userPlan.id,
        weekly_selections: generatedPlan,
      });
      toast.success("Personalized meal plan generated! 🎉");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate meal plan");
    } finally {
      setIsGenerating(false);
    }
  };

  // Show personalization signals
  const signals: { icon: typeof Brain; label: string }[] = [];
  if (profile?.ms_type) signals.push({ icon: Brain, label: profile.ms_type });
  if (profile?.symptoms?.length) signals.push({ icon: TrendingUp, label: `${profile.symptoms.length} symptoms tracked` });
  if (profile?.medications?.length) signals.push({ icon: Pill, label: `${profile.medications.length} medications` });
  signals.push({ icon: Zap, label: "Energy-aware" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/50 to-card p-4 border border-primary/15 shadow-soft">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Meal Planner</h3>
            <p className="text-[11px] text-muted-foreground">Personalized to your MS profile, symptoms & medications</p>
          </div>
        </div>

        {/* Personalization signals */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {signals.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Icon className="h-2.5 w-2.5" />
              {label}
            </span>
          ))}
        </div>

        <input
          type="text"
          value={preferences}
          onChange={e => setPreferences(e.target.value)}
          placeholder="Any preferences? (e.g. 'no dairy', 'quick meals only')"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3"
          maxLength={200}
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your profile & generating…</>
          ) : (
            <><Wand2 className="h-4 w-4" /> Generate Personalized Plan</>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Uses your symptoms, medications, energy level & recent trends to tailor meals.
        </p>
      </div>
    </motion.div>
  );
}
