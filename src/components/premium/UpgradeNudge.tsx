import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Props {
  /** e.g. "You've used 5 of 5 AI messages today" */
  message: string;
  /** e.g. "Upgrade for unlimited AI coaching, advanced insights, and more." */
  description?: string;
  /** Optional CTA text override */
  cta?: string;
}

/** Contextual upgrade nudge shown when free users hit limits */
const UpgradeNudge = ({ message, description, cta = "Go Premium" }: Props) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/50 to-card p-4 space-y-2"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Crown className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{message}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => navigate("/premium")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};

export default UpgradeNudge;
