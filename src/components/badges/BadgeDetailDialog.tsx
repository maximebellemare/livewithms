import { motion } from "framer-motion";
import { Lock, CheckCircle2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: "logging" | "weekly" | "medication" | "relapse";
}

/** Maps badge id → required threshold */
const BADGE_THRESHOLDS: Record<string, number> = {
  "log-3": 3, "log-7": 7, "log-14": 14, "log-30": 30,
  "week-2": 2, "week-4": 4, "week-8": 8,
  "med-7": 7, "med-14": 14, "med-30": 30, "med-60": 60, "med-90": 90,
  "relapse-30": 30, "relapse-60": 60, "relapse-90": 90,
};

const CATEGORY_UNITS: Record<string, string> = {
  logging: "days",
  weekly: "weeks",
  medication: "days",
  relapse: "days",
};

interface Props {
  badge: BadgeDef | null;
  earned: boolean;
  earnedAt?: string;
  currentStreak: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BadgeDetailDialog = ({ badge, earned, earnedAt, currentStreak, open, onOpenChange }: Props) => {
  if (!badge) return null;

  const threshold = BADGE_THRESHOLDS[badge.id] ?? 0;
  const unit = CATEGORY_UNITS[badge.category] ?? "days";
  const progress = threshold > 0 ? Math.min((currentStreak / threshold) * 100, 100) : 0;
  const remaining = Math.max(threshold - currentStreak, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-2xl p-6 text-center">
        <DialogHeader className="items-center space-y-1">
          <motion.span
            className="text-5xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {badge.emoji}
          </motion.span>
          <DialogTitle className="text-lg font-bold">{badge.name}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{badge.description}</p>

        {earned ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Earned!
            </div>
            {earnedAt && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(earnedAt), "MMMM d, yyyy")}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {currentStreak} / {threshold} {unit}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {remaining} more {unit} to unlock
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BadgeDetailDialog;
