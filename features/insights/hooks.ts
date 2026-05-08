import { useMemo } from "react";
import { subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { DailyCheckIn } from "../checkins/types";
import { insightsApi } from "./api";
import type {
  CorrelationSummary,
  HydrationEnergyInsight,
  InsightsDashboard,
  PatternSummary,
  SleepFatigueInsight,
  SleepMoodInsight,
  StressFatigueInsight,
  TrendDirection,
  TrendSummary,
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
      summary = `${label} has stayed fairly steady between your last 7 and 30 days.`;
    } else if (higherIsBetter) {
      summary =
        direction === "up"
          ? `${label} is trending a little stronger over the last 7 days.`
          : `${label} has dipped a bit compared with your 30-day average.`;
    } else {
      summary =
        direction === "up"
          ? `${label} is easing compared with your 30-day average.`
          : `${label} has been running higher over the last 7 days.`;
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
      summary = `There is no clear link yet between ${config.leftLabel.toLowerCase()} and ${config.rightLabel.toLowerCase()}.`;
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
    const sleepFatigueInsight = buildSleepFatigueInsight(entries30);
    const stressFatigueInsight = buildStressFatigueInsight(entries30);
    const sleepMoodInsight = buildSleepMoodInsight(entries30);
    const hydrationEnergyInsight = buildHydrationEnergyInsight(entries30);

    return {
      hasEnoughData: entries7.length >= 3,
      weeklySummary,
      sleepFatigueInsight,
      stressFatigueInsight,
      sleepMoodInsight,
      hydrationEnergyInsight,
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
