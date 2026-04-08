import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Check } from "lucide-react";
import { toast } from "sonner";
import type { PatternInsight, ActionKind } from "@/hooks/useDailyCheckIn";

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

// ── Micro-action inline UIs ──────────────────────────────────

function BreatheMicro({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const cycle = () => {
      setPhase("in");
      timerRef.current = setTimeout(() => {
        setPhase("hold");
        timerRef.current = setTimeout(() => {
          setPhase("out");
          timerRef.current = setTimeout(() => {
            setCount((c) => {
              if (c + 1 >= 3) {
                onDone();
                return c + 1;
              }
              cycle();
              return c + 1;
            });
          }, 4000);
        }, 3000);
      }, 4000);
    };
    cycle();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = phase === "in" ? "Breathe in…" : phase === "hold" ? "Hold…" : "Breathe out…";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="pt-2 space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground/80">{label}</p>
        <p className="text-[10px] text-muted-foreground">{count + 1} of 3</p>
      </div>
      <div className="h-1 rounded-full bg-border/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary/50"
          animate={{ width: phase === "in" ? "100%" : phase === "hold" ? "100%" : "0%" }}
          transition={{ duration: phase === "in" ? 4 : phase === "hold" ? 3 : 4, ease: "easeInOut" }}
          initial={{ width: "0%" }}
          key={`${count}-${phase}`}
        />
      </div>
    </motion.div>
  );
}

function JournalMicro({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="pt-2 space-y-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Just one sentence…"
        rows={2}
        autoFocus
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={onDone}
        disabled={!text.trim()}
        className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
      >
        Done ✓
      </button>
    </motion.div>
  );
}

// ── Main card ─────────────────────────────────────────────────

interface PatternInsightCardProps {
  insight: PatternInsight;
}

const PatternInsightCard = ({ insight }: PatternInsightCardProps) => {
  const Icon = ICON_MAP[insight.type] || Sparkles;
  const iconColor = COLOR_MAP[insight.type] || "text-muted-foreground";
  const [actionState, setActionState] = useState<"idle" | "active" | "done">("idle");
  const action = insight.action;

  const handleDone = () => {
    setActionState("done");
    if (action) {
      toast(action.completionMessage, { duration: 3500 });
    }
  };

  // Some actions resolve instantly (notice, simplify, rest, checkin)
  const handleStart = () => {
    if (!action) return;
    const instant: ActionKind[] = ["notice", "simplify", "rest", "checkin"];
    if (instant.includes(action.kind)) {
      handleDone();
    } else {
      setActionState("active");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
      className="rounded-xl border border-border/50 bg-secondary/30 px-4 py-3.5 space-y-2"
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[13px] text-foreground/85 leading-relaxed">
            {insight.message}
          </p>
          {insight.suggestion && actionState === "idle" && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-[10px]">💡</span>
              {insight.suggestion}
            </p>
          )}
        </div>
      </div>

      {/* Action area */}
      <AnimatePresence mode="wait">
        {action && actionState === "idle" && (
          <motion.div
            key="action-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pl-[1.625rem]"
          >
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all"
            >
              {action.label}
            </button>
          </motion.div>
        )}

        {action && actionState === "active" && action.kind === "breathe" && (
          <motion.div key="breathe" className="pl-[1.625rem]">
            <BreatheMicro onDone={handleDone} />
          </motion.div>
        )}

        {action && actionState === "active" && action.kind === "journal" && (
          <motion.div key="journal" className="pl-[1.625rem]">
            <JournalMicro onDone={handleDone} />
          </motion.div>
        )}

        {actionState === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pl-[1.625rem] flex items-center gap-1.5"
          >
            <div className="flex items-center justify-center h-4 w-4 rounded-full bg-primary/15">
              <Check className="h-2.5 w-2.5 text-primary" />
            </div>
            <p className="text-[11px] font-medium text-primary/80">Done — small steps count</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PatternInsightCard;
