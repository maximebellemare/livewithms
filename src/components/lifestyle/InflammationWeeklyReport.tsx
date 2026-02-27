import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX, BarChart3 } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import type { InflammatoryScan } from "@/hooks/useInflammatoryScanHistory";

interface Props {
  scans: InflammatoryScan[];
}

const scoreDot = { green: "bg-green-500", yellow: "bg-amber-500", red: "bg-red-500" };
const scoreIcon = {
  green: <ShieldCheck className="h-3.5 w-3.5 text-green-500" />,
  yellow: <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />,
  red: <ShieldX className="h-3.5 w-3.5 text-red-500" />,
};

export default function InflammationWeeklyReport({ scans }: Props) {
  const report = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    const twoWeeksAgo = subDays(new Date(), 14);

    const thisWeek = scans.filter(s => isAfter(new Date(s.scanned_at), weekAgo));
    const lastWeek = scans.filter(s => {
      const d = new Date(s.scanned_at);
      return isAfter(d, twoWeeksAgo) && !isAfter(d, weekAgo);
    });

    if (thisWeek.length === 0) return null;

    const scoreVal = (s: string) => s === "green" ? 1 : s === "yellow" ? 2 : 3;
    const avg = (arr: InflammatoryScan[]) =>
      arr.reduce((sum, s) => sum + scoreVal(s.overall_score), 0) / arr.length;

    const thisAvg = avg(thisWeek);
    const lastAvg = lastWeek.length > 0 ? avg(lastWeek) : null;

    // Top flagged ingredients
    const flagCounts = new Map<string, number>();
    thisWeek.forEach(s =>
      (s.flags || []).forEach((f: any) => {
        const name = (f.ingredient || "").toLowerCase();
        if (name) flagCounts.set(name, (flagCounts.get(name) || 0) + 1);
      })
    );
    const topFlags = [...flagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Score distribution
    const dist = { green: 0, yellow: 0, red: 0 };
    thisWeek.forEach(s => {
      const k = s.overall_score as keyof typeof dist;
      if (k in dist) dist[k]++;
    });

    return { thisWeek, thisAvg, lastAvg, topFlags, dist, totalScans: thisWeek.length };
  }, [scans]);

  if (!report) return null;

  const trend =
    report.lastAvg === null
      ? "neutral"
      : report.thisAvg < report.lastAvg
        ? "improving"
        : report.thisAvg > report.lastAvg
          ? "worsening"
          : "neutral";

  const trendConfig = {
    improving: { icon: <TrendingDown className="h-3.5 w-3.5 text-green-500" />, label: "Improving", color: "text-green-600 dark:text-green-400" },
    worsening: { icon: <TrendingUp className="h-3.5 w-3.5 text-red-500" />, label: "More inflammatory", color: "text-red-600 dark:text-red-400" },
    neutral: { icon: <Minus className="h-3.5 w-3.5 text-muted-foreground" />, label: "Steady", color: "text-muted-foreground" },
  };

  const t = trendConfig[trend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-4 shadow-soft space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">Weekly Inflammation Report</h4>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {report.totalScans} scan{report.totalScans !== 1 ? "s" : ""} this week
        </span>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
        {t.icon}
        <span className={`text-xs font-medium ${t.color}`}>{t.label} vs last week</span>
      </div>

      {/* Score distribution bar */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">Score distribution</p>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
          {(["green", "yellow", "red"] as const).map(k =>
            report.dist[k] > 0 ? (
              <div
                key={k}
                className={`${scoreDot[k]} transition-all`}
                style={{ width: `${(report.dist[k] / report.totalScans) * 100}%` }}
              />
            ) : null
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {report.dist.green} green
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {report.dist.yellow} yellow
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {report.dist.red} red
          </span>
        </div>
      </div>

      {/* Top triggers */}
      {report.topFlags.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">🔥 Top triggers this week</p>
          <div className="flex flex-wrap gap-1.5">
            {report.topFlags.map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive"
              >
                {name} <span className="text-destructive/60">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
