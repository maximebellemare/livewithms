import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface FeedbackStat {
  session_id: string;
  session_created_at: string;
  thumbs_up: number;
  thumbs_down: number;
}

export const FeedbackTrendsChart = ({ data }: { data: FeedbackStat[] }) => {
  const chartData = useMemo(() => {
    const byDate = new Map<string, { up: number; down: number }>();
    for (const s of data) {
      const key = format(parseISO(s.session_created_at), "MMM d");
      const prev = byDate.get(key) ?? { up: 0, down: 0 };
      byDate.set(key, {
        up: prev.up + Number(s.thumbs_up),
        down: prev.down + Number(s.thumbs_down),
      });
    }
    return Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      "Helpful": v.up,
      "Not Helpful": v.down,
    }));
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Feedback Trends</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barGap={2}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="Helpful" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Not Helpful" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
