import { AlertTriangle } from "lucide-react";

interface Props {
  plannedSpoons: number;
  totalSpoons: number;
  history: { used: number; total_spoons: number }[];
}

export default function OverexertionAlert({ plannedSpoons, totalSpoons, history }: Props) {
  // Check if user consistently overexerts
  const recentOverDays = history.filter((d) => d.used > d.total_spoons).length;
  const overBudgetNow = plannedSpoons > totalSpoons;

  if (!overBudgetNow && recentOverDays < 2) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-foreground">Overexertion Warning</h4>
          {overBudgetNow && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              You've planned <span className="font-semibold text-destructive">{plannedSpoons} spoons</span> against a budget of {totalSpoons}. 
              Consider removing or postponing low-priority activities to avoid a crash.
            </p>
          )}
          {recentOverDays >= 2 && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              You've exceeded your budget {recentOverDays} of the last {history.length} days. 
              Consistent overexertion can lead to flare-ups — consider increasing your budget or scaling back activities.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
