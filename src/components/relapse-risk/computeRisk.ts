import { DailyEntry } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import { RiskResult, RiskLevel } from "./types";

function avg(vals: (number | null | undefined)[]): number | null {
  const v = vals.filter((x): x is number => typeof x === "number");
  return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function trend(recent: (number | null | undefined)[], older: (number | null | undefined)[]): number | null {
  const r = avg(recent);
  const o = avg(older);
  if (r === null || o === null) return null;
  return r - o;
}

export function computeRisk(recent: DailyEntry[], older: DailyEntry[]): RiskResult {
  const factors: string[] = [];
  let score = 0;

  const worseHigher: { key: keyof DailyEntry; label: string; weight: number }[] = [
    { key: "fatigue", label: "Fatigue", weight: 15 },
    { key: "pain", label: "Pain", weight: 12 },
    { key: "brain_fog", label: "Brain fog", weight: 10 },
    { key: "spasticity", label: "Spasticity", weight: 12 },
    { key: "stress", label: "Stress", weight: 10 },
  ];

  const betterHigher: { key: keyof DailyEntry; label: string; weight: number }[] = [
    { key: "mood", label: "Mood", weight: 8 },
    { key: "mobility", label: "Mobility", weight: 10 },
  ];

  for (const { key, label, weight } of worseHigher) {
    const t = trend(
      recent.map((e) => e[key] as number | null),
      older.map((e) => e[key] as number | null)
    );
    if (t !== null && t > 1) {
      const contribution = Math.min(weight, (t / 3) * weight);
      score += contribution;
      factors.push(`${label} trending up (+${t.toFixed(1)})`);
    }
    const recentAvg = avg(recent.map((e) => e[key] as number | null));
    if (recentAvg !== null && recentAvg >= 7) {
      score += weight * 0.4;
      factors.push(`${label} consistently high (${recentAvg.toFixed(1)}/10)`);
    }
  }

  for (const { key, label, weight } of betterHigher) {
    const t = trend(
      recent.map((e) => e[key] as number | null),
      older.map((e) => e[key] as number | null)
    );
    if (t !== null && t < -1) {
      const contribution = Math.min(weight, (Math.abs(t) / 3) * weight);
      score += contribution;
      factors.push(`${label} declining (${t.toFixed(1)})`);
    }
  }

  const recentSleep = avg(recent.map((e) => e.sleep_hours));
  const olderSleep = avg(older.map((e) => e.sleep_hours));
  if (recentSleep !== null && recentSleep < 6) {
    score += 8;
    factors.push(`Sleep low (${recentSleep.toFixed(1)} hrs)`);
  } else if (recentSleep !== null && olderSleep !== null && recentSleep < olderSleep - 1) {
    score += 5;
    factors.push(`Sleep declining`);
  }

  const worseningCount = factors.filter((f) => f.includes("trending") || f.includes("declining")).length;
  if (worseningCount >= 3) {
    score += 10;
  }

  score = Math.min(100, Math.round(score));
  const unique = [...new Set(factors)].slice(0, 4);

  const level: RiskLevel =
    score >= 60 ? "high" :
    score >= 35 ? "elevated" :
    score >= 15 ? "moderate" : "low";

  return { level, score, factors: unique };
}

export function computeWeeklyScores(entries: DailyEntry[], today: Date): number[] {
  const scores: number[] = [];
  for (let w = 0; w < 4; w++) {
    const recentEnd = format(subDays(today, w * 7), "yyyy-MM-dd");
    const recentStart = format(subDays(today, w * 7 + 6), "yyyy-MM-dd");
    const olderEnd = recentStart;
    const olderStart = format(subDays(today, w * 7 + 13), "yyyy-MM-dd");

    const recent = entries.filter((e) => e.date <= recentEnd && e.date > recentStart);
    const older = entries.filter((e) => e.date <= olderEnd && e.date > olderStart);

    if (recent.length >= 2 && older.length >= 2) {
      scores.unshift(computeRisk(recent, older).score);
    }
  }
  return scores;
}
