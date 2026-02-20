import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { CalendarDays } from "lucide-react";
import { parseISO, getMonth, getYear } from "date-fns";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RelapseYearComparison() {
  const { data: relapses = [], isLoading } = useRelapses();

  const { years, grid, maxCount } = useMemo(() => {
    const yearSet = new Set<number>();
    const counts: Record<string, number> = {};

    relapses.forEach((r) => {
      const d = parseISO(r.start_date);
      const y = getYear(d);
      const m = getMonth(d);
      yearSet.add(y);
      const key = `${y}-${m}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });

    const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
    let max = 0;
    const g = sortedYears.map((y) =>
      MONTH_LABELS.map((_, m) => {
        const c = counts[`${y}-${m}`] ?? 0;
        if (c > max) max = c;
        return c;
      })
    );

    return { years: sortedYears, grid: g, maxCount: max };
  }, [relapses]);

  if (isLoading || relapses.length === 0 || years.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Year-over-Year</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {relapses.length} total
        </span>
      </div>

      {/* Month header */}
      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-x-1 gap-y-2 text-center">
        <div />
        {MONTH_LABELS.map((m) => (
          <span key={m} className="text-[9px] text-muted-foreground">{m}</span>
        ))}

        {years.map((year, yi) => (
          <div key={year} className="contents">
            <span className="text-[10px] text-muted-foreground font-medium pr-1 text-right self-center">
              {year}
            </span>
            {grid[yi].map((count, mi) => (
              <div
                key={mi}
                className="flex items-center justify-center"
                title={`${MONTH_LABELS[mi]} ${year}: ${count}`}
              >
                <div
                  className="w-full aspect-square max-w-[24px] rounded-sm flex items-center justify-center text-[9px] font-medium transition-colors"
                  style={{
                    backgroundColor:
                      count === 0
                        ? "hsl(var(--muted))"
                        : `hsl(var(--primary) / ${0.25 + (count / maxCount) * 0.75})`,
                    color: count > 0 ? "hsl(var(--primary-foreground))" : "transparent",
                  }}
                >
                  {count > 0 ? count : ""}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
