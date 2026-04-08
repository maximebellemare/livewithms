import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import DailyCheckInFlow from "@/components/DailyCheckInFlow";
import { CheckInMood, CheckInData } from "@/hooks/useDailyCheckIn";

const MOOD_EMOJI: Record<CheckInMood, string> = {
  good: "😊",
  okay: "😐",
  struggling: "😞",
  exhausted: "😴",
};

const MOOD_LABEL: Record<CheckInMood, string> = {
  good: "Good",
  okay: "Okay",
  struggling: "Struggling",
  exhausted: "Exhausted",
};

interface Props {
  checkIn: CheckInData | null;
  onComplete: (mood: CheckInMood) => CheckInData;
  onReset: () => void;
}

/** Persistent card on Today page — shows summary or lets user check in */
const DailyCheckInCard = ({ checkIn, onComplete, onReset }: Props) => {
  const [showRedo, setShowRedo] = useState(false);

  if (checkIn && !showRedo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-2xl border border-primary/10 bg-gradient-to-b from-primary/[0.04] to-primary/[0.08] p-5 space-y-3"
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{MOOD_EMOJI[checkIn.mood]}</span>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Today's check-in
              </p>
              <p className="text-[15px] font-semibold text-foreground -mt-0.5">
                Feeling {MOOD_LABEL[checkIn.mood].toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => { onReset(); setShowRedo(true); }}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary/60 transition-colors"
            title="Update check-in"
          >
            <RefreshCw className="h-3 w-3" />
            Update
          </button>
        </div>

        {/* AI response */}
        <p className="text-[13px] text-foreground/80 leading-relaxed pl-[3.25rem]">
          "{checkIn.aiResponse}"
        </p>

        {/* Suggestion nudge */}
        {checkIn.suggestion && (
          <div className="flex items-center gap-2 pl-[3.25rem] pt-0.5">
            <span className="text-xs">💡</span>
            <p className="text-xs font-medium text-primary/80">{checkIn.suggestion}</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <DailyCheckInFlow
      onComplete={(mood) => {
        const result = onComplete(mood);
        setShowRedo(false);
        return result;
      }}
      variant="card"
    />
  );
};

export default DailyCheckInCard;
