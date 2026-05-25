import type { AdaptiveProfile } from "../adaptive/types";
import type { DailyCheckIn } from "../checkins/types";
import type { AiInsightsSummary } from "../insights/types";

export type TodayOrientationModule = {
  id: "focus" | "observation" | "low-energy";
  title: string;
  body: string;
  icon: string;
  tone?: "default" | "soft";
};

export type TodayOrientation = {
  title: string;
  modules: TodayOrientationModule[];
};

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function firstSentence(text: string, maxLength = 100) {
  const sentence = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)[0] ?? text.trim();

  if (sentence.length <= maxLength) {
    return sentence;
  }

  const trimmed = sentence.slice(0, maxLength);
  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpaceIndex > 0 ? lastSpaceIndex : maxLength).trim()}…`;
}

function deriveGentleFocus(todayEntry: DailyCheckIn | null, adaptiveProfile: AdaptiveProfile | null) {
  if ((todayEntry?.stress ?? 0) >= 4) {
    return "Protect your energy before expanding it.";
  }

  if ((todayEntry?.fatigue ?? 0) >= 4 || adaptiveProfile?.lowEnergyMode) {
    return "Today can stay simple.";
  }

  if ((todayEntry?.mood ?? 5) <= 2) {
    return "A gentler day still counts.";
  }

  if ((todayEntry?.sleep_hours ?? 99) < 6) {
    return "Rest is not falling behind.";
  }

  if ((todayEntry?.brain_fog ?? 0) >= 4) {
    return "Keep the next step clear and close.";
  }

  if (adaptiveProfile?.engagementPattern === "gentle-reengagement") {
    return "A small return is enough for today.";
  }

  return "Let today stay manageable.";
}

function deriveSmallObservation(
  recentEntries: DailyCheckIn[],
  adaptiveProfile: AdaptiveProfile | null,
  aiSummary: AiInsightsSummary | null,
) {
  const recentSleepAverage = average(recentEntries.map((entry) => entry.sleep_hours));
  const recentStressAverage = average(recentEntries.map((entry) => entry.stress));
  const recentFatigueAverage = average(recentEntries.map((entry) => entry.fatigue));

  if (
    recentEntries.length >= 3 &&
    recentSleepAverage !== null &&
    recentSleepAverage < 6 &&
    recentStressAverage !== null &&
    recentStressAverage >= 3.5
  ) {
    return "Lower-sleep days have been lining up with higher stress this week.";
  }

  if (recentEntries.length >= 3 && recentFatigueAverage !== null && recentFatigueAverage >= 4) {
    return "Energy has been running lower across recent check-ins.";
  }

  if (adaptiveProfile?.stressTrend === "elevated") {
    return "Stress has been taking more room lately.";
  }

  if (adaptiveProfile?.brainFogTrend === "high") {
    return "Brain fog may be shaping this stretch more than usual.";
  }

  if (adaptiveProfile?.homeMoment) {
    return firstSentence(adaptiveProfile.homeMoment, 92);
  }

  if (aiSummary?.summary) {
    return firstSentence(aiSummary.summary, 92);
  }

  return "There is not enough information yet to call this a clear pattern.";
}

function deriveLowEnergyOption(todayEntry: DailyCheckIn | null, adaptiveProfile: AdaptiveProfile | null) {
  if ((todayEntry?.fatigue ?? 0) >= 4 || adaptiveProfile?.lowEnergyMode) {
    return "Choose one important thing. Let the rest stay smaller today.";
  }

  if ((todayEntry?.stress ?? 0) >= 4) {
    return "Lower the number of decisions before adding more to the day.";
  }

  if ((todayEntry?.brain_fog ?? 0) >= 4) {
    return "Keep one visible next step and leave the rest for later.";
  }

  if ((todayEntry?.sleep_hours ?? 99) < 6) {
    return "Treat today like a lower-capacity day where you can.";
  }

  return "Keep the plan smaller than usual today.";
}

export function deriveTodayOrientation(input: {
  todayEntry: DailyCheckIn | null;
  recentEntries: DailyCheckIn[];
  adaptiveProfile: AdaptiveProfile | null;
  aiSummary: AiInsightsSummary | null;
}) : TodayOrientation {
  return {
    title: "Today at a glance",
    modules: [
      {
        id: "focus",
        title: "Gentle focus",
        body: deriveGentleFocus(input.todayEntry, input.adaptiveProfile),
        icon: "🌿",
      },
      {
        id: "observation",
        title: "Small observation",
        body: deriveSmallObservation(input.recentEntries, input.adaptiveProfile, input.aiSummary),
        icon: "☁️",
      },
      {
        id: "low-energy",
        title: "Low-energy option",
        body: deriveLowEnergyOption(input.todayEntry, input.adaptiveProfile),
        icon: "🌙",
        tone: "soft",
      },
    ],
  };
}
