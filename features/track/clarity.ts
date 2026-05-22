import type { DailyCheckIn } from "../checkins/types";

export const LIFE_CONTEXT_TAGS = [
  "stressful day",
  "poor sleep",
  "travel",
  "illness or cold",
  "period or hormonal",
  "high activity",
  "low activity",
  "social day",
  "rest day",
] as const;

export type TrackSummaryCard = {
  title: string;
  body: string;
  metrics: string[];
};

export type TrackClaritySnapshot = {
  recentChanges: string[];
  correlations: string[];
  whatSeemsToHelp: string[];
  fluctuationNote: string | null;
  weeklySummary: TrackSummaryCard | null;
  monthlySummary: TrackSummaryCard | null;
};

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function roundToOne(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function formatAverage(label: string, value: number | null, suffix = "/5") {
  return `${label} ${value === null ? "—" : `${roundToOne(value)}${suffix}`}`;
}

function standardDeviation(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length < 2) {
    return null;
  }

  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance =
    valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

function pearsonCorrelation(xs: number[], ys: number[]) {
  if (xs.length < 5 || ys.length < 5 || xs.length !== ys.length) {
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

function getRecentAndPreviousWeeks(entries: DailyCheckIn[]) {
  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date));
  return {
    recent: sorted.slice(0, 7),
    previous: sorted.slice(7, 14),
  };
}

function describeSleepStabilityChange(recent: DailyCheckIn[], previous: DailyCheckIn[]) {
  const recentSpread = standardDeviation(recent.map((entry) => entry.sleep_hours));
  const previousSpread = standardDeviation(previous.map((entry) => entry.sleep_hours));

  if (recentSpread === null || previousSpread === null) {
    return null;
  }

  const difference = recentSpread - previousSpread;

  if (Math.abs(difference) < 0.35) {
    return null;
  }

  return difference < 0
    ? "Sleep appears a little steadier recently."
    : "Sleep has looked a little less steady recently.";
}

export function deriveWhatChangedRecently(entries: DailyCheckIn[]) {
  const { recent, previous } = getRecentAndPreviousWeeks(entries);

  if (recent.length < 4 || previous.length < 4) {
    return [] as string[];
  }

  const observations: string[] = [];
  const fatigueDifference =
    (average(recent.map((entry) => entry.fatigue)) ?? 0) -
    (average(previous.map((entry) => entry.fatigue)) ?? 0);
  const stressDifference =
    (average(recent.map((entry) => entry.stress)) ?? 0) -
    (average(previous.map((entry) => entry.stress)) ?? 0);
  const moodSpreadDifference =
    (standardDeviation(recent.map((entry) => entry.mood)) ?? 0) -
    (standardDeviation(previous.map((entry) => entry.mood)) ?? 0);

  if (Math.abs(fatigueDifference) >= 0.45) {
    observations.push(
      fatigueDifference > 0
        ? "Fatigue has felt a little heavier recently."
        : "Fatigue has felt a little lighter recently.",
    );
  }

  if (Math.abs(stressDifference) >= 0.45) {
    observations.push(
      stressDifference > 0
        ? "Stress has felt a little heavier recently."
        : "Stress has felt a little lighter recently.",
    );
  }

  if (Math.abs(moodSpreadDifference) >= 0.3) {
    observations.push(
      moodSpreadDifference < 0
        ? "Mood has looked a little steadier recently."
        : "Mood has looked a little more variable recently.",
    );
  }

  const sleepChange = describeSleepStabilityChange(recent, previous);
  if (sleepChange) {
    observations.push(sleepChange);
  }

  return observations.slice(0, 3);
}

type CorrelationCandidate = {
  summary: string;
  supportiveSummary?: string;
  strength: number;
};

function buildCorrelationCandidate(
  entries: DailyCheckIn[],
  key: string,
  leftLabel: string,
  rightLabel: string,
  leftAccessor: (entry: DailyCheckIn) => number | null,
  rightAccessor: (entry: DailyCheckIn) => number | null,
  positiveSummary: string,
  negativeSummary: string,
  supportivePositiveSummary?: string,
  supportiveNegativeSummary?: string,
) {
  const pairs = entries
    .map((entry) => ({
      left: leftAccessor(entry),
      right: rightAccessor(entry),
    }))
    .filter((pair): pair is { left: number; right: number } => pair.left !== null && pair.right !== null);

  const coefficient = pearsonCorrelation(
    pairs.map((pair) => pair.left),
    pairs.map((pair) => pair.right),
  );

  if (coefficient === null || Math.abs(coefficient) < 0.35) {
    return null;
  }

  const positive = coefficient > 0;
  const summary = positive ? positiveSummary : negativeSummary;
  const supportiveSummary = positive
    ? supportivePositiveSummary
    : supportiveNegativeSummary;

  return {
    key,
    leftLabel,
    rightLabel,
    summary,
    supportiveSummary,
    strength: Math.abs(coefficient),
  };
}

export function deriveCalmCorrelations(entries: DailyCheckIn[]) {
  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const candidates = [
    buildCorrelationCandidate(
      sorted,
      "fatigue-sleep",
      "Fatigue",
      "Sleep",
      (entry) => entry.fatigue,
      (entry) => entry.sleep_hours,
      "On days with longer sleep, fatigue often appears a little lighter.",
      "On days with shorter sleep, fatigue often appears a little heavier.",
      "Longer sleep often lines up with lighter fatigue.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      "fatigue-stress",
      "Fatigue",
      "Stress",
      (entry) => entry.fatigue,
      (entry) => entry.stress,
      "On days with higher stress, fatigue often appears a little heavier.",
      "Stress and fatigue do not seem to move in a simple way right now.",
      undefined,
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      "mood-sleep",
      "Mood",
      "Sleep",
      (entry) => entry.mood,
      (entry) => entry.sleep_hours,
      "On days with longer sleep, mood often appears a little steadier.",
      "On days with shorter sleep, mood often appears a little lower.",
      "Longer sleep often lines up with steadier mood.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      "brain-fog-fatigue",
      "Brain fog",
      "Fatigue",
      (entry) => entry.brain_fog,
      (entry) => entry.fatigue,
      "On days with heavier fatigue, brain fog often appears a little more present.",
      "Brain fog and fatigue are not moving together in a simple way right now.",
    ),
    buildCorrelationCandidate(
      sorted,
      "pain-stress",
      "Pain",
      "Stress",
      (entry) => entry.pain,
      (entry) => entry.stress,
      "On days with higher stress, pain often appears a little more noticeable.",
      "Pain and stress are not moving together in a simple way right now.",
    ),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return candidates
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 3)
    .map((item) => item.summary);
}

export function deriveWhatSeemsToHelp(entries: DailyCheckIn[]) {
  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const suggestions: Array<{ summary: string; strength: number }> = [];
  const correlationCandidates = [
    buildCorrelationCandidate(
      sorted,
      "fatigue-sleep",
      "Fatigue",
      "Sleep",
      (entry) => entry.fatigue,
      (entry) => entry.sleep_hours,
      "On days with longer sleep, fatigue often appears a little lighter.",
      "On days with shorter sleep, fatigue often appears a little heavier.",
      "Longer sleep often lines up with lighter fatigue.",
    ),
    buildCorrelationCandidate(
      sorted,
      "mood-sleep",
      "Mood",
      "Sleep",
      (entry) => entry.mood,
      (entry) => entry.sleep_hours,
      "On days with longer sleep, mood often appears a little steadier.",
      "On days with shorter sleep, mood often appears a little lower.",
      "Longer sleep often lines up with steadier mood.",
    ),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  for (const candidate of correlationCandidates) {
    if (candidate.supportiveSummary) {
      suggestions.push({
        summary: candidate.supportiveSummary,
        strength: candidate.strength,
      });
    }
  }

  const hydrationPairs = sorted.filter(
    (entry): entry is DailyCheckIn & { water_glasses: number; fatigue: number } =>
      entry.water_glasses !== null && entry.fatigue !== null,
  );
  const higherHydration = average(
    hydrationPairs.filter((entry) => entry.water_glasses >= 6).map((entry) => entry.fatigue),
  );
  const lowerHydration = average(
    hydrationPairs.filter((entry) => entry.water_glasses < 6).map((entry) => entry.fatigue),
  );

  if (
    hydrationPairs.length >= 6 &&
    higherHydration !== null &&
    lowerHydration !== null &&
    higherHydration + 0.35 < lowerHydration
  ) {
    suggestions.push({
      summary: "Check-ins with hydration noted sometimes look a little easier.",
      strength: lowerHydration - higherHydration,
    });
  }

  const restDayEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { fatigue: number; triggers: string[] } =>
      entry.fatigue !== null && Array.isArray(entry.triggers),
  );
  const restDayFatigue = average(
    restDayEntries
      .filter((entry) => entry.triggers.includes("rest day"))
      .map((entry) => entry.fatigue),
  );
  const nonRestDayFatigue = average(
    restDayEntries
      .filter((entry) => !entry.triggers.includes("rest day"))
      .map((entry) => entry.fatigue),
  );

  if (
    restDayEntries.length >= 6 &&
    restDayFatigue !== null &&
    nonRestDayFatigue !== null &&
    restDayFatigue + 0.35 < nonRestDayFatigue
  ) {
    suggestions.push({
      summary: "Rest days sometimes line up with lighter fatigue.",
      strength: nonRestDayFatigue - restDayFatigue,
    });
  }

  return suggestions
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 2)
    .map((item) => item.summary);
}

export function deriveFluctuationNote(entries: DailyCheckIn[]) {
  const recent = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  if (recent.length < 4) {
    return null;
  }

  const fatigueValues = recent.map((entry) => entry.fatigue).filter((value): value is number => value !== null);
  const moodValues = recent.map((entry) => entry.mood).filter((value): value is number => value !== null);
  const stressValues = recent.map((entry) => entry.stress).filter((value): value is number => value !== null);

  const fatigueRange = fatigueValues.length ? Math.max(...fatigueValues) - Math.min(...fatigueValues) : 0;
  const moodRange = moodValues.length ? Math.max(...moodValues) - Math.min(...moodValues) : 0;
  const stressRange = stressValues.length ? Math.max(...stressValues) - Math.min(...stressValues) : 0;

  if (fatigueRange >= 2) {
    return "Your energy has varied this week. Fluctuation can happen, and one difficult day does not define the whole pattern.";
  }

  if (stressRange >= 2) {
    return "Stress has moved around this week. A heavier day can be part of a larger pattern, not the whole story.";
  }

  if (moodRange >= 2) {
    return "Mood has shifted around this week. It may help to look at the stretch gently rather than any single day.";
  }

  return null;
}

function describeSleepTrend(entries: DailyCheckIn[]) {
  const recent = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const previous = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14);

  if (recent.length < 4 || previous.length < 4) {
    return "Sleep patterns are still taking shape.";
  }

  const sleepChange = describeSleepStabilityChange(recent, previous);
  return sleepChange ?? "Sleep has looked fairly steady lately.";
}

function buildSummaryCard(
  title: string,
  entries: DailyCheckIn[],
  dayCount: number,
): TrackSummaryCard | null {
  if (entries.length < Math.max(4, Math.ceil(dayCount / 3))) {
    return null;
  }

  const sorted = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, dayCount);
  const consistency = `${sorted.length} check-in${sorted.length === 1 ? "" : "s"} logged`;
  return {
    title,
    body:
      dayCount === 7
        ? "A quieter read on this week so far."
        : "A gentler monthly overview to make the bigger picture easier to hold.",
    metrics: [
      formatAverage("Fatigue", average(sorted.map((entry) => entry.fatigue))),
      formatAverage("Mood", average(sorted.map((entry) => entry.mood))),
      formatAverage("Stress", average(sorted.map((entry) => entry.stress))),
      `Sleep ${roundToOne(average(sorted.map((entry) => entry.sleep_hours))) ?? "—"}h`,
      consistency,
      describeSleepTrend(sorted),
    ],
  };
}

export function buildTrackClaritySnapshot(entries: DailyCheckIn[]): TrackClaritySnapshot {
  return {
    recentChanges: deriveWhatChangedRecently(entries),
    correlations: deriveCalmCorrelations(entries),
    whatSeemsToHelp: deriveWhatSeemsToHelp(entries),
    fluctuationNote: deriveFluctuationNote(entries),
    weeklySummary: buildSummaryCard("This week at a glance", entries, 7),
    monthlySummary: buildSummaryCard("This month at a glance", entries, 30),
  };
}
