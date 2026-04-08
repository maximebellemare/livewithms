import { Crown, Heart, BarChart3, Brain, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/** Full-screen overlay shown when the 3-day trial has expired */
const TrialExpiryScreen = ({ onDismiss }: { onDismiss: () => void }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="max-w-sm w-full space-y-6 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Heart className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">
            Your 3-day experience has ended
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Continue your progress with patterns, insights, and daily support that help you feel your best.
          </p>
        </div>

        {/* What you'll keep */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Keep your premium features
          </p>
          {[
            { icon: BarChart3, label: "Pattern insights & daily plan" },
            { icon: Brain, label: "Unlimited AI coaching" },
            { icon: Shield, label: "Doctor-ready reports" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/premium")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            Continue with Premium
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue with free version
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TrialExpiryScreen;
