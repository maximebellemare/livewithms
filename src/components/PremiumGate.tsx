import { ReactNode } from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useNavigate } from "react-router-dom";

interface PremiumGateProps {
  children?: ReactNode;
  feature?: string;
  compact?: boolean;
}

/** Wraps premium-only content. Shows upgrade prompt for free users. */
const PremiumGate = ({ children, feature, compact }: PremiumGateProps) => {
  const { isPremium, isLoading } = usePremium();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (isPremium) return <>{children}</>;

  if (compact) {
    return (
      <button
        onClick={() => navigate("/premium")}
        className="flex items-center gap-2 rounded-xl border border-primary/20 bg-accent/50 px-4 py-3 w-full text-left transition-all hover:border-primary/40 hover:bg-accent"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Lock className="h-4 w-4 text-primary" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{feature || "Premium Feature"}</p>
          <p className="text-[11px] text-muted-foreground">Upgrade to unlock</p>
        </div>
        <Crown className="h-4 w-4 text-primary" />
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-accent/60 to-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {feature || "Premium Feature"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
        Unlock AI-powered insights, clinical tools, and personalized programs with Premium.
      </p>
      <button
        onClick={() => navigate("/premium")}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <Crown className="h-4 w-4" />
        Explore Premium
      </button>
      <p className="mt-3 text-[10px] text-muted-foreground">Starting at $19/month</p>
    </div>
  );
};

export default PremiumGate;
