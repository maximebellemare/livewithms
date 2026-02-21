import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Pill } from "lucide-react";

export default function RelapseTreatmentSummary() {
  const { data: relapses = [], isLoading } = useRelapses();

  const treatmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relapses.forEach((r) => {
      const t = (r.treatment ?? "").trim();
      if (!t) return;
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [relapses]);

  if (isLoading || treatmentCounts.length === 0) return null;

  const total = treatmentCounts.reduce((sum, [, c]) => sum + c, 0);
  const maxCount = treatmentCounts[0][1];

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Treatment History</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {total} treated relapse{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {treatmentCounts.slice(0, 8).map(([treatment, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={treatment}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-foreground">{treatment}</span>
                <span className="text-[10px] text-muted-foreground">
                  {count}× ({pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {treatmentCounts.length > 8 && (
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          +{treatmentCounts.length - 8} more treatment{treatmentCounts.length - 8 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
