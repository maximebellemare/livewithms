import type { DailyCheckIn } from "../checkins/types";

export type PatternInsightSection = {
  title: string;
  helper: string;
  items: string[];
  empty: string;
};

export type PatternConfidenceStage = "early" | "emerging" | "stronger";

export type PatternIntelligence = {
  summary: string;
  stage: PatternConfidenceStage;
  stageLabel: string;
  progressionMessage: string;
  sections: PatternInsightSection[];
};

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function dateDiffInDays(leftDate: string, rightDate: string) {
  const left = new Date(`${leftDate}T00:00:00`);
  const right = new Date(`${rightDate}T00:00:00`);
  const difference = right.getTime() - left.getTime();

  if (Number.isNaN(difference)) {
    return null;
  }

  return Math.round(difference / 86_400_000);
}

function countSameDay(entries: DailyCheckIn[], matches: (entry: DailyCheckIn) => boolean) {
  return entries.filter(matches).length;
}

function countNextDay(
  entries: DailyCheckIn[],
  currentDayMatches: (entry: DailyCheckIn) => boolean,
  nextDayMatches: (entry: DailyCheckIn) => boolean,
) {
  const sorted = entries.slice().sort((left, right) => left.date.localeCompare(right.date));
  let count = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    if (dateDiffInDays(sorted[index].date, sorted[index + 1].date) !== 1) {
      continue;
    }

    if (currentDayMatches(sorted[index]) && nextDayMatches(sorted[index + 1])) {
      count += 1;
    }
  }

  return count;
}

function unique(items: string[]) {
  return items.filter((item, index, all) => all.indexOf(item) === index);
}

function compareLatest(entries: DailyCheckIn[]) {
  const sorted = entries.slice().sort((left, right) => right.date.localeCompare(left.date));
  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;

  if (!latest || !previous) {
    return [];
  }

  const changes: string[] = [];
  const comparisons: Array<{
    label: string;
    current: number | null;
    prior: number | null;
    threshold: number;
    higherWord: string;
    lowerWord: string;
  }> = [
    {
      label: "Fatigue",
      current: latest.fatigue,
      prior: previous.fatigue,
      threshold: 1,
      higherWord: "higher",
      lowerWord: "lower",
    },
    {
      label: "Stress",
      current: latest.stress,
      prior: previous.stress,
      threshold: 1,
      higherWord: "higher",
      lowerWord: "lower",
    },
    {
      label: "Mood",
      current: latest.mood,
      prior: previous.mood,
      threshold: 1,
      higherWord: "higher",
      lowerWord: "lower",
    },
    {
      label: "Sleep",
      current: latest.sleep_hours,
      prior: previous.sleep_hours,
      threshold: 0.75,
      higherWord: "longer",
      lowerWord: "shorter",
    },
  ];

  for (const comparison of comparisons) {
    if (typeof comparison.current !== "number" || typeof comparison.prior !== "number") {
      continue;
    }

    const difference = comparison.current - comparison.prior;
    if (Math.abs(difference) < comparison.threshold) {
      continue;
    }

    changes.push(
      `${comparison.label} was ${
        difference > 0 ? comparison.higherWord : comparison.lowerWord
      } than your previous check-in.`,
    );
  }

  return changes;
}

function metricRange(entries: DailyCheckIn[], selector: (entry: DailyCheckIn) => number | null) {
  const values = entries.map(selector).filter((value): value is number => typeof value === "number");
  if (values.length < 2) {
    return null;
  }

  return Math.max(...values) - Math.min(...values);
}

function splitByCondition(
  entries: DailyCheckIn[],
  condition: (entry: DailyCheckIn) => boolean,
  selector: (entry: DailyCheckIn) => number | null,
) {
  const matching = average(entries.filter(condition).map(selector));
  const other = average(entries.filter((entry) => !condition(entry)).map(selector));

  if (matching === null || other === null) {
    return null;
  }

  return matching - other;
}

function getStage(entryCount: number): PatternConfidenceStage {
  if (entryCount <= 4) {
    return "early";
  }

  if (entryCount <= 10) {
    return "emerging";
  }

  return "stronger";
}

function getStageLabel(stage: PatternConfidenceStage) {
  if (stage === "early") {
    return "Early insights";
  }

  if (stage === "emerging") {
    return "Emerging patterns";
  }

  return "Stronger patterns";
}

function getProgressionMessage(stage: PatternConfidenceStage) {
  if (stage === "early") {
    return "Early patterns are lightweight. More check-ins help them become more personalized over time.";
  }

  if (stage === "emerging") {
    return "Patterns are becoming more personal as recent check-ins build.";
  }

  return "These patterns use a broader check-in history for stronger signal.";
}

function buildEarlySections(entries: DailyCheckIn[]): PatternInsightSection[] {
  const latest = entries.slice().sort((left, right) => right.date.localeCompare(left.date))[0] ?? null;
  const changes = compareLatest(entries);
  const fatigueRange = metricRange(entries, (entry) => entry.fatigue);
  const stressRange = metricRange(entries, (entry) => entry.stress);
  const moodRange = metricRange(entries, (entry) => entry.mood);
  const lowSleepFatigueDifference = splitByCondition(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => entry.fatigue,
  );
  const highStressFatigueDifference = splitByCondition(
    entries,
    (entry) => (entry.stress ?? 0) >= 4,
    (entry) => entry.fatigue,
  );
  const highStressMoodDifference = splitByCondition(
    entries,
    (entry) => (entry.stress ?? 0) >= 4,
    (entry) => entry.mood,
  );
  const lowSleepBrainFogDifference = splitByCondition(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => entry.brain_fog,
  );
  const earlySignals = unique([
    ...changes,
    stressRange !== null && moodRange !== null && stressRange > moodRange
      ? "Stress has fluctuated more than mood so far."
      : null,
    moodRange !== null && moodRange <= 1 && entries.length >= 2 ? "Mood has stayed relatively stable so far." : null,
    fatigueRange !== null && fatigueRange >= 2 ? "Fatigue has already varied by 2 or more points." : null,
    lowSleepFatigueDifference !== null && lowSleepFatigueDifference >= 0.5
      ? "Fatigue appears slightly higher on lower-sleep days so far."
      : null,
    highStressFatigueDifference !== null && highStressFatigueDifference >= 0.5
      ? "Fatigue appears slightly higher on higher-stress days so far."
      : null,
    highStressMoodDifference !== null && highStressMoodDifference <= -0.5
      ? "Mood appears lower on higher-stress days so far."
      : null,
    lowSleepBrainFogDifference !== null && lowSleepBrainFogDifference >= 0.5
      ? "Brain fog appears slightly higher after lower sleep so far."
      : null,
  ].filter((item): item is string => Boolean(item)));

  return [
    {
      title: "What we're starting to notice",
      helper: "Early observations from the check-ins available so far.",
      items: earlySignals,
      empty: "Your first check-in gives Insights a starting point.",
    },
    {
      title: "What to log next",
      helper: "Small additions that make future patterns easier to see.",
      items: unique([
        typeof latest?.sleep_hours === "number" && typeof latest?.fatigue === "number"
          ? "Keep logging sleep and fatigue to see whether they move together."
          : null,
        "Keep logging fatigue, stress, sleep, and brain fog when possible.",
        "Add context tags like high activity, rest day, or poor sleep when they apply.",
        entries.length < 3 ? "A few more check-ins will make patterns more personal." : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "A few more check-ins will make patterns more personal.",
    },
  ];
}

function buildRelationshipSections(entries: DailyCheckIn[], range: 7 | 30, stage: PatternConfidenceStage): PatternInsightSection[] {
  const label = range === 7 ? "this week" : "this month";
  const sameDayThreshold = stage === "stronger" ? 2 : 1;
  const stressFatigueSameDay = countSameDay(
    entries,
    (entry) => (entry.stress ?? 0) >= 4 && (entry.fatigue ?? 0) >= 4,
  );
  const stressFatigueNextDay = countNextDay(
    entries,
    (entry) => (entry.stress ?? 0) >= 4,
    (entry) => (entry.fatigue ?? 0) >= 4,
  );
  const shortSleepFatigue = countNextDay(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => (entry.fatigue ?? 0) >= 4,
  );
  const highDemandFatigue = countNextDay(
    entries,
    (entry) => (entry.triggers ?? []).some((trigger) => ["high activity", "social day", "travel"].includes(trigger)),
    (entry) => (entry.fatigue ?? 0) >= 4 || (entry.brain_fog ?? 0) >= 4,
  );
  const highStressBrainFog = countSameDay(
    entries,
    (entry) => (entry.stress ?? 0) >= 4 && (entry.brain_fog ?? 0) >= 4,
  );
  const poorSleepStress = countSameDay(
    entries,
    (entry) => (entry.triggers ?? []).includes("poor sleep") && (entry.stress ?? 0) >= 4,
  );
  const shortSleepStress = countNextDay(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => (entry.stress ?? 0) >= 4,
  );
  const highDemandStress = countSameDay(
    entries,
    (entry) =>
      (entry.triggers ?? []).some((trigger) => ["high activity", "social day", "travel"].includes(trigger)) &&
      (entry.stress ?? 0) >= 4,
  );
  const shortSleepBrainFog = countNextDay(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => (entry.brain_fog ?? 0) >= 4,
  );
  const lowerStressWithRest = countSameDay(
    entries,
    (entry) => (entry.triggers ?? []).includes("rest day") && typeof entry.stress === "number" && entry.stress <= 2,
  );
  const lowerFatigueWithHydration = countSameDay(
    entries,
    (entry) => (entry.water_glasses ?? 0) >= 6 && typeof entry.fatigue === "number" && entry.fatigue <= 2,
  );
  const lowerFatigueWithLongerSleep = countSameDay(
    entries,
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours >= 7 && typeof entry.fatigue === "number" && entry.fatigue <= 3,
  );
  const fatigueRange = metricRange(entries, (entry) => entry.fatigue);
  const stressRange = metricRange(entries, (entry) => entry.stress);
  const brainFogCount = countSameDay(entries, (entry) => (entry.brain_fog ?? 0) >= 4);

  return [
    {
      title: "What affects energy",
      helper: "Relationships that may explain fatigue or energy changes.",
      items: unique([
        stressFatigueSameDay >= sameDayThreshold
          ? `Higher stress matched higher fatigue ${stressFatigueSameDay} times ${label}.`
          : null,
        stressFatigueNextDay >= 1
          ? `Higher stress was followed by higher fatigue ${stressFatigueNextDay} time${stressFatigueNextDay === 1 ? "" : "s"}.`
          : null,
        shortSleepFatigue >= 1
          ? `Shorter sleep was followed by higher fatigue ${shortSleepFatigue} time${shortSleepFatigue === 1 ? "" : "s"}.`
          : null,
        highDemandFatigue >= 1
          ? `Higher-demand days were followed by more fatigue or brain fog ${highDemandFatigue} time${highDemandFatigue === 1 ? "" : "s"}.`
          : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "Energy patterns will become clearer as sleep, stress, and activity context build.",
    },
    {
      title: "What increases stress",
      helper: "Context that may be adding load.",
      items: unique([
        poorSleepStress >= 1 ? `Poor-sleep context matched higher stress ${poorSleepStress} time${poorSleepStress === 1 ? "" : "s"}.` : null,
        shortSleepStress >= 1
          ? `Shorter sleep was followed by higher stress ${shortSleepStress} time${shortSleepStress === 1 ? "" : "s"}.`
          : null,
        highDemandStress >= 1
          ? `Higher-demand context matched higher stress ${highDemandStress} time${highDemandStress === 1 ? "" : "s"}.`
          : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "Stress patterns will become clearer when sleep and daily-demand context build.",
    },
    {
      title: "Brain fog and stress",
      helper: "Signals connected with cognitive load.",
      items: unique([
        highStressBrainFog >= sameDayThreshold ? `Higher stress matched higher brain fog ${highStressBrainFog} times ${label}.` : null,
        shortSleepBrainFog >= 1
          ? `Shorter sleep was followed by higher brain fog ${shortSleepBrainFog} time${shortSleepBrainFog === 1 ? "" : "s"}.`
          : null,
        brainFogCount >= (stage === "stronger" ? 3 : 2) ? `Brain fog was higher on ${brainFogCount} check-ins ${label}.` : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "Brain fog patterns will appear as stress, sleep, and context entries build.",
    },
    {
      title: "What appears to help recovery",
      helper: "Signals that may show what helps recovery or lowers symptom load.",
      items: unique([
        lowerFatigueWithLongerSleep >= sameDayThreshold
          ? `Longer sleep matched lower fatigue ${lowerFatigueWithLongerSleep} times ${label}.`
          : null,
        lowerFatigueWithHydration >= sameDayThreshold
          ? `Higher hydration matched lower fatigue ${lowerFatigueWithHydration} times ${label}.`
          : null,
        lowerStressWithRest >= 1
          ? `Rest-day context matched lower stress ${lowerStressWithRest} time${lowerStressWithRest === 1 ? "" : "s"}.`
          : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "Recovery signals will become clearer when rest, hydration, sleep, and demand levels are logged.",
    },
    {
      title: "Watch for",
      helper: "Changes worth noticing, without turning them into alarm signals.",
      items: unique([
        fatigueRange !== null && fatigueRange >= 2 ? `Fatigue varied by ${fatigueRange} points ${label}.` : null,
        stressRange !== null && stressRange >= 2 ? `Stress varied by ${stressRange} points ${label}.` : null,
        highDemandFatigue >= 1 ? "Consider pacing after high-demand days when fatigue or brain fog follows." : null,
      ].filter((item): item is string => Boolean(item))),
      empty: "No clear watch item stands out in this range.",
    },
  ];
}

export function buildPatternIntelligence(entries: DailyCheckIn[], range: 7 | 30): PatternIntelligence {
  const sorted = entries.slice().sort((left, right) => right.date.localeCompare(left.date));
  const stage = getStage(sorted.length);
  const stageLabel = getStageLabel(stage);
  const progressionMessage = getProgressionMessage(stage);

  if (sorted.length === 0) {
    return {
      summary: "Start with one check-in to begin seeing useful patterns.",
      stage,
      stageLabel,
      progressionMessage,
      sections: buildEarlySections(sorted),
    };
  }

  if (stage === "early") {
    const earlySections = buildEarlySections(sorted);
    const firstInsight = earlySections.flatMap((section) => section.items)[0];
    return {
      summary: firstInsight ?? "Early check-ins are enough to start simple comparisons.",
      stage,
      stageLabel,
      progressionMessage,
      sections: earlySections,
    };
  }

  const sections = buildRelationshipSections(sorted, range, stage);
  const firstInsight = sections.flatMap((section) => section.items)[0];
  const recentAverageStress = average(sorted.slice(0, Math.ceil(sorted.length / 2)).map((entry) => entry.stress));
  const olderAverageStress = average(sorted.slice(Math.ceil(sorted.length / 2)).map((entry) => entry.stress));
  const stressSummary =
    recentAverageStress !== null && olderAverageStress !== null && Math.abs(recentAverageStress - olderAverageStress) >= 0.5
      ? `Stress is ${recentAverageStress > olderAverageStress ? "higher" : "lower"} in the most recent part of this range.`
      : null;

  return {
    summary: firstInsight ?? stressSummary ?? "Insights are looking for concrete relationships across recent check-ins.",
    stage,
    stageLabel,
    progressionMessage,
    sections,
  };
}
