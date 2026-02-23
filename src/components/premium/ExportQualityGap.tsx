import { Crown, FileText, Sparkles, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";

const freeFeatures = [
  { label: "Symptom charts & averages", included: true },
  { label: "Medication adherence", included: true },
  { label: "Basic date range", included: true },
  { label: "AI-powered insights", included: false },
  { label: "Period-over-period comparison", included: false },
  { label: "Relapse trigger analysis", included: false },
  { label: "Doctor-formatted layout", included: false },
];

/** Shows the difference between basic and premium (Doctor Mode) reports */
const ExportQualityGap = () => {
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  if (isPremium) return null;

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-accent/40 to-card p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Upgrade your reports</p>
          <p className="text-xs text-muted-foreground">Doctor Mode unlocks clinical-grade exports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Basic column */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Basic</span>
          </div>
          {freeFeatures.map((f) => (
            <div key={f.label} className="flex items-start gap-1.5 text-[11px]">
              {f.included ? (
                <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/30 mt-0.5 shrink-0" />
              )}
              <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* Premium column */}
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Doctor Mode</span>
          </div>
          {freeFeatures.map((f) => (
            <div key={f.label} className="flex items-start gap-1.5 text-[11px]">
              <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate("/premium")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <Crown className="h-4 w-4" />
        Unlock Doctor Mode
      </button>
    </div>
  );
};

export default ExportQualityGap;
