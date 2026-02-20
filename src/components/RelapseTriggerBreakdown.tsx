import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Zap } from "lucide-react";

export default function RelapseTriggerBreakdown() {
  const { data: relapses = [], isLoading } = useRelapses();

  const triggerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relapses.forEach((r) => {
      (r.triggers ?? []).forEach((t) => {
        counts[t] = (counts[t] ?? 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [relapses]);

  if (isLoading || relapses.length === 0 || triggerCounts.length === 0) return null;

  const maxCount = triggerCounts[0][1];
  const total = relapses.length;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Trigger Frequency</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          across {total} relapse{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {triggerCounts.slice(0, 8).map(([trigger, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={trigger}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-foreground">{trigger}</span>
                <span className="text-[10px] text-muted-foreground">
                  {count}/{total} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent-foreground/60 transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {triggerCounts.length > 8 && (
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          +{triggerCounts.length - 8} more trigger{triggerCounts.length - 8 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
