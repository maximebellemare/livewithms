import type { DailyCheckIn } from "../checkins/types";

export type PremiumDailySupportInput = {
  currentHour: number;
  lowEnergyMode: boolean;
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  todayEntry?: DailyCheckIn | null;
};

export type PremiumDailySupportCard = {
  title: string;
  body: string;
  reflection: string;
  pacing: string;
  moment: "morning" | "daytime" | "evening";
};

const MORNING_CARDS: PremiumDailySupportCard[] = [
  {
    title: "Start smaller than usual",
    body: "Today may feel easier if kept simpler.",
    reflection: "What feels most important to protect today?",
    pacing: "A slower start may help more than trying to catch up quickly.",
    moment: "morning",
  },
  {
    title: "Let the day open gradually",
    body: "You do not need to solve everything at once.",
    reflection: "What pressure could be reduced before the day gets busier?",
    pacing: "Lowering decision load early may help the rest of the day feel steadier.",
    moment: "morning",
  },
  {
    title: "Keep the bar gentle",
    body: "It is okay if this day stays small.",
    reflection: "What would make this morning feel gentler?",
    pacing: "One clear next step may be enough for now.",
    moment: "morning",
  },
];

const DAYTIME_CARDS: PremiumDailySupportCard[] = [
  {
    title: "Make more room than pressure",
    body: "A quieter pace could feel easier.",
    reflection: "What would make the next few hours feel more workable?",
    pacing: "Lower stimulation may help today.",
    moment: "daytime",
  },
  {
    title: "Let support stay brief",
    body: "You can keep things light if that fits better today.",
    reflection: "What feels most useful to protect for the rest of the day?",
    pacing: "Reducing decisions may help more than pushing for clarity.",
    moment: "daytime",
  },
  {
    title: "Keep the middle of the day softer",
    body: "Today does not need to be carried all at once.",
    reflection: "What could be left simpler this afternoon?",
    pacing: "A short reset may be enough if the day feels full.",
    moment: "daytime",
  },
];

const EVENING_CARDS: PremiumDailySupportCard[] = [
  {
    title: "Let the day settle without fixing it",
    body: "The day can end without being fully resolved.",
    reflection: "What would help tonight feel less loaded?",
    pacing: "A quieter evening may help more than trying to do a little more.",
    moment: "evening",
  },
  {
    title: "Lower the demand on the evening",
    body: "It is okay if tonight stays simple.",
    reflection: "What could be put down for the rest of the night?",
    pacing: "Reducing self-judgment may help the evening soften.",
    moment: "evening",
  },
  {
    title: "Make room to come down slowly",
    body: "A small downshift can still count.",
    reflection: "What would make the next hour feel gentler?",
    pacing: "Less stimulation may help the nervous system settle.",
    moment: "evening",
  },
];

function sanitizeSupportText(text: string) {
  return text
    .replace(/\balways here for you\b/gi, "available when useful")
    .replace(/\byour personal ai companion\b/gi, "daily support")
    .replace(/\bcompanion\b/gi, "support")
    .replace(/\bjourney\b/gi, "day")
    .trim();
}

function pickBySeed<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length] ?? items[0];
}

export function derivePremiumDailySupport(input: PremiumDailySupportInput): PremiumDailySupportCard | null {
  if (!input.hasPremiumAccess || !input.featureEnabled) {
    return null;
  }

  const pool =
    input.currentHour < 12
      ? MORNING_CARDS
      : input.currentHour >= 18
        ? EVENING_CARDS
        : DAYTIME_CARDS;

  const fatigue = input.todayEntry?.fatigue ?? input.recentFatigueAverage ?? 0;
  const stress = input.todayEntry?.stress ?? input.recentStressAverage ?? 0;
  const sleep = input.todayEntry?.sleep_hours ?? input.recentSleepAverage ?? 8;
  const seed = Math.round(fatigue * 7 + stress * 5 + sleep * 3 + input.currentHour);
  const base = pickBySeed(pool, seed);

  let body = base.body;
  let pacing = base.pacing;

  if (input.lowEnergyMode || fatigue >= 4 || stress >= 4 || sleep < 6.5) {
    body = input.currentHour >= 18 ? "You can let tonight stay quieter if needed." : "Today may feel easier if kept simpler.";
    pacing =
      input.currentHour < 12
        ? "A lower-pressure start may help today."
        : input.currentHour >= 18
          ? "A quieter evening may help the day settle."
          : "A quieter pace could feel easier right now.";
  }

  return {
    title: sanitizeSupportText(base.title),
    body: sanitizeSupportText(body),
    reflection: sanitizeSupportText(base.reflection),
    pacing: sanitizeSupportText(pacing),
    moment: base.moment,
  };
}
