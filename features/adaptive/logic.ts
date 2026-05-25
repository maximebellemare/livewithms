import type { CheckInOverviewEntry, DailyCheckIn } from "../checkins/types";
import type { PersonalizationMemory } from "../personalization-memory/types";
import type { AdaptiveProfile } from "./types";

type AdaptiveEntry = DailyCheckIn | CheckInOverviewEntry;

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function buildAdaptiveProfile(
  entries: AdaptiveEntry[],
  daysActiveThisWeek: number,
  memory?: PersonalizationMemory | null,
): AdaptiveProfile {
  const recent = entries.slice(0, 7);
  const averageStress = average(recent.map((entry) => ("stress" in entry ? entry.stress : null)));
  const averageSleep = average(recent.map((entry) => ("sleep_hours" in entry ? entry.sleep_hours : null)));
  const averageFatigue = average(recent.map((entry) => ("fatigue" in entry ? entry.fatigue : null)));
  const averageBrainFog = average(recent.map((entry) => ("brain_fog" in entry ? entry.brain_fog : null)));
  const reflectionCount = recent.filter((entry) => ("notes" in entry ? entry.notes?.trim() : entry.hasReflection)).length;

  const stressTrend =
    averageStress === null ? "unknown" : averageStress >= 3.8 ? "elevated" : averageStress <= 2.2 ? "lighter" : "steady";
  const sleepTrend =
    averageSleep === null ? "unknown" : averageSleep < 6.3 ? "low" : averageSleep >= 7.5 ? "rested" : "steady";
  const fatigueTrend =
    averageFatigue === null ? "unknown" : averageFatigue >= 3.8 ? "high" : averageFatigue <= 2.2 ? "lighter" : "steady";
  const brainFogTrend =
    averageBrainFog === null ? "unknown" : averageBrainFog >= 3.5 ? "high" : averageBrainFog <= 1.8 ? "lighter" : "steady";

  let engagementPattern: AdaptiveProfile["engagementPattern"] = "unknown";
  if (!entries.length) {
    engagementPattern = "new";
  } else if (daysActiveThisWeek >= 4) {
    engagementPattern = "steady";
  } else {
    engagementPattern = "gentle-reengagement";
  }

  let homeMoment = "Recent check-ins are starting to show useful patterns.";
  let suggestedProgram: AdaptiveProfile["suggestedProgram"] = null;
  let secondarySuggestedProgram: AdaptiveProfile["secondarySuggestedProgram"] = null;
  let simplificationTitle = "Keep today simple";
  let simplificationBody = "Focus on the basics and reduce extra decisions.";
  const lowEnergyMode =
    fatigueTrend === "high" ||
    brainFogTrend === "high" ||
    (stressTrend === "elevated" && sleepTrend === "low");

  if (stressTrend === "elevated") {
    homeMoment = "Stress has been one of the stronger recent signals.";
    suggestedProgram = "breathing-reset";
    secondarySuggestedProgram = "hard-moment-reflection";
    simplificationTitle = "Reduce pressure where you can";
    simplificationBody = "Reduce decisions and narrow the next step.";
  } else if (sleepTrend === "low") {
    homeMoment = "Sleep has been lower recently.";
    suggestedProgram = "body-scan";
    secondarySuggestedProgram = "low-energy-checklist";
    simplificationTitle = "Lower the bar for today";
    simplificationBody = "Lower sleep can make the day harder. Focus on the basics.";
  } else if (fatigueTrend === "high") {
    homeMoment = "Fatigue has been higher recently.";
    suggestedProgram = "low-energy-checklist";
    secondarySuggestedProgram = "body-scan";
    simplificationTitle = "Protect your energy";
    simplificationBody = "Keep steps shorter and reduce extra demands.";
  } else if (brainFogTrend === "high") {
    homeMoment = "Brain fog has been more noticeable recently.";
    suggestedProgram = "one-priority-planner";
    secondarySuggestedProgram = "low-energy-checklist";
    simplificationTitle = "Keep decisions lighter";
    simplificationBody = "Choose one priority and simplify the rest.";
  } else if (engagementPattern === "steady") {
    homeMoment = "Regular check-ins are making patterns easier to review.";
    suggestedProgram = "one-priority-planner";
    secondarySuggestedProgram = "hard-moment-reflection";
  } else if (reflectionCount >= 2) {
    homeMoment = "Recent reflections are adding more context to this week.";
    suggestedProgram = "hard-moment-reflection";
    secondarySuggestedProgram = "breathing-reset";
  } else if (engagementPattern === "gentle-reengagement") {
    homeMoment = "A new check-in can add more context.";
    suggestedProgram = "breathing-reset";
    secondarySuggestedProgram = "one-priority-planner";
  }

  if (!suggestedProgram && memory?.preferredProgramTags?.includes("planning")) {
    suggestedProgram = "one-priority-planner";
  } else if (!suggestedProgram && memory?.preferredProgramTags?.includes("reflection")) {
    suggestedProgram = "hard-moment-reflection";
  } else if (!suggestedProgram && memory?.preferredProgramTags?.includes("fatigue")) {
    suggestedProgram = "low-energy-checklist";
  }

  const reminderTone =
    engagementPattern === "gentle-reengagement"
      ? "gentle-nudge"
      : stressTrend === "elevated" || fatigueTrend === "high"
        ? "consistency-support"
        : "daily-checkin";

  return {
    stressTrend,
    sleepTrend,
    fatigueTrend,
    brainFogTrend,
    engagementPattern,
    reflectionPattern: reflectionCount >= 2 ? "active" : "quiet",
    reminderTone,
    homeMoment,
    lowEnergyMode,
    simplificationTitle,
    simplificationBody,
    suggestedProgram,
    secondarySuggestedProgram,
    preferredSupportStyle: memory?.preferredSupportStyle,
    preferredProgramTags: memory?.preferredProgramTags,
  };
}
