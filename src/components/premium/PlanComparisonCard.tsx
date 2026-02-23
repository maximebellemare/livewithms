import { Crown, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { label: "Daily symptom tracking", free: true, premium: true },
  { label: "Community forum", free: true, premium: true },
  { label: "Nervous system tools", free: true, premium: true },
  { label: "Basic insights & charts", free: true, premium: true },
  { label: "AI Coach (5 messages/day)", free: true, premium: false },
  { label: "AI Coach (unlimited)", free: false, premium: true },
  { label: "Advanced correlations", free: false, premium: true },
  { label: "Monthly health review", free: false, premium: true },
  { label: "Doctor Mode reports", free: false, premium: true },
  { label: "Fatigue deep dive", free: false, premium: true },
  { label: "Guided programs", free: false, premium: true },
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
          <span className="text-center text-primary">Pro</span>
        </div>

        {features.slice(0, compact ? 7 : undefined).map((f, i) => (
          <div
            key={f.label}
            className={`grid grid-cols-[1fr_56px_56px] px-4 py-2.5 text-xs ${
              !f.free && f.premium ? "bg-primary/[0.02]" : ""
            }`}
          >
            <span className="text-foreground">{f.label}</span>
            <span className="flex justify-center">
              {f.free ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground/40" />
              )}
            </span>
            <span className="flex justify-center">
              <Check className="h-3.5 w-3.5 text-primary" />
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
