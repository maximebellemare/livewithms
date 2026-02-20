import { useMemo, useEffect, useRef } from "react";
import { useEntriesInRange } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { RISK_CONFIG } from "./relapse-risk/types";
import { computeRisk, computeWeeklyScores } from "./relapse-risk/computeRisk";
import RiskBar from "./relapse-risk/RiskBar";
import RiskSparkline from "./relapse-risk/RiskSparkline";
import WeekOverWeekChange from "./relapse-risk/WeekOverWeekChange";
import RiskFactors from "./relapse-risk/RiskFactors";

export default function RelapseRiskIndicator() {
  const today = new Date();
  const start = format(subDays(today, 34), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [], isLoading } = useEntriesInRange(start, end);
  const { data: profile } = useProfile();

  const { risk, prevRisk, weeklyScores } = useMemo(() => {
    if (entries.length < 4) return { risk: null, prevRisk: null, weeklyScores: [] };

    const midpoint = format(subDays(today, 6), "yyyy-MM-dd");
    const recent = entries.filter((e) => e.date > midpoint);
    const older = entries.filter((e) => e.date <= midpoint && e.date > format(subDays(today, 13), "yyyy-MM-dd"));

    const currentRisk = (recent.length >= 2 && older.length >= 2) ? computeRisk(recent, older) : null;

    const prevRecent = older;
    const prevOlder = entries.filter((e) => e.date <= format(subDays(today, 13), "yyyy-MM-dd") && e.date > format(subDays(today, 20), "yyyy-MM-dd"));
    const previousRisk = (prevRecent.length >= 2 && prevOlder.length >= 2) ? computeRisk(prevRecent, prevOlder) : null;

    const scores = computeWeeklyScores(entries, today);

    return { risk: currentRisk, prevRisk: previousRisk, weeklyScores: scores };
  }, [entries]);

  // Alert once per day when risk is high or elevated
  const alertedRef = useRef(false);
  useEffect(() => {
    if (!risk || alertedRef.current) return;
    if (risk.level === "high" || risk.level === "elevated") {
      const key = `relapse_risk_alert_${format(new Date(), "yyyy-MM-dd")}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        alertedRef.current = true;
        const isHigh = risk.level === "high";
        toast.warning(
          isHigh ? "🔴 High relapse risk detected" : "🔶 Elevated relapse risk",
          {
            description: isHigh
              ? "Multiple symptoms are worsening. Consider contacting your neurologist."
              : "Some symptoms are trending upward. Keep monitoring closely.",
            duration: 8000,
          }
        );
      }
    }
  }, [risk]);

  if (isLoading || !risk) return null;

  const cfg = RISK_CONFIG[risk.level];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${cfg.color}`} />
        <span className="text-sm font-semibold text-foreground">Relapse Risk</span>
        <span className={`ml-auto text-xs font-bold ${cfg.color}`}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>

      <RiskBar level={risk.level} score={risk.score} />
      <RiskSparkline weeklyScores={weeklyScores} />
      {prevRisk && <WeekOverWeekChange risk={risk} prevRisk={prevRisk} />}
      <RiskFactors factors={risk.factors} isLow={risk.level === "low"} />

      {(risk.level === "high" || risk.level === "elevated") && (
        <a
          href={
            profile?.neurologist_email
              ? `mailto:${profile.neurologist_email}?subject=${encodeURIComponent("Symptom update – elevated relapse risk")}&body=${encodeURIComponent(`Hi${profile.neurologist_name ? ` Dr. ${profile.neurologist_name}` : ""},\n\nMy symptom tracker is showing ${risk.level} relapse risk (score: ${risk.score}/100).\n\nKey factors:\n${risk.factors.map((f) => `• ${f}`).join("\n")}\n\nI'd like to discuss next steps.\n\nThank you`)}`
              : "/profile"
          }
          className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            risk.level === "high"
              ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              : "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          {profile?.neurologist_email ? "Contact neurologist" : "Set up neurologist email"}
        </a>
      )}

      <p className="mt-2 text-[9px] text-muted-foreground">
        Based on 14-day trends · not medical advice
      </p>
    </div>
  );
}
