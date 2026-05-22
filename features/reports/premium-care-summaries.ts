import type { Appointment } from "../appointments/types";
import type { CareNote } from "../care-notes/types";
import type { DailyCheckIn } from "../checkins/types";
import type { Medication } from "../medications/types";
import { sanitizeInsightSafety } from "../insights/actionable";

export type PremiumCareWindow = "weekly" | "monthly";
export type PremiumCareExportAudience = "clinician" | "caregiver";

export type PremiumCareSummary = {
  window: PremiumCareWindow;
  title: string;
  atAGlance: string;
  patternsWorthNoticing: string[];
  thingsThatSeemedSteadier: string[];
  whatMayHelpNext: string[];
  continuitySummary: string;
  helpfulContextForAppointments: string[];
  medicationConsistencyOverview: string[];
  symptomContextSummary: string[];
  reflectionContextHighlights: string[];
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

export type PremiumCareSummaries = {
  weekly: PremiumCareSummary;
  monthly: PremiumCareSummary;
};

export type PremiumCareExportSection = {
  title: string;
  lines: string[];
};

export type PremiumCareExportContent = {
  title: string;
  subtitle: string;
  fileName: string;
  sections: PremiumCareExportSection[];
  text: string;
};

const FALLBACK_MESSAGE = "More gentle patterns may appear over time.";

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function standardDeviation(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");

  if (valid.length < 2) {
    return null;
  }

  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map((line) => sanitizeInsightSafety(line))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

function previewText(value: string | null | undefined, maxLength = 120) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

function describeContinuity(entries: DailyCheckIn[], window: PremiumCareWindow) {
  const reflections = entries.filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0).length;

  if (reflections >= (window === "weekly" ? 2 : 4)) {
    return window === "weekly"
      ? "A few reflections added a little more context to this week."
      : "Your check-ins and reflections have gradually built more context over the month.";
  }

  return window === "weekly"
    ? "This week has a little more context now."
    : "Your check-ins have gradually built more context over time.";
}

function buildMedicationOverview(
  medications: Medication[],
  lowEnergyMode: boolean,
) {
  const active = medications.filter((medication) => medication.active);
  const lines: string[] = [];

  if (!active.length) {
    lines.push("No active medications are listed right now.");
    return clampLines(lines, 2);
  }

  lines.push(
    `${active.length} ${active.length === 1 ? "medication is" : "medications are"} being tracked right now.`,
  );

  const named = active
    .slice(0, lowEnergyMode ? 1 : 2)
    .map((medication) => medication.name)
    .filter(Boolean);

  if (named.length) {
    lines.push(`Tracked medications include ${named.join(named.length > 1 ? " and " : "")}.`);
  }

  if (active.some((medication) => typeof medication.notes === "string" && medication.notes.trim().length > 0)) {
    lines.push("A few medication notes are already in one place if you want them later.");
  }

  return clampLines(lines, lowEnergyMode ? 1 : 3);
}

function buildReflectionHighlights(
  entries: DailyCheckIn[],
  careNotes: CareNote[],
  lowEnergyMode: boolean,
) {
  const entryHighlights = entries
    .filter((entry) => typeof entry.notes === "string" && entry.notes.trim().length > 0)
    .slice(0, lowEnergyMode ? 1 : 2)
    .map((entry) => {
      const preview = previewText(entry.notes, 110);
      return preview ? `${formatDateLabel(entry.date)}: ${preview}` : null;
    })
    .filter((line): line is string => Boolean(line));

  const noteHighlights = careNotes
    .slice(0, lowEnergyMode ? 1 : 2)
    .map((note) => {
      const label = note.title?.trim() || note.category?.trim() || "Care note";
      const preview = previewText(note.body, 90);
      return preview ? `${label}: ${preview}` : `${label}.`;
    });

  return clampLines(
    entryHighlights.length ? entryHighlights : noteHighlights,
    lowEnergyMode ? 1 : 2,
  );
}

function buildAppointmentContext(options: {
  window: PremiumCareWindow;
  currentEntries: DailyCheckIn[];
  previousEntries: DailyCheckIn[];
  nextAppointment: Appointment | null;
  activeMedicationCount: number;
  lowEnergyMode: boolean;
}) {
  const {
    window,
    currentEntries,
    previousEntries,
    nextAppointment,
    activeMedicationCount,
    lowEnergyMode,
  } = options;
  const lines: string[] = [];
  const fatigueCurrent = average(currentEntries.map((entry) => entry.fatigue));
  const fatiguePrevious = average(previousEntries.map((entry) => entry.fatigue));
  const stressCurrent = average(currentEntries.map((entry) => entry.stress));
  const sleepCurrent = average(currentEntries.map((entry) => entry.sleep_hours));
  const lowEnergyDays = currentEntries.filter((entry) => (entry.fatigue ?? 0) >= 4).length;

  if (nextAppointment) {
    lines.push(
      `Upcoming visit: ${nextAppointment.title} on ${formatDateLabel(nextAppointment.appointment_date)}${nextAppointment.appointment_time ? ` at ${nextAppointment.appointment_time}` : ""}.`,
    );
  }

  if (fatigueCurrent !== null && fatiguePrevious !== null && fatigueCurrent >= fatiguePrevious + 0.45) {
    lines.push(
      window === "weekly"
        ? "Fatigue has looked a little heavier than the stretch before it."
        : "Fatigue appeared somewhat heavier this month than the stretch before it.",
    );
  }

  if (stressCurrent !== null && stressCurrent >= 4) {
    lines.push("Stress has been one of the stronger signals in recent check-ins.");
  }

  if (sleepCurrent !== null && sleepCurrent < 6.5) {
    lines.push("Sleep has looked a little shorter lately, which may be worth bringing into the conversation.");
  }

  if (lowEnergyDays >= (window === "weekly" ? 3 : 8)) {
    lines.push(
      window === "weekly"
        ? "Several lower-energy days were recorded this week."
        : "Several lower-energy days were recorded through the month.",
    );
  }

  if (activeMedicationCount > 0) {
    lines.push(
      `${activeMedicationCount} ${activeMedicationCount === 1 ? "medication is" : "medications are"} being tracked right now.`,
    );
  }

  if (!lines.length) {
    lines.push("A short glance through recent check-ins may be enough before a visit.");
  }

  return clampLines(lines, lowEnergyMode ? 2 : 4);
}

function buildSymptomContextSummary(
  entries: DailyCheckIn[],
  previousEntries: DailyCheckIn[],
  window: PremiumCareWindow,
  lowEnergyMode: boolean,
) {
  const lines: string[] = [];
  const fatigueAverage = average(entries.map((entry) => entry.fatigue));
  const stressAverage = average(entries.map((entry) => entry.stress));
  const sleepAverage = average(entries.map((entry) => entry.sleep_hours));
  const moodAverage = average(entries.map((entry) => entry.mood));
  const fatiguePrevious = average(previousEntries.map((entry) => entry.fatigue));
  const sleepStability = standardDeviation(entries.map((entry) => entry.sleep_hours));

  if (fatigueAverage !== null && fatigueAverage >= 4) {
    lines.push(
      window === "weekly"
        ? "Several lower-energy days were recorded this week."
        : "Lower-energy days appeared fairly often this month.",
    );
  }

  if (stressAverage !== null && stressAverage >= 4) {
    lines.push("Stress levels varied across this stretch.");
  }

  if (sleepAverage !== null && sleepAverage < 6.5) {
    lines.push("Sleep has been somewhat inconsistent recently.");
  } else if (sleepStability !== null && sleepStability <= 0.75) {
    lines.push("Sleep appeared a little steadier recently.");
  }

  if (moodAverage !== null && moodAverage >= 3.2) {
    lines.push("A few steadier mood days were still part of the picture.");
  }

  if (fatigueAverage !== null && fatiguePrevious !== null && fatigueAverage <= fatiguePrevious - 0.45) {
    lines.push("Fatigue has looked a little lighter than the stretch before it.");
  }

  if (!lines.length) {
    lines.push(
      window === "weekly"
        ? "This week has had a mixed, ordinary rhythm."
        : "This month has included a mix of steadier and heavier days.",
    );
  }

  return clampLines(lines, lowEnergyMode ? 1 : 3);
}

function buildCareWindowSummary(input: {
  entries: DailyCheckIn[];
  medications: Medication[];
  appointments: Appointment[];
  careNotes: CareNote[];
  window: PremiumCareWindow;
  lowEnergyMode: boolean;
}) {
  const { entries, medications, appointments, careNotes, window, lowEnergyMode } = input;
  const windowSize = window === "weekly" ? 7 : 30;
  const minimumEntries = window === "weekly" ? 4 : 10;
  const sortedEntries = entries.slice().sort((left, right) => right.date.localeCompare(left.date));
  const currentEntries = sortedEntries.slice(0, windowSize);
  const previousEntries = sortedEntries.slice(windowSize, windowSize * 2);
  const title = window === "weekly" ? "Weekly care summary" : "Monthly care snapshot";
  const limit = lowEnergyMode ? 1 : window === "weekly" ? 2 : 3;
  const currentFatigue = average(currentEntries.map((entry) => entry.fatigue));
  const currentStress = average(currentEntries.map((entry) => entry.stress));
  const currentSleep = average(currentEntries.map((entry) => entry.sleep_hours));
  const currentMood = average(currentEntries.map((entry) => entry.mood));
  const previousFatigue = average(previousEntries.map((entry) => entry.fatigue));
  const previousStress = average(previousEntries.map((entry) => entry.stress));
  const previousMood = average(previousEntries.map((entry) => entry.mood));
  const currentSleepStability = standardDeviation(currentEntries.map((entry) => entry.sleep_hours));
  const previousSleepStability = standardDeviation(previousEntries.map((entry) => entry.sleep_hours));
  const nextAppointment =
    appointments
      .filter((appointment) => appointment.appointment_date >= currentEntries[currentEntries.length - 1]?.date)
      .sort((left, right) => {
        const dateCompare = left.appointment_date.localeCompare(right.appointment_date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
      })[0] ?? null;

  if (currentEntries.length < minimumEntries) {
    return {
      window,
      title,
      atAGlance: FALLBACK_MESSAGE,
      patternsWorthNoticing: [],
      thingsThatSeemedSteadier: [],
      whatMayHelpNext: [],
      continuitySummary: window === "weekly" ? "A few more check-ins can make this week easier to read." : "A little more time can help this month feel clearer.",
      helpfulContextForAppointments: [],
      medicationConsistencyOverview: buildMedicationOverview(medications, lowEnergyMode),
      symptomContextSummary: [],
      reflectionContextHighlights: [],
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    } satisfies PremiumCareSummary;
  }

  const atAGlanceParts: string[] = [];
  const patterns: string[] = [];
  const steadier: string[] = [];
  const whatMayHelpNext: string[] = [];

  if (currentFatigue !== null && currentFatigue >= 4) {
    atAGlanceParts.push(window === "weekly" ? "Fatigue appeared somewhat heavier this week." : "Fatigue appeared somewhat heavier this month.");
    whatMayHelpNext.push("A simpler day structure may feel easier right now.");
  } else if (currentFatigue !== null && currentFatigue <= 2.7) {
    atAGlanceParts.push(window === "weekly" ? "Energy has looked a little steadier this week." : "Energy has had a steadier feel this month.");
  }

  if (currentStress !== null && currentStress >= 4) {
    atAGlanceParts.push(window === "weekly" ? "Stress seemed a little heavier this week." : "Stress levels varied across the past few weeks.");
    whatMayHelpNext.push("A little more space around plans may help next week.");
  } else if (currentStress !== null && currentStress <= 2.6) {
    steadier.push("Stress has looked a little lighter on some recent days.");
  }

  if (currentSleep !== null && currentSleep < 6.5) {
    patterns.push("Sleep has been somewhat inconsistent recently.");
    whatMayHelpNext.push("A calmer evening rhythm may be worth noticing.");
  }

  if (
    currentSleepStability !== null &&
    previousSleepStability !== null &&
    currentSleepStability + 0.2 < previousSleepStability
  ) {
    patterns.push("Sleep appeared slightly steadier recently.");
  }

  if (previousFatigue !== null && currentFatigue !== null) {
    if (currentFatigue >= previousFatigue + 0.45) {
      patterns.push("Fatigue looks a little heavier than the stretch before it.");
    } else if (currentFatigue <= previousFatigue - 0.45) {
      patterns.push("Fatigue looks a little lighter than the stretch before it.");
    }
  }

  if (previousStress !== null && currentStress !== null) {
    if (currentStress >= previousStress + 0.45) {
      patterns.push("Stress seems a little heavier than the stretch before it.");
    } else if (currentStress <= previousStress - 0.45) {
      patterns.push("Stress seems a little lighter than the stretch before it.");
    }
  }

  if (previousMood !== null && currentMood !== null && currentMood >= previousMood + 0.35) {
    steadier.push("Mood has felt a little steadier than the stretch before it.");
  }

  if (currentMood !== null && currentMood <= 2.5) {
    atAGlanceParts.push(window === "weekly" ? "Mood has looked a little lower this week." : "Mood has looked a little lower in parts of this month.");
  } else if (currentMood !== null && currentMood >= 3.2) {
    steadier.push("Mood has had a steadier feel on some recent days.");
  }

  if (!atAGlanceParts.length) {
    atAGlanceParts.push(
      window === "weekly"
        ? "This week has had a mixed, ordinary rhythm."
        : "This month has included heavier days alongside steadier ones.",
    );
  }

  if (!patterns.length) {
    patterns.push(
      window === "weekly"
        ? "A few small patterns are starting to take shape."
        : "A broader pattern is starting to feel a little easier to notice.",
    );
  }

  if (!steadier.length) {
    steadier.push(
      window === "weekly"
        ? "Even this week, a steadier moment or two may still be part of the picture."
        : "Even in a mixed month, steadier moments can still be part of the picture.",
    );
  }

  if (!whatMayHelpNext.length) {
    whatMayHelpNext.push(
      window === "weekly"
        ? "Keeping the next few days simpler may be enough."
        : "A gentler rhythm may feel more realistic than trying to do too much at once.",
    );
  }

  return {
    window,
    title,
    atAGlance: sanitizeInsightSafety(atAGlanceParts[0] ?? FALLBACK_MESSAGE),
    patternsWorthNoticing: clampLines(patterns, limit),
    thingsThatSeemedSteadier: clampLines(steadier, limit),
    whatMayHelpNext: clampLines(whatMayHelpNext, limit),
    continuitySummary: sanitizeInsightSafety(describeContinuity(currentEntries, window)),
    helpfulContextForAppointments: buildAppointmentContext({
      window,
      currentEntries,
      previousEntries,
      nextAppointment,
      activeMedicationCount: medications.filter((medication) => medication.active).length,
      lowEnergyMode,
    }),
    medicationConsistencyOverview: buildMedicationOverview(medications, lowEnergyMode),
    symptomContextSummary: buildSymptomContextSummary(currentEntries, previousEntries, window, lowEnergyMode),
    reflectionContextHighlights: buildReflectionHighlights(currentEntries, careNotes, lowEnergyMode),
    hasEnoughData: true,
  } satisfies PremiumCareSummary;
}

export function derivePremiumCareSummaries(input: {
  entries: DailyCheckIn[];
  medications: Medication[];
  appointments: Appointment[];
  careNotes: CareNote[];
  lowEnergyMode?: boolean;
}) {
  const { entries, medications, appointments, careNotes, lowEnergyMode = false } = input;

  return {
    weekly: buildCareWindowSummary({
      entries,
      medications,
      appointments,
      careNotes,
      window: "weekly",
      lowEnergyMode,
    }),
    monthly: buildCareWindowSummary({
      entries,
      medications,
      appointments,
      careNotes,
      window: "monthly",
      lowEnergyMode,
    }),
  } satisfies PremiumCareSummaries;
}

export function canAccessPremiumCareSummaries(
  subscriptionsEnabled: boolean,
  hasPremiumAccess: boolean,
  featureEnabled: boolean,
) {
  return subscriptionsEnabled && hasPremiumAccess && featureEnabled;
}

export function buildPremiumCareExportContent(input: {
  audience: PremiumCareExportAudience;
  summaries: PremiumCareSummaries;
}) {
  const { audience, summaries } = input;
  const { weekly, monthly } = summaries;

  const sections: PremiumCareExportSection[] = [
    {
      title: "This week at a glance",
      lines: clampLines(
        [
          weekly.atAGlance,
          weekly.continuitySummary,
        ],
        2,
      ),
    },
    {
      title: "Patterns worth noticing",
      lines: weekly.patternsWorthNoticing,
    },
    {
      title: "Things that seemed steadier",
      lines: weekly.thingsThatSeemedSteadier,
    },
    {
      title: "What may help next",
      lines: weekly.whatMayHelpNext,
    },
    {
      title: "Helpful context for appointments",
      lines: weekly.helpfulContextForAppointments,
    },
    {
      title: "Medication overview",
      lines: weekly.medicationConsistencyOverview,
    },
    {
      title: "Symptom context",
      lines: monthly.symptomContextSummary,
    },
  ].filter((section) => section.lines.length > 0);

  if (audience === "caregiver") {
    sections.splice(
      4,
      sections.length - 4,
      {
        title: "Helpful context",
        lines: clampLines(
          [
            weekly.continuitySummary,
            ...weekly.whatMayHelpNext,
            ...weekly.medicationConsistencyOverview,
          ],
          4,
        ),
      },
    );
  }

  const title =
    audience === "clinician"
      ? "LiveWithMS care summary"
      : "LiveWithMS caregiver-friendly summary";
  const subtitle =
    audience === "clinician"
      ? "A calmer overview of recent patterns, care details, and appointment context."
      : "A calm, shareable overview for support conversations when explaining everything feels like too much.";
  const fileName =
    audience === "clinician"
      ? "livewithms-care-summary.pdf"
      : "livewithms-caregiver-summary.pdf";

  const text = [
    title,
    subtitle,
    "",
    ...sections.flatMap((section) => [
      section.title,
      ...section.lines.map((line) => `• ${line}`),
      "",
    ]),
    "This summary is meant to support conversations, not replace professional judgment.",
  ].join("\n");

  return {
    title,
    subtitle,
    fileName,
    sections,
    text,
  } satisfies PremiumCareExportContent;
}
