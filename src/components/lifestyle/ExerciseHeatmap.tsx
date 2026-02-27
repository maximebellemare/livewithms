import { useMemo } from "react";
import { format, subDays, startOfWeek, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";

interface Props {
  logs: ExerciseLog[];
}

export default function ExerciseHeatmap({ logs }: Props) {
  const weeks = 5;

  const heatmapData = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(subDays(now, weeks * 7 - 1), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: now });

    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = logs.filter(l => l.date === dateStr);
      const totalMin = dayLogs.reduce((s, l) => s + l.duration_minutes, 0);
      return {
        date: day,
        dateStr,
        minutes: totalMin,
        dayLabel: format(day, "EEEEE"),
        isToday: isSameDay(day, now),
      };
    });
  }, [logs]);

  // Group into weeks
  const weekGroups = useMemo(() => {
    const groups: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      groups.push(heatmapData.slice(i, i + 7));
    }
    return groups;
  }, [heatmapData]);

  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return "bg-secondary";
    if (minutes < 15) return "bg-primary/20";
    if (minutes < 30) return "bg-primary/40";
    if (minutes < 60) return "bg-primary/65";
    return "bg-primary";
  };

  const activeDays = heatmapData.filter(d => d.minutes > 0).length;
  const totalDays = heatmapData.length;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Activity Calendar</h3>
        <span className="text-[11px] text-muted-foreground">{activeDays}/{totalDays} active days</span>
      </div>

      <div className="space-y-1">
        {/* Day labels */}
        <div className="flex gap-1 mb-0.5">
          <div className="w-4" />
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{d}</div>
          ))}
        </div>

        {weekGroups.map((week, wi) => (
          <div key={wi} className="flex gap-1 items-center">
            <span className="text-[9px] text-muted-foreground w-4 text-right shrink-0">
              {format(week[0].date, "d")}
            </span>
            {week.map((day, di) => (
              <div
                key={di}
                className={`flex-1 aspect-square rounded-sm ${getIntensityClass(day.minutes)} ${day.isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-card" : ""} transition-colors`}
                title={`${format(day.date, "MMM d")}: ${day.minutes} min`}
              />
            ))}
            {/* Pad incomplete weeks */}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`pad-${i}`} className="flex-1 aspect-square" />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {["bg-secondary", "bg-primary/20", "bg-primary/40", "bg-primary/65", "bg-primary"].map((cls, i) => (
          <div key={i} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
