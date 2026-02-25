import { useMemo } from "react";
import { DailyEntry } from "@/hooks/useEntries";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import { format, parseISO, getDay } from "date-fns";

interface Props {
  entries: DailyEntry[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MoodPatternNudge = ({ entries }: Props) => {
  const insights = useMemo(() => {
    const recent = entries.slice(0, 14);
    if (recent.length < 3) return null;

    const moodVals = recent.filter((e) => e.mood !== null).map((e) => ({ mood: e.mood!, date: e.date }));
    if (moodVals.length < 3) return null;

    const nuggets: Array<{ icon: React.ReactNode; text: string }> = [];

    // 1. Mood trend (last 7 vs previous 7)
    const last7 = moodVals.slice(0, 7);
    const prev7 = moodVals.slice(7, 14);
    if (last7.length >= 3 && prev7.length >= 2) {
      const avg1 = last7.reduce((s, v) => s + v.mood, 0) / last7.length;
      const avg2 = prev7.reduce((s, v) => s + v.mood, 0) / prev7.length;
      const diff = avg1 - avg2;
      if (diff > 0.8) {
        nuggets.push({
          icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
          text: `Your mood has been trending up this week — ${avg1.toFixed(1)} avg vs ${avg2.toFixed(1)} last week.`,
        });
      } else if (diff < -0.8) {
        nuggets.push({
          icon: <TrendingDown className="h-3.5 w-3.5 text-amber-500" />,
          text: `Mood dipped a bit this week (${avg1.toFixed(1)} avg). Be gentle with yourself. 💛`,
        });
      }
    }

    // 2. Best/worst day of week pattern
    const dayMoods: Record<number, number[]> = {};
    moodVals.forEach((v) => {
      const d = getDay(parseISO(v.date));
      if (!dayMoods[d]) dayMoods[d] = [];
      dayMoods[d].push(v.mood);
    });
    const dayAvgs = Object.entries(dayMoods)
      .filter(([, vals]) => vals.length >= 2)
      .map(([day, vals]) => ({ day: Number(day), avg: vals.reduce((a, b) => a + b, 0) / vals.length }));

    if (dayAvgs.length >= 3) {
      const best = dayAvgs.reduce((a, b) => (a.avg > b.avg ? a : b));
      const worst = dayAvgs.reduce((a, b) => (a.avg < b.avg ? a : b));
      if (best.avg - worst.avg > 1) {
        nuggets.push({
          icon: <Brain className="h-3.5 w-3.5 text-primary" />,
          text: `You tend to feel best on ${DAY_NAMES[best.day]}s and lowest on ${DAY_NAMES[worst.day]}s.`,
        });
      }
    }

    // 3. Recurring mood tags
    const tagCount: Record<string, number> = {};
    recent.forEach((e) => (e.mood_tags ?? []).forEach((t) => { tagCount[t] = (tagCount[t] ?? 0) + 1; }));
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .filter(([, c]) => c >= 3)
      .slice(0, 2);

    if (topTags.length > 0) {
      const tagStr = topTags.map(([t, c]) => `"${t}" (${c}×)`).join(" and ");
      nuggets.push({
        icon: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
        text: `In the last 2 weeks, your most logged feelings: ${tagStr}.`,
      });
    }

    return nuggets.length > 0 ? nuggets : null;
  }, [entries]);

  if (!insights) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        📊 Mood patterns
      </p>
      <ul className="space-y-1.5">
        {insights.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-foreground leading-relaxed">
            <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoodPatternNudge;
