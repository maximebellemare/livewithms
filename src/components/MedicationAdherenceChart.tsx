import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";

interface Props {
  range: 7 | 30;
}

export default function MedicationAdherenceChart({ range }: Props) {
  const today = new Date();
  const startDate = format(subDays(today, range - 1), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  const { data: medications } = useDbMedications();
  const { data: logs } = useDbMedicationLogs(startDate, endDate);

  // Only count active daily medications
  const activeMeds = useMemo(
    () => (medications ?? []).filter((m) => m.active && m.schedule_type === "daily"),
    [medications],
  );

  const chartData = useMemo(() => {
    if (activeMeds.length === 0) return [];

    const days = eachDayOfInterval({ start: subDays(today, range - 1), end: today });
    const logsByDate = new Map<string, Set<string>>();

    for (const log of logs ?? []) {
      if (log.status === "taken") {
        const key = log.date;
        if (!logsByDate.has(key)) logsByDate.set(key, new Set());
        logsByDate.get(key)!.add(log.medication_id);
      }
    }

    return days.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const takenSet = logsByDate.get(dateStr);
      const taken = takenSet ? takenSet.size : 0;
      const total = activeMeds.length;
      const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
      return {
        date: dateStr,
        label: format(d, range <= 7 ? "EEE" : "MMM d"),
        pct,
        taken,
        total,
      };
    });
  }, [activeMeds, logs, range]);

  const overallPct = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((s, d) => s + d.pct, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // Show nothing if no active daily meds
  if (activeMeds.length === 0) return null;

  const barColor = (pct: number) => {
    if (pct >= 80) return "hsl(145 45% 45%)";
    if (pct >= 50) return "hsl(35 90% 55%)";
    return "hsl(0 70% 55%)";
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💊</span>
          <div>
            <span className="text-sm font-semibold text-foreground">Medication Adherence</span>
            <p className="text-[10px] text-muted-foreground">
              {activeMeds.length} active daily med{activeMeds.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-xl font-bold"
            style={{ color: barColor(overallPct) }}
          >
            {overallPct}%
          </span>
          <p className="text-[10px] text-muted-foreground">{range}-day avg</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval={range <= 7 ? 0 : "preserveStartEnd"}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine y={80} strokeDasharray="4 4" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value: number, _: string, props: { payload: { taken: number; total: number } }) => [
                `${props.payload.taken}/${props.payload.total} taken (${value}%)`,
                "Adherence",
              ]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={range <= 7 ? 32 : 14}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.pct)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(145 45% 45%)" }} />
          ≥80%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(35 90% 55%)" }} />
          50–79%
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(0 70% 55%)" }} />
          &lt;50%
        </span>
        <span className="border-l border-border pl-3 ml-1">— 80% goal</span>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Tracks daily medications only · {chartData.filter((d) => d.pct === 100).length} perfect day{chartData.filter((d) => d.pct === 100).length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
