import type { DailyCheckIn } from "../checkins/types";
import type { AiInsightsSummary } from "../insights/types";

export type TodayGuidanceAction = {
  label: string;
  route: "/coach" | "/insights" | "/programs";
};

export type TodayGuidance = {
  title: string;
  body: string;
  actions: TodayGuidanceAction[];
};

function pickVariant<T>(variants: T[], seed: number) {
  return variants[seed % variants.length];
}

function buildSleepGuidance(seed: number): TodayGuidance {
  return {
    title: pickVariant(["Lower the pressure today", "Keep today softer", "Give yourself more room today"], seed),
    body: pickVariant(
      [
        "Sleep seems lighter lately, and that may be shaping your energy. A simpler pace could help the day feel steadier.",
        "With lighter sleep in the mix, today may go better with gentler expectations and shorter lists.",
        "Less sleep can change the whole feel of a day. A softer pace may help the day feel more manageable.",
      ],
      seed,
    ),
    actions: [
      { label: "Open Calm Reset", route: "/coach" },
      { label: "Use a Program", route: "/programs" },
    ],
  };
}

function buildStressGuidance(seed: number): TodayGuidance {
  return {
    title: pickVariant(["Stress may be leading today", "A reset may help today", "Keep the day lighter"], seed),
    body: pickVariant(
      [
        "Stress seems elevated lately. A short reset and a slower pace might help you feel a little more grounded.",
        "Recent check-ins suggest stress may be shaping the day. Keeping things simple could help reduce pressure.",
        "When stress stays high, smaller steps may feel more manageable. A brief pause may help you settle.",
      ],
      seed,
    ),
    actions: [
      { label: "Open Calm Reset", route: "/coach" },
      { label: "Reflect with Coach", route: "/coach" },
    ],
  };
}

function buildFatigueGuidance(seed: number): TodayGuidance {
  return {
    title: pickVariant(["Protect your energy", "Save energy for what matters", "Keep your list short today"], seed),
    body: pickVariant(
      [
        "Your energy has been lower recently. Today may be a good day to reduce pressure and focus on what matters most.",
        "Fatigue seems to be one of the stronger signals lately. A shorter list may help you move through the day more steadily.",
        "Lower energy has been showing up more often. Pacing yourself today may help the day feel steadier.",
      ],
      seed,
    ),
    actions: [
      { label: "Reflect with Coach", route: "/coach" },
      { label: "Use a Program", route: "/programs" },
    ],
  };
}

function buildMoodGuidance(seed: number): TodayGuidance {
  return {
    title: pickVariant(["Aim for one small win", "Keep the bar gentle today", "Try one steadying step"], seed),
    body: pickVariant(
      [
        "Mood seems a little lower today. One small steadying thing may be more helpful than trying to do everything at once.",
        "If today feels heavier, a gentle next step may matter more than a big push.",
        "A smaller, kinder pace may help today feel more manageable. One small win is enough.",
      ],
      seed,
    ),
    actions: [
      { label: "Reflect with Coach", route: "/coach" },
      { label: "Open Calm Reset", route: "/coach" },
    ],
  };
}

function buildAiGuidance(summary: AiInsightsSummary, seed: number): TodayGuidance {
  const helpingLine = summary.helping[0];

  return {
    title: pickVariant(["Today’s guidance", "A gentle read on today", "What may help today"], seed),
    body: helpingLine
      ? `${summary.summary} ${helpingLine}`
      : summary.summary,
    actions: [
      { label: "View Insights", route: "/insights" },
      { label: "Reflect with Coach", route: "/coach" },
    ],
  };
}

function buildDefaultGuidance(seed: number): TodayGuidance {
  return {
    title: pickVariant(["Notice what helps", "Stay close to what is working", "Keep things simple today"], seed),
    body: pickVariant(
      [
        "A short check-in and one steady next step can be enough for today.",
        "You do not need a perfect day for this app to be useful. Small check-ins build a clearer picture over time.",
        "A little consistency can go a long way. Keep the day manageable and notice what helps.",
      ],
      seed,
    ),
    actions: [
      { label: "View Insights", route: "/insights" },
      { label: "Use a Program", route: "/programs" },
    ],
  };
}

export function buildTodayGuidance(
  todayEntry: DailyCheckIn | null,
  aiSummary: AiInsightsSummary | null,
  date: string,
): TodayGuidance {
  const seed = Number(date.slice(-2)) || 1;

  if (todayEntry) {
    if ((todayEntry.sleep_hours ?? 99) < 6) {
      return buildSleepGuidance(seed);
    }

    if ((todayEntry.stress ?? 0) >= 4) {
      return buildStressGuidance(seed);
    }

    if ((todayEntry.fatigue ?? 0) >= 4) {
      return buildFatigueGuidance(seed);
    }

    if ((todayEntry.mood ?? 5) <= 2) {
      return buildMoodGuidance(seed);
    }
  }

  if (aiSummary?.summary) {
    return buildAiGuidance(aiSummary, seed);
  }

  return buildDefaultGuidance(seed);
}
