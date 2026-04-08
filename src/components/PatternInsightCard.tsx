import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";
import type { PatternInsight } from "@/hooks/useDailyCheckIn";

const ICON_MAP: Record<string, typeof Sparkles> = {
  consecutive_exhausted: Heart,
  consecutive_struggling: Heart,
  low_energy_week: Heart,
  improving: Sparkles,
  consistent_checkins: Sparkles,
  re_engage: Heart,
};

const COLOR_MAP: Record<string, string> = {
  consecutive_exhausted: "text-orange-500/80",
  consecutive_struggling: "text-orange-500/80",
  low_energy_week: "text-orange-500/80",
  improving: "text-primary",
  consistent_checkins: "text-primary",
  re_engage: "text-muted-foreground",
};

interface PatternInsightCardProps {
  insight: PatternInsight;
}

const PatternInsightCard = ({ insight }: PatternInsightCardProps) => {
  const Icon = ICON_MAP[insight.type] || Sparkles;
  const iconColor = COLOR_MAP[insight.type] || "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
      className="rounded-xl border border-border/50 bg-secondary/30 px-4 py-3.5 space-y-1.5"
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="space-y-1 min-w-0">
          <p className="text-[13px] text-foreground/85 leading-relaxed">
            {insight.message}
          </p>
          {insight.suggestion && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-[10px]">💡</span>
              {insight.suggestion}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PatternInsightCard;
