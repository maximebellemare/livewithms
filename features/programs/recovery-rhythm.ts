type RecoveryRhythmInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  recentSleepAverage: number | null;
  recentEntries: Array<{
    fatigue?: number | null;
    stress?: number | null;
    sleep_hours?: number | null;
  }>;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
};

export type RecoveryRhythmState = {
  title: string;
  body: string;
  observations: string[];
  suggestions: string[];
  simplifyFurther: boolean;
};

const BANNED_RECOVERY_LANGUAGE =
  /(optimize recovery|maximize performance|push your limits|advanced recovery intelligence|burnout optimization|performance recovery system|bad week|decline)/gi;

function sanitizeRecoveryCopy(text: string) {
  return text.replace(BANNED_RECOVERY_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function countHighStressDays(entries: RecoveryRhythmInput["recentEntries"]) {
  return entries.filter((entry) => typeof entry.stress === "number" && entry.stress >= 4).length;
}

function countHighFatigueDays(entries: RecoveryRhythmInput["recentEntries"]) {
  return entries.filter((entry) => typeof entry.fatigue === "number" && entry.fatigue >= 4).length;
}

function countLowSleepDays(entries: RecoveryRhythmInput["recentEntries"]) {
  return entries.filter((entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours > 0 && entry.sleep_hours < 6.5).length;
}

export function deriveRecoveryRhythm(input: RecoveryRhythmInput): RecoveryRhythmState {
  const observations: string[] = [];
  const suggestions: string[] = [];

  const highStressDays = countHighStressDays(input.recentEntries);
  const highFatigueDays = countHighFatigueDays(input.recentEntries);
  const lowSleepDays = countLowSleepDays(input.recentEntries);
  const averageSleep = average(input.recentEntries.map((entry) => entry.sleep_hours));

  if (highStressDays >= 3 || input.stressTrend === "elevated") {
    observations.push("Higher-stress days may be stacking together.");
    suggestions.push("A quieter pace may help this week.");
  }

  if (highFatigueDays >= 3 || input.fatigueTrend === "high") {
    observations.push("Several lower-energy days appeared close together.");
    suggestions.push("Protecting energy may matter more than doing more today.");
  }

  if (lowSleepDays >= 3 || (typeof averageSleep === "number" && averageSleep < 6.5)) {
    observations.push("Recovery time may have been shorter recently.");
    suggestions.push("Protecting rest periods may help this week.");
  }

  if (!observations.length) {
    observations.push("Some days may be asking for a steadier rhythm than others.");
    suggestions.push("A simpler pace may still be useful this week.");
  }

  const simplifyFurther =
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated" ||
    lowSleepDays >= 3;

  if (simplifyFurther) {
    return {
      title: "Calmer pacing for heavier stretches",
      body: sanitizeRecoveryCopy(
        "This support includes calmer pacing and recovery support during difficult periods, with gentle rhythm summaries and lower-pressure suggestions.",
      ),
      observations: observations.slice(0, 2),
      suggestions: suggestions.slice(0, 2),
      simplifyFurther,
    };
  }

  return {
    title: "A steadier rhythm through unpredictable days",
    body: sanitizeRecoveryCopy(
      "This support includes calmer pacing and recovery support when you want a gentler view of how energy, stress, and rest may be interacting over time.",
    ),
    observations: observations.slice(0, 3),
    suggestions: suggestions.slice(0, 2),
    simplifyFurther,
  };
}
