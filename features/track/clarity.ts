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

export type TrackInsightLabel = "Improving" | "Stable" | "Needs attention" | "Not enough data yet";

export type TrackInsightStatus = {
  label: TrackInsightLabel;
  body: string;
};

export type TrackAtGlanceItem = {
  label: string;
  value: string;
  detail?: string;
  status: TrackInsightLabel;
};

export type TrackPatternCard = {
  title: string;
  body: string;
  basedOn: string;
};

export type TrackSuggestionCard = {
  title: string;
  body: string;
};

export type TrackClaritySnapshot = {
  recentChanges: string[];
  correlations: string[];
  whatSeemsToHelp: string[];
  fluctuationNote: string | null;
  weeklySummary: TrackSummaryCard | null;
  monthlySummary: TrackSummaryCard | null;
  insightStatus: TrackInsightStatus;
  atGlance: TrackAtGlanceItem[];
  possiblePatterns: TrackPatternCard[];
  nextSteps: TrackSuggestionCard[];
  emptyState: string | null;
};

type MetricKey = "fatigue" | "stress" | "mood" | "sleep_hours" | "water_glasses" | "pain" | "brain_fog" | "mobility";

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
  return `${label} ${value === null ? "-" : `${roundToOne(value)}${suffix}`}`;
}

function standardDeviation(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length < 2) {
    return null;
  }

  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

function pearsonCorrelation(xs: number[], ys: number[]) {
  if (xs.length < 5 || ys.length < 5 || xs.length !== ys.length) {
    return null;
  }

  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  const numerator = xs.reduce((sum, value, index) => sum + (value - meanX) * (ys[index] - meanY), 0);
  const denominator = Math.sqrt(
    xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0) *
      ys.reduce((sum, value) => sum + (value - meanY) ** 2, 0),
  );

  if (!denominator) {
    return null;
  }

  return numerator / denominator;
}

function getSortedEntries(entries: DailyCheckIn[]) {
  return entries.slice().sort((a, b) => b.date.localeCompare(a.date));
}

function getRecentAndPreviousWeeks(entries: DailyCheckIn[]) {
  const sorted = getSortedEntries(entries);
  return {
    recent: sorted.slice(0, 7),
    previous: sorted.slice(7, 14),
  };
}

function getMetricValues(entries: DailyCheckIn[], key: MetricKey) {
  return entries.map((entry) => entry[key] ?? null);
}

function getMetricAverage(entries: DailyCheckIn[], key: MetricKey) {
  return average(getMetricValues(entries, key));
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
    ? "Sleep looked more consistent than the previous week."
    : "Sleep looked less consistent than the previous week.";
}

function getTrendLabel(
  recentAverage: number | null,
  previousAverage: number | null,
  options: {
    higherIsBetter: boolean;
    threshold?: number;
  },
): TrackInsightLabel {
  if (recentAverage === null || previousAverage === null) {
    return "Not enough data yet";
  }

  const threshold = options.threshold ?? 0.35;
  const difference = recentAverage - previousAverage;

  if (Math.abs(difference) < threshold) {
    return "Stable";
  }

  const improved = options.higherIsBetter ? difference > 0 : difference < 0;
  return improved ? "Improving" : "Needs attention";
}

function formatTrendText(label: string, trend: TrackInsightLabel) {
  switch (trend) {
    case "Improving":
      return `${label} is improving`;
    case "Stable":
      return `${label} looks stable`;
    case "Needs attention":
      return `${label} needs attention`;
    default:
      return `${label} needs more data`;
  }
}

function formatDayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getEnergyLabelFromFatigue(fatigueAverage: number | null) {
  if (fatigueAverage === null) {
    return "Not enough data yet";
  }
  if (fatigueAverage >= 3.6) {
    return "Lower";
  }
  if (fatigueAverage >= 2.3) {
    return "Medium";
  }
  return "Stable";
}

function getBestAndHardestDays(entries: DailyCheckIn[]) {
  const recent = getSortedEntries(entries).slice(0, 7);
  const scored = recent
    .map((entry) => {
      const values = [
        entry.mood !== null ? entry.mood : null,
        entry.fatigue !== null ? 5 - entry.fatigue : null,
        entry.stress !== null ? 5 - entry.stress : null,
        entry.pain !== null ? 5 - entry.pain : null,
        entry.brain_fog !== null ? 5 - entry.brain_fog : null,
        entry.mobility !== null ? 5 - entry.mobility : null,
      ].filter((value): value is number => value !== null);

      if (values.length < 3) {
        return null;
      }

      return {
        date: entry.date,
        score: values.reduce((sum, value) => sum + value, 0) / values.length,
      };
    })
    .filter((entry): entry is { date: string; score: number } => Boolean(entry));

  if (scored.length < 3) {
    return {
      bestDay: null,
      hardestDay: null,
    };
  }

  const bestDay = scored.reduce((best, current) => (current.score > best.score ? current : best));
  const hardestDay = scored.reduce((hardest, current) => (current.score < hardest.score ? current : hardest));

  return {
    bestDay: bestDay.date,
    hardestDay: hardestDay.date,
  };
}

function buildAtGlance(entries: DailyCheckIn[]) {
  const { recent, previous } = getRecentAndPreviousWeeks(entries);
  if (recent.length < 4) {
    return [] as TrackAtGlanceItem[];
  }

  const symptomCandidates = [
    {
      label: "Fatigue",
      count: recent.filter((entry) => (entry.fatigue ?? 0) >= 3).length,
      average: getMetricAverage(recent, "fatigue") ?? 0,
    },
    {
      label: "Brain fog",
      count: recent.filter((entry) => (entry.brain_fog ?? 0) >= 3).length,
      average: getMetricAverage(recent, "brain_fog") ?? 0,
    },
    {
      label: "Stress",
      count: recent.filter((entry) => (entry.stress ?? 0) >= 3).length,
      average: getMetricAverage(recent, "stress") ?? 0,
    },
    {
      label: "Pain",
      count: recent.filter((entry) => (entry.pain ?? 0) >= 3).length,
      average: getMetricAverage(recent, "pain") ?? 0,
    },
    {
      label: "Mobility strain",
      count: recent.filter((entry) => (entry.mobility ?? 0) >= 3).length,
      average: getMetricAverage(recent, "mobility") ?? 0,
    },
  ].sort((left, right) => right.count - left.count || right.average - left.average);

  const topSymptom = symptomCandidates[0];
  const fatigueRecent = getMetricAverage(recent, "fatigue");
  const fatiguePrevious = getMetricAverage(previous, "fatigue");
  const moodRecent = getMetricAverage(recent, "mood");
  const moodPrevious = getMetricAverage(previous, "mood");
  const sleepRecent = getMetricAverage(recent, "sleep_hours");
  const sleepPrevious = getMetricAverage(previous, "sleep_hours");
  const hydrationRecent = getMetricAverage(recent, "water_glasses");
  const hydrationPrevious = getMetricAverage(previous, "water_glasses");
  const bestAndHardest = getBestAndHardestDays(entries);

  return [
    {
      label: "Most common this week",
      value: topSymptom && topSymptom.count >= 2 ? topSymptom.label : "Not enough pattern yet",
      detail: topSymptom && topSymptom.count >= 2 ? `${topSymptom.count} recent check-ins showed this more strongly.` : "Track a few more days to surface a recurring pattern.",
      status: topSymptom && topSymptom.count >= 2 ? "Needs attention" : "Not enough data yet",
    },
    {
      label: "Energy",
      value: getEnergyLabelFromFatigue(fatigueRecent),
      detail: fatigueRecent !== null ? `Based on average fatigue of ${roundToOne(fatigueRecent)}/5.` : "Based on recent fatigue check-ins.",
      status: getTrendLabel(fatigueRecent, fatiguePrevious, { higherIsBetter: false }),
    },
    {
      label: "Best day",
      value: bestAndHardest.bestDay ? formatDayLabel(bestAndHardest.bestDay) : "Not enough data yet",
      detail: bestAndHardest.bestDay ? "This day looked lighter overall." : "A few more complete check-ins will make this clearer.",
      status: bestAndHardest.bestDay ? "Improving" : "Not enough data yet",
    },
    {
      label: "Hardest day",
      value: bestAndHardest.hardestDay ? formatDayLabel(bestAndHardest.hardestDay) : "Not enough data yet",
      detail: bestAndHardest.hardestDay ? "This day looked heavier overall." : "A few more complete check-ins will make this clearer.",
      status: bestAndHardest.hardestDay ? "Needs attention" : "Not enough data yet",
    },
    {
      label: "Sleep trend",
      value: formatTrendText("Sleep", getTrendLabel(sleepRecent, sleepPrevious, { higherIsBetter: true, threshold: 0.4 })),
      detail: sleepRecent !== null ? `Recent average: ${roundToOne(sleepRecent)} hours.` : "Track sleep to unlock this trend.",
      status: getTrendLabel(sleepRecent, sleepPrevious, { higherIsBetter: true, threshold: 0.4 }),
    },
    {
      label: "Hydration trend",
      value: formatTrendText("Hydration", getTrendLabel(hydrationRecent, hydrationPrevious, { higherIsBetter: true, threshold: 0.5 })),
      detail: hydrationRecent !== null ? `Recent average: ${roundToOne(hydrationRecent)} glasses.` : "Track hydration to unlock this trend.",
      status: getTrendLabel(hydrationRecent, hydrationPrevious, { higherIsBetter: true, threshold: 0.5 }),
    },
    {
      label: "Mood trend",
      value: formatTrendText("Mood", getTrendLabel(moodRecent, moodPrevious, { higherIsBetter: true, threshold: 0.35 })),
      detail: moodRecent !== null ? `Recent average: ${roundToOne(moodRecent)}/5.` : "Track mood to unlock this trend.",
      status: getTrendLabel(moodRecent, moodPrevious, { higherIsBetter: true, threshold: 0.35 }),
    },
  ];
}

export function deriveWhatChangedRecently(entries: DailyCheckIn[]) {
  const { recent, previous } = getRecentAndPreviousWeeks(entries);

  if (recent.length < 4 || previous.length < 4) {
    return [] as string[];
  }

  const observations: string[] = [];
  const fatigueDifference = (average(recent.map((entry) => entry.fatigue)) ?? 0) - (average(previous.map((entry) => entry.fatigue)) ?? 0);
  const stressDifference = (average(recent.map((entry) => entry.stress)) ?? 0) - (average(previous.map((entry) => entry.stress)) ?? 0);
  const moodSpreadDifference = (standardDeviation(recent.map((entry) => entry.mood)) ?? 0) - (standardDeviation(previous.map((entry) => entry.mood)) ?? 0);

  if (Math.abs(fatigueDifference) >= 0.45) {
    observations.push(
      fatigueDifference > 0
        ? "Fatigue looked higher than the previous week."
        : "Fatigue looked lower than the previous week.",
    );
  }

  if (Math.abs(stressDifference) >= 0.45) {
    observations.push(
      stressDifference > 0
        ? "Stress looked higher than the previous week."
        : "Stress looked lower than the previous week.",
    );
  }

  if (Math.abs(moodSpreadDifference) >= 0.3) {
    observations.push(
      moodSpreadDifference < 0
        ? "Mood looked more stable than the previous week."
        : "Mood looked less stable than the previous week.",
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

  return {
    summary: positive ? positiveSummary : negativeSummary,
    supportiveSummary: positive ? supportivePositiveSummary : supportiveNegativeSummary,
    strength: Math.abs(coefficient),
  };
}

export function deriveCalmCorrelations(entries: DailyCheckIn[]) {
  const sorted = getSortedEntries(entries).slice(0, 30);
  const candidates = [
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.fatigue,
      (entry) => entry.sleep_hours,
      "Longer sleep and fatigue appeared together in recent check-ins.",
      "Shorter sleep and higher fatigue appeared together in recent check-ins.",
      undefined,
      "Shorter sleep and higher fatigue appeared together in recent check-ins.",
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.sleep_hours,
      (entry) => entry.fatigue,
      "Longer sleep and lower fatigue appeared together in recent check-ins.",
      null,
      "Longer sleep and lower fatigue appeared together in recent check-ins.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.fatigue,
      (entry) => entry.stress,
      "Higher stress and higher fatigue appeared together in recent check-ins.",
      null,
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.mood,
      (entry) => entry.sleep_hours,
      "Longer sleep and more stable mood appeared together in recent check-ins.",
      "Shorter sleep and lower mood appeared together in recent check-ins.",
      "Longer sleep and more stable mood appeared together in recent check-ins.",
      undefined,
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.brain_fog,
      (entry) => entry.fatigue,
      "Higher fatigue and more brain fog appeared together in recent check-ins.",
      null,
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.pain,
      (entry) => entry.stress,
      "Higher stress and higher pain appeared together in recent check-ins.",
      null,
    ),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return candidates
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 3)
    .map((item) => item.summary);
}

export function deriveWhatSeemsToHelp(entries: DailyCheckIn[]) {
  const sorted = getSortedEntries(entries).slice(0, 30);
  const suggestions: Array<{ summary: string; strength: number }> = [];
  const correlationCandidates = [
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.fatigue,
      (entry) => entry.sleep_hours,
      "Longer sleep and fatigue appeared together in recent check-ins.",
      "Shorter sleep and higher fatigue appeared together in recent check-ins.",
      undefined,
      "Shorter sleep and higher fatigue appeared together in recent check-ins.",
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.sleep_hours,
      (entry) => entry.fatigue,
      "Longer sleep and lower fatigue appeared together in recent check-ins.",
      null,
      "Longer sleep and lower fatigue appeared together in recent check-ins.",
    ),
    buildCorrelationCandidate(
      sorted,
      (entry) => entry.mood,
      (entry) => entry.sleep_hours,
      "Longer sleep and more stable mood appeared together in recent check-ins.",
      "Shorter sleep and lower mood appeared together in recent check-ins.",
      "Longer sleep and more stable mood appeared together in recent check-ins.",
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
  const higherHydration = average(hydrationPairs.filter((entry) => entry.water_glasses >= 6).map((entry) => entry.fatigue));
  const lowerHydration = average(hydrationPairs.filter((entry) => entry.water_glasses < 6).map((entry) => entry.fatigue));

  if (hydrationPairs.length >= 6 && higherHydration !== null && lowerHydration !== null && higherHydration + 0.35 < lowerHydration) {
    suggestions.push({
      summary: "Higher hydration and lower fatigue appeared together in recent check-ins.",
      strength: lowerHydration - higherHydration,
    });
  }

  const restDayEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { fatigue: number; triggers: string[] } =>
      entry.fatigue !== null && Array.isArray(entry.triggers),
  );
  const restDayFatigue = average(restDayEntries.filter((entry) => entry.triggers.includes("rest day")).map((entry) => entry.fatigue));
  const nonRestDayFatigue = average(restDayEntries.filter((entry) => !entry.triggers.includes("rest day")).map((entry) => entry.fatigue));

  if (restDayEntries.length >= 6 && restDayFatigue !== null && nonRestDayFatigue !== null && restDayFatigue + 0.35 < nonRestDayFatigue) {
    suggestions.push({
      summary: "Rest days and lower fatigue appeared together in recent check-ins.",
      strength: nonRestDayFatigue - restDayFatigue,
    });
  }

  return suggestions
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 2)
    .map((item) => item.summary);
}

export function deriveFluctuationNote(entries: DailyCheckIn[]) {
  const recent = getSortedEntries(entries).slice(0, 7);
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
  const recent = getSortedEntries(entries).slice(0, 7);
  const previous = getSortedEntries(entries).slice(7, 14);

  if (recent.length < 4 || previous.length < 4) {
    return "Not enough sleep entries yet.";
  }

  const sleepChange = describeSleepStabilityChange(recent, previous);
  return sleepChange ?? "Sleep has looked fairly steady recently.";
}

function buildSummaryCard(title: string, entries: DailyCheckIn[], dayCount: number): TrackSummaryCard | null {
  if (entries.length < Math.max(4, Math.ceil(dayCount / 3))) {
    return null;
  }

  const sorted = getSortedEntries(entries).slice(0, dayCount);
  const consistency = `${sorted.length} check-in${sorted.length === 1 ? "" : "s"} logged`;
  return {
    title,
    body: dayCount === 7 ? "Average values from recent check-ins." : "Average values across the past month.",
    metrics: [
      formatAverage("Fatigue", average(sorted.map((entry) => entry.fatigue))),
      formatAverage("Mood", average(sorted.map((entry) => entry.mood))),
      formatAverage("Stress", average(sorted.map((entry) => entry.stress))),
      `Sleep ${roundToOne(average(sorted.map((entry) => entry.sleep_hours))) ?? "-"}h`,
      consistency,
      describeSleepTrend(sorted),
    ],
  };
}

function buildPossiblePatterns(entries: DailyCheckIn[]) {
  const sorted = getSortedEntries(entries).slice(0, 30);
  const cards: Array<TrackPatternCard & { strength: number }> = [];

  const shortSleepEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { sleep_hours: number; fatigue: number } =>
      entry.sleep_hours !== null && entry.fatigue !== null,
  );
  const shortSleepFatigue = average(shortSleepEntries.filter((entry) => entry.sleep_hours < 6.5).map((entry) => entry.fatigue));
  const longerSleepFatigue = average(shortSleepEntries.filter((entry) => entry.sleep_hours >= 6.5).map((entry) => entry.fatigue));
  if (shortSleepEntries.length >= 6 && shortSleepFatigue !== null && longerSleepFatigue !== null && shortSleepFatigue >= longerSleepFatigue + 0.45) {
    cards.push({
      title: "Sleep and fatigue may be connected",
      body: "Fatigue appeared higher on days after lower sleep. This is not proof of cause, but it may be worth watching.",
      basedOn: `Based on ${shortSleepEntries.length} recent days with both sleep and fatigue logged.`,
      strength: shortSleepFatigue - longerSleepFatigue,
    });
  }

  const hydrationEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { water_glasses: number; fatigue: number } =>
      entry.water_glasses !== null && entry.fatigue !== null,
  );
  const higherHydrationFatigue = average(hydrationEntries.filter((entry) => entry.water_glasses >= 6).map((entry) => entry.fatigue));
  const lowerHydrationFatigue = average(hydrationEntries.filter((entry) => entry.water_glasses < 6).map((entry) => entry.fatigue));
  if (hydrationEntries.length >= 6 && higherHydrationFatigue !== null && lowerHydrationFatigue !== null && higherHydrationFatigue + 0.35 < lowerHydrationFatigue) {
    cards.push({
      title: "Hydration may be helping energy",
      body: "Energy looked more stable on days with higher water intake. The pattern is only observational, but it may be useful to keep tracking.",
      basedOn: `Based on ${hydrationEntries.length} recent days with hydration and fatigue logged.`,
      strength: lowerHydrationFatigue - higherHydrationFatigue,
    });
  }

  const stressEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { stress: number; fatigue: number; pain: number; brain_fog: number } =>
      entry.stress !== null && entry.fatigue !== null && entry.pain !== null && entry.brain_fog !== null,
  );
  const higherStressComposite = average(
    stressEntries
      .filter((entry) => entry.stress >= 3)
      .map((entry) => (entry.fatigue + entry.pain + entry.brain_fog) / 3),
  );
  const lowerStressComposite = average(
    stressEntries
      .filter((entry) => entry.stress < 3)
      .map((entry) => (entry.fatigue + entry.pain + entry.brain_fog) / 3),
  );
  if (stressEntries.length >= 6 && higherStressComposite !== null && lowerStressComposite !== null && higherStressComposite >= lowerStressComposite + 0.45) {
    cards.push({
      title: "Higher-stress days may feel heavier overall",
      body: "Fatigue, pain, and brain fog appeared more intense on higher-stress days. That may be worth noticing rather than assuming one caused the other.",
      basedOn: `Based on ${stressEntries.length} recent days with stress, fatigue, pain, and brain fog logged.`,
      strength: higherStressComposite - lowerStressComposite,
    });
  }

  const moodSleepEntries = sorted.filter(
    (entry): entry is DailyCheckIn & { mood: number; sleep_hours: number } =>
      entry.mood !== null && entry.sleep_hours !== null,
  );
  const longerSleepMood = average(moodSleepEntries.filter((entry) => entry.sleep_hours >= 6.5).map((entry) => entry.mood));
  const shorterSleepMood = average(moodSleepEntries.filter((entry) => entry.sleep_hours < 6.5).map((entry) => entry.mood));
  if (moodSleepEntries.length >= 6 && longerSleepMood !== null && shorterSleepMood !== null && longerSleepMood >= shorterSleepMood + 0.35) {
    cards.push({
      title: "Sleep and mood may be moving together",
      body: "Mood looked more stable on longer-sleep days. It may be useful to keep watching that pairing over the next week.",
      basedOn: `Based on ${moodSleepEntries.length} recent days with sleep and mood logged.`,
      strength: longerSleepMood - shorterSleepMood,
    });
  }

  return cards.sort((left, right) => right.strength - left.strength).slice(0, 3).map(({ strength: _strength, ...card }) => card);
}

function buildWhatToTryNext(entries: DailyCheckIn[], possiblePatterns: TrackPatternCard[]) {
  const suggestions: TrackSuggestionCard[] = [];
  const sorted = getSortedEntries(entries).slice(0, 14);
  const sleepCount = sorted.filter((entry) => entry.sleep_hours !== null).length;
  const hydrationCount = sorted.filter((entry) => entry.water_glasses !== null).length;
  const fatigueCount = sorted.filter((entry) => entry.fatigue !== null).length;
  const stressAverage = getMetricAverage(sorted, "stress");
  const fatigueAverage = getMetricAverage(sorted, "fatigue");

  if (sleepCount >= 3 && fatigueCount >= 3 && !possiblePatterns.some((item) => item.title.toLowerCase().includes("sleep and fatigue"))) {
    suggestions.push({
      title: "Track sleep and fatigue together",
      body: "A few more days of both check-ins could make the sleep and fatigue picture easier to understand.",
    });
  }

  if (hydrationCount >= 3 && !possiblePatterns.some((item) => item.title.toLowerCase().includes("hydration"))) {
    suggestions.push({
      title: "Keep logging hydration",
      body: "A few more hydration entries could show whether water intake and energy are worth watching together.",
    });
  }

  if (typeof fatigueAverage === "number" && fatigueAverage >= 3) {
    suggestions.push({
      title: "Plan lighter tasks on lower-energy days",
      body: "If fatigue stays elevated, consider keeping one or two tasks smaller and seeing whether that changes the pattern.",
    });
  }

  if (typeof stressAverage === "number" && stressAverage >= 3) {
    suggestions.push({
      title: "Notice what surrounds higher-stress days",
      body: "It could be useful to tag stressful days and bring the pattern to your clinician if it keeps repeating.",
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      title: "Keep the picture simple",
      body: "Tracking the same few signals for another week may make your patterns easier to trust and discuss.",
    });
  }

  return suggestions.slice(0, 3);
}

function buildInsightStatus(entries: DailyCheckIn[], recentChanges: string[], possiblePatterns: TrackPatternCard[]) {
  const recent = getSortedEntries(entries).slice(0, 7);
  if (recent.length < 4) {
    return {
      label: "Not enough data yet" as const,
      body: "Track a few more days to unlock personalized patterns.",
    };
  }

  const fatigueRecent = getMetricAverage(recent, "fatigue");
  const stressRecent = getMetricAverage(recent, "stress");
  const moodRecent = getMetricAverage(recent, "mood");
  const { previous } = getRecentAndPreviousWeeks(entries);
  const fatiguePrevious = getMetricAverage(previous, "fatigue");
  const stressPrevious = getMetricAverage(previous, "stress");
  const moodPrevious = getMetricAverage(previous, "mood");

  const fatigueTrend = getTrendLabel(fatigueRecent, fatiguePrevious, { higherIsBetter: false });
  const stressTrend = getTrendLabel(stressRecent, stressPrevious, { higherIsBetter: false });
  const moodTrend = getTrendLabel(moodRecent, moodPrevious, { higherIsBetter: true });

  if (fatigueTrend === "Needs attention" || stressTrend === "Needs attention") {
    return {
      label: "Needs attention" as const,
      body: possiblePatterns[0]?.body ?? recentChanges[0] ?? "A few recent patterns may be worth noticing and discussing if they continue.",
    };
  }

  if (fatigueTrend === "Improving" || moodTrend === "Improving") {
    return {
      label: "Improving" as const,
      body: recentChanges[0] ?? "Some recent signals look a little more stable than before.",
    };
  }

  return {
    label: "Stable" as const,
    body: recentChanges[0] ?? "Your recent check-ins look fairly steady so far.",
  };
}

export function buildTrackClaritySnapshot(entries: DailyCheckIn[]): TrackClaritySnapshot {
  const recentChanges = deriveWhatChangedRecently(entries);
  const correlations = deriveCalmCorrelations(entries);
  const whatSeemsToHelp = deriveWhatSeemsToHelp(entries);
  const possiblePatterns = buildPossiblePatterns(entries);
  const atGlance = buildAtGlance(entries);
  const nextSteps = buildWhatToTryNext(entries, possiblePatterns);
  const emptyState = entries.length < 4 ? "Track a few more days to unlock personalized patterns." : null;

  return {
    recentChanges,
    correlations,
    whatSeemsToHelp,
    fluctuationNote: deriveFluctuationNote(entries),
    weeklySummary: buildSummaryCard("This week at a glance", entries, 7),
    monthlySummary: buildSummaryCard("This month at a glance", entries, 30),
    insightStatus: buildInsightStatus(entries, recentChanges, possiblePatterns),
    atGlance,
    possiblePatterns,
    nextSteps,
    emptyState,
  };
}
