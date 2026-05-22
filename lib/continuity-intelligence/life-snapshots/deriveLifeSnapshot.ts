import type { DailyCheckIn } from "../../../features/checkins/types";
import type { JourneySnapshot } from "../../journey-design/types";
import { deriveGroundingMoments } from "../grounding/deriveGroundingMoments";
import { guardContinuityCalmness } from "../governance/guardContinuityCalmness";
import { deriveOrdinaryLifeAnchors } from "../ordinary-life/deriveOrdinaryLifeAnchors";
import type { ContinuitySummary, ContinuitySummaryWindow } from "../types";

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function standardDeviation(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length < 2) {
    return null;
  }
  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => guardContinuityCalmness(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

function sliceCurrentAndPrevious(entries: DailyCheckIn[], windowDays: number) {
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  return {
    current: sorted.slice(0, windowDays),
    previous: sorted.slice(windowDays, windowDays * 2),
  };
}

function describeContinuity(window: ContinuitySummaryWindow, entries: DailyCheckIn[], snapshot: JourneySnapshot | null) {
  const reflections = entries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length;

  if (window === "yearly" && snapshot?.continuitySignals.length) {
    return "Across a longer stretch, continuity can look quiet and ordinary rather than linear.";
  }

  if (reflections >= (window === "monthly" ? 3 : window === "seasonal" ? 5 : 8)) {
    return window === "monthly"
      ? "Your reflections are gradually building more context over time."
      : window === "seasonal"
        ? "Some patterns become easier to notice across longer periods."
        : "A longer view can hold both heavier periods and steadier ones without forcing them into a single story.";
  }

  return window === "monthly"
    ? "This month has a little more context now."
    : window === "seasonal"
      ? "This season is starting to feel a little easier to read."
      : "Even a longer stretch can stay observational and calm.";
}

function buildFallbackSummary(
  window: ContinuitySummaryWindow,
  snapshot: JourneySnapshot | null,
  lowEnergyMode: boolean,
): ContinuitySummary {
  const maxMeaningfulMoments = lowEnergyMode ? 1 : 2;

  return {
    window,
    title: window === "monthly" ? "Monthly life snapshot" : window === "seasonal" ? "Seasonal reflection" : "Yearly continuity summary",
    atAGlance: FALLBACK_MESSAGE,
    patternsWorthNoticing: [],
    thingsThatBroughtCalm: [],
    whatMayHelpNext: [],
    continuityReflection: window === "yearly" ? "A longer view can stay quiet until there is enough context to read it gently." : "A little more time can help this view feel clearer.",
    lifeBeyondSymptoms: deriveOrdinaryLifeAnchors([], snapshot, lowEnergyMode),
    meaningfulMoments: deriveGroundingMoments(snapshot, maxMeaningfulMoments),
    hasEnoughData: false,
    fallbackMessage: FALLBACK_MESSAGE,
  };
}

export function deriveLifeSnapshot(
  entries: DailyCheckIn[],
  snapshot: JourneySnapshot | null,
  window: ContinuitySummaryWindow,
  lowEnergyMode: boolean,
): ContinuitySummary {
  const windowDays = window === "monthly" ? 30 : window === "seasonal" ? 90 : 365;
  const minEntries = window === "monthly" ? 10 : window === "seasonal" ? 18 : 36;
  const { current, previous } = sliceCurrentAndPrevious(entries, windowDays);

  if (current.length < minEntries) {
    return buildFallbackSummary(window, snapshot, lowEnergyMode);
  }

  const listLimit = lowEnergyMode ? 1 : window === "yearly" ? 3 : 2;
  const atAGlanceParts: string[] = [];
  const patterns: string[] = [];
  const calmSupports: string[] = [];
  const next: string[] = [];

  const averageFatigue = average(current.map((entry) => entry.fatigue));
  const averageStress = average(current.map((entry) => entry.stress));
  const averageMood = average(current.map((entry) => entry.mood));
  const averageSleep = average(current.map((entry) => entry.sleep_hours));
  const fatiguePrevious = average(previous.map((entry) => entry.fatigue));
  const stressPrevious = average(previous.map((entry) => entry.stress));
  const sleepStability = standardDeviation(current.map((entry) => entry.sleep_hours));
  const previousSleepStability = standardDeviation(previous.map((entry) => entry.sleep_hours));
  const lowEnergyDays = current.filter((entry) => (entry.fatigue ?? 0) >= 4).length;

  if (averageFatigue !== null && averageFatigue >= 4) {
    atAGlanceParts.push(
      window === "monthly"
        ? "Fatigue appeared somewhat heavier this month."
        : window === "seasonal"
          ? "Lower-energy periods appeared intermittently this season."
          : "Lower-energy periods appeared at points across the year.",
    );
    next.push("A quieter pace may help more than trying to do too much at once.");
  } else if (averageFatigue !== null && averageFatigue <= 2.8) {
    atAGlanceParts.push(window === "yearly" ? "Some longer stretches have looked a little steadier than others." : "Energy has had some steadier stretches lately.");
  }

  if (averageStress !== null && averageStress >= 4) {
    atAGlanceParts.push(window === "monthly" ? "Stress seemed a little heavier this month." : "Stress varied across this longer stretch and sometimes carried more weight.");
    next.push("Leaving a little more space around plans may feel easier right now.");
  }

  if (averageMood !== null && averageMood >= 3.2) {
    calmSupports.push("Mood has had some steadier moments mixed into the heavier ones.");
  } else if (averageMood !== null && averageMood <= 2.5) {
    patterns.push("Mood has looked a little lower in parts of this stretch.");
  }

  if (averageSleep !== null && averageSleep < 6.5) {
    patterns.push("Sleep has looked a little shorter across this stretch.");
    next.push("A calmer evening rhythm may be worth keeping in view.");
  }

  if (sleepStability !== null && previousSleepStability !== null && sleepStability + 0.2 < previousSleepStability) {
    calmSupports.push("Sleep appeared slightly steadier than the stretch before it.");
  }

  if (fatiguePrevious !== null && averageFatigue !== null && averageFatigue >= fatiguePrevious + 0.45) {
    patterns.push("Fatigue has looked a little heavier than the stretch before it.");
  } else if (fatiguePrevious !== null && averageFatigue !== null && averageFatigue <= fatiguePrevious - 0.45) {
    calmSupports.push("Fatigue has looked a little lighter than the stretch before it.");
  }

  if (stressPrevious !== null && averageStress !== null && averageStress <= stressPrevious - 0.45) {
    calmSupports.push("Stress has looked a little lighter than the stretch before it.");
  }

  if (lowEnergyDays >= (window === "monthly" ? 8 : window === "seasonal" ? 18 : 40)) {
    patterns.push(window === "yearly" ? "Heavier days showed up intermittently across the year rather than defining all of it." : "Heavier days showed up at times, without needing to define the whole picture.");
  }

  for (const pattern of snapshot?.longWindowPatterns ?? []) {
    patterns.push(pattern.body);
  }

  for (const signal of snapshot?.continuitySignals ?? []) {
    if (signal.kind === "grounding" || signal.kind === "pacing") {
      calmSupports.push(signal.body);
    }
  }

  for (const rhythm of snapshot?.seasonalRhythms ?? []) {
    patterns.push(rhythm.body);
  }

  if (snapshot?.recoveryCycles.some((cycle) => cycle.pace === "slower")) {
    next.push("Keeping the next stretch simpler may be more realistic than pushing for a bigger reset.");
  }

  if (!atAGlanceParts.length) {
    atAGlanceParts.push(window === "yearly" ? "Across the longer view, some periods appeared steadier than others." : "This stretch has included a mix of heavier and steadier days.");
  }

  if (!patterns.length) {
    patterns.push(window === "yearly" ? "Some patterns are becoming easier to notice across longer stretches." : "A few broader patterns are starting to become easier to notice.");
  }

  if (!calmSupports.length) {
    calmSupports.push("Short grounding routines have still seemed to matter on the harder days.");
  }

  if (!next.length) {
    next.push(window === "yearly" ? "A quieter pace may still be the most useful next step." : "Keeping the next stretch a little simpler may be enough.");
  }

  return {
    window,
    title: window === "monthly" ? "Monthly life snapshot" : window === "seasonal" ? "Seasonal reflection" : "Yearly continuity summary",
    atAGlance: guardContinuityCalmness(atAGlanceParts[0] ?? FALLBACK_MESSAGE),
    patternsWorthNoticing: clampLines(patterns, listLimit),
    thingsThatBroughtCalm: clampLines(calmSupports, listLimit),
    whatMayHelpNext: clampLines(next, lowEnergyMode ? 1 : 2),
    continuityReflection: guardContinuityCalmness(describeContinuity(window, current, snapshot)),
    lifeBeyondSymptoms: deriveOrdinaryLifeAnchors(current, snapshot, lowEnergyMode),
    meaningfulMoments: deriveGroundingMoments(snapshot, lowEnergyMode ? 1 : 2),
    hasEnoughData: true,
  };
}
