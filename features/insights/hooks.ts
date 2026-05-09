import { useMemo } from "react";
import { subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { DailyCheckIn } from "../checkins/types";
import { insightsApi } from "./api";
import type {
  BestWorstDayInsight,
  CorrelationSummary,
  HydrationEnergyInsight,
  InsightsDashboard,
  PatternSummary,
  SleepFatigueInsight,
  SleepMoodInsight,
  StressFatigueInsight,
  TrendDirection,
  TrendSummary,
  WeeklyProgressOverview,
  WeeklyProgressTrend,
  WeeklySummary,
} from "./types";

export function usePatternSummary(entries: DailyCheckIn[], range = 7) {
  return useQuery({
    queryKey: [
      "pattern-summary",
      range,
      entries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|"),
    ],
    queryFn: () => insightsApi.getPatternSummary(entries, range),
    enabled: entries.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);
  if (!validValues.length) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function roundToOneDecimal(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function getCutoffDate(days: number) {
  return subDays(new Date(), days - 1).toISOString().slice(0, 10);
}

function filterEntriesByDays(entries: DailyCheckIn[], days: number) {
  const cutoff = getCutoffDate(days);
  return entries.filter((entry) => entry.date >= cutoff);
}

function calculateTrendDirection(
  average7: number | null,
  average30: number | null,
  higherIsBetter: boolean,
): TrendDirection {
  if (average7 === null || average30 === null) {
    return "flat";
  }

  const difference = average7 - average30;

  if (Math.abs(difference) < 0.35) {
    return "flat";
  }

  if (higherIsBetter) {
    return difference > 0 ? "up" : "down";
  }

  return difference > 0 ? "down" : "up";
}

function buildTrendSummary(
  entries7: DailyCheckIn[],
  entries30: DailyCheckIn[],
  key: "fatigue" | "mood" | "sleep_hours",
  label: string,
  higherIsBetter: boolean,
): TrendSummary {
  const average7 = roundToOneDecimal(average(entries7.map((entry) => entry[key] ?? null)));
  const average30 = roundToOneDecimal(average(entries30.map((entry) => entry[key] ?? null)));
  const direction = calculateTrendDirection(average7, average30, higherIsBetter);

  let summary = "Track a few days to unlock insights";

  if (average7 !== null && average30 !== null) {
    if (direction === "flat") {
      summary = `Your ${label.toLowerCase()} has felt fairly steady lately.`;
    } else if (higherIsBetter) {
      summary =
        direction === "up"
          ? `Lately, your ${label.toLowerCase()} has been feeling a little stronger.`
          : `Lately, your ${label.toLowerCase()} has felt a little lower than usual.`;
    } else {
      summary =
        direction === "up"
          ? `Lately, your ${label.toLowerCase()} has felt a little lighter.`
          : `Lately, your ${label.toLowerCase()} has been a bit more noticeable.`;
    }
  }

  return {
    key,
    label,
    average7,
    average30,
    direction,
    summary,
    points: entries7
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        label: entry.date.slice(5),
        value: entry[key] ?? null,
      })),
  };
}

function buildWeeklyProgressTrend(
  entries7: DailyCheckIn[],
  config: {
    key: "fatigue" | "mood" | "stress";
    label: string;
    higherIsBetter: boolean;
  },
): WeeklyProgressTrend {
  const sortedEntries = entries7.slice().sort((a, b) => a.date.localeCompare(b.date));
  const midpoint = Math.ceil(sortedEntries.length / 2);
  const firstHalf = sortedEntries.slice(0, midpoint);
  const secondHalf = sortedEntries.slice(midpoint);
  const firstHalfAverage = roundToOneDecimal(average(firstHalf.map((entry) => entry[config.key] ?? null)));
  const secondHalfAverage = roundToOneDecimal(average(secondHalf.map((entry) => entry[config.key] ?? null)));

  let indicator = "→ stable";

  if (firstHalfAverage !== null && secondHalfAverage !== null) {
    const difference = secondHalfAverage - firstHalfAverage;

    if (Math.abs(difference) >= 0.35) {
      if (config.higherIsBetter) {
        indicator = difference > 0 ? "↑ improving" : "↓ worsening";
      } else {
        indicator = difference < 0 ? "↓ improving" : "↑ worsening";
      }
    }
  }

  return {
    key: config.key,
    label: config.label,
    firstHalfAverage,
    secondHalfAverage,
    indicator,
  };
}

function buildWeeklyProgressOverview(entries7: DailyCheckIn[]): WeeklyProgressOverview {
  if (entries7.length < 4) {
    return {
      hasEnoughData: false,
      trends: [],
      message: "Track a few more days to see your trends",
    };
  }

  return {
    hasEnoughData: true,
    trends: [
      buildWeeklyProgressTrend(entries7, {
        key: "fatigue",
        label: "Fatigue",
        higherIsBetter: false,
      }),
      buildWeeklyProgressTrend(entries7, {
        key: "mood",
        label: "Mood",
        higherIsBetter: true,
      }),
      buildWeeklyProgressTrend(entries7, {
        key: "stress",
        label: "Stress",
        higherIsBetter: false,
      }),
    ],
    message: null,
  };
}

function pearsonCorrelation(xs: number[], ys: number[]) {
  if (xs.length < 3 || ys.length < 3 || xs.length !== ys.length) {
    return null;
  }

  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const numerator = xs.reduce((sum, value, index) => {
    return sum + (value - meanX) * (ys[index] - meanY);
  }, 0);
  const denominator = Math.sqrt(
    xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0) *
      ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0),
  );

  if (!denominator) {
    return null;
  }

  return numerator / denominator;
}

function buildCorrelationSummary(
  entries30: DailyCheckIn[],
  config: {
    key: string;
    title: string;
    leftLabel: string;
    rightLabel: string;
    leftKey: "fatigue" | "mood";
    rightKey: "sleep_hours" | "stress";
    positiveMeaning: string;
    negativeMeaning: string;
  },
): CorrelationSummary {
  const pairs = entries30
    .map((entry) => ({
      left: entry[config.leftKey],
      right: entry[config.rightKey],
    }))
    .filter(
      (
        pair,
      ): pair is {
        left: number;
        right: number;
      } => pair.left !== null && pair.right !== null,
    );

  const coefficient = roundToOneDecimal(
    pearsonCorrelation(
      pairs.map((pair) => pair.left),
      pairs.map((pair) => pair.right),
    ),
  );

  let summary = "Track a few days to unlock insights";

  if (coefficient !== null) {
    if (Math.abs(coefficient) < 0.2) {
      summary = `There is not a strong pattern yet between ${config.leftLabel.toLowerCase()} and ${config.rightLabel.toLowerCase()}.`;
    } else if (coefficient > 0) {
      summary = config.positiveMeaning;
    } else {
      summary = config.negativeMeaning;
    }
  }

  return {
    key: config.key,
    title: config.title,
    leftLabel: config.leftLabel,
    rightLabel: config.rightLabel,
    coefficient,
    sampleSize: pairs.length,
    summary,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hasRenderableDifference(percentageDifference: number) {
  return Math.abs(percentageDifference) >= 10;
}

function buildSleepFatigueInsight(entries30: DailyCheckIn[]): SleepFatigueInsight {
  const pairedEntries = entries30.filter(
    (
      entry,
    ): entry is DailyCheckIn & {
      sleep_hours: number;
      fatigue: number;
    } => entry.sleep_hours !== null && entry.fatigue !== null,
  );

  const lowSleepEntries = pairedEntries.filter((entry) => entry.sleep_hours < 6);
  const normalSleepEntries = pairedEntries.filter((entry) => entry.sleep_hours >= 6);

  const lowSleepAverage = roundToOneDecimal(average(lowSleepEntries.map((entry) => entry.fatigue)));
  const normalSleepAverage = roundToOneDecimal(average(normalSleepEntries.map((entry) => entry.fatigue)));

  if (
    lowSleepEntries.length < 3 ||
    normalSleepEntries.length < 3 ||
    lowSleepAverage === null ||
    normalSleepAverage === null ||
    normalSleepAverage <= 0
  ) {
    return {
      show: false,
      percentageDifference: null,
      lowSleepAverage,
      normalSleepAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Try aiming for 7+ hours of sleep to reduce fatigue",
    };
  }

  const rawDifference = ((lowSleepAverage - normalSleepAverage) / normalSleepAverage) * 100;
  const percentageDifference = Math.round(clamp(rawDifference, -95, 300));
  const direction = percentageDifference >= 0 ? "more" : "less";

  if (!hasRenderableDifference(percentageDifference)) {
    return {
      show: false,
      percentageDifference,
      lowSleepAverage,
      normalSleepAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Try aiming for 7+ hours of sleep to reduce fatigue",
    };
  }

  return {
    show: true,
    percentageDifference,
    lowSleepAverage,
    normalSleepAverage,
    sentence: `You feel ${Math.abs(percentageDifference)}% ${direction} fatigued on low sleep days`,
    recommendation: "Try aiming for 7+ hours of sleep to reduce fatigue",
  };
}

function buildStressFatigueInsight(entries30: DailyCheckIn[]): StressFatigueInsight {
  const pairedEntries = entries30.filter(
    (
      entry,
    ): entry is DailyCheckIn & {
      stress: number;
      fatigue: number;
    } => entry.stress !== null && entry.fatigue !== null,
  );

  const highStressEntries = pairedEntries.filter((entry) => entry.stress >= 7);
  const lowStressEntries = pairedEntries.filter((entry) => entry.stress < 7);

  const highStressAverage = roundToOneDecimal(average(highStressEntries.map((entry) => entry.fatigue)));
  const lowStressAverage = roundToOneDecimal(average(lowStressEntries.map((entry) => entry.fatigue)));

  if (
    highStressEntries.length < 3 ||
    lowStressEntries.length < 3 ||
    highStressAverage === null ||
    lowStressAverage === null ||
    lowStressAverage <= 0
  ) {
    return {
      show: false,
      percentageDifference: null,
      highStressAverage,
      lowStressAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Managing stress may help reduce fatigue levels",
    };
  }

  const rawDifference = ((highStressAverage - lowStressAverage) / lowStressAverage) * 100;
  const percentageDifference = Math.round(clamp(rawDifference, -95, 300));
  const direction = percentageDifference >= 0 ? "more" : "less";

  if (!hasRenderableDifference(percentageDifference)) {
    return {
      show: false,
      percentageDifference,
      highStressAverage,
      lowStressAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Managing stress may help reduce fatigue levels",
    };
  }

  return {
    show: true,
    percentageDifference,
    highStressAverage,
    lowStressAverage,
    sentence: `You feel ${Math.abs(percentageDifference)}% ${direction} fatigued on high stress days`,
    recommendation: "Managing stress may help reduce fatigue levels",
  };
}

function buildSleepMoodInsight(entries30: DailyCheckIn[]): SleepMoodInsight {
  const pairedEntries = entries30.filter(
    (
      entry,
    ): entry is DailyCheckIn & {
      sleep_hours: number;
      mood: number;
    } => entry.sleep_hours !== null && entry.mood !== null,
  );

  const lowSleepEntries = pairedEntries.filter((entry) => entry.sleep_hours < 6);
  const normalSleepEntries = pairedEntries.filter((entry) => entry.sleep_hours >= 6);

  const lowSleepAverage = roundToOneDecimal(average(lowSleepEntries.map((entry) => entry.mood)));
  const normalSleepAverage = roundToOneDecimal(average(normalSleepEntries.map((entry) => entry.mood)));

  if (
    lowSleepEntries.length < 3 ||
    normalSleepEntries.length < 3 ||
    lowSleepAverage === null ||
    normalSleepAverage === null ||
    normalSleepAverage <= 0
  ) {
    return {
      show: false,
      percentageDifference: null,
      lowSleepAverage,
      normalSleepAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Getting enough sleep may improve your mood",
    };
  }

  const rawDifference = ((normalSleepAverage - lowSleepAverage) / normalSleepAverage) * 100;
  const percentageDifference = Math.round(clamp(rawDifference, -95, 300));
  const direction = percentageDifference >= 0 ? "lower" : "higher";

  if (!hasRenderableDifference(percentageDifference)) {
    return {
      show: false,
      percentageDifference,
      lowSleepAverage,
      normalSleepAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Getting enough sleep may improve your mood",
    };
  }

  return {
    show: true,
    percentageDifference,
    lowSleepAverage,
    normalSleepAverage,
    sentence: `Your mood is ${Math.abs(percentageDifference)}% ${direction} on low sleep days`,
    recommendation: "Getting enough sleep may improve your mood",
  };
}

function buildHydrationEnergyInsight(entries30: DailyCheckIn[]): HydrationEnergyInsight {
  const pairedEntries = entries30.filter(
    (
      entry,
    ): entry is DailyCheckIn & {
      water_glasses: number;
      fatigue: number;
    } => entry.water_glasses !== null && entry.fatigue !== null,
  );

  const lowHydrationEntries = pairedEntries.filter((entry) => entry.water_glasses < 5);
  const goodHydrationEntries = pairedEntries.filter((entry) => entry.water_glasses >= 5);

  const lowHydrationAverage = roundToOneDecimal(average(lowHydrationEntries.map((entry) => entry.fatigue)));
  const goodHydrationAverage = roundToOneDecimal(average(goodHydrationEntries.map((entry) => entry.fatigue)));

  if (
    lowHydrationEntries.length < 3 ||
    goodHydrationEntries.length < 3 ||
    lowHydrationAverage === null ||
    goodHydrationAverage === null ||
    lowHydrationAverage <= 0
  ) {
    return {
      show: false,
      percentageDifference: null,
      lowHydrationAverage,
      goodHydrationAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Staying hydrated may help improve your energy levels",
    };
  }

  const rawDifference = ((lowHydrationAverage - goodHydrationAverage) / lowHydrationAverage) * 100;
  const percentageDifference = Math.round(clamp(rawDifference, -95, 300));

  if (!hasRenderableDifference(percentageDifference)) {
    return {
      show: false,
      percentageDifference,
      lowHydrationAverage,
      goodHydrationAverage,
      sentence: "Track more days to unlock this insight",
      recommendation: "Staying hydrated may help improve your energy levels",
    };
  }

  return {
    show: true,
    percentageDifference,
    lowHydrationAverage,
    goodHydrationAverage,
    sentence:
      Math.abs(percentageDifference) >= 10
        ? `You feel ${Math.abs(percentageDifference)}% less fatigued when well hydrated`
        : "You tend to have higher energy on well-hydrated days",
    recommendation: "Staying hydrated may help improve your energy levels",
  };
}

function buildBestWorstDayInsight(entries30: DailyCheckIn[]): BestWorstDayInsight {
  const scoredEntries = entries30
    .filter(
      (
        entry,
      ): entry is DailyCheckIn & {
        mood: number;
        fatigue: number;
      } => entry.mood !== null && entry.fatigue !== null,
    )
    .map((entry) => ({
      entry,
      score: entry.mood - entry.fatigue,
    }));

  if (scoredEntries.length < 5) {
    return {
      show: false,
      bestDay: null,
      worstDay: null,
      sentence: "Track more days to unlock this insight",
      recommendation: "Try to recreate these conditions more often",
    };
  }

  const sorted = scoredEntries.slice().sort((a, b) => b.score - a.score);
  const best = sorted[0]?.entry ?? null;
  const worst = sorted[sorted.length - 1]?.entry ?? null;

  if (!best || !worst || best.date === worst.date) {
    return {
      show: false,
      bestDay: null,
      worstDay: null,
      sentence: "Track more days to unlock this insight",
      recommendation: "Try to recreate these conditions more often",
    };
  }

  const bestDay = {
    date: best.date,
    sleepHours: best.sleep_hours ?? null,
    stress: best.stress ?? null,
    waterGlasses: best.water_glasses ?? null,
  };

  const worstDay = {
    date: worst.date,
    sleepHours: worst.sleep_hours ?? null,
    stress: worst.stress ?? null,
    waterGlasses: worst.water_glasses ?? null,
  };

  const clues: string[] = [];

  if (
    bestDay.sleepHours !== null &&
    worstDay.sleepHours !== null &&
    bestDay.sleepHours > worstDay.sleepHours
  ) {
    clues.push("more sleep");
  }

  if (
    bestDay.stress !== null &&
    worstDay.stress !== null &&
    bestDay.stress < worstDay.stress
  ) {
    clues.push("lower stress");
  }

  if (
    bestDay.waterGlasses !== null &&
    worstDay.waterGlasses !== null &&
    bestDay.waterGlasses > worstDay.waterGlasses
  ) {
    clues.push("better hydration");
  }

  const sentence =
    clues.length > 0
      ? `Your best days tend to have ${clues.join(" and ")}`
      : "Your best days show a steadier balance of energy and mood";

  return {
    show: true,
    bestDay,
    worstDay,
    sentence,
    recommendation: "Try to recreate these conditions more often",
  };
}

export function useInsightsDashboard(
  entries: DailyCheckIn[],
  patternSummary?: PatternSummary | null,
): InsightsDashboard {
  return useMemo(() => {
    const entries30 = filterEntriesByDays(entries, 30);
    const entries7 = filterEntriesByDays(entries, 7);
    const summaryText =
      patternSummary?.insight ??
      "Track a few days to unlock insights";

    const weeklySummary: WeeklySummary = {
      daysLogged: entries7.length,
      averageFatigue: roundToOneDecimal(average(entries7.map((entry) => entry.fatigue))),
      averageMood: roundToOneDecimal(average(entries7.map((entry) => entry.mood))),
      averageStress: roundToOneDecimal(average(entries7.map((entry) => entry.stress))),
      averageSleep: roundToOneDecimal(average(entries7.map((entry) => entry.sleep_hours))),
      summary: summaryText,
    };
    const weeklyProgressOverview = buildWeeklyProgressOverview(entries7);
    const sleepFatigueInsight = buildSleepFatigueInsight(entries30);
    const stressFatigueInsight = buildStressFatigueInsight(entries30);
    const sleepMoodInsight = buildSleepMoodInsight(entries30);
    const hydrationEnergyInsight = buildHydrationEnergyInsight(entries30);
    const bestWorstDayInsight = buildBestWorstDayInsight(entries30);

    return {
      hasEnoughData: entries7.length >= 3,
      weeklyProgressOverview,
      weeklySummary,
      sleepFatigueInsight,
      stressFatigueInsight,
      sleepMoodInsight,
      hydrationEnergyInsight,
      bestWorstDayInsight,
      trends: [
        buildTrendSummary(entries7, entries30, "fatigue", "Fatigue", false),
        buildTrendSummary(entries7, entries30, "mood", "Mood", true),
        buildTrendSummary(entries7, entries30, "sleep_hours", "Sleep", true),
      ],
      correlations: [
        buildCorrelationSummary(entries30, {
          key: "fatigue-sleep",
          title: "Fatigue vs sleep",
          leftLabel: "Fatigue",
          rightLabel: "Sleep",
          leftKey: "fatigue",
          rightKey: "sleep_hours",
          positiveMeaning: "Higher sleep and fatigue have been rising together, which may mean other factors are also shaping your energy.",
          negativeMeaning: "More sleep tends to line up with lower fatigue across your recent check-ins.",
        }),
        buildCorrelationSummary(entries30, {
          key: "fatigue-stress",
          title: "Fatigue vs stress",
          leftLabel: "Fatigue",
          rightLabel: "Stress",
          leftKey: "fatigue",
          rightKey: "stress",
          positiveMeaning: "Higher stress tends to show up on days when fatigue is also stronger.",
          negativeMeaning: "Stress and fatigue are not moving together in the usual way, which may mean your days are influenced by several different factors.",
        }),
        buildCorrelationSummary(entries30, {
          key: "mood-sleep",
          title: "Mood vs sleep",
          leftLabel: "Mood",
          rightLabel: "Sleep",
          leftKey: "mood",
          rightKey: "sleep_hours",
          positiveMeaning: "More sleep tends to line up with steadier mood in your recent check-ins.",
          negativeMeaning: "Sleep and mood are moving in opposite directions more often, so it may help to keep an eye on what else is affecting your day.",
        }),
      ],
    };
  }, [entries, patternSummary?.insight]);
}
