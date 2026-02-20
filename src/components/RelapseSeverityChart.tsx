import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { ShieldAlert } from "lucide-react";

const SEVERITY_ORDER = ["mild", "moderate", "severe", "critical"];
const SEVERITY_COLORS: Record<string, string> = {
  mild: "hsl(var(--primary) / 0.4)",
  moderate: "hsl(var(--primary) / 0.65)",
  severe: "hsl(var(--primary))",
  critical: "hsl(var(--destructive))",
};

export default function RelapseSeverityChart() {
  const { data: relapses = [], isLoading } = useRelapses();

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relapses.forEach((r) => {
      const s = (r.severity ?? "moderate").toLowerCase();
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return SEVERITY_ORDER
      .filter((s) => counts[s])
      .map((s) => ({ label: s, count: counts[s] }));
  }, [relapses]);

  if (isLoading || relapses.length === 0 || severityCounts.length === 0) return null;

  const total = relapses.length;
  const maxCount = Math.max(...severityCounts.map((s) => s.count));

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Severity Distribution</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {total} relapse{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-end gap-2 h-28">
        {severityCounts.map(({ label, count }) => {
          const pct = Math.round((count / total) * 100);
          const heightPct = (count / maxCount) * 100;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{pct}%</span>
              <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                <div
                  className="w-full max-w-[40px] rounded-t-md transition-all"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: "8px",
                    backgroundColor: SEVERITY_COLORS[label] ?? "hsl(var(--primary))",
                  }}
                />
              </div>
              <span className="text-[10px] text-foreground capitalize">{label}</span>
              <span className="text-[10px] text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
