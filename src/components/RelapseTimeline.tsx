import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { format, parseISO, subMonths, eachMonthOfInterval, startOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

const SEVERITY_COLOR: Record<string, string> = {
  mild:     "hsl(145 45% 45%)",
  moderate: "hsl(35 80% 50%)",
  severe:   "hsl(25 85% 50%)",
  critical: "hsl(0 72% 51%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        {d.count} relapse{d.count !== 1 ? "s" : ""}
      </p>
      {d.severities && Object.entries(d.severities).map(([sev, cnt]) => (
        <p key={sev} className="flex items-center gap-1.5 mt-0.5">
          <span
            className="h-2 w-2 rounded-full inline-block"
            style={{ backgroundColor: SEVERITY_COLOR[sev] ?? "hsl(var(--muted-foreground))" }}
          />
          <span className="capitalize">{sev}: {cnt as number}</span>
        </p>
      ))}
    </div>
  );
};

export default function RelapseTimeline() {
  const { data: relapses = [], isLoading } = useRelapses();
  const navigate = useNavigate();

  const chartData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 11));
    const months = eachMonthOfInterval({ start, end: now });

    return months.map((m) => {
      const key = format(m, "yyyy-MM");
      const matching = relapses.filter((r) => r.start_date.startsWith(key));
      const severities: Record<string, number> = {};
      let worst = "mild";
      const severityOrder = ["mild", "moderate", "severe", "critical"];
      matching.forEach((r) => {
        severities[r.severity] = (severities[r.severity] ?? 0) + 1;
        if (severityOrder.indexOf(r.severity) > severityOrder.indexOf(worst)) worst = r.severity;
      });
      return {
        month: format(m, "MMM ''yy"),
        count: matching.length,
        worst,
        severities,
      };
    });
  }, [relapses]);

  const totalRelapses = relapses.length;
  const ongoingCount = relapses.filter((r) => !r.is_recovered).length;

  if (isLoading) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Relapse Timeline</span>
        </div>
        <button
          onClick={() => navigate("/relapses")}
          className="text-[10px] text-primary font-medium hover:underline"
        >
          View all →
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Last 12 months · {totalRelapses} total{ongoingCount > 0 ? ` · ${ongoingCount} ongoing` : ""}
      </p>

      {totalRelapses === 0 ? (
        <div className="py-8 text-center">
          <span className="text-2xl">✨</span>
          <p className="mt-2 text-xs text-muted-foreground">No relapses recorded</p>
          <button
            onClick={() => navigate("/relapses")}
            className="mt-2 text-xs text-primary font-medium hover:underline"
          >
            Log a relapse
          </button>
        </div>
      ) : (
        <>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={16}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.count > 0
                        ? SEVERITY_COLOR[entry.worst] ?? "hsl(var(--primary))"
                        : "hsl(var(--muted))"}
                      opacity={entry.count > 0 ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
              <span key={sev} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                <span className="capitalize">{sev}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
