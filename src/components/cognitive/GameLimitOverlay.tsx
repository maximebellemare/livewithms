import { motion } from "framer-motion";
import { Crown, Sunrise } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameLimitOverlayProps {
  onDismiss: () => void;
}

const GameLimitOverlay = ({ onDismiss }: GameLimitOverlayProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sunrise className="h-7 w-7 text-primary" />
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          That was a good reset
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
          Take another moment like this anytime with premium — unlimited resets, whenever you need them.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate("/premium")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            Continue with Premium
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-full px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Come back tomorrow
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameLimitOverlay;
