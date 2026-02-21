import { useCognitiveSessions } from "@/hooks/useCognitiveSessions";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

const GAME_COLORS: Record<string, string> = {
  memory_match: "hsl(var(--primary))",
  reaction_time: "#22c55e",
  sequence_recall: "#a855f7",
};

const GAME_LABELS: Record<string, string> = {
  memory_match: "Memory",
  reaction_time: "Reaction",
  sequence_recall: "Sequence",
};

const CognitiveTrends = ({ days = 30 }: { days?: number }) => {
  const { data: sessions = [], isLoading } = useCognitiveSessions(days);

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 shadow-soft text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Play some games to see your trends!</p>
      </div>
    );
  }

  // Group by date, average score per game type per day
  const byDate: Record<string, Record<string, { total: number; count: number }>> = {};
  for (const s of sessions) {
    const day = format(parseISO(s.played_at), "MM/dd");
    if (!byDate[day]) byDate[day] = {};
    if (!byDate[day][s.game_type]) byDate[day][s.game_type] = { total: 0, count: 0 };
    byDate[day][s.game_type].total += s.score;
    byDate[day][s.game_type].count += 1;
  }

  const chartData = Object.entries(byDate)
    .map(([day, games]) => {
      const row: Record<string, any> = { day };
      for (const [type, { total, count }] of Object.entries(games)) {
        row[type] = Math.round(total / count);
      }
      return row;
    })
    .reverse();

  const gameTypes = [...new Set(sessions.map((s) => s.game_type))];

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Score Trends</h3>
      </div>

      <div className="flex gap-3 mb-3">
        {gameTypes.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: GAME_COLORS[type] }} />
            <span className="text-[10px] text-muted-foreground">{GAME_LABELS[type] ?? type}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {gameTypes.map((type) => (
            <Line
              key={type}
              type="monotone"
              dataKey={type}
              name={GAME_LABELS[type] ?? type}
              stroke={GAME_COLORS[type]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CognitiveTrends;
