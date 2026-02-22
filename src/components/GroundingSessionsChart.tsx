import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ComposedChart, Bar, Cell, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { format, subDays, eachWeekOfInterval, endOfWeek, isWithinInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGroundingStreak } from "@/hooks/useGroundingStreak";
import { useProfile } from "@/hooks/useProfile";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import confetti from "canvas-confetti";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 7, 10];

const GroundingSessionsChart = () => {
  const { user } = useAuth();
  const { streak, totalSessions } = useGroundingStreak();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const weeklyGoal = (profile as any)?.grounding_weekly_goal ?? 3;

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

      return { week: format(weekStart, "MMM d"), sessions: count, avgMin, fill: count >= weeklyGoal ? "hsl(145 45% 45%)" : "hsl(var(--muted-foreground) / 0.3)" };
    });
  }, [sessions, weeklyGoal]);

  const updateGoal = async (goal: number) => {
    if (!user) return;
    await supabase.from("profiles").update({ grounding_weekly_goal: goal } as any).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setShowGoalPicker(false);
  };

  const currentWeek = chartData[chartData.length - 1];
  const currentWeekMet = currentWeek && currentWeek.sessions >= weeklyGoal;

  useEffect(() => {
    const key = "grounding_confetti_week";
    const currentWeekLabel = currentWeek?.week;
    if (currentWeekMet && currentWeekLabel && sessionStorage.getItem(key) !== currentWeekLabel) {
      sessionStorage.setItem(key, currentWeekLabel);
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.7 },
        colors: ["#4CAF50", "#81C784", "#A5D6A7"],
      });
    }
  }, [currentWeekMet, currentWeek?.week]);

  if (totalSessions === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="text-sm font-semibold text-foreground">Grounding Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={200}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowGoalPicker((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-help"
                >
                  <Target className="h-3 w-3" />
                  Goal: {weeklyGoal}/wk
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                Complete {weeklyGoal} grounding session{weeklyGoal !== 1 ? "s" : ""} per week to meet your goal. Tap to change.
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          <span className="text-xs text-muted-foreground">8-week view</span>
        </div>
      </div>

      {showGoalPicker && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => updateGoal(g)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                g === weeklyGoal
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

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
                const sess = payload.find((p) => p.dataKey === "sessions");
                const avgM = payload.find((p) => p.dataKey === "avgMin");
                const met = Number(sess?.value) >= weeklyGoal;
                return (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
                    <p className="font-semibold text-foreground">Week of {label}</p>
                    <p className="text-foreground">
                      🌿 {sess?.value} session{sess?.value !== 1 ? "s" : ""}
                      {met ? " ✓" : ""}
                    </p>
                    {Number(avgM?.value) > 0 && (
                      <p className="text-foreground">⏱ ~{avgM?.value} min avg</p>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              yAxisId="left"
              y={weeklyGoal}
              stroke="hsl(var(--primary))"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Goal: ${weeklyGoal}`,
                position: "insideTopLeft",
                fill: "hsl(var(--primary))",
                fontSize: 9,
                fontWeight: 600,
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="sessions"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
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

      {(() => {
        const activeWeeks = chartData.filter((w) => w.sessions > 0);
        const metWeeks = activeWeeks.filter((w) => w.sessions >= weeklyGoal);
        const pct = activeWeeks.length > 0 ? Math.round((metWeeks.length / activeWeeks.length) * 100) : 0;

        // Trend: compare recent 4 weeks avg sessions vs prior 4 weeks
        const half = Math.floor(chartData.length / 2);
        const recentHalf = chartData.slice(half);
        const priorHalf = chartData.slice(0, half);
        const avg = (arr: typeof chartData) => arr.length > 0 ? arr.reduce((s, w) => s + w.sessions, 0) / arr.length : 0;
        const recentAvg = avg(recentHalf);
        const priorAvg = avg(priorHalf);
        const diff = recentAvg - priorAvg;
        const trendUp = diff > 0.25;
        const trendDown = diff < -0.25;

        return activeWeeks.length > 0 ? (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "hsl(145 45% 45%)" }} />
                      Goal met
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    Weeks where you completed {weeklyGoal}+ grounding sessions.
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/30" />
                      Below goal
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    Weeks with fewer than {weeklyGoal} grounding sessions.
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              {metWeeks.length}/{activeWeeks.length} weeks ({pct}%)
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {trendUp && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {trendDown && <TrendingDown className="h-3 w-3 text-red-400" />}
                      {!trendUp && !trendDown && <Minus className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px]">
                    {trendUp && "Sessions trending up — recent weeks have more sessions than earlier weeks."}
                    {trendDown && "Sessions trending down — recent weeks have fewer sessions than earlier weeks."}
                    {!trendUp && !trendDown && "Sessions are stable — recent and earlier weeks are similar."}
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "hsl(145 45% 45%)" }} />
                      Goal met
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    Weeks where you completed {weeklyGoal}+ grounding sessions.
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      <span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/30" />
                      Below goal
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    Weeks with fewer than {weeklyGoal} grounding sessions.
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
        );
      })()}

      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalSessions} total session{totalSessions !== 1 ? "s" : ""}</span>
        {streak > 0 && (
          <span className="font-medium text-primary">🔥 {streak} day streak</span>
        )}
      </div>
    </div>
  );
};

export default GroundingSessionsChart;
