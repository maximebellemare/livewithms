import { useMemo, useState } from "react";
import { format, subDays, parseISO, startOfDay, eachDayOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";

interface Props {
  logs: ExerciseLog[];
}

const INTENSITY_COLORS = {
  light: "hsl(var(--primary) / 0.4)",
  moderate: "hsl(var(--primary) / 0.7)",
  vigorous: "hsl(var(--primary))",
};

export default function ExerciseHistoryChart({ logs }: Props) {
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const chartData = useMemo(() => {
    const now = new Date();
    const start = subDays(now, range - 1);
    const days = eachDayOfInterval({ start, end: now });

    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = logs.filter(l => l.date === dateStr);
      const totalMin = dayLogs.reduce((s, l) => s + l.duration_minutes, 0);
      const topIntensity = dayLogs.length > 0
        ? dayLogs.reduce((best, l) => {
            const order = { light: 0, moderate: 1, vigorous: 2 };
            return (order[l.intensity as keyof typeof order] ?? 0) > (order[best.intensity as keyof typeof order] ?? 0) ? l : best;
          }, dayLogs[0]).intensity
        : "moderate";

      return {
        date: format(day, range <= 7 ? "EEE" : "MMM d"),
        minutes: totalMin,
        intensity: topIntensity,
      };
    });
  }, [logs, range]);

  if (logs.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Exercise History</h3>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-2 py-0.5 text-[10px] transition-all ${
                range === r ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} width={30} />
          <Tooltip
            formatter={(value: number) => [`${value} min`, "Exercise"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={INTENSITY_COLORS[entry.intensity as keyof typeof INTENSITY_COLORS] || INTENSITY_COLORS.moderate}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4">
        {Object.entries(INTENSITY_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-muted-foreground capitalize">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
