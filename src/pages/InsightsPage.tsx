import { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const InsightsPage = () => {
  const entries = useMemo(() => {
    return JSON.parse(localStorage.getItem("ms-entries") || "[]");
  }, []);

  const last7 = entries.slice(-7);

  const chartData = last7.map((e: any) => ({
    date: new Date(e.date).toLocaleDateString("en-US", { weekday: "short" }),
    fatigue: e.fatigue,
    pain: e.pain,
    brainFog: e.brainFog,
    mood: e.mood,
  }));

  const avg = (key: string) => {
    if (last7.length === 0) return 0;
    return (last7.reduce((acc: number, e: any) => acc + (e[key] || 0), 0) / last7.length).toFixed(1);
  };

  return (
    <>
      <PageHeader title="Insights" subtitle="Your weekly summary" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {entries.length < 2 ? (
          <div className="py-16 text-center animate-fade-in">
            <span className="text-4xl">📈</span>
            <p className="mt-3 font-display text-lg font-medium text-foreground">Not enough data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Log at least 2 days to start seeing your trends.
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Averages */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Avg Fatigue", val: avg("fatigue"), emoji: "🔋" },
                { label: "Avg Pain", val: avg("pain"), emoji: "⚡" },
                { label: "Avg Brain Fog", val: avg("brainFog"), emoji: "🌫️" },
                { label: "Avg Mood", val: avg("mood"), emoji: "😊" },
              ].map(({ label, val, emoji }) => (
                <div key={label} className="rounded-xl bg-card p-4 shadow-soft text-center">
                  <span className="text-xl">{emoji}</span>
                  <p className="mt-1 text-2xl font-bold text-foreground">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl bg-card p-4 shadow-soft">
              <p className="mb-3 text-sm font-medium text-foreground">7-day trend</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line type="monotone" dataKey="fatigue" stroke="hsl(25, 85%, 50%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pain" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="brainFog" stroke="hsl(210, 60%, 50%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mood" stroke="hsl(145, 45%, 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Fatigue</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Pain</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-blue" /> Brain Fog</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-green" /> Mood</span>
              </div>
            </div>

            {/* Export stub */}
            <button className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]">
              📄 Generate Doctor Report
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Export a professional PDF for your neurologist
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default InsightsPage;
