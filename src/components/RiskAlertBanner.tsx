import { useState } from "react";
import { useRiskScores } from "@/hooks/useRiskScores";
import { RISK_CONFIG } from "./relapse-risk/types";
import type { RiskLevel } from "./relapse-risk/types";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function RiskAlertBanner() {
  const { data: scores, isLoading } = useRiskScores(1);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !scores || scores.length === 0 || dismissed) return null;

  const latest = scores[scores.length - 1];
  const level = latest.level as RiskLevel;

  if (level !== "elevated" && level !== "high") return null;

  const cfg = RISK_CONFIG[level];
  const Icon = cfg.icon;
  const isHigh = level === "high";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 ${cfg.border} ${cfg.bg}`}
        role="alert"
      >
        <Icon className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${cfg.color}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${cfg.color}`}>
            {isHigh ? "🔴 High relapse risk" : "🔶 Elevated relapse risk"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isHigh
              ? "Multiple symptoms are worsening — consider contacting your neurologist."
              : "Some symptoms are trending upward. Keep monitoring closely."}
          </p>
          <Link
            to="/risk-history"
            className={`mt-1.5 inline-block text-xs font-medium ${cfg.color} hover:underline`}
          >
            View risk history →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss risk alert"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
