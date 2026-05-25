import type { DailyCheckIn } from "../checkins/types";
import type { CorrelationSummary, TrendSummary } from "./types";

export type WeeklyMeaning = {
  observations: string[];
  suggestions: string[];
};

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

const SAFETY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bworsening\b/gi, "feeling heavier"],
  [/\bdeteriorating\b/gi, "feeling heavier"],
  [/\bwarning sign\b/gi, "worth noticing"],
  [/\bnegative trend detected\b/gi, "a heavier stretch is showing up"],
  [/\bprogression\b/gi, "pattern over time"],
  [/\byou should see a doctor\b/gi, "you can bring it into a broader conversation if that feels useful"],
  [/\byour condition worsened\b/gi, "this stretch has felt heavier"],
];

export function sanitizeInsightSafety(text: string) {
  let next = normalizeWhitespace(text);

  for (const [pattern, replacement] of SAFETY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next
    .replace(/\bcaused by\b/gi, "may be connected with")
    .replace(/\bcauses\b/gi, "may connect with")
    .replace(/\bis causing\b/gi, "may be shaping")
    .replace(/\bwill\b/gi, "may")
    .replace(/\bdefinitely\b/gi, "often")
    .replace(/\bclearly\b/gi, "seem to")
    .trim();
}

function clampItems(items: string[], maxItems: number) {
  return items
    .map((item) => sanitizeInsightSafety(item))
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, maxItems);
}

export function deriveWeeklyMeaning(entries: DailyCheckIn[]) {
  const recent = entries.slice(0, 7);
  const averageFatigue = average(recent.map((entry) => entry.fatigue));
  const averageMood = average(recent.map((entry) => entry.mood));
  const averageStress = average(recent.map((entry) => entry.stress));
  const averageSleep = average(recent.map((entry) => entry.sleep_hours));

  const observations: string[] = [];
  const suggestions: string[] = [];

  if (averageFatigue !== null && averageFatigue >= 4) {
    observations.push("Fatigue is higher across recent check-ins.");
    suggestions.push("Reduce decision load on higher-fatigue days.");
  }

  if (averageSleep !== null && averageSleep < 6.5 && averageStress !== null && averageStress >= 3.5) {
    observations.push("Lower sleep and higher stress are both present in this range.");
    suggestions.push("Track whether shorter sleep is followed by higher stress.");
  }

  if (averageStress !== null && averageStress >= 4) {
    observations.push("Stress has been one of the stronger signals this week.");
    suggestions.push("A short reset may be enough on fuller days.");
  }

  if (averageMood !== null && averageMood <= 2.5) {
    observations.push("Mood is lower across recent check-ins.");
    suggestions.push("Look for what changed on lower-mood days.");
  }

  if (averageFatigue !== null && averageFatigue <= 2.5 && averageStress !== null && averageStress <= 2.5) {
    observations.push("Fatigue and stress are both lower in this range.");
    suggestions.push("Compare these days with higher-fatigue periods.");
  }

  if (!observations.length) {
    observations.push("This pattern is still early.");
  }

  if (!suggestions.length) {
    suggestions.push("A few more check-ins may help reveal clearer patterns.");
  }

  return {
    observations: clampItems(observations, 3),
    suggestions: clampItems(suggestions, 2),
  };
}

export function derivePatternsWorthNoticing(correlations: CorrelationSummary[]) {
  return clampItems(
    correlations
      .filter((item) => item.show)
      .map((item) => item.summary),
    3,
  );
}

export function deriveWhatChangedRecently(trends: TrendSummary[]) {
  const interesting = trends.filter((trend) => trend.averageCurrent !== null && trend.direction !== "flat");

  if (!interesting.length) {
    return [] as string[];
  }

  return clampItems(
    interesting
      .slice(0, 3)
      .map((trend) => trend.summary),
    3,
  );
}

export function deriveSmallNextSteps(
  entries: DailyCheckIn[],
  aiSuggestions: string[] = [],
) {
  const recent = entries.slice(0, 7);
  const averageFatigue = average(recent.map((entry) => entry.fatigue));
  const averageStress = average(recent.map((entry) => entry.stress));
  const averageSleep = average(recent.map((entry) => entry.sleep_hours));
  const suggestions: string[] = [];

  if (averageFatigue !== null && averageFatigue >= 4) {
    suggestions.push("Keep tomorrow simpler if fatigue stays high.");
  }

  if (averageSleep !== null && averageSleep < 6.5) {
    suggestions.push("Notice whether sleep timing affects energy.");
  }

  if (averageStress !== null && averageStress >= 4) {
    suggestions.push("A short reset may be enough today.");
  }

  suggestions.push(...aiSuggestions);

  return clampItems(suggestions, 3);
}

export function deriveLocalAiFallbackMessage() {
  return "AI insights are taking a moment. A simpler local summary is shown for now.";
}
