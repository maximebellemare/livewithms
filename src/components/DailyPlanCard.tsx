import { useMemo } from "react";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import type { CheckInMood } from "@/hooks/useDailyCheckIn";

interface Props {
  mood: CheckInMood | null;
}

const PLANS: Record<CheckInMood, { emoji: string; text: string }[]> = {
  good: [
    { emoji: "☀️", text: "Enjoy the momentum — do something you love today" },
    { emoji: "📝", text: "Log your symptoms later to capture this good stretch" },
    { emoji: "💧", text: "Stay hydrated and keep your energy steady" },
  ],
  okay: [
    { emoji: "🧘", text: "Keep your energy light today" },
    { emoji: "📝", text: "Check in with your symptoms this afternoon" },
    { emoji: "💤", text: "Plan a short rest break if you need one" },
  ],
  struggling: [
    { emoji: "🫶", text: "Take a short reset break when you can" },
    { emoji: "🧘", text: "Try a 2-minute breathing exercise" },
    { emoji: "📝", text: "Log how you're feeling — it helps you track patterns" },
  ],
  exhausted: [
    { emoji: "💛", text: "Be gentle with yourself today" },
    { emoji: "🛋️", text: "Simplify your plans — rest is productive" },
    { emoji: "📝", text: "Log your symptoms so your patterns stay accurate" },
  ],
};

const DailyPlanCard = ({ mood }: Props) => {
  const { hasPremiumAccess } = usePremiumAccess();
  const navigate = useNavigate();

  const plan = useMemo(() => {
    if (!mood) return null;
    return PLANS[mood] || PLANS.okay;
  }, [mood]);

  if (!mood || !plan) return null;

  // Free users see a locked/blurred version
  if (!hasPremiumAccess) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <div className="pointer-events-none select-none blur-[5px] opacity-50 saturate-50" aria-hidden>
          <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Your plan for today</span>
            </div>
            {plan.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 py-1">
                <span className="text-base">{item.emoji}</span>
                <span className="text-sm text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/95 via-card/70 to-transparent rounded-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 mb-2">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Your daily plan</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Unlock patterns and guidance</p>
          <button
            onClick={() => navigate("/premium")}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Explore Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Your plan for today</span>
      </div>
      {plan.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <span className="text-base">{item.emoji}</span>
          <span className="text-sm text-foreground">{item.text}</span>
        </div>
      ))}
    </div>
  );
};

export default DailyPlanCard;
