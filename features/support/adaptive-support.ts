import type { Appointment } from "../appointments/types";
import type { DailyCheckIn } from "../checkins/types";
import { getProgramToolById } from "../programs/catalog";
import type { ProgramProgressSnapshot, ProgramTool } from "../programs/types";

export type AdaptiveSupportRecommendation = {
  id: string;
  title: string;
  body: string;
  tool?: ProgramTool;
  route?: string;
  params?: Record<string, string>;
  reason: "fatigue" | "stress" | "brain-fog" | "sleep" | "appointment" | "recovery" | "nutrition" | "coach" | "community" | "exercise";
};

type SupportCandidate = {
  id: string;
  title: string;
  body: string;
  score: number;
  reason: AdaptiveSupportRecommendation["reason"];
  source: "base" | "signal" | "fallback";
  toolId?: string;
  route?: string;
  params?: Record<string, string>;
};

type CurrentCheckInSignal = {
  fatigue?: number | null;
  stress?: number | null;
  brainFog?: number | null;
  sleepHours?: number | string | null;
};

export type AdaptiveSupportInput = {
  current: CurrentCheckInSignal;
  recentEntries: DailyCheckIn[];
  textInputs?: Array<string | null | undefined>;
  baseRecommendations?: Array<{ toolId: string; body: string }>;
  programProgress: ProgramProgressSnapshot;
  recentRecommendationIds?: string[];
  upcomingAppointments?: Appointment[];
  recoveryStrategies?: Array<string | null | undefined>;
  currentHour: number;
  date: string;
  maxItems?: number;
};

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");

  if (!valid.length) {
    return null;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function parseNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDateSeed(date: string) {
  return date.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function normalizeText(inputs: Array<string | null | undefined>) {
  return inputs
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function hasPlanningIntent(text: string) {
  return containsAny(text, [
    "plan",
    "planning",
    "priority",
    "priorities",
    "focus",
    "organize",
    "organise",
    "task",
    "tasks",
    "to do",
    "todo",
    "next step",
  ]);
}

function buildToolCandidate(
  toolId: string,
  body: string,
  score: number,
  reason: SupportCandidate["reason"],
  source: SupportCandidate["source"] = "signal",
): SupportCandidate | null {
  const tool = getProgramToolById(toolId);

  if (!tool) {
    return null;
  }

  return {
    id: `tool:${toolId}`,
    title: tool.title,
    body,
    score,
    reason,
    source,
    toolId,
  };
}

function buildRouteCandidate(input: {
  id: string;
  title: string;
  body: string;
  score: number;
  reason: SupportCandidate["reason"];
  source?: SupportCandidate["source"];
  route: string;
  params?: Record<string, string>;
}): SupportCandidate {
  return {
    ...input,
    source: input.source ?? "signal",
  };
}

function addCandidate(candidates: SupportCandidate[], candidate: SupportCandidate | null) {
  if (!candidate) {
    return;
  }

  const existingIndex = candidates.findIndex((item) => item.id === candidate.id);
  if (existingIndex === -1) {
    candidates.push(candidate);
    return;
  }

  if (candidate.score > candidates[existingIndex].score) {
    candidates[existingIndex] = candidate;
  }
}

function getRecentToolPenalty(candidate: SupportCandidate, progress: ProgramProgressSnapshot) {
  if (!candidate.toolId) {
    return 0;
  }

  if (progress.lastOpenedToolId === candidate.toolId || progress.activeToolId === candidate.toolId) {
    return 5;
  }

  const recentIndex = progress.recentToolIds.indexOf(candidate.toolId);
  if (recentIndex >= 0) {
    return Math.max(1, 4 - recentIndex);
  }

  return 0;
}

function getRecommendationCooldownPenalty(candidate: SupportCandidate, recentRecommendationIds: string[]) {
  const recommendationIndex = recentRecommendationIds.indexOf(candidate.id);
  const toolIndex = candidate.toolId ? recentRecommendationIds.indexOf(`tool:${candidate.toolId}`) : -1;
  const recentIndex = recommendationIndex >= 0 ? recommendationIndex : toolIndex;

  if (recentIndex < 0) {
    return 0;
  }

  return Math.max(1.5, 4 - recentIndex);
}

function rotateCandidates(candidates: SupportCandidate[], date: string, maxItems: number) {
  const seed = getDateSeed(date);
  const sorted = candidates
    .map((candidate, index) => ({
      candidate,
      rank: candidate.score + ((seed + index * 7) % 5) / 10,
    }))
    .sort((left, right) => right.rank - left.rank)
    .map((item) => item.candidate);
  const selected: SupportCandidate[] = [];
  const selectedReasons = new Set<SupportCandidate["reason"]>();

  for (const candidate of sorted) {
    if (selected.length >= maxItems) {
      break;
    }

    if (selectedReasons.has(candidate.reason) && sorted.some((item) => !selectedReasons.has(item.reason))) {
      continue;
    }

    selected.push(candidate);
    selectedReasons.add(candidate.reason);
  }

  if (selected.length < maxItems) {
    for (const candidate of sorted) {
      if (selected.length >= maxItems) {
        break;
      }

      if (!selected.some((item) => item.id === candidate.id)) {
        selected.push(candidate);
      }
    }
  }

  return selected;
}

function hasUpcomingAppointmentSoon(appointments: Appointment[], date: string) {
  const todayDate = new Date(`${date}T12:00:00`);

  return appointments.some((appointment) => {
    const appointmentDate = new Date(`${appointment.appointment_date}T12:00:00`);
    const dayDiff = Math.round((appointmentDate.getTime() - todayDate.getTime()) / 86_400_000);
    return dayDiff >= 0 && dayDiff <= 7;
  });
}

function hasRepeatedRecoveryStrategy(strategies: Array<string | null | undefined>, terms: string[]) {
  return strategies.filter((strategy) => {
    const normalized = strategy?.toLowerCase() ?? "";
    return terms.some((term) => normalized.includes(term));
  }).length >= 2;
}

function mapBaseRecommendationReason(toolId: string): SupportCandidate["reason"] {
  if (toolId.includes("brain") || toolId.includes("cognitive") || toolId.includes("decision")) {
    return "brain-fog";
  }

  if (toolId.includes("sleep") || toolId.includes("evening") || toolId.includes("bedtime")) {
    return "sleep";
  }

  if (toolId.includes("fatigue") || toolId.includes("energy") || toolId.includes("pacing") || toolId.includes("low-energy")) {
    return "fatigue";
  }

  if (toolId.includes("overwhelm") || toolId.includes("stimulation") || toolId.includes("reset")) {
    return "stress";
  }

  return "recovery";
}

export function deriveAdaptiveSupportRecommendations(input: AdaptiveSupportInput): AdaptiveSupportRecommendation[] {
  const recentWeek = input.recentEntries.slice(0, 7);
  const text = normalizeText(input.textInputs ?? []);
  const fatigue = input.current.fatigue ?? average(recentWeek.map((entry) => entry.fatigue));
  const stress = input.current.stress ?? average(recentWeek.map((entry) => entry.stress));
  const brainFog = input.current.brainFog ?? average(recentWeek.map((entry) => entry.brain_fog));
  const sleep = parseNumber(input.current.sleepHours) ?? average(recentWeek.map((entry) => entry.sleep_hours));
  const highDemandDays = recentWeek.filter((entry) => (entry.fatigue ?? 0) >= 4 || (entry.stress ?? 0) >= 4).length;
  const isEvening = input.currentHour >= 17;
  const planningIntent = hasPlanningIntent(text);
  const candidates: SupportCandidate[] = [];
  const detectedState: string[] = [];

  (input.baseRecommendations ?? []).forEach((recommendation, index) => {
    const isOnePriorityPlanner = recommendation.toolId === "one-priority-planner";
    if (isOnePriorityPlanner && !planningIntent && (brainFog ?? 0) < 3.5) {
      return;
    }

    addCandidate(
      candidates,
      buildToolCandidate(
        recommendation.toolId,
        recommendation.body,
        isOnePriorityPlanner ? 0.75 : Math.max(1.5, 3.5 - index),
        mapBaseRecommendationReason(recommendation.toolId),
        "base",
      ),
    );
  });

  if ((stress ?? 0) >= 4 || containsAny(text, ["stress", "overwhelmed", "overwhelm", "too much", "pressure", "panic"])) {
    detectedState.push("high-stress");
    addCandidate(candidates, buildToolCandidate("reduce-overwhelm", "Sort competing pressure into one focus.", 8, "stress"));
    addCandidate(candidates, buildToolCandidate("sixty-second-quiet-reset", "Take one minute to lower stimulation.", 6, "stress"));
    addCandidate(candidates, buildToolCandidate("reduce-stimulation-guide", "Make the next hour quieter and easier to handle.", 6, "stress"));
  }

  if ((fatigue ?? 0) >= 4 || containsAny(text, ["fatigue", "exhausted", "tired", "low energy", "drained"])) {
    detectedState.push("high-fatigue");
    addCandidate(candidates, buildToolCandidate("difficult-day-pacing-checklist", "Protect energy across the rest of the day.", 8, "fatigue"));
    addCandidate(candidates, buildToolCandidate("low-energy-checklist", "Make today smaller before energy drops further.", 7, "fatigue"));
    addCandidate(candidates, buildRouteCandidate({
      id: "nutrition-low-energy",
      title: "Low-energy meal ideas",
      body: "Find easy food options for low-energy days.",
      score: 5,
      reason: "nutrition",
      source: "signal",
      route: "/nutrition",
    }));
  }

  if ((brainFog ?? 0) >= 3.5 || containsAny(text, ["brain fog", "can't focus", "cannot focus", "mentally overloaded", "mental overload", "foggy", "scattered"])) {
    detectedState.push("brain-fog");
    addCandidate(candidates, buildToolCandidate("brain-fog-basics", "Reduce mental overload and simplify decisions.", 8, "brain-fog"));
    addCandidate(candidates, buildRouteCandidate({
      id: "focus-exercises",
      title: "Focus Sprint",
      body: "Use a short exercise for attention and focus consistency.",
      score: 6,
      reason: "exercise",
      source: "signal",
      route: "/programs",
      params: { section: "exercises", exercise: "focus-sprint" },
    }));
    addCandidate(candidates, buildToolCandidate("one-priority-planner", "Choose one clear focus for today.", 3.5, "brain-fog"));
    addCandidate(candidates, buildToolCandidate("reduce-stimulation-guide", "Lower stimulation before adding more decisions.", 5, "brain-fog"));
  }

  if (planningIntent && !detectedState.includes("brain-fog")) {
    detectedState.push("planning-needed");
    addCandidate(candidates, buildToolCandidate("one-priority-planner", "Choose one clear focus for today.", 5.5, "brain-fog"));
    addCandidate(candidates, buildToolCandidate("reduce-mental-load", "Reduce decisions before adding more to the list.", 4.5, "brain-fog"));
  }

  if ((sleep !== null && sleep < 6.5) || containsAny(text, ["poor sleep", "bad sleep", "didn't sleep", "couldn't sleep", "insomnia"])) {
    detectedState.push("poor-sleep");
    addCandidate(candidates, buildToolCandidate("sleep-decompression-flow", "Lower evening activation and protect sleep tonight.", isEvening ? 8 : 6, "sleep"));
    addCandidate(candidates, buildToolCandidate("quiet-evening-reset", "Make tonight easier on your nervous system.", isEvening ? 7 : 5, "sleep"));
  }

  if (highDemandDays >= 3 || hasRepeatedRecoveryStrategy(input.recoveryStrategies ?? [], ["smaller", "lighter", "quiet", "rest", "break"])) {
    detectedState.push("recovery-strain");
    addCandidate(candidates, buildToolCandidate("slower-recovery-pacing", "Add more recovery space after demanding days.", 7, "recovery"));
    addCandidate(candidates, buildToolCandidate("less-pressure-reset", "Lower pressure before the day gets too full.", 6, "recovery"));
  }

  if (hasUpcomingAppointmentSoon(input.upcomingAppointments ?? [], input.date) || containsAny(text, ["appointment", "neurology", "doctor", "clinic", "provider"])) {
    detectedState.push("upcoming-appointment");
    addCandidate(candidates, buildToolCandidate("appointment-prep", "Prepare a short list for your care visit.", 8, "appointment"));
    addCandidate(candidates, buildRouteCandidate({
      id: "health-summary",
      title: "Health summary",
      body: "Review recent symptoms before an appointment.",
      score: 6,
      reason: "appointment",
      source: "signal",
      route: "/health-summary",
    }));
  }

  if (containsAny(text, ["food", "meal", "eat", "nutrition", "snack", "cook"])) {
    detectedState.push("nutrition-support");
    addCandidate(candidates, buildRouteCandidate({
      id: "nutrition-plan",
      title: "Nutrition planner",
      body: "Build food options around energy, recovery, and preferences.",
      score: 6,
      reason: "nutrition",
      source: "signal",
      route: "/nutrition",
    }));
  }

  if (detectedState.length === 0 && recentWeek.length >= 2) {
    addCandidate(candidates, buildRouteCandidate({
      id: "focus-exercises",
      title: "Focus Sprint",
      body: "Use a short exercise for attention and focus consistency.",
      score: 2.8,
      reason: "exercise",
      source: "fallback",
      route: "/programs",
      params: { section: "exercises", exercise: "focus-sprint" },
    }));
    addCandidate(candidates, buildRouteCandidate({
      id: "nutrition-plan",
      title: "Nutrition planner",
      body: "Build food options around energy, recovery, and preferences.",
      score: 2.6,
      reason: "nutrition",
      source: "fallback",
      route: "/nutrition",
    }));
  }

  addCandidate(candidates, buildRouteCandidate({
    id: "coach-planning",
    title: "Coach",
    body: "Sort today’s plan, pacing, or next step.",
    score: detectedState.length > 0 ? 2.2 : 3,
    reason: "coach",
    source: "fallback",
    route: "/coach",
  }));
  addCandidate(candidates, buildRouteCandidate({
    id: "community-practical",
    title: "Community",
    body: "Read practical discussions from others living with MS.",
    score: detectedState.length > 0 ? 2.4 : recentWeek.length >= 3 ? 3.2 : 4,
    reason: "community",
    source: "fallback",
    route: "/community",
  }));

  const scored = candidates.map((candidate) => ({
    ...candidate,
    score:
      candidate.score -
      getRecentToolPenalty(candidate, input.programProgress) -
      getRecommendationCooldownPenalty(candidate, input.recentRecommendationIds ?? []),
  }));
  const selected = rotateCandidates(scored.filter((candidate) => candidate.score > 0), input.date, input.maxItems ?? 2);
  const finalRecommendations = selected
    .map((candidate) => candidate.title)
    .filter((title) => title.trim().length > 0);

  if (__DEV__) {
    console.log("[suggested-support]", {
      fatigue,
      stress,
      brainFog,
      sleep,
      parsedSymptomState: {
        highStress: (stress ?? 0) >= 4,
        highFatigue: (fatigue ?? 0) >= 4,
        highBrainFog: (brainFog ?? 0) >= 3.5,
        poorSleep: sleep !== null && sleep < 6.5,
        planningIntent,
        highDemandDays,
      },
      detectedState,
      recentToolIds: input.programProgress.recentToolIds,
      recentRecommendationIds: input.recentRecommendationIds ?? [],
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        reason: candidate.reason,
        source: candidate.source,
        baseScore: candidate.score,
        toolPenalty: getRecentToolPenalty(candidate, input.programProgress),
        cooldownPenalty: getRecommendationCooldownPenalty(candidate, input.recentRecommendationIds ?? []),
      })),
      scored: scored.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        reason: candidate.reason,
        source: candidate.source,
        finalScore: candidate.score,
      })),
      selectedCandidates: selected.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        reason: candidate.reason,
        source: candidate.source,
        finalScore: candidate.score,
      })),
      finalRecommendations,
    });
  }

  return selected
    .map((candidate): AdaptiveSupportRecommendation | null => {
      if (candidate.toolId) {
        const tool = getProgramToolById(candidate.toolId);
        return tool
          ? {
              id: candidate.id,
              title: tool.title,
              body: candidate.body,
              tool,
              reason: candidate.reason,
            }
          : null;
      }

      return {
        id: candidate.id,
        title: candidate.title,
        body: candidate.body,
        route: candidate.route,
        params: candidate.params,
        reason: candidate.reason,
      };
    })
    .filter((recommendation): recommendation is AdaptiveSupportRecommendation => Boolean(recommendation));
}
