import { motion } from "framer-motion";
import { Crown, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  onDismiss: () => void;
}

export default function FitnessLimitOverlay({ onDismiss }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl p-4"
    >
      <div className="w-full max-w-xs text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Heart className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            You've reached your daily guidance limit
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
            Get personalized, MS-aware support anytime with premium.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate("/premium")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Crown className="h-3.5 w-3.5" />
            Continue with Premium
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-full px-5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Try again tomorrow
          </button>
        </div>
      </div>
    </motion.div>
  );
}
