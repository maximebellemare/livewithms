import { Mail, FileText } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useEntriesInRange } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import { computeRisk } from "./relapse-risk/computeRisk";
import { RISK_CONFIG } from "./relapse-risk/types";

export default function ContactNeurologistCard() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const today = new Date();
  const start = format(subDays(today, 34), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [] } = useEntriesInRange(start, end);

  const risk = useMemo(() => {
    if (entries.length < 4) return null;
    const midpoint = format(subDays(today, 6), "yyyy-MM-dd");
    const recent = entries.filter((e) => e.date > midpoint);
    const older = entries.filter((e) => e.date <= midpoint && e.date > format(subDays(today, 13), "yyyy-MM-dd"));
    return (recent.length >= 2 && older.length >= 2) ? computeRisk(recent, older) : null;
  }, [entries]);

  const isElevated = risk && (risk.level === "elevated" || risk.level === "high");
  const cfg = isElevated ? RISK_CONFIG[risk.level] : null;
  const hasNeuro = !!profile?.neurologist_email;
  const neuroName = profile?.neurologist_name;

  const mailtoSubject = isElevated
    ? "Symptom update – elevated relapse risk"
    : "Symptom update from my MS tracker";

  const mailtoBody = isElevated
    ? `Hi${neuroName ? ` ${neuroName.match(/^dr\.?\s/i) ? neuroName : `Dr. ${neuroName}`}` : ""},\n\nMy symptom tracker is showing ${risk.level} relapse risk (score: ${risk.score}/100).\n\nKey factors:\n${risk.factors.map((f) => `• ${f}`).join("\n")}\n\nI'd like to discuss next steps.\n\nThank you`
    : `Hi${neuroName ? ` ${neuroName.match(/^dr\.?\s/i) ? neuroName : `Dr. ${neuroName}`}` : ""},\n\nI'd like to share an update from my MS symptom tracker.\n\nThank you`;

  const mailtoHref = hasNeuro
    ? `mailto:${profile.neurologist_email}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`
    : undefined;

  // Dynamic styling based on risk
  const borderClass = cfg ? cfg.border : "border-border";
  const bgClass = cfg ? cfg.bg : "bg-card";
  const subtitle = isElevated
    ? `Your risk level is ${risk.level} — consider reaching out`
    : "Stay connected with your care team";

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🩺</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Contact Your Neurologist</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {cfg && (
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
        )}
      </div>

      {hasNeuro && (
        <div className="mb-3 rounded-lg bg-card/60 border border-border px-3 py-2">
          <p className="text-xs text-muted-foreground">Neurologist on file</p>
          <p className="text-sm font-medium text-foreground">
            {neuroName ? (neuroName.match(/^dr\.?\s/i) ? neuroName : `Dr. ${neuroName}`) : profile.neurologist_email}
          </p>
          {neuroName && (
            <p className="text-[11px] text-muted-foreground">{profile.neurologist_email}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {hasNeuro ? (
          <a
            href={mailtoHref}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            Email Neurologist
          </a>
        ) : (
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Mail className="h-4 w-4" />
            Set Up Email
          </button>
        )}
        <button
          onClick={() => navigate("/reports")}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      <p className="mt-2.5 text-[9px] text-muted-foreground text-center">
        {isElevated ? "Quick actions based on your current risk assessment" : "Email your neurologist or generate a report anytime"}
      </p>
    </div>
  );
}
