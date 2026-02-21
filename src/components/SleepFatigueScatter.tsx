import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";

interface Pair {
  sleep: number;
  fatigue: number;
}

interface Props {
  pairs: Pair[];
  correlationR: number | null;
  corrLabel: { text: string; emoji: string; positive: boolean | null } | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
      <p className="text-muted-foreground">
        Sleep: <span className="font-bold text-foreground">{d.sleep.toFixed(1)} hrs</span>
      </p>
      <p className="text-muted-foreground">
        Next-day fatigue: <span className="font-bold text-foreground">{d.fatigue}/10</span>
      </p>
    </div>
  );
};

const SleepFatigueScatter = ({ pairs, correlationR, corrLabel }: Props) => {
  if (pairs.length < 3) return null;

  const avgSleep = pairs.reduce((s, p) => s + p.sleep, 0) / pairs.length;
  const avgFatigue = pairs.reduce((s, p) => s + p.fatigue, 0) / pairs.length;

  return (
    <div className="rounded-xl bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div>
          <p className="text-sm font-semibold text-foreground">🌙 Sleep → Fatigue</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Does last night's sleep affect today's fatigue?
          </p>
        </div>
        {correlationR !== null && (
          <span className="text-lg font-bold text-foreground tabular-nums">
            r = {correlationR.toFixed(2)}
          </span>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="sleep"
                type="number"
                domain={[0, 12]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Sleep (hrs)",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                dataKey="fatigue"
                type="number"
                domain={[0, 10]}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Fatigue",
                  angle: -90,
                  position: "insideLeft",
                  offset: 20,
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={avgSleep}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <ReferenceLine
                y={avgFatigue}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Scatter
                data={pairs}
                fill="hsl(220 70% 60%)"
                fillOpacity={0.7}
                r={5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Correlation label */}
        {corrLabel && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-xs"
            style={{
              background: corrLabel.positive === false
                ? "hsl(0 72% 51% / 0.08)"
                : corrLabel.positive === true
                ? "hsl(145 45% 45% / 0.08)"
                : "hsl(var(--muted))",
            }}
          >
            <span className="mr-1">{corrLabel.emoji}</span>
            <span className="text-foreground font-medium">{corrLabel.text}</span>
          </div>
        )}

        <p className="mt-2 text-[9px] text-muted-foreground text-center">
          Each dot = one night's sleep vs next day's fatigue · {pairs.length} data points
        </p>
      </div>
    </div>
  );
};

export default SleepFatigueScatter;
