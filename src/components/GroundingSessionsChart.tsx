import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays, eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGroundingStreak } from "@/hooks/useGroundingStreak";

const GroundingSessionsChart = () => {
  const { user } = useAuth();
  const { streak, totalSessions } = useGroundingStreak();

  const { data: sessions = [] } = useQuery({
    queryKey: ["grounding-chart-sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = format(subDays(new Date(), 56), "yyyy-MM-dd");
      const { data } = await supabase
        .from("grounding_sessions")
        .select("completed_at, created_at")
        .eq("user_id", user!.id)
        .gte("completed_at", since)
        .order("completed_at", { ascending: true });
      return data ?? [];
    },
  });

  const chartData = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 55);
    const weeks = eachWeekOfInterval({ start, end: today }, { weekStartsOn: 1 });

    return weeks.map((weekStart) => {
      const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekSessions = sessions.filter((s) =>
        isWithinInterval(new Date(s.completed_at), { start: weekStart, end: wEnd })
      );
      const count = weekSessions.length;

      const avgMin = count > 0
        ? Math.round(
            weekSessions.reduce((sum, s) => {
              const dur = (new Date(s.completed_at).getTime() - new Date(s.created_at).getTime()) / 60000;
              return sum + Math.max(dur, 0);
            }, 0) / count
          )
        : 0;

      return {
        week: format(weekStart, "MMM d"),
        sessions: count,
        avgMin,
      };
    });
  }, [sessions]);

  if (totalSessions === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="text-sm font-semibold text-foreground">Grounding Sessions</span>
        </div>
        <span className="text-xs text-muted-foreground">8-week view</span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={20}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={28}
              unit="m"
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const sessions = payload.find((p) => p.dataKey === "sessions");
                const avgMin = payload.find((p) => p.dataKey === "avgMin");
                return (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
                    <p className="font-semibold text-foreground">Week of {label}</p>
                    <p className="text-foreground">🌿 {sessions?.value} session{sessions?.value !== 1 ? "s" : ""}</p>
                    {Number(avgMin?.value) > 0 && (
                      <p className="text-foreground">⏱ ~{avgMin?.value} min avg</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="sessions"
              fill="hsl(145 45% 45%)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgMin"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
              name="Avg Duration"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalSessions} total session{totalSessions !== 1 ? "s" : ""}</span>
        {streak > 0 && (
          <span className="font-medium text-primary">🔥 {streak} day streak</span>
        )}
      </div>
    </div>
  );
};

export default GroundingSessionsChart;
