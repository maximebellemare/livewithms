import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Timer } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export default function ActiveRelapseDuration() {
  const { data: relapses = [], isLoading } = useRelapses();

  const activeRelapses = useMemo(() => {
    const today = new Date();
    return relapses
      .filter((r) => !r.is_recovered)
      .map((r) => ({
        id: r.id,
        severity: (r.severity ?? "moderate").toLowerCase(),
        days: differenceInDays(today, parseISO(r.start_date)),
        startDate: r.start_date,
        symptoms: r.symptoms.slice(0, 3),
      }))
      .sort((a, b) => b.days - a.days);
  }, [relapses]);

  if (isLoading || activeRelapses.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4 text-destructive" />
        <span className="text-sm font-semibold text-foreground">Active Relapses</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {activeRelapses.length} ongoing
        </span>
      </div>

      <div className="space-y-3">
        {activeRelapses.map((r) => (
          <div key={r.id} className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground capitalize">
                {r.severity} severity
              </span>
              <span className="text-sm font-bold text-primary">
                {r.days} day{r.days !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Started {r.startDate}
            </p>
            {r.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {r.symptoms.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
