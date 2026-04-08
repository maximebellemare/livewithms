import { Crown } from "lucide-react";
import { useTrial } from "@/hooks/useTrial";
import { usePremium } from "@/hooks/usePremium";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/** Shows a subtle banner during the trial period */
const TrialBanner = () => {
  const { isInTrial, daysRemaining } = useTrial();
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  // Don't show if user has paid or is not in trial
  if (isPremium || !isInTrial) return null;

  const dayText = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        onClick={() => navigate("/premium")}
        className="flex w-full items-center justify-center gap-2 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
      >
        <Crown className="h-3.5 w-3.5" />
        <span>
          {daysRemaining > 0
            ? `${dayText} left in your free experience`
            : "Your free experience is ending soon"}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default TrialBanner;
