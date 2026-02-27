import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { BrainCircuit } from "lucide-react";

interface HistoryDay {
  date: string;
  used: number;
  total_spoons: number;
}

export default function FatigueCorrelation({ history }: { history: HistoryDay[] }) {
  const { user } = useAuth();

  const { data: entries } = useQuery({
    queryKey: ["energy-fatigue-corr", user?.id],
    queryFn: async () => {
      const start = format(subDays(new Date(), 8), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_entries")
        .select("date, fatigue, mood")
        .eq("user_id", user!.id)
        .gte("date", start)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && history.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (!entries || entries.length < 2 || history.length < 2) return null;

  // Find correlation: high spoon usage yesterday → high fatigue today
  const insights: string[] = [];

  for (let i = 1; i < entries.length; i++) {
    const yesterdayEntry = entries[i - 1];
    const todayEntry = entries[i];
    const yesterdayHistory = history.find((h) => h.date === yesterdayEntry.date);

    if (yesterdayHistory && todayEntry.fatigue !== null) {
      const overuse = yesterdayHistory.used > yesterdayHistory.total_spoons;
      if (overuse && todayEntry.fatigue >= 7) {
        insights.push(
          `On ${format(new Date(todayEntry.date + "T12:00:00"), "EEE d MMM")}, your fatigue was ${todayEntry.fatigue}/10 after exceeding your spoon budget the day before.`
        );
      }
    }
  }

  // General avg comparison
  const highUseDays = history.filter((h) => h.used >= h.total_spoons);
  const normalDays = history.filter((h) => h.used < h.total_spoons * 0.8);

  const avgFatigueAfterHigh = getAvgNextDayFatigue(highUseDays, entries);
  const avgFatigueAfterNormal = getAvgNextDayFatigue(normalDays, entries);

  if (avgFatigueAfterHigh !== null && avgFatigueAfterNormal !== null && avgFatigueAfterHigh - avgFatigueAfterNormal >= 1.5) {
    insights.push(
      `When you use most/all your spoons, your next-day fatigue averages ${avgFatigueAfterHigh.toFixed(1)} vs ${avgFatigueAfterNormal.toFixed(1)} on lighter days.`
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
        <BrainCircuit className="h-4 w-4 text-primary" />
        Energy → Fatigue Link
      </h3>
      {insights.map((insight, i) => (
        <p key={i} className="text-xs text-muted-foreground leading-relaxed">
          💡 {insight}
        </p>
      ))}
    </div>
  );
}

function getAvgNextDayFatigue(
  days: { date: string }[],
  entries: { date: string; fatigue: number | null }[]
): number | null {
  const fatigues: number[] = [];
  for (const d of days) {
    const nextDate = format(new Date(new Date(d.date + "T12:00:00").getTime() + 86400000), "yyyy-MM-dd");
    const entry = entries.find((e) => e.date === nextDate);
    if (entry?.fatigue !== null && entry?.fatigue !== undefined) {
      fatigues.push(entry.fatigue);
    }
  }
  if (fatigues.length === 0) return null;
  return fatigues.reduce((s, v) => s + v, 0) / fatigues.length;
}
