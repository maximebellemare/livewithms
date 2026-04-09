import { Crown, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { label: "Daily symptom tracking", free: "✓", premium: "✓" },
  { label: "Community access", free: "✓", premium: "✓" },
  { label: "Nervous system tools", free: "✓", premium: "✓" },
  { label: "AI Coach", free: "5/day", premium: "Unlimited" },
  { label: "Cognitive games", free: "3/day", premium: "Unlimited" },
  { label: "Insights", free: "Basic", premium: "Pattern trends" },
  { label: "Personalized daily guidance", free: "—", premium: "✓" },
  { label: "Understand symptom triggers", free: "—", premium: "✓" },
  { label: "Monthly health summary", free: "—", premium: "✓" },
  { label: "Doctor-ready reports (PDF)", free: "—", premium: "✓" },
  { label: "Fatigue trigger analysis", free: "—", premium: "✓" },
  { label: "Guided programs", free: "—", premium: "✓" },
];

/** Free vs Premium comparison card for onboarding and premium page */
const PlanComparisonCard = ({ compact = false }: { compact?: boolean }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/15 bg-card shadow-soft overflow-hidden"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-accent/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Free vs Premium</p>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_56px_56px] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Feature</span>
          <span className="text-center">Free</span>
          <span className="text-center text-primary">Premium</span>
        </div>

        {features.slice(0, compact ? 7 : undefined).map((f) => (
          <div
            key={f.label}
            className={`grid grid-cols-[1fr_56px_56px] px-4 py-2.5 text-xs ${
              f.free === "—" ? "bg-primary/[0.02]" : ""
            }`}
          >
            <span className="text-foreground">{f.label}</span>
            <span className="flex justify-center text-center">
              {f.free === "✓" ? (
                <Check className="h-3.5 w-3.5 text-[hsl(var(--brand-green))]" />
              ) : f.free === "—" ? (
                <span className="text-muted-foreground/40">—</span>
              ) : (
                <span className="text-muted-foreground text-[10px]">{f.free}</span>
              )}
            </span>
            <span className="flex justify-center text-center">
              {f.premium === "✓" ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span className="font-medium text-primary text-[10px]">{f.premium}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="px-4 py-3 bg-accent/30">
          <button
            onClick={() => navigate("/premium")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            Start Premium · $19/mo
          </button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            14-day free trial on annual plan
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default PlanComparisonCard;
