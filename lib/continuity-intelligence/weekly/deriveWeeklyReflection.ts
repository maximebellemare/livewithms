import type { DailyCheckIn } from "../../../features/checkins/types";
import { guardContinuityCalmness } from "../governance/guardContinuityCalmness";
import type { ContinuityReflectionSummary, ContinuityReflectionWindow } from "../types";

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

function describeContinuity(entries: DailyCheckIn[], window: ContinuityReflectionWindow) {
  const reflectionCount = entries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length;
  const fatigueValues = entries.map((entry) => entry.fatigue).filter((value): value is number => typeof value === "number");
  const fatigueRange = fatigueValues.length >= 2 ? Math.max(...fatigueValues) - Math.min(...fatigueValues) : 0;

  if (reflectionCount >= (window === "weekly" ? 2 : 4)) {
    return window === "weekly"
      ? "A few reflections have added a little more texture to this week."
      : "Your reflections have gradually built more context through the month.";
  }

  if (fatigueRange >= 2) {
    return window === "weekly"
      ? "Some days appeared heavier, while others felt a little steadier."
      : "This month has included heavier days alongside steadier ones, which can happen.";
  }

  return window === "weekly" ? "This week has a little more context now." : "Your check-ins have gradually built more context over time.";
}

export function deriveWeeklyReflection(
  entries: DailyCheckIn[],
  window: ContinuityReflectionWindow,
  lowEnergyMode: boolean,
): ContinuityReflectionSummary {
  const sorted = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const windowDays = window === "weekly" ? 7 : 30;
  const minEntries = window === "weekly" ? 4 : 10;
  const current = sorted.slice(0, windowDays);
  const previous = sorted.slice(windowDays, windowDays * 2);
  const listLimit = lowEnergyMode ? 1 : window === "weekly" ? 2 : 3;

  if (current.length < minEntries) {
    return {
      window,
      title: window === "weekly" ? "Weekly reflection" : "Monthly reflection",
      atAGlance: FALLBACK_MESSAGE,
      patternsWorthNoticing: [],
      thingsThatSeemedSteadier: [],
      whatMayHelpNext: [],
      continuitySummary: window === "weekly" ? "A few more check-ins can make this week easier to read." : "A little more time can help this month feel clearer.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const averageFatigue = average(current.map((entry) => entry.fatigue));
  const averageStress = average(current.map((entry) => entry.stress));
  const averageMood = average(current.map((entry) => entry.mood));
  const averageSleep = average(current.map((entry) => entry.sleep_hours));
  const averageHydration = average(current.map((entry) => entry.water_glasses));
  const sleepStability = standardDeviation(current.map((entry) => entry.sleep_hours));
  const priorFatigue = average(previous.map((entry) => entry.fatigue));
  const priorStress = average(previous.map((entry) => entry.stress));
  const priorMood = average(previous.map((entry) => entry.mood));
  const priorSleepStability = standardDeviation(previous.map((entry) => entry.sleep_hours));

  const atAGlanceParts: string[] = [];
  const patterns: string[] = [];
  const steadier: string[] = [];
  const next: string[] = [];

  if (averageFatigue !== null && averageFatigue >= 4) {
    atAGlanceParts.push(window === "weekly" ? "Fatigue seems a little heavier this week." : "Fatigue has looked a little heavier in this month.");
    next.push("Simpler routines may feel easier right now.");
  } else if (averageFatigue !== null && averageFatigue <= 2.6) {
    atAGlanceParts.push(window === "weekly" ? "Energy has looked a little steadier this week." : "Energy has had a steadier feel in this month.");
  }

  if (averageStress !== null && averageStress >= 4) {
    atAGlanceParts.push(window === "weekly" ? "Stress has been one of the stronger signals lately." : "Stress has carried a little more weight in this month.");
    next.push("A little more space around plans may help next week.");
  } else if (averageStress !== null && averageStress <= 2.6) {
    steadier.push("Stress has looked a little lighter on some recent days.");
  }

  if (averageMood !== null && averageMood >= 3.3) {
    steadier.push("Mood has had some steadier moments recently.");
  } else if (averageMood !== null && averageMood <= 2.5) {
    atAGlanceParts.push(window === "weekly" ? "Mood has looked a little lower this week." : "Mood has felt a little lower in parts of this month.");
  }

  if (averageSleep !== null && averageSleep < 6.5) {
    patterns.push("Sleep has looked a little shorter lately.");
    next.push("A calmer evening rhythm may be worth noticing.");
  }

  if (sleepStability !== null && priorSleepStability !== null && sleepStability + 0.2 < priorSleepStability) {
    patterns.push("Sleep appeared slightly steadier recently.");
  } else if (sleepStability !== null && priorSleepStability !== null && sleepStability > priorSleepStability + 0.2) {
    patterns.push("Sleep has felt a little less settled lately.");
  }

  if (averageHydration !== null && averageHydration >= 6) {
    steadier.push("Hydration has been showing up a little more consistently.");
  } else if (averageHydration !== null && averageHydration < 4) {
    next.push("Keeping water a little closer may make the day feel easier.");
  }

  if (priorFatigue !== null && averageFatigue !== null) {
    if (averageFatigue >= priorFatigue + 0.45) {
      patterns.push("Fatigue looks a little heavier than the stretch before it.");
    } else if (averageFatigue <= priorFatigue - 0.45) {
      patterns.push("Fatigue looks a little lighter than the stretch before it.");
    }
  }

  if (priorStress !== null && averageStress !== null) {
    if (averageStress >= priorStress + 0.45) {
      patterns.push("Stress seems a little heavier than the stretch before it.");
    } else if (averageStress <= priorStress - 0.45) {
      patterns.push("Stress seems a little lighter than the stretch before it.");
    }
  }

  if (priorMood !== null && averageMood !== null && averageMood >= priorMood + 0.4) {
    patterns.push("Mood has felt a little steadier than the stretch before it.");
  }

  if (!atAGlanceParts.length) {
    atAGlanceParts.push(window === "weekly" ? "This week has had a mixed, ordinary rhythm." : "This month has included a mix of heavier and steadier days.");
  }

  if (!patterns.length) {
    patterns.push(window === "weekly" ? "A few small patterns are starting to take shape." : "A broader pattern is starting to feel a little easier to notice.");
  }

  if (!steadier.length) {
    steadier.push(window === "weekly" ? "Even this week, there may have been a steadier moment or two worth keeping in mind." : "Even in a mixed month, steadier moments can still be part of the picture.");
  }

  if (!next.length) {
    next.push(window === "weekly" ? "Keeping the next few days simpler may be enough." : "A gentle rhythm may feel more realistic than trying to do too much at once.");
  }

  return {
    window,
    title: window === "weekly" ? "Weekly reflection" : "Monthly reflection",
    atAGlance: guardContinuityCalmness(atAGlanceParts[0] ?? FALLBACK_MESSAGE),
    patternsWorthNoticing: clampLines(patterns, listLimit),
    thingsThatSeemedSteadier: clampLines(steadier, listLimit),
    whatMayHelpNext: clampLines(next, lowEnergyMode ? 1 : 2),
    continuitySummary: guardContinuityCalmness(describeContinuity(current, window)),
    hasEnoughData: true,
  };
}
