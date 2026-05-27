import type { Appointment } from "../appointments/types";
import type { DailyCheckIn } from "../checkins/types";
import type { Medication } from "../medications/types";
import { getProgramToolById } from "../programs/catalog";
import type { ProgramProgressSnapshot } from "../programs/types";
import type { AdaptiveProfile } from "../adaptive/types";

export type CoachOperationalMemory = {
  continuityObservations: string[];
  whatHelpedBefore: string[];
  careContext: string[];
  suggestedSupportActions: string[];
};

function clampLines(lines: string[], max = 4) {
  return Array.from(new Set(lines.filter(Boolean))).slice(0, max);
}

function countHigh(entries: DailyCheckIn[], key: "fatigue" | "stress" | "brain_fog") {
  return entries.filter((entry) => (entry[key] ?? 0) >= 4).length;
}

function countNoteMentions(entries: DailyCheckIn[], terms: string[]) {
  return entries.filter((entry) => {
    const note = entry.notes?.toLowerCase() ?? "";
    return terms.some((term) => note.includes(term));
  }).length;
}

function derivePatternObservations(entries: DailyCheckIn[], adaptiveProfile: AdaptiveProfile) {
  const recent = entries.slice(0, 10);
  const lines: string[] = [];
  const highStressCount = countHigh(recent, "stress");
  const highFatigueCount = countHigh(recent, "fatigue");
  const highBrainFogCount = countHigh(recent, "brain_fog");
  const lowerSleepWithFatigue = recent.filter((entry) => (entry.sleep_hours ?? 99) <= 6 && (entry.fatigue ?? 0) >= 4).length;
  const highStressWithBrainFog = recent.filter((entry) => (entry.stress ?? 0) >= 4 && (entry.brain_fog ?? 0) >= 4).length;
  const overstimulationMentions = countNoteMentions(recent, ["overstim", "noise", "loud", "screen", "crowd", "busy"]);
  const pacingMentions = countNoteMentions(recent, ["pace", "pacing", "rest", "break", "smaller", "slower"]);

  if (highStressCount >= 2 && highFatigueCount >= 2) {
    lines.push("Stress and fatigue have both appeared higher more than once recently.");
  }

  if (lowerSleepWithFatigue >= 2) {
    lines.push("Lower sleep has recently matched higher fatigue more than once.");
  }

  if (highStressWithBrainFog >= 2) {
    lines.push("Brain fog has shown up on higher-stress days recently.");
  }

  if (highBrainFogCount >= 2) {
    lines.push("Brain fog has been a recurring support area lately.");
  }

  if (overstimulationMentions >= 2) {
    lines.push("Overstimulation has been mentioned several times recently.");
  }

  if (pacingMentions >= 2 || adaptiveProfile.fatigueTrend === "high") {
    lines.push("Pacing support may be useful when energy is lower.");
  }

  if (adaptiveProfile.stressTrend === "elevated") {
    lines.push("Stress has been trending higher recently.");
  }

  return clampLines(lines, 4);
}

function deriveWhatHelpedBefore(entries: DailyCheckIn[], programProgress: ProgramProgressSnapshot) {
  const lines: string[] = [];
  const recent = entries.slice(0, 10);
  const helpfulNotes = [
    { terms: ["quiet", "less noise", "lower stimulation"], line: "Lower stimulation has appeared in recent notes as a useful support." },
    { terms: ["rest", "break", "nap"], line: "Rest or short breaks have appeared in recent notes." },
    { terms: ["smaller", "simplify", "one thing", "one task"], line: "Smaller plans have appeared as a useful strategy." },
    { terms: ["water", "hydration", "snack", "food"], line: "Basic body support has appeared in recent notes." },
  ];

  for (const item of helpfulNotes) {
    if (countNoteMentions(recent, item.terms) > 0) {
      lines.push(item.line);
    }
  }

  const completedTools = programProgress.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    .slice(0, 2);

  for (const tool of completedTools) {
    lines.push(`${tool.title} was opened recently.`);
  }

  return clampLines(lines, 4);
}

function deriveSavedRecoveryStrategyMemory(strategies: string[]) {
  const saved = strategies.map((strategy) => strategy.trim()).filter(Boolean);
  const lines: string[] = [];

  if (saved.filter((strategy) => /quiet|lower stimulation|less noise|screen/i.test(strategy)).length >= 2) {
    lines.push("Lower stimulation has helped more than once recently.");
  }

  if (saved.filter((strategy) => /rest|break|sleep|earlier|recovery/i.test(strategy)).length >= 2) {
    lines.push("Rest or recovery breaks have helped more than once recently.");
  }

  if (saved.filter((strategy) => /smaller|lighter|one|priority|less/i.test(strategy)).length >= 2) {
    lines.push("Smaller plans have helped more than once recently.");
  }

  if (lines.length === 0 && saved[0]) {
    lines.push(`Recent helpful support: ${saved[0]}.`);
  }

  return clampLines(lines, 3);
}

function deriveCareContext(input: {
  activeMedications: Medication[];
  nextAppointment: Appointment | null;
}) {
  const lines: string[] = [];

  if (input.activeMedications.length > 0) {
    const names = input.activeMedications.slice(0, 3).map((medication) => medication.name).join(", ");
    lines.push(`Active medications tracked: ${names}.`);
  }

  if (input.nextAppointment) {
    lines.push(`Upcoming appointment: ${input.nextAppointment.title} on ${input.nextAppointment.appointment_date}.`);
  }

  return clampLines(lines, 3);
}

function deriveSuggestedSupportActions(input: {
  adaptiveProfile: AdaptiveProfile;
  latestEntry: DailyCheckIn | null;
  programProgress: ProgramProgressSnapshot;
}) {
  const actions: string[] = [];
  const latest = input.latestEntry;

  if ((latest?.stress ?? 0) >= 4 || input.adaptiveProfile.stressTrend === "elevated") {
    actions.push("Reduce overwhelm");
  }

  if ((latest?.brain_fog ?? 0) >= 4 || input.adaptiveProfile.brainFogTrend === "high") {
    actions.push("Brain fog support");
  }

  if ((latest?.fatigue ?? 0) >= 4 || input.adaptiveProfile.fatigueTrend === "high") {
    actions.push("Fatigue pacing planner");
  }

  if (input.programProgress.lastOpenedToolId) {
    const tool = getProgramToolById(input.programProgress.lastOpenedToolId);
    if (tool) {
      actions.push(`Consider ${tool.title} again if it fits today.`);
    }
  }

  return clampLines(actions, 4);
}

export function deriveCoachOperationalMemory(input: {
  recentEntries: DailyCheckIn[];
  latestEntry: DailyCheckIn | null;
  adaptiveProfile: AdaptiveProfile;
  programProgress: ProgramProgressSnapshot;
  activeMedications: Medication[];
  nextAppointment: Appointment | null;
  recentRecoveryStrategies?: string[];
}): CoachOperationalMemory {
  return {
    continuityObservations: derivePatternObservations(input.recentEntries, input.adaptiveProfile),
    whatHelpedBefore: clampLines(
      [
        ...deriveWhatHelpedBefore(input.recentEntries, input.programProgress),
        ...deriveSavedRecoveryStrategyMemory(input.recentRecoveryStrategies ?? []),
      ],
      4,
    ),
    careContext: deriveCareContext({
      activeMedications: input.activeMedications,
      nextAppointment: input.nextAppointment,
    }),
    suggestedSupportActions: deriveSuggestedSupportActions({
      adaptiveProfile: input.adaptiveProfile,
      latestEntry: input.latestEntry,
      programProgress: input.programProgress,
    }),
  };
}
