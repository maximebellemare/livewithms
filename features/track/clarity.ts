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
    ? "Sleep has been more consistent than the previous week."
    : "Sleep has been less consistent than the previous week.";
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
        ? "Fatigue is higher than the previous week."
        : "Fatigue is lower than the previous week.",
    );
  }

  if (Math.abs(stressDifference) >= 0.45) {
    observations.push(
      stressDifference > 0
        ? "Stress is higher than the previous week."
        : "Stress is lower than the previous week.",
    );
  }

  if (Math.abs(moodSpreadDifference) >= 0.3) {
    observations.push(
      moodSpreadDifference < 0
        ? "Mood is more stable than the previous week."
        : "Mood is less stable than the previous week.",
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
  negativeSummary: string | null,
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
  if (!positive && !negativeSummary) {
    return null;
  }

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
      "Longer sleep days often line up with higher fatigue.",
      "Shorter sleep days often line up with higher fatigue.",
      undefined,
      "Shorter sleep days often line up with higher fatigue.",
    ),
    buildCorrelationCandidate(
      sorted,
      "fatigue-sleep-lower",
      "Fatigue",
      "Sleep",
      (entry) => entry.sleep_hours,
      (entry) => entry.fatigue,
      "Longer sleep days often line up with lower fatigue.",
      null,
      "Longer sleep days often line up with lower fatigue.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      "fatigue-stress",
      "Fatigue",
      "Stress",
      (entry) => entry.fatigue,
      (entry) => entry.stress,
      "Higher-stress days often line up with higher fatigue.",
      null,
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
      "Longer sleep days often line up with steadier mood.",
      "Shorter sleep days often line up with lower mood.",
      "Longer sleep days often line up with steadier mood.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      "brain-fog-fatigue",
      "Brain fog",
      "Fatigue",
      (entry) => entry.brain_fog,
      (entry) => entry.fatigue,
      "Higher-fatigue days often line up with more brain fog.",
      null,
    ),
    buildCorrelationCandidate(
      sorted,
      "pain-stress",
      "Pain",
      "Stress",
      (entry) => entry.pain,
      (entry) => entry.stress,
      "Higher-stress days often line up with higher pain.",
      null,
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
      "Longer sleep days often line up with higher fatigue.",
      "Shorter sleep days often line up with higher fatigue.",
      undefined,
      "Shorter sleep days often line up with higher fatigue.",
    ),
    buildCorrelationCandidate(
      sorted,
      "fatigue-sleep-lower",
      "Fatigue",
      "Sleep",
      (entry) => entry.sleep_hours,
      (entry) => entry.fatigue,
      "Longer sleep days often line up with lower fatigue.",
      null,
      "Longer sleep days often line up with lower fatigue.",
    ),
    buildCorrelationCandidate(
      sorted,
      "mood-sleep",
      "Mood",
      "Sleep",
      (entry) => entry.mood,
      (entry) => entry.sleep_hours,
      "Longer sleep days often line up with steadier mood.",
      "Shorter sleep days often line up with lower mood.",
      "Longer sleep days often line up with steadier mood.",
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
      summary: "Days with higher hydration often line up with lower fatigue.",
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
      summary: "Rest days often line up with lower fatigue.",
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
    return "Fatigue has varied by 2 or more points this week.";
  }

  if (stressRange >= 2) {
    return "Stress has varied by 2 or more points this week.";
  }

  if (moodRange >= 2) {
    return "Mood has varied by 2 or more points this week.";
  }

  return null;
}

function describeSleepTrend(entries: DailyCheckIn[]) {
  const recent = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const previous = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14);

  if (recent.length < 4 || previous.length < 4) {
    return "Not enough sleep entries yet.";
  }

  const sleepChange = describeSleepStabilityChange(recent, previous);
  return sleepChange ?? "Sleep has been fairly steady recently.";
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
        ? "Average values from recent check-ins."
        : "Average values across the past month.",
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
