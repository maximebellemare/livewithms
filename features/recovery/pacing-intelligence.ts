import type { DailyCheckIn } from "../checkins/types";

export type RecoveryState =
  | "recovery-protected"
  | "recovery-strained"
  | "higher-demand-stretch"
  | "lower-demand-recovery-day"
  | "building-signal";

export type PacingSupportRecommendation = {
  toolId: string;
  title: string;
  body: string;
  premiumOnly?: boolean;
};

export type PacingRecoveryIntelligence = {
  dailyState: {
    label: string;
    message: string;
    recoveryState: RecoveryState;
  };
  recoveryProtection: string[];
  triggerPatterns: string[];
  suggestedSupport: PacingSupportRecommendation[];
  whatTendsToHelp: string[];
  weeklySummary: string[];
  lowEnergyUi: {
    simplifyToday: boolean;
    priority: "recovery" | "cognitive-load" | "stress" | "pacing" | "standard";
    maxSuggestedCards: number;
  };
};

type PacingDraft = {
  fatigue?: number | null;
  stress?: number | null;
  brain_fog?: number | null;
  sleep_hours?: string | number | null;
  notes?: string | null;
};

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function unique(items: string[]) {
  return items.filter((item, index, all) => all.indexOf(item) === index);
}

function parseSleep(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCurrentValue(
  todayEntry: DailyCheckIn | null,
  draft: PacingDraft | null | undefined,
  key: "fatigue" | "stress" | "brain_fog",
) {
  return todayEntry?.[key] ?? draft?.[key] ?? null;
}

function countNextDay(
  entries: DailyCheckIn[],
  currentDayMatches: (entry: DailyCheckIn) => boolean,
  nextDayMatches: (entry: DailyCheckIn) => boolean,
) {
  const sorted = entries.slice().sort((left, right) => left.date.localeCompare(right.date));
  let count = 0;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    const currentDate = new Date(`${current.date}T12:00:00`);
    const nextDate = new Date(`${next.date}T12:00:00`);
    const dayDiff = Math.round((nextDate.getTime() - currentDate.getTime()) / 86_400_000);

    if (dayDiff === 1 && currentDayMatches(current) && nextDayMatches(next)) {
      count += 1;
    }
  }

  return count;
}

function countSameDay(entries: DailyCheckIn[], matches: (entry: DailyCheckIn) => boolean) {
  return entries.filter(matches).length;
}

function includesNote(entries: DailyCheckIn[], terms: string[]) {
  return entries.some((entry) => {
    const note = entry.notes?.toLowerCase() ?? "";
    return terms.some((term) => note.includes(term));
  });
}

function buildRecommendation(
  toolId: string,
  title: string,
  body: string,
  premiumOnly = false,
): PacingSupportRecommendation {
  return { toolId, title, body, premiumOnly };
}

function addRecommendation(
  recommendations: PacingSupportRecommendation[],
  recommendation: PacingSupportRecommendation,
  hasPremiumAccess: boolean,
) {
  if (recommendation.premiumOnly && !hasPremiumAccess) {
    return;
  }

  if (!recommendations.some((item) => item.toolId === recommendation.toolId)) {
    recommendations.push(recommendation);
  }
}

export function derivePacingRecoveryIntelligence(input: {
  entries: DailyCheckIn[];
  todayEntry?: DailyCheckIn | null;
  draft?: PacingDraft | null;
  recoveryStrategies?: string[];
  hasPremiumAccess?: boolean;
}): PacingRecoveryIntelligence {
  const entries = input.entries.slice().sort((left, right) => right.date.localeCompare(left.date));
  const recentWeek = entries.slice(0, 7);
  const previousWeek = entries.slice(7, 14);
  const fatigue = getCurrentValue(input.todayEntry ?? null, input.draft, "fatigue");
  const stress = getCurrentValue(input.todayEntry ?? null, input.draft, "stress");
  const brainFog = getCurrentValue(input.todayEntry ?? null, input.draft, "brain_fog");
  const sleep = input.todayEntry?.sleep_hours ?? parseSleep(input.draft?.sleep_hours);
  const recentFatigue = average(recentWeek.map((entry) => entry.fatigue));
  const recentStress = average(recentWeek.map((entry) => entry.stress));
  const recentBrainFog = average(recentWeek.map((entry) => entry.brain_fog));
  const recentSleep = average(recentWeek.map((entry) => entry.sleep_hours));
  const previousStress = average(previousWeek.map((entry) => entry.stress));
  const previousFatigue = average(previousWeek.map((entry) => entry.fatigue));
  const highDemandDays = recentWeek.filter((entry) => (entry.fatigue ?? 0) >= 4 || (entry.stress ?? 0) >= 4).length;
  const recommendations: PacingSupportRecommendation[] = [];
  const recoveryProtection: string[] = [];
  const triggerPatterns: string[] = [];
  const whatTendsToHelp: string[] = [];
  const weeklySummary: string[] = [];
  const hasPremiumAccess = input.hasPremiumAccess === true;

  let dailyState = {
    label: "Build today’s check-in",
    message: "Check in today to get energy and recovery guidance based on fatigue, stress, sleep, and brain fog.",
    recoveryState: "building-signal" as RecoveryState,
  };
  let lowEnergyUi: PacingRecoveryIntelligence["lowEnergyUi"] = {
    simplifyToday: false,
    priority: "standard",
    maxSuggestedCards: 2,
  };

  if ((fatigue ?? 0) >= 4 && (stress ?? 0) >= 4) {
    dailyState = {
      label: "Recovery strained",
      message: "Stress and fatigue are both high today. Use energy for essentials first and protect one recovery window.",
      recoveryState: "recovery-strained",
    };
    lowEnergyUi = { simplifyToday: true, priority: "recovery", maxSuggestedCards: 2 };
    recoveryProtection.push("Move one non-urgent demand later so fatigue has less room to build.");
    addRecommendation(
      recommendations,
      buildRecommendation("difficult-day-pacing-checklist", "Fatigue pacing planner", "Match today’s demands to your available energy.", true),
      hasPremiumAccess,
    );
    addRecommendation(recommendations, buildRecommendation("reduce-overwhelm", "Reduce overwhelm", "Narrow today to one focus and one next step."), hasPremiumAccess);
  } else if ((brainFog ?? 0) >= 4) {
    dailyState = {
      label: "Elevated cognitive load",
      message: "Brain fog is high today. Keep one task visible and write down the next step.",
      recoveryState: "recovery-strained",
    };
    lowEnergyUi = { simplifyToday: true, priority: "cognitive-load", maxSuggestedCards: 2 };
    recoveryProtection.push("Reduce tabs, choices, and task switching before adding more work.");
    addRecommendation(recommendations, buildRecommendation("brain-fog-basics", "Brain fog support", "Turn mental clutter into one clear next action."), hasPremiumAccess);
    addRecommendation(
      recommendations,
      buildRecommendation("cognitive-decompression-reset", "Cognitive overload support", "Reduce competing demands and mental noise.", true),
      hasPremiumAccess,
    );
  } else if ((fatigue ?? 0) >= 4) {
    dailyState = {
      label: "Higher fatigue",
      message: "Fatigue is high today. Choose the main demand early and make the rest smaller.",
      recoveryState: "recovery-strained",
    };
    lowEnergyUi = { simplifyToday: true, priority: "pacing", maxSuggestedCards: 2 };
    recoveryProtection.push("Protecting energy earlier can help prevent heavier fatigue later.");
    addRecommendation(recommendations, buildRecommendation("low-energy-checklist", "Low-energy checklist", "Make today smaller before energy drops further."), hasPremiumAccess);
  } else if ((stress ?? 0) >= 4) {
    dailyState = {
      label: "Higher stress",
      message: "Stress is high today. Lower stimulation first, then choose one concrete next step.",
      recoveryState: "higher-demand-stretch",
    };
    lowEnergyUi = { simplifyToday: true, priority: "stress", maxSuggestedCards: 2 };
    recoveryProtection.push("A quieter evening can help recovery after a high-stress day.");
    addRecommendation(recommendations, buildRecommendation("reduce-overwhelm", "Reduce overwhelm", "Sort competing pressure into one focus."), hasPremiumAccess);
  } else if (sleep !== null && sleep < 6) {
    dailyState = {
      label: "Shorter sleep",
      message: "Sleep was low. Keep plans smaller because fatigue and brain fog can build faster after shorter nights.",
      recoveryState: "recovery-strained",
    };
    lowEnergyUi = { simplifyToday: true, priority: "recovery", maxSuggestedCards: 2 };
    recoveryProtection.push("Reduce evening activation tonight to give tomorrow more recovery room.");
    addRecommendation(
      recommendations,
      buildRecommendation("sleep-decompression-flow", "Sleep recovery support", "Lower evening activation and protect recovery tonight.", true),
      hasPremiumAccess,
    );
  } else if (highDemandDays >= 3) {
    dailyState = {
      label: "Higher-demand stretch",
      message: "Several recent days were high-demand. Keep today lighter to reduce next-day fatigue risk.",
      recoveryState: "higher-demand-stretch",
    };
    lowEnergyUi = { simplifyToday: true, priority: "recovery", maxSuggestedCards: 2 };
    recoveryProtection.push("Move one non-urgent demand later and protect one low-stimulation break.");
  } else if (recentWeek.length >= 3) {
    dailyState = {
      label: "Lower-demand recovery day",
      message: "Fatigue and stress have stayed lower recently. Keep plans manageable so recovery has room.",
      recoveryState: "lower-demand-recovery-day",
    };
    recoveryProtection.push("Keeping plans smaller today can help reduce fatigue later.");
  }

  if (recentStress !== null && previousStress !== null && recentStress - previousStress >= 0.5) {
    weeklySummary.push("Stress is higher than the previous week.");
    recoveryProtection.push("Lower stimulation tonight can help reduce recovery strain.");
  }

  if (recentFatigue !== null && previousFatigue !== null && recentFatigue - previousFatigue >= 0.5) {
    weeklySummary.push("Fatigue is higher than the previous week.");
    recoveryProtection.push("Use recovery breaks before fatigue reaches its peak.");
  }

  if (recentSleep !== null && recentSleep < 6.5) {
    weeklySummary.push("Sleep has been shorter recently.");
  }

  if (highDemandDays >= 3) {
    weeklySummary.push("Several recent days had high stress or fatigue.");
  }

  const highStressToFatigue = countNextDay(
    entries.slice(0, 30),
    (entry) => (entry.stress ?? 0) >= 4,
    (entry) => (entry.fatigue ?? 0) >= 4,
  );
  const lowSleepToBrainFog = countNextDay(
    entries.slice(0, 30),
    (entry) => typeof entry.sleep_hours === "number" && entry.sleep_hours < 6.5,
    (entry) => (entry.brain_fog ?? 0) >= 4,
  );
  const stressFatigueSameDay = countSameDay(entries.slice(0, 30), (entry) => (entry.stress ?? 0) >= 4 && (entry.fatigue ?? 0) >= 4);
  const hydrationLowerFatigue = countSameDay(
    entries.slice(0, 30),
    (entry) => (entry.water_glasses ?? 0) >= 6 && typeof entry.fatigue === "number" && entry.fatigue <= 2,
  );

  if (highStressToFatigue >= 2) {
    triggerPatterns.push("Higher stress often matched heavier fatigue the next day.");
  }

  if (lowSleepToBrainFog >= 2) {
    triggerPatterns.push("Shorter sleep often matched higher brain fog the next day.");
  }

  if (stressFatigueSameDay >= 2) {
    triggerPatterns.push("Stress and fatigue often rose together on the same day.");
  }

  if (hydrationLowerFatigue >= 2) {
    whatTendsToHelp.push("Higher hydration often matched lower fatigue days.");
  }

  if (includesNote(entries.slice(0, 30), ["quiet", "low stimulation", "low-stimulation", "less noise"])) {
    whatTendsToHelp.push("Lower-stimulation notes often matched easier recovery days.");
  }

  if (includesNote(entries.slice(0, 30), ["shorter list", "small plan", "one thing", "one priority"])) {
    whatTendsToHelp.push("Shorter plans were often logged around more manageable days.");
  }

  const savedStrategies = unique((input.recoveryStrategies ?? []).map((strategy) => strategy.trim()).filter(Boolean));
  const lowerStimulationStrategies = savedStrategies.filter((strategy) =>
    /quiet|lower stimulation|less noise|screen|calm/i.test(strategy),
  ).length;
  const restStrategies = savedStrategies.filter((strategy) => /rest|sleep|break|earlier|recovery/i.test(strategy)).length;
  const smallerPlanStrategies = savedStrategies.filter((strategy) => /smaller|lighter|one|priority|less/i.test(strategy)).length;

  if (lowerStimulationStrategies >= 2) {
    whatTendsToHelp.push("Lower-stimulation choices have helped more than once.");
  }

  if (restStrategies >= 2) {
    whatTendsToHelp.push("Rest or recovery breaks have helped more than once.");
  }

  if (smallerPlanStrategies >= 2) {
    whatTendsToHelp.push("Smaller plans have helped more than once.");
  }

  addRecommendation(
    recommendations,
    buildRecommendation("one-priority-planner", "One-priority planner", "Simplify today’s focus and reduce overload."),
    hasPremiumAccess,
  );

  return {
    dailyState,
    recoveryProtection: unique(recoveryProtection).slice(0, 3),
    triggerPatterns: unique(triggerPatterns).slice(0, 4),
    suggestedSupport: recommendations.slice(0, hasPremiumAccess ? 3 : 2),
    whatTendsToHelp: unique(whatTendsToHelp).slice(0, 3),
    weeklySummary: unique(weeklySummary).slice(0, 4),
    lowEnergyUi,
  };
}
