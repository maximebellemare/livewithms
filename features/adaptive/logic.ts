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

  let homeMoment = "Small patterns are becoming clearer.";
  let suggestedProgram: AdaptiveProfile["suggestedProgram"] = null;
  let secondarySuggestedProgram: AdaptiveProfile["secondarySuggestedProgram"] = null;
  let simplificationTitle = "Keep things simple";
  let simplificationBody = "A few basics may be enough today. You can skip anything that feels like too much.";
  const lowEnergyMode =
    fatigueTrend === "high" ||
    brainFogTrend === "high" ||
    (stressTrend === "elevated" && sleepTrend === "low");

  if (stressTrend === "elevated") {
    homeMoment = "Stress has felt a little steadier to watch this week.";
    suggestedProgram = "breathing-reset";
    secondarySuggestedProgram = "hard-moment-reflection";
    simplificationTitle = "Reduce pressure where you can";
    simplificationBody = "A calmer pace, fewer decisions, and one short reset may help the day feel less loaded.";
  } else if (sleepTrend === "low") {
    homeMoment = "Sleep has looked lighter lately, so a gentler pace may help.";
    suggestedProgram = "body-scan";
    secondarySuggestedProgram = "low-energy-checklist";
    simplificationTitle = "Lower the bar for today";
    simplificationBody = "Lighter sleep can make everything feel louder. The basics may be enough today.";
  } else if (fatigueTrend === "high") {
    homeMoment = "Your energy has seemed lower lately, which is worth keeping in mind today.";
    suggestedProgram = "low-energy-checklist";
    secondarySuggestedProgram = "body-scan";
    simplificationTitle = "Protect your energy";
    simplificationBody = "Try to keep steps shorter, choices fewer, and expectations gentler while your energy is lower.";
  } else if (brainFogTrend === "high") {
    homeMoment = "Brain fog may be shaping this stretch more than usual.";
    suggestedProgram = "one-priority-planner";
    secondarySuggestedProgram = "low-energy-checklist";
    simplificationTitle = "Keep decisions lighter";
    simplificationBody = "When thinking feels slower or foggier, one priority and simpler choices may help the day feel steadier.";
  } else if (engagementPattern === "steady") {
    homeMoment = "You’ve been checking in consistently, and that is helping patterns take shape.";
    suggestedProgram = "one-priority-planner";
    secondarySuggestedProgram = "hard-moment-reflection";
  } else if (reflectionCount >= 2) {
    homeMoment = "Your reflections are adding more shape to what this week has felt like.";
    suggestedProgram = "hard-moment-reflection";
    secondarySuggestedProgram = "breathing-reset";
  } else if (engagementPattern === "gentle-reengagement") {
    homeMoment = "Even a small return today can make the picture feel clearer again.";
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
