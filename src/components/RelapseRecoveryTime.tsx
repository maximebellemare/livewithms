import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Clock } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const SEVERITY_ORDER = ["mild", "moderate", "severe", "critical"];

export default function RelapseRecoveryTime() {
  const { data: relapses = [], isLoading } = useRelapses();

  const recoveryData = useMemo(() => {
    const groups: Record<string, number[]> = {};
    relapses.forEach((r) => {
      if (!r.is_recovered || !r.end_date) return;
      const days = differenceInDays(parseISO(r.end_date), parseISO(r.start_date));
      if (days < 0) return;
      const sev = (r.severity ?? "moderate").toLowerCase();
      if (!groups[sev]) groups[sev] = [];
      groups[sev].push(days);
    });
    return SEVERITY_ORDER
      .filter((s) => groups[s]?.length)
      .map((s) => ({
        label: s,
        avg: Math.round(groups[s].reduce((a, b) => a + b, 0) / groups[s].length),
        count: groups[s].length,
      }));
  }, [relapses]);

  if (isLoading || recoveryData.length === 0) return null;

  const maxAvg = Math.max(...recoveryData.map((d) => d.avg));

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Avg. Recovery Time</span>
        <span className="ml-auto text-[10px] text-muted-foreground">recovered only</span>
      </div>

      <div className="space-y-2">
        {recoveryData.map(({ label, avg, count }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-foreground capitalize">{label}</span>
              <span className="text-[10px] text-muted-foreground">
                {avg} day{avg !== 1 ? "s" : ""} · {count} relapse{count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${maxAvg > 0 ? (avg / maxAvg) * 100 : 0}%`, minWidth: "8px" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
