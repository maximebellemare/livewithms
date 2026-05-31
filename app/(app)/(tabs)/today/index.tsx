import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DailyCheckInCard, {
  getEmptyCheckInDraft,
  normalizeCheckInInput,
  type DailyCheckInDraft,
} from "../../../../components/today/DailyCheckInCard";
import CalmSkeleton from "../../../../components/ui/CalmSkeleton";
import ErrorState from "../../../../components/ui/ErrorState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";
import { useSaveDailyCheckIn, useCheckInHistory, useCheckInOverview, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import {
  getCareWins,
  getCheckInsInLastDays,
  getCurrentCheckInStreak,
  getMilestoneMessage,
} from "../../../../features/checkins/consistency";
import { deriveGentleContinuityFeedback } from "../../../../features/checkins/continuity-feedback";
import type { DailyCheckIn } from "../../../../features/checkins/types";
import { useGrowthState } from "../../../../features/growth/hooks";
import { useAiInsightsSummary } from "../../../../features/insights/hooks";
import { applyLowEnergyModeOverride, useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { useAppointments } from "../../../../features/appointments/hooks";
import type { Appointment } from "../../../../features/appointments/types";
import { useMedications } from "../../../../features/medications/hooks";
import { medicationsApi } from "../../../../features/medications/api";
import { usePersonalizationMemory } from "../../../../features/personalization-memory/hooks";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { usePremium } from "../../../../features/premium/hooks";
import { derivePremiumAdaptiveSupport } from "../../../../features/premium/adaptive-support";
import { derivePremiumDailySupport } from "../../../../features/today/premium-daily-support";
import { derivePremiumAdaptiveHome } from "../../../../features/today/premium-adaptive-home";
import { derivePremiumCalmCompanionEnvironment } from "../../../../features/today/premium-calm-companion";
import { useMyProfile } from "../../../../features/profile/hooks";
import { useProgramProgress } from "../../../../features/programs/hooks";
import { getTodayFocusLine } from "../../../../features/today/focus";
import { buildTodayGuidance } from "../../../../features/today/guidance";
import { loadRecentTodayPlans, loadTodayPlan, saveTodayPlan, type TodayPlan } from "../../../../features/today-plan/storage";
import { derivePostCheckInMoment } from "../../../../features/today/post-check-in";
import { getErrorMessage } from "../../../../lib/errors";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { getProgramToolById } from "../../../../features/programs/catalog";
import type { AdaptiveSupportRecommendation } from "../../../../features/support/adaptive-support";
import { deriveAdaptiveSupportRecommendations } from "../../../../features/support/adaptive-support";
import { derivePacingRecoveryIntelligence } from "../../../../features/recovery/pacing-intelligence";
import { useReminderSettings } from "../../../../features/reminders/hooks";
import { trackRetryTriggered } from "../../../../lib/events";
import { useSlowScreenDiagnostics } from "../../../../lib/observability";
import { buildLifecycleProfile } from "../../../../features/lifecycle/logic";
import { analyzePatterns } from "../../../../lib/longitudinal/pattern-engine/analyzePatterns";
import { buildReflectionFeed } from "../../../../lib/reflection-surfaces/reflection-selection/buildReflectionFeed";
import type { LongitudinalEntry } from "../../../../lib/longitudinal/types";
import { deriveAdaptiveFlow } from "../../../../lib/energy-aware/adaptive-flow/deriveAdaptiveFlow";
import { deriveContinuityState } from "../../../../lib/behavior-support/consistency-framework/deriveContinuityState";
import { generateConsistencyMessaging } from "../../../../lib/behavior-support/consistency-framework/generateConsistencyMessaging";
import { detectRoutineDisruption } from "../../../../lib/behavior-support/disruption-recovery/detectRoutineDisruption";
import { deriveRecoveryExperience } from "../../../../lib/behavior-support/disruption-recovery/deriveRecoveryExperience";
import { generateGentleReentry } from "../../../../lib/behavior-support/disruption-recovery/generateGentleReentry";
import { deriveBehavioralDemand } from "../../../../lib/behavior-support/adaptive-softening/deriveBehavioralDemand";
import { deriveSuggestedEffortLevel } from "../../../../lib/behavior-support/adaptive-softening/deriveSuggestedEffortLevel";
import { deriveSustainableCadence } from "../../../../lib/behavior-support/sustainable-rhythm/deriveSustainableCadence";
import { detectOverextensionPatterns } from "../../../../lib/behavior-support/sustainable-rhythm/detectOverextensionPatterns";
import { generateSelfCompassionReinforcement } from "../../../../lib/behavior-support/self-compassion/generateSelfCompassionReinforcement";
import { deriveGentleNormalization } from "../../../../lib/behavior-support/self-compassion/deriveGentleNormalization";
import { derivePrimarySurface } from "../../../../lib/cognitive-simplification/surface-prioritization/derivePrimarySurface";
import { deriveDeferredContent } from "../../../../lib/cognitive-simplification/surface-prioritization/deriveDeferredContent";
import { deriveDisclosureDepth } from "../../../../lib/cognitive-simplification/progressive-disclosure/deriveDisclosureDepth";
import { deriveOptionalExpansion } from "../../../../lib/cognitive-simplification/progressive-disclosure/deriveOptionalExpansion";
import { deriveNavigationPriority } from "../../../../lib/cognitive-simplification/navigation-quieting/deriveNavigationPriority";
import { deriveHiddenComplexity } from "../../../../lib/cognitive-simplification/navigation-quieting/deriveHiddenComplexity";
import { deriveReflectionDensity } from "../../../../lib/cognitive-simplification/density-regulation/deriveReflectionDensity";
import { deriveCognitiveBurden } from "../../../../lib/cognitive-simplification/cognitive-load/deriveCognitiveBurden";
import { deriveDecisionLoad } from "../../../../lib/cognitive-simplification/cognitive-load/deriveDecisionLoad";
import { deriveAdaptiveDefaults } from "../../../../lib/cognitive-simplification/calm-defaults/deriveAdaptiveDefaults";
import { deriveQuietMoments } from "../../../../lib/cognitive-simplification/recovery-spaces/deriveQuietMoments";
import { deriveLowStimulusSurface } from "../../../../lib/cognitive-simplification/recovery-spaces/deriveLowStimulusSurface";
import { buildLifeContextSnapshot } from "../../../../lib/life-context/buildLifeContextSnapshot";
import { deriveAtmosphereState } from "../../../../lib/emotional-environment/atmosphere/deriveAtmosphereState";
import { deriveAtmosphereTransitions } from "../../../../lib/emotional-environment/atmosphere/deriveAtmosphereTransitions";
import { deriveEmotionalDensity } from "../../../../lib/emotional-environment/emotional-pacing/deriveEmotionalDensity";
import { deriveReflectionSpacing } from "../../../../lib/emotional-environment/emotional-pacing/deriveReflectionSpacing";
import { deriveQuietMoments as deriveEnvironmentQuietMoment } from "../../../../lib/emotional-environment/recovery-moments/deriveQuietMoments";
import { deriveAttentionLoad } from "../../../../lib/attention-respect/attention-budgeting/deriveAttentionLoad";
import { derivePromptSuppression } from "../../../../lib/attention-respect/attention-budgeting/derivePromptSuppression";
import { deriveCalmOrientation } from "../../../../lib/attention-respect/intentional-entry/deriveCalmOrientation";
import { deriveSessionEntryState } from "../../../../lib/attention-respect/intentional-entry/deriveSessionEntryState";
import { deriveSessionClosure } from "../../../../lib/attention-respect/non-compulsive-engagement/deriveSessionClosure";
import { deriveHealthyExitState } from "../../../../lib/attention-respect/recovery-disengagement/deriveHealthyExitState";
import {
  clearCheckinDraft,
  loadCheckinDraft,
  preserveCheckinDraft,
} from "../../../../lib/operational-calm/continuity-preservation/preserveCheckinDraft";
import { restoreSessionContinuity } from "../../../../lib/operational-calm/continuity-preservation/restoreSessionContinuity";
import { reconcileAdaptiveSystems } from "../../../../lib/system-coherence/adaptive-coordination/reconcileAdaptiveSystems";
import { deriveEmotionalDensityLimits } from "../../../../lib/system-coherence/calmness-thresholds/deriveEmotionalDensityLimits";
import { derivePromptLoadLimits } from "../../../../lib/system-coherence/calmness-thresholds/derivePromptLoadLimits";
import { deriveUnifiedEmotionalRules } from "../../../../lib/system-coherence/emotional-logic/deriveUnifiedEmotionalRules";
import { deriveCrossFlowConsistency } from "../../../../lib/system-coherence/experience-continuity/deriveCrossFlowConsistency";
import { deriveTransitionContinuity } from "../../../../lib/system-coherence/experience-continuity/deriveTransitionContinuity";
import { deriveUnifiedTone } from "../../../../lib/system-coherence/tone-harmonization/deriveUnifiedTone";
import { orchestrateAdaptiveSystems } from "../../../../lib/meta-orchestration/global-adaptation/orchestrateAdaptiveSystems";
import { deriveCalmnessPriority } from "../../../../lib/meta-orchestration/priority-resolution/deriveCalmnessPriority";
import { logger } from "../../../../lib/logger";

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatLongDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortAppointmentDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTimeLabel(time: string | null) {
  if (!time) {
    return null;
  }

  const parsed = new Date(`2000-01-01T${time}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return time;
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMedicationDueTimeLabel(frequency: string, reminderTime?: string | null, reminderHour?: number, reminderMinute?: number) {
  const normalized = frequency.toLowerCase();

  if (normalized.includes("as needed") || normalized.includes("prn")) {
    return null;
  }

  if (reminderTime) {
    const [hourText, minuteText] = reminderTime.split(":");
    const hourValue = Number(hourText);
    const minuteValue = Number(minuteText);
    const reminderDate = new Date();
    reminderDate.setHours(hourValue, minuteValue, 0, 0);

    if (!Number.isNaN(reminderDate.getTime())) {
      return reminderDate.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  const hour = reminderHour ?? (normalized.includes("evening") ? 19 : 9);
  const minute = reminderMinute ?? 0;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function sortAppointmentsByDateTime(items: Appointment[]) {
  return [...items].sort((left, right) => {
    const dateCompare = left.appointment_date.localeCompare(right.appointment_date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return (left.appointment_time ?? "").localeCompare(right.appointment_time ?? "");
  });
}

function getAppointmentTimingLabel(appointment: Appointment, today: string) {
  const todayDate = new Date(`${today}T12:00:00`);
  const appointmentDate = new Date(`${appointment.appointment_date}T12:00:00`);
  const dayDiff = Math.round((appointmentDate.getTime() - todayDate.getTime()) / 86_400_000);
  const timeLabel = formatTimeLabel(appointment.appointment_time);
  const dayLabel =
    dayDiff === 0
      ? "Today"
      : dayDiff === 1
        ? "Tomorrow"
        : dayDiff > 1 && dayDiff <= 6
          ? `In ${dayDiff} days`
          : formatShortAppointmentDate(appointment.appointment_date);

  return timeLabel ? `${dayLabel} • ${timeLabel}` : dayLabel;
}

function getTodayPlanPrioritySuggestions(input: {
  fatigue: number | null;
  stress: number | null;
  brainFog: number | null;
  hasAppointmentSoon: boolean;
}) {
  const suggestions = [...DEFAULT_TODAY_PLAN_PRIORITIES];

  if ((input.fatigue ?? 0) >= 4) {
    suggestions.unshift("Protect energy");
  }

  if ((input.brainFog ?? 0) >= 4) {
    suggestions.unshift("One clear step");
  }

  if ((input.stress ?? 0) >= 4) {
    suggestions.unshift("Reduce pressure");
  }

  if (input.hasAppointmentSoon) {
    suggestions.unshift("Prepare appointment");
  }

  return suggestions.filter((item, index, all) => all.indexOf(item) === index).slice(0, 5);
}

function getTodayPlanSaveLabel(saveState: "idle" | "saving" | "saved") {
  if (saveState === "saving") {
    return "Saving...";
  }

  if (saveState === "saved") {
    return "Plan saved ✓";
  }

  return "Save plan";
}

function formatPlanDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const CHECK_IN_STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100]);

type TodayPlanDraft = {
  mainPriority: string;
  energyLevel: string;
  staySmaller: string;
  recoveryProtection: string;
  tomorrowEnergy: string;
  prepareTonight: string;
  tomorrowSmaller: string;
  recoveryTonight: string;
  whatHelped: string;
};

const EMPTY_TODAY_PLAN: TodayPlanDraft = {
  mainPriority: "",
  energyLevel: "",
  staySmaller: "",
  recoveryProtection: "",
  tomorrowEnergy: "",
  prepareTonight: "",
  tomorrowSmaller: "",
  recoveryTonight: "",
  whatHelped: "",
};

const DEFAULT_TODAY_PLAN_PRIORITIES = [
  "One necessary task",
  "Care basics",
  "Appointment prep",
  "Rest and recovery",
] as const;

const DEFAULT_STAY_SMALLER_OPTIONS = [
  "Errands",
  "Screen time",
  "Workload",
  "Social plans",
  "Stimulation",
] as const;

const DEFAULT_RECOVERY_STRATEGIES = [
  "Quieter evening",
  "Hydration",
  "Recovery break",
  "Smaller task list",
  "Lower stimulation",
  "Earlier sleep",
] as const;

const DEFAULT_TOMORROW_PREP_OPTIONS = [
  "Prepare medications",
  "Set out essentials",
  "Lower stimulation tonight",
  "Lighter morning",
] as const;

const DEFAULT_TOMORROW_SMALLER_OPTIONS = [
  "Workload",
  "Errands",
  "Screen time",
  "Social plans",
  "Decisions",
] as const;

function getStreakLabel(streak: number, todayEntry: DailyCheckIn | null) {
  if (streak > 0) {
    return `${streak}-day check-in streak 🎉`;
  }

  return todayEntry ? "Check-in saved ✓" : "Start today's check-in";
}

function getStreakCelebrationMessage(streak: number) {
  if (CHECK_IN_STREAK_MILESTONES.has(streak)) {
    return `${streak} days in a row 🎉`;
  }

  if (streak > 1) {
    return "Nice consistency.";
  }

  return "Check-in saved.";
}

function getCutoffDate(days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (days - 1));
  return cutoff.toISOString().slice(0, 10);
}

function getDraftFromCheckIn(checkIn: DailyCheckIn | null): DailyCheckInDraft {
  return {
    fatigue: checkIn?.fatigue ?? null,
    pain: checkIn?.pain ?? null,
    brain_fog: checkIn?.brain_fog ?? null,
    mood: checkIn?.mood ?? null,
    mobility: checkIn?.mobility ?? null,
    stress: checkIn?.stress ?? null,
    sleep_hours: checkIn?.sleep_hours != null ? String(checkIn.sleep_hours) : "",
    water_glasses: checkIn?.water_glasses != null ? String(checkIn.water_glasses) : "",
    notes: checkIn?.notes ?? "",
  };
}

function getDraftSnapshot(draft: DailyCheckInDraft) {
  return JSON.stringify(normalizeCheckInInput(draft));
}

function formatPreviousMetric(label: string, value: number | null) {
  return `${label} ${value ?? "—"}`;
}

function getRecentActionCard(
  recentActions: Array<{
    eventName: string;
    occurredAt: string;
  }>,
) {
  const latest = [...recentActions]
    .reverse()
    .find((action) =>
      ["ai_coach_message_sent", "reflection_saved", "program_completed", "reminder_enabled"].includes(action.eventName),
    );

  if (!latest) {
    return null;
  }

  switch (latest.eventName) {
    case "ai_coach_message_sent":
      return {
        title: "Pick up where you left off",
        body: "You recently spent time with Coach. You can come back to that reflection whenever you’re ready.",
        actionLabel: "Open Coach",
        route: "/coach" as const,
      };
    case "reflection_saved":
      return {
        title: "Your reflection is here for you",
        body: "If another thought comes up today, Coach is ready to hold it with you.",
        actionLabel: "Continue in Coach",
        route: "/coach" as const,
      };
    case "program_completed":
      return {
        title: "A small support tool can still help",
        body: "You recently used a Program. Another short reset is there if today needs a softer pace.",
        actionLabel: "Open Programs",
        route: "/programs" as const,
      };
    case "reminder_enabled":
      return {
        title: "Your reminder is set",
        body: "You can adjust the timing anytime if a different part of the day would feel more supportive.",
        actionLabel: "Open Profile",
        route: "/profile" as const,
      };
    default:
      return null;
  }
}

function formatSummaryScaleValue(value: number | null) {
  return value === null ? "—" : `${value}/5`;
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (!valid.length) {
    return null;
  }

  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function getSummaryItems(checkIn: DailyCheckIn) {
  return [
    { label: "Fatigue", value: formatSummaryScaleValue(checkIn.fatigue) },
    { label: "Mood", value: formatSummaryScaleValue(checkIn.mood) },
    { label: "Stress", value: formatSummaryScaleValue(checkIn.stress) },
    ...(checkIn.pain !== null ? [{ label: "Pain", value: formatSummaryScaleValue(checkIn.pain) }] : []),
    ...(checkIn.brain_fog !== null ? [{ label: "Brain fog", value: formatSummaryScaleValue(checkIn.brain_fog) }] : []),
    ...(checkIn.mobility !== null ? [{ label: "Mobility", value: formatSummaryScaleValue(checkIn.mobility) }] : []),
    ...(checkIn.sleep_hours !== null ? [{ label: "Sleep", value: `${checkIn.sleep_hours}h` }] : []),
  ];
}

function getGentleFocus(checkIn: DailyCheckIn | null) {
  if (!checkIn) {
    return {
      title: "Start with a quick check-in",
      body: "A short check-in helps Coach feel more personal and gives Insights more to work with.",
    };
  }

  if ((checkIn.fatigue ?? 0) >= 4) {
    return {
      title: "Protect your energy",
      body: "Keep the day simple and save your energy for what matters most.",
    };
  }

  if ((checkIn.stress ?? 0) >= 4) {
    return {
      title: "Calm your nervous system",
      body: "A short reset or a quieter pace could help the day feel less loaded.",
    };
  }

  if ((checkIn.mood ?? 5) <= 2) {
    return {
      title: "One small win",
      body: "Choose one small thing that makes the next hour easier.",
    };
  }

  if ((checkIn.sleep_hours ?? 99) < 6) {
    return {
      title: "Lower the pressure today",
      body: "Poor sleep can change the whole feel of a day, so keep expectations lighter.",
    };
  }

  return {
    title: "Notice what helped",
    body: "If today has more room in it, pay attention to what supported that feeling.",
  };
}

function getOperationalObservation(entries: DailyCheckIn[]) {
  const recent = entries.slice(0, 7);

  if (recent.length < 3) {
    return null;
  }

  const sleep = average(recent.map((entry) => entry.sleep_hours));
  const fatigue = average(recent.map((entry) => entry.fatigue));
  const stress = average(recent.map((entry) => entry.stress));
  const brainFog = average(recent.map((entry) => entry.brain_fog));

  if (sleep !== null && sleep < 6 && fatigue !== null && fatigue >= 3.5) {
    return "Lower sleep has often matched higher fatigue recently.";
  }

  if (sleep !== null && sleep < 6 && stress !== null && stress >= 3.5) {
    return "Lower sleep has often matched higher stress recently.";
  }

  if (stress !== null && stress >= 4 && brainFog !== null && brainFog >= 3.5) {
    return "Higher stress has often matched more brain fog recently.";
  }

  if (fatigue !== null && fatigue >= 4) {
    return "Fatigue has been higher across recent check-ins.";
  }

  return null;
}

const RECOVERY_PROTECTION_FALLBACKS = [
  "Protect a low-stimulation break before the day gets too full.",
  "Leave more space between tasks so recovery has room.",
  "Keep tonight quieter if stress or fatigue has been high.",
  "Use a recovery break before fatigue reaches its peak.",
  "Reduce one avoidable demand to protect energy for tomorrow.",
] as const;

function getCurrentScaleValue(
  todayEntry: DailyCheckIn | null,
  draft: DailyCheckInDraft,
  key: "fatigue" | "stress" | "brain_fog" | "mood",
) {
  return todayEntry?.[key] ?? draft[key] ?? null;
}

function normalizeGuidanceText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getGuidanceTopics(value: string) {
  const normalized = normalizeGuidanceText(value);
  const topics = new Set<string>();

  if (/\b(smaller|lighter|non urgent|demand|demands|workload|essentials|plans?|priority)\b/.test(normalized)) {
    topics.add("workload");
  }

  if (/\b(stimulation|quiet|quieter|noise|tabs|screen|screens|activation|task switching)\b/.test(normalized)) {
    topics.add("stimulation");
  }

  if (/\b(sleep|evening|tonight|tomorrow|morning)\b/.test(normalized)) {
    topics.add("sleep-evening");
  }

  if (/\b(break|breaks|spacing|space|window|recovery)\b/.test(normalized)) {
    topics.add("recovery-breaks");
  }

  if (/\b(fatigue|energy)\b/.test(normalized)) {
    topics.add("fatigue-energy");
  }

  if (/\b(stress|pressure)\b/.test(normalized)) {
    topics.add("stress");
  }

  if (/\b(brain fog|cognitive|mental|thinking|choices)\b/.test(normalized)) {
    topics.add("cognitive-load");
  }

  return topics;
}

function hasDuplicateGuidanceIdea(candidate: string, existingItems: string[]) {
  const candidateNormalized = normalizeGuidanceText(candidate);
  const existingNormalized = existingItems.map(normalizeGuidanceText);

  if (existingNormalized.some((item) => item === candidateNormalized || item.includes(candidateNormalized) || candidateNormalized.includes(item))) {
    return true;
  }

  const candidateTopics = getGuidanceTopics(candidate);

  return existingItems.some((item) => {
    const existingTopics = getGuidanceTopics(item);
    return Array.from(candidateTopics).some((topic) => existingTopics.has(topic));
  });
}

function pickDistinctGuidanceLine(candidates: string[], existingItems: string[]) {
  return candidates.find((candidate) => !hasDuplicateGuidanceIdea(candidate, existingItems)) ?? null;
}

function getAdaptiveDailyDashboard(input: {
  todayEntry: DailyCheckIn | null;
  draft: DailyCheckInDraft;
  recentEntries: DailyCheckIn[];
  recoveryStrategies?: string[];
  hasPremiumAccess: boolean;
  programProgress: Parameters<typeof deriveAdaptiveSupportRecommendations>[0]["programProgress"];
  recentRecommendationIds?: string[];
  currentHour: number;
  date: string;
  upcomingAppointments: Appointment[];
  textInputs?: Array<string | null | undefined>;
}) {
  const intelligence = derivePacingRecoveryIntelligence({
    entries: input.recentEntries,
    todayEntry: input.todayEntry,
    draft: input.draft,
    recoveryStrategies: input.recoveryStrategies,
    hasPremiumAccess: input.hasPremiumAccess,
  });
  const recommendations = deriveAdaptiveSupportRecommendations({
    current: {
      fatigue: getCurrentScaleValue(input.todayEntry, input.draft, "fatigue"),
      stress: getCurrentScaleValue(input.todayEntry, input.draft, "stress"),
      brainFog: getCurrentScaleValue(input.todayEntry, input.draft, "brain_fog"),
      sleepHours: input.todayEntry?.sleep_hours ?? input.draft.sleep_hours,
    },
    recentEntries: input.recentEntries,
    programProgress: input.programProgress,
    recentRecommendationIds: input.recentRecommendationIds,
    currentHour: input.currentHour,
    date: `${input.date}:${input.currentHour}`,
    textInputs: [
      input.draft.notes,
      input.todayEntry?.notes,
      ...(input.textInputs ?? []),
      ...(input.recoveryStrategies ?? []),
    ],
    recoveryStrategies: input.recoveryStrategies,
    upcomingAppointments: input.upcomingAppointments,
    baseRecommendations: intelligence.suggestedSupport.map((recommendation) => ({
      toolId: recommendation.toolId,
      body: recommendation.body,
    })),
    maxItems: intelligence.lowEnergyUi.maxSuggestedCards,
  });
  const stateSummary =
    pickDistinctGuidanceLine(
      [...intelligence.triggerPatterns, ...intelligence.weeklySummary],
      [intelligence.dailyState.message],
    ) ?? "Use today’s support to keep energy, recovery, and workload visible.";
  const recoveryProtection =
    pickDistinctGuidanceLine(
      [...intelligence.recoveryProtection, ...RECOVERY_PROTECTION_FALLBACKS],
      [intelligence.dailyState.message, stateSummary],
    ) ?? "Protect one recovery break before adding more to the day.";

  return {
    guidance: intelligence.dailyState.message,
    stateSummary,
    recoveryProtection,
    recommendations,
  };
}

function pickRotatingPrompt(prompts: string[], seed: string) {
  if (prompts.length === 0) {
    return "What would help tomorrow feel slightly easier?";
  }

  const value = seed.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return prompts[value % prompts.length];
}

function getReflectionNotes(todayEntry: DailyCheckIn | null, draft: DailyCheckInDraft) {
  return `${todayEntry?.notes ?? ""} ${draft.notes ?? ""}`.toLowerCase();
}

function getDailyReflectionPrompt(todayEntry: DailyCheckIn | null, draft: DailyCheckInDraft, date: string) {
  const fatigue = getCurrentScaleValue(todayEntry, draft, "fatigue");
  const stress = getCurrentScaleValue(todayEntry, draft, "stress");
  const brainFog = getCurrentScaleValue(todayEntry, draft, "brain_fog");
  const mood = getCurrentScaleValue(todayEntry, draft, "mood");
  const pain = todayEntry?.pain ?? draft.pain ?? null;
  const mobility = todayEntry?.mobility ?? draft.mobility ?? null;
  const spasticity = todayEntry?.spasticity ?? draft.spasticity ?? null;
  const sleep = todayEntry?.sleep_hours ?? Number(draft.sleep_hours);
  const highestSymptom = Math.max(
    fatigue ?? 0,
    stress ?? 0,
    brainFog ?? 0,
    pain ?? 0,
    mobility ?? 0,
    spasticity ?? 0,
  );
  const highSymptomCount = [fatigue, stress, brainFog, pain, mobility, spasticity].filter(
    (value) => typeof value === "number" && value >= 4,
  ).length;
  const moderateSymptomCount = [fatigue, stress, brainFog, pain, mobility, spasticity].filter(
    (value) => typeof value === "number" && value >= 3,
  ).length;
  const notes = getReflectionNotes(todayEntry, draft);
  const notesSuggestOverload = /overload|overwhelmed|too much|crash|flare|hard day|rough day|exhausted|burned out/.test(notes);
  const hasAnyDaySignal = [fatigue, stress, brainFog, mood, pain, mobility, spasticity].some(
    (value) => typeof value === "number",
  ) || (typeof sleep === "number" && sleep > 0) || notes.trim().length > 0;
  const isDifficultDay =
    highestSymptom >= 5 ||
    highSymptomCount >= 2 ||
    notesSuggestOverload ||
    (typeof mood === "number" && mood <= 2 && moderateSymptomCount >= 1) ||
    ((fatigue ?? 0) >= 4 && (stress ?? 0) >= 4);

  if (!hasAnyDaySignal) {
    return pickRotatingPrompt(
      [
        "What would be useful to remember from today?",
        "What would make tomorrow slightly easier?",
        "What actually mattered today?",
      ],
      `${date}:no-day-signal`,
    );
  }

  if (isDifficultDay) {
    return pickRotatingPrompt(
      [
        "What would make tomorrow slightly easier?",
        "What felt hardest to carry today?",
        "What would help tomorrow feel more manageable?",
        "What can stay smaller tomorrow?",
        "What needs less pressure tomorrow?",
      ],
      `${date}:difficult-day`,
    );
  }

  if ((brainFog ?? 0) >= 4) {
    return pickRotatingPrompt(
      [
        "What helped thinking feel clearer today?",
        "What made thinking harder today?",
        "What would reduce mental load tomorrow?",
        "What would make the next step easier to see tomorrow?",
      ],
      `${date}:brain-fog`,
    );
  }

  if ((fatigue ?? 0) >= 4) {
    return pickRotatingPrompt(
      [
        "What took the most energy today?",
        "What helped protect energy today?",
        "What could use less energy tomorrow?",
        "What would make tomorrow require less effort?",
      ],
      `${date}:fatigue`,
    );
  }

  if ((stress ?? 0) >= 4) {
    return pickRotatingPrompt(
      [
        "What helped reduce stress, even a little?",
        "What added the most pressure today?",
        "What would lower pressure tomorrow?",
        "What can be made simpler tomorrow?",
      ],
      `${date}:stress`,
    );
  }

  if (typeof sleep === "number" && sleep > 0 && sleep < 6) {
    return pickRotatingPrompt(
      [
        "What would help tonight feel easier?",
        "What can stay lighter after shorter sleep?",
        "What helped you get through today with less sleep?",
        "What would protect recovery tomorrow?",
      ],
      `${date}:sleep`,
    );
  }

  if (typeof mood === "number" && mood >= 4 && highestSymptom <= 2) {
    return pickRotatingPrompt(
      [
        "What would you like to repeat tomorrow?",
        "What helped today feel easier?",
        "What made today more manageable?",
      ],
      `${date}:easier-day`,
    );
  }

  return pickRotatingPrompt(
    [
      "What helped today feel manageable?",
      "What actually mattered today?",
      "What would make tomorrow slightly easier?",
    ],
    `${date}:standard`,
  );
}

function TodayLoadingShell({ today }: { today: string }) {
    return (
      <AppScreen
        eyebrow="Daily check-in"
        title="Today"
        subtitle="Track energy, mood, stress, and symptoms."
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <AppText style={styles.greeting}>{getGreeting()}</AppText>
          <AppText style={styles.todayDate}>{formatLongDate(today)}</AppText>
          <View style={styles.skeletonStack}>
            <CalmSkeleton width="62%" height={20} radius={10} />
            <CalmSkeleton width="92%" height={14} />
            <CalmSkeleton width="76%" height={14} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.skeletonStack}>
            <CalmSkeleton width="34%" height={16} radius={10} />
            <CalmSkeleton width="94%" height={12} />
            <CalmSkeleton width="74%" height={12} />
          </View>
        </View>

        <View style={styles.guidanceCard}>
          <View style={styles.skeletonStack}>
            <CalmSkeleton width="40%" height={18} radius={10} />
            <CalmSkeleton width="88%" height={12} />
            <CalmSkeleton width="68%" height={12} />
          </View>
          <View style={styles.skeletonMetricGrid}>
            <CalmSkeleton width="100%" height={64} radius={18} />
            <CalmSkeleton width="100%" height={64} radius={18} />
            <CalmSkeleton width="100%" height={64} radius={18} />
          </View>
          <CalmSkeleton width="100%" height={56} radius={16} />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function getLowEnergyQuickActions(adaptiveProfile: ReturnType<typeof buildAdaptiveProfile>) {
  if (adaptiveProfile.brainFogTrend === "high") {
    return [
      { label: "Open Coach", route: "/coach" as const },
      { label: "Low-energy tool", route: "/programs" as const },
    ];
  }

  if (adaptiveProfile.stressTrend === "elevated") {
    return [
      { label: "Calm Reset", route: "/coach" as const },
      { label: "Open Programs", route: "/programs" as const },
    ];
  }

  return [
    { label: "Short reflection", route: "/coach" as const },
    { label: "Open Programs", route: "/programs" as const },
  ];
}

function mapCheckInsToLongitudinalEntries(entries: DailyCheckIn[]): LongitudinalEntry[] {
  return entries.map((entry) => {
    const timestamp = entry.updated_at || entry.created_at;
    const parsedHour = Number.isNaN(new Date(timestamp).getHours()) ? null : new Date(timestamp).getHours();

    return {
      date: entry.date,
      fatigue: entry.fatigue,
      stress: entry.stress,
      brain_fog: entry.brain_fog,
      mood: entry.mood,
      sleep_hours: entry.sleep_hours,
      water_glasses: entry.water_glasses,
      notes: entry.notes,
      reflection_text: entry.notes,
      interaction_count: entry.notes?.trim() ? 2 : 1,
      hour_of_day: parsedHour,
    };
  });
}

export default function TodayScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const today = getTodayDateString();
  const todayFocusLine = useMemo(() => getTodayFocusLine(today), [today]);
  const profileQuery = useMyProfile(user?.id);
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const historyQuery = useCheckInHistory(user?.id, 30);
  const overviewQuery = useCheckInOverview(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const appointmentsQuery = useAppointments(user?.id);
  const saveCheckIn = useSaveDailyCheckIn();
  const programProgress = useProgramProgress();
  const reminderSettings = useReminderSettings();
  const lowEnergyMode = useLowEnergyMode();
  const premium = usePremium();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [todayPlan, setTodayPlan] = useState<TodayPlanDraft>(EMPTY_TODAY_PLAN);
  const [savedTodayPlan, setSavedTodayPlan] = useState<TodayPlan | null>(null);
  const [recentTodayPlans, setRecentTodayPlans] = useState<TodayPlan[]>([]);
  const [todayPlanSaveState, setTodayPlanSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaveQueued, setLastSaveQueued] = useState(false);
  const [medicationsTakenToday, setMedicationsTakenToday] = useState<Record<string, string>>({});
  const [recentSupportRecommendationIds, setRecentSupportRecommendationIds] = useState<string[]>([]);
  const [streakCelebration, setStreakCelebration] = useState<string | null>(null);
  const streakCelebrationOpacity = useRef(new Animated.Value(0)).current;
  const streakCelebrationY = useRef(new Animated.Value(8)).current;
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));
  const lastTrackedLifecycleKeyRef = useRef<string | null>(null);
  const recentReflectionCardIdsRef = useRef<string[]>([]);
  const greeting = useMemo(() => getGreeting(), []);
  const currentHour = useMemo(() => new Date().getHours(), []);
  const historyEntries = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const activeMedications = useMemo(
    () => (medicationsQuery.data ?? []).filter((medication) => medication.active),
    [medicationsQuery.data],
  );
  const visibleTodayMedications = activeMedications;
  const upcomingAppointments = useMemo(
    () =>
      sortAppointmentsByDateTime(
        (appointmentsQuery.data ?? []).filter((appointment) => appointment.appointment_date >= today),
      ),
    [appointmentsQuery.data, today],
  );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const nextAppointmentDaysAway = useMemo(() => {
    if (!nextAppointment) {
      return null;
    }

    const todayDate = new Date(`${today}T12:00:00`);
    const appointmentDate = new Date(`${nextAppointment.appointment_date}T12:00:00`);
    return Math.round((appointmentDate.getTime() - todayDate.getTime()) / 86_400_000);
  }, [nextAppointment, today]);
  const showAppointmentPrepShortcut =
    nextAppointmentDaysAway !== null && nextAppointmentDaysAway >= 0 && nextAppointmentDaysAway <= 7;
  const longitudinalEntries = useMemo(() => mapCheckInsToLongitudinalEntries(historyEntries), [historyEntries]);
  const longitudinalAnalysis = useMemo(() => analyzePatterns(longitudinalEntries), [longitudinalEntries]);
  const lifeContext = useMemo(() => buildLifeContextSnapshot(longitudinalEntries), [longitudinalEntries]);
  const overviewEntries = useMemo(() => overviewQuery.data ?? [], [overviewQuery.data]);
  const todayEntry = checkInQuery.data ?? null;
  const totalCheckIns = overviewEntries.length;
  const streak = useMemo(() => getCurrentCheckInStreak(overviewEntries, today), [overviewEntries, today]);
  const streakLabel = useMemo(() => getStreakLabel(streak, todayEntry), [streak, todayEntry]);
  const weeklyCheckIns = useMemo(() => getCheckInsInLastDays(overviewEntries, today, 7), [overviewEntries, today]);
  const continuityFeedback = useMemo(
    () => deriveGentleContinuityFeedback({ totalCheckIns, weeklyCheckIns, streak }),
    [streak, totalCheckIns, weeklyCheckIns],
  );
  const growth = useGrowthState({ totalCheckIns });
  const recentRangeEntries = useMemo(() => {
    const cutoff = getCutoffDate(7);
    return historyEntries.filter((entry) => entry.date >= cutoff);
  }, [historyEntries]);
  const operationalObservation = useMemo(() => getOperationalObservation(recentRangeEntries), [recentRangeEntries]);
  const aiSummaryQuery = useAiInsightsSummary(recentRangeEntries, 7);
  useSlowScreenDiagnostics("today", checkInQuery.isLoading);
  const previousEntry = useMemo(() => {
    return historyEntries.find((entry) => entry.date < today) ?? null;
  }, [historyEntries, today]);
  const summaryItems = useMemo(() => (todayEntry ? getSummaryItems(todayEntry) : []), [todayEntry]);
  const gentleFocus = useMemo(() => getGentleFocus(todayEntry), [todayEntry]);
  const milestone = useMemo(() => getMilestoneMessage(totalCheckIns), [totalCheckIns]);
  const wins = useMemo(() => getCareWins(overviewEntries).slice(0, 3), [overviewEntries]);
  const recentActionCard = useMemo(
    () => getRecentActionCard(growth.state?.recentActions ?? []),
    [growth.state?.recentActions],
  );
  const baseAdaptiveProfile = useMemo(() => buildAdaptiveProfile(historyEntries, weeklyCheckIns), [historyEntries, weeklyCheckIns]);
  const personalizationMemory = usePersonalizationMemory({
    onboardingGoals: profileQuery.data?.goals ?? [],
    onboardingSymptoms: profileQuery.data?.symptoms ?? [],
    recentEntries: historyEntries,
    adaptiveProfile: baseAdaptiveProfile,
    reminderSettings: {
      enabled: reminderSettings.enabled,
      hour: reminderSettings.hour,
      minute: reminderSettings.minute,
      permissionStatus: reminderSettings.permissionStatus,
      notificationId: reminderSettings.notificationId,
      medicationRemindersEnabled: reminderSettings.medicationRemindersEnabled,
      appointmentRemindersEnabled: reminderSettings.appointmentRemindersEnabled,
      appointmentReminderOneDay: reminderSettings.appointmentReminderOneDay,
      appointmentReminderOneHour: reminderSettings.appointmentReminderOneHour,
      quietReminders: reminderSettings.quietReminders,
    },
    growthState: growth.state,
    programProgress: programProgress.progress,
  });
  const adaptiveProfile = useMemo(
    () =>
      applyLowEnergyModeOverride(
        buildAdaptiveProfile(historyEntries, weeklyCheckIns, personalizationMemory.memory),
        lowEnergyMode.enabled,
      ),
    [historyEntries, lowEnergyMode.enabled, personalizationMemory.memory, weeklyCheckIns],
  );
  const hasAdaptiveSupport = useMemo(
    () =>
      canAccessPremiumFeature("adaptive_support", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasDailyCalmSupport = useMemo(
    () =>
      canAccessPremiumFeature("daily_calm_support", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasAdaptiveHome = useMemo(
    () =>
      canAccessPremiumFeature("adaptive_home", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasCalmDailyEnvironment = useMemo(
    () =>
      canAccessPremiumFeature("calm_daily_environment", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const recentAverages = useMemo(
    () => ({
      fatigue: average(historyEntries.slice(0, 7).map((entry) => entry.fatigue)),
      stress: average(historyEntries.slice(0, 7).map((entry) => entry.stress)),
      sleep: average(historyEntries.slice(0, 7).map((entry) => entry.sleep_hours)),
    }),
    [historyEntries],
  );
  const adaptiveDailyDashboard = useMemo(
    () =>
      getAdaptiveDailyDashboard({
        todayEntry,
        draft,
        recentEntries: historyEntries,
        recoveryStrategies: recentTodayPlans.map((plan) => plan.whatHelped),
        hasPremiumAccess: premium.hasPremiumAccess,
        programProgress: programProgress.progress,
        recentRecommendationIds: recentSupportRecommendationIds,
        currentHour,
        date: today,
        upcomingAppointments,
        textInputs: [
          todayPlan.mainPriority,
          todayPlan.staySmaller,
          todayPlan.tomorrowEnergy,
          todayPlan.prepareTonight,
          todayPlan.tomorrowSmaller,
          todayPlan.recoveryTonight,
          todayPlan.whatHelped,
        ],
      }),
    [currentHour, draft, historyEntries, premium.hasPremiumAccess, programProgress.progress, recentSupportRecommendationIds, recentTodayPlans, today, todayEntry, todayPlan, upcomingAppointments],
  );
  const todayPlanPrioritySuggestions = useMemo(
    () =>
      getTodayPlanPrioritySuggestions({
        fatigue: getCurrentScaleValue(todayEntry, draft, "fatigue"),
        stress: getCurrentScaleValue(todayEntry, draft, "stress"),
        brainFog: getCurrentScaleValue(todayEntry, draft, "brain_fog"),
        hasAppointmentSoon: showAppointmentPrepShortcut,
      }),
    [draft, showAppointmentPrepShortcut, todayEntry],
  );
  const dailyReflectionPrompt = useMemo(
    () => getDailyReflectionPrompt(todayEntry, draft, today),
    [draft, today, todayEntry],
  );
  const premiumAdaptiveSupport = useMemo(
    () =>
      derivePremiumAdaptiveSupport({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.adaptive_support,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage: recentAverages.fatigue,
        recentStressAverage: recentAverages.stress,
        recentSleepAverage: recentAverages.sleep,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: adaptiveProfile.lowEnergyMode ? "reduced" : "steady",
        preferredSupportStyle: personalizationMemory.memory.preferredSupportStyle,
        preferredDensity: personalizationMemory.memory.preferredDensity,
        timeOfDay: currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening",
        engagementRhythm: personalizationMemory.memory.engagementRhythm,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      currentHour,
      lowEnergyMode.enabled,
      personalizationMemory.memory.engagementRhythm,
      personalizationMemory.memory.preferredDensity,
      personalizationMemory.memory.preferredSupportStyle,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.adaptive_support,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
    ],
  );
  const premiumDailySupport = useMemo(
    () =>
      derivePremiumDailySupport({
        currentHour,
        lowEnergyMode: lowEnergyMode.enabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.daily_calm_support,
        recentFatigueAverage: recentAverages.fatigue,
        recentStressAverage: recentAverages.stress,
        recentSleepAverage: recentAverages.sleep,
        todayEntry,
      }),
    [
      currentHour,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.daily_calm_support,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      todayEntry,
    ],
  );
  const premiumAdaptiveHome = useMemo(
    () =>
      derivePremiumAdaptiveHome({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.adaptive_home,
        lowEnergyMode: lowEnergyMode.enabled,
        recentFatigueAverage: recentAverages.fatigue,
        recentStressAverage: recentAverages.stress,
        recentSleepAverage: recentAverages.sleep,
        hasTodayEntry: Boolean(todayEntry),
        recentCheckIns: weeklyCheckIns,
        currentHour,
        reducedInteractionTolerance:
          adaptiveProfile.lowEnergyMode || personalizationMemory.memory.engagementRhythm === "sporadic",
      }),
    [
      adaptiveProfile.lowEnergyMode,
      currentHour,
      lowEnergyMode.enabled,
      personalizationMemory.memory.engagementRhythm,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.adaptive_home,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      todayEntry,
      weeklyCheckIns,
    ],
  );
  const premiumCalmCompanionEnvironment = useMemo(
    () =>
      derivePremiumCalmCompanionEnvironment({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.calm_daily_environment,
        lowEnergyMode: lowEnergyMode.enabled,
        recentFatigueAverage: recentAverages.fatigue,
        recentStressAverage: recentAverages.stress,
        recentSleepAverage: recentAverages.sleep,
        recentCheckIns: weeklyCheckIns,
        currentHour,
        reducedInteractionTolerance:
          adaptiveProfile.lowEnergyMode || personalizationMemory.memory.engagementRhythm === "sporadic",
        hasTodayEntry: Boolean(todayEntry),
      }),
    [
      adaptiveProfile.lowEnergyMode,
      currentHour,
      lowEnergyMode.enabled,
      personalizationMemory.memory.engagementRhythm,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.calm_daily_environment,
      recentAverages.fatigue,
      recentAverages.sleep,
      recentAverages.stress,
      todayEntry,
      weeklyCheckIns,
    ],
  );
  const visibleSummaryItems = useMemo(
    () =>
      adaptiveProfile.lowEnergyMode || (hasAdaptiveSupport && premiumAdaptiveSupport.active)
        ? summaryItems.slice(0, Math.min(4, premiumAdaptiveSupport.density.maxCards))
        : summaryItems,
    [adaptiveProfile.lowEnergyMode, hasAdaptiveSupport, premiumAdaptiveSupport.active, premiumAdaptiveSupport.density.maxCards, summaryItems],
  );
  const lifecycleProfile = useMemo(
    () =>
      buildLifecycleProfile({
        firstOpenedAt: growth.state?.firstOpenedAt ?? null,
        activeDates: growth.state?.activeDates ?? [],
        totalCheckIns,
        weeklyCheckIns,
      }),
    [growth.state?.activeDates, growth.state?.firstOpenedAt, totalCheckIns, weeklyCheckIns],
  );
  const suggestedProgram = useMemo(() => getProgramToolById(adaptiveProfile.suggestedProgram), [adaptiveProfile.suggestedProgram]);
  const secondarySuggestedProgram = useMemo(
    () => getProgramToolById(adaptiveProfile.secondarySuggestedProgram),
    [adaptiveProfile.secondarySuggestedProgram],
  );
  const lowEnergyQuickActions = useMemo(() => getLowEnergyQuickActions(adaptiveProfile), [adaptiveProfile]);
  const postCheckInMoment = useMemo(
    () =>
      derivePostCheckInMoment({
        fatigue: draft.fatigue,
        stress: draft.stress,
        brainFog: draft.brain_fog,
        mood: draft.mood,
        hasNotes: draft.notes.trim().length > 0,
        queuedOffline: lastSaveQueued,
        lowEnergyMode: lowEnergyMode.enabled,
      }),
    [draft.brain_fog, draft.fatigue, draft.mood, draft.notes, draft.stress, lastSaveQueued, lowEnergyMode.enabled],
  );
  const todayGuidance = useMemo(
    () =>
      buildTodayGuidance(
        todayEntry,
        aiSummaryQuery.data ?? null,
        today,
        adaptiveProfile,
        personalizationMemory.memory,
        lifecycleProfile,
        lifeContext,
        { forceLowEnergyMode: lowEnergyMode.enabled },
      ),
    [adaptiveProfile, aiSummaryQuery.data, lifeContext, lifecycleProfile, lowEnergyMode.enabled, personalizationMemory.memory, today, todayEntry],
  );
  const reflectionFeed = useMemo(
    () =>
      buildReflectionFeed({
        entries: longitudinalEntries,
        analysis: longitudinalAnalysis,
        adaptiveState: longitudinalAnalysis.adaptiveState,
        timeOfDay: currentHour,
        sessionLengthSeconds: 0,
        skippedCheckIns: Math.max(0, 7 - weeklyCheckIns),
        recentCardIds: recentReflectionCardIdsRef.current,
        lifecycleStage: lifecycleProfile.stage,
        preferredSupportStyle: personalizationMemory.memory?.preferredSupportStyle ?? null,
      }),
    [
      currentHour,
      lifecycleProfile.stage,
      longitudinalAnalysis,
      longitudinalEntries,
      personalizationMemory.memory,
      weeklyCheckIns,
    ],
  );
  const interactionFrequency = useMemo(
    () =>
      longitudinalEntries.slice(0, 7).reduce((sum, entry) => sum + (entry.interaction_count ?? 1), 0) /
      Math.max(1, Math.min(7, longitudinalEntries.length || 1)),
    [longitudinalEntries],
  );
  const energyAwareFlow = useMemo(() => {
    const fatigueLevel = todayEntry?.fatigue ?? historyEntries[0]?.fatigue ?? null;

    return deriveAdaptiveFlow({
      adaptiveState: longitudinalAnalysis.adaptiveState,
      lifecycleStage: lifecycleProfile.stage,
      fatigueLevel,
      skippedCheckIns: Math.max(0, 7 - weeklyCheckIns),
      sessionLengthSeconds: 0,
      interactionFrequency,
      repeatedSkippedPrompts:
        adaptiveProfile.lowEnergyMode && !todayEntry && lifecycleProfile.stage !== "new" ? 1 : 0,
    });
  }, [
    adaptiveProfile.lowEnergyMode,
    historyEntries,
    interactionFrequency,
    lifecycleProfile.stage,
    longitudinalAnalysis.adaptiveState,
    todayEntry,
    weeklyCheckIns,
  ]);
  const continuityState = useMemo(
    () =>
      deriveContinuityState({
        lifecycleStage: lifecycleProfile.stage,
        previousActiveGapDays: lifecycleProfile.previousActiveGapDays,
        recentActiveDays: Math.min(7, growth.state?.activeDates.length ?? weeklyCheckIns),
        totalCheckIns,
        weeklyCheckIns,
      }),
    [growth.state?.activeDates.length, lifecycleProfile.previousActiveGapDays, lifecycleProfile.stage, totalCheckIns, weeklyCheckIns],
  );
  const routineDisruption = useMemo(
    () =>
      detectRoutineDisruption({
        lifecycleStage: lifecycleProfile.stage,
        previousActiveGapDays: lifecycleProfile.previousActiveGapDays,
        weeklyCheckIns,
      }),
    [lifecycleProfile.previousActiveGapDays, lifecycleProfile.stage, weeklyCheckIns],
  );
  const recoveryExperience = useMemo(
    () =>
      deriveRecoveryExperience({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        disruption: routineDisruption,
      }),
    [longitudinalAnalysis.adaptiveState.primary, routineDisruption],
  );
  const behavioralDemand = useMemo(
    () =>
      deriveBehavioralDemand({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        disruption: routineDisruption,
      }),
    [longitudinalAnalysis.adaptiveState.primary, routineDisruption],
  );
  const suggestedEffortLevel = useMemo(() => deriveSuggestedEffortLevel(behavioralDemand), [behavioralDemand]);
  const sustainableCadence = useMemo(
    () =>
      deriveSustainableCadence({
        recentActiveDays: Math.min(7, growth.state?.activeDates.length ?? weeklyCheckIns),
        weeklyCheckIns,
      }),
    [growth.state?.activeDates.length, weeklyCheckIns],
  );
  const overextensionPattern = useMemo(
    () =>
      detectOverextensionPatterns({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        interactionFrequency,
        weeklyCheckIns,
      }),
    [interactionFrequency, longitudinalAnalysis.adaptiveState.primary, weeklyCheckIns],
  );
  const continuityMessaging = useMemo(
    () => generateConsistencyMessaging(continuityState, sustainableCadence),
    [continuityState, sustainableCadence],
  );
  const gentleReentry = useMemo(() => generateGentleReentry(recoveryExperience), [recoveryExperience]);
  const selfCompassionReinforcement = useMemo(
    () =>
      generateSelfCompassionReinforcement({
        continuity: continuityState,
        recoveryExperience,
      }),
    [continuityState, recoveryExperience],
  );
  const gentleNormalization = useMemo(
    () =>
      deriveGentleNormalization({
        demand: behavioralDemand,
        disruption: routineDisruption,
      }),
    [behavioralDemand, routineDisruption],
  );
  const cognitiveBurden = useMemo(
    () =>
      deriveCognitiveBurden({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        visibleSurfaceCount:
          4 +
          (todayEntry ? 1 : 0) +
          (reflectionFeed.length > 0 ? 1 : 0) +
          (recentActionCard ? 1 : 0) +
          (suggestedProgram ? 1 : 0) +
          (secondarySuggestedProgram ? 1 : 0) +
          (wins.length > 0 ? 1 : 0),
        actionCount: todayGuidance.actions.length + 3 + (lowEnergyQuickActions.length > 0 ? lowEnergyQuickActions.length : 0),
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
      }),
    [
      aiSummaryQuery.data?.summary,
      longitudinalAnalysis.adaptiveState.primary,
      lowEnergyQuickActions.length,
      recentActionCard,
      reflectionFeed.length,
      secondarySuggestedProgram,
      suggestedProgram,
      todayEntry,
      todayGuidance.actions.length,
      wins.length,
    ],
  );
  const decisionLoad = useMemo(
    () =>
      deriveDecisionLoad({
        actionCount: todayGuidance.actions.length + 3,
        optionCount: lowEnergyQuickActions.length + (secondarySuggestedProgram ? 1 : 0),
        hasSecondaryChoices: Boolean(recentActionCard || suggestedProgram),
      }),
    [
      lowEnergyQuickActions.length,
      recentActionCard,
      secondarySuggestedProgram,
      suggestedProgram,
      todayGuidance.actions.length,
    ],
  );
  const disclosureDepth = useMemo(
    () =>
      deriveDisclosureDepth({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: cognitiveBurden,
        lifecycleStage: lifecycleProfile.stage,
      }),
    [cognitiveBurden, lifecycleProfile.stage, longitudinalAnalysis.adaptiveState.primary],
  );
  const deferredContent = useMemo(
    () =>
      deriveDeferredContent({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const optionalExpansion = useMemo(
    () => deriveOptionalExpansion(disclosureDepth),
    [disclosureDepth],
  );
  const hiddenComplexity = useMemo(
    () =>
      deriveHiddenComplexity({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const reflectionDensity = useMemo(
    () =>
      deriveReflectionDensity({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: cognitiveBurden,
      }),
    [cognitiveBurden, longitudinalAnalysis.adaptiveState.primary],
  );
  const navigationPriority = useMemo(
    () =>
      deriveNavigationPriority({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const adaptiveDefaults = useMemo(
    () =>
      deriveAdaptiveDefaults({
        burden: cognitiveBurden,
        disclosureDepth,
      }),
    [cognitiveBurden, disclosureDepth],
  );
  const quietMoment = useMemo(
    () =>
      deriveQuietMoments({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        hasStackedEmotionalSurfaces: reflectionFeed.length > 0 && Boolean(aiSummaryQuery.data?.summary),
      }),
    [aiSummaryQuery.data?.summary, longitudinalAnalysis.adaptiveState.primary, reflectionFeed.length],
  );
  const lowStimulusSurface = useMemo(
    () => deriveLowStimulusSurface(longitudinalAnalysis.adaptiveState.primary),
    [longitudinalAnalysis.adaptiveState.primary],
  );
  const atmosphere = useMemo(
    () =>
      deriveAtmosphereState({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        hasStackedEmotionalSurfaces: reflectionFeed.length > 0 && Boolean(aiSummaryQuery.data?.summary),
        timeOfDay: currentHour,
        reflectionCount: reflectionFeed.length,
        aiSurfaceVisible: Boolean(aiSummaryQuery.data?.summary),
        burden: cognitiveBurden,
      }),
    [
      aiSummaryQuery.data?.summary,
      cognitiveBurden,
      currentHour,
      longitudinalAnalysis.adaptiveState.primary,
      reflectionFeed.length,
    ],
  );
  const atmosphereTransition = useMemo(() => deriveAtmosphereTransitions("LIGHT", atmosphere), [atmosphere]);
  const emotionalDensity = useMemo(
    () =>
      deriveEmotionalDensity({
        atmosphere,
        hasStackedEmotionalSurfaces: reflectionFeed.length > 0 && Boolean(aiSummaryQuery.data?.summary),
        reflectionCount: reflectionFeed.length,
      }),
    [aiSummaryQuery.data?.summary, atmosphere, reflectionFeed.length],
  );
  const reflectionSpacing = useMemo(() => deriveReflectionSpacing(emotionalDensity), [emotionalDensity]);
  const environmentQuietMoment = useMemo(
    () =>
      deriveEnvironmentQuietMoment(
        atmosphere,
        reflectionFeed.length > 0 && Boolean(aiSummaryQuery.data?.summary),
      ),
    [aiSummaryQuery.data?.summary, atmosphere, reflectionFeed.length],
  );
  const coherenceBurden = useMemo(
    () => (cognitiveBurden === "high" ? "high" : cognitiveBurden === "medium" ? "moderate" : "low"),
    [cognitiveBurden],
  );
  const coherenceRules = useMemo(
    () =>
      deriveUnifiedEmotionalRules({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
        hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
        hasStackedEmotionalSurfaces: reflectionFeed.length > 0 && Boolean(aiSummaryQuery.data?.summary),
      }),
    [aiSummaryQuery.data?.summary, coherenceBurden, longitudinalAnalysis.adaptiveState.primary, reflectionFeed.length],
  );
  const coherenceAdaptive = useMemo(
    () =>
      reconcileAdaptiveSystems({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
        reflectionCount: reflectionFeed.length,
        quickLinkCount: 3,
      }),
    [aiSummaryQuery.data?.summary, coherenceBurden, longitudinalAnalysis.adaptiveState.primary, reflectionFeed.length],
  );
  const coherenceDensityLimits = useMemo(
    () =>
      deriveEmotionalDensityLimits({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
      }),
    [aiSummaryQuery.data?.summary, coherenceBurden, longitudinalAnalysis.adaptiveState.primary],
  );
  const coherencePromptLimits = useMemo(
    () =>
      derivePromptLoadLimits({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
      }),
    [coherenceBurden, longitudinalAnalysis.adaptiveState.primary],
  );
  const transitionContinuity = useMemo(
    () =>
      deriveTransitionContinuity({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
        fromSurface: "today",
        toSurface: todayGuidance.actions[0]?.route === "/insights" ? "insights" : "coach",
      }),
    [coherenceBurden, longitudinalAnalysis.adaptiveState.primary, todayGuidance.actions],
  );
  const crossFlowConsistency = useMemo(
    () =>
      deriveCrossFlowConsistency({
        entryTone: transitionContinuity.bridgeTone,
        destinationTone: deriveUnifiedTone({
          adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
          emotionalLoad: coherenceBurden === "high" ? "high" : coherenceBurden === "moderate" ? "moderate" : "low",
        }),
      }),
    [coherenceBurden, longitudinalAnalysis.adaptiveState.primary, transitionContinuity.bridgeTone],
  );
  const metaOrchestration = useMemo(
    () =>
      orchestrateAdaptiveSystems({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
        reflectionCount: reflectionFeed.length,
        hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
        activeSystems: [
          "energy-aware",
          "attention-respect",
          "behavior-support",
          "cognitive-simplification",
          "system-coherence",
        ],
      }),
    [
      aiSummaryQuery.data?.summary,
      coherenceBurden,
      longitudinalAnalysis.adaptiveState.primary,
      reflectionFeed.length,
    ],
  );
  const metaPriority = useMemo(
    () =>
      deriveCalmnessPriority({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        burden: coherenceBurden,
      }),
    [coherenceBurden, longitudinalAnalysis.adaptiveState.primary],
  );
  const primarySurface = useMemo(
    () =>
      derivePrimarySurface({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        lifecycleStage: lifecycleProfile.stage,
        hasTodayEntry: Boolean(todayEntry),
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
        hasReflectionCards: reflectionFeed.length > 0,
      }),
    [aiSummaryQuery.data?.summary, lifecycleProfile.stage, longitudinalAnalysis.adaptiveState.primary, reflectionFeed.length, todayEntry],
  );
  const visibleReflectionCards = useMemo(() => [], []);
  const visibleQuickLinks = useMemo(
    () =>
      [
        {
          title: "Coach",
          body: "Planning, reflection, energy support, and practical help.",
          route: "/coach" as const,
        },
        {
          title: "Programs",
          body: "Guided tools for fatigue, recovery, overwhelm, and focus.",
          route: "/programs" as const,
        },
        {
          title: "Exercises",
          body: "Short cognitive and focus exercises.",
          route: "/programs?section=exercises" as const,
        },
        {
          title: "Community",
          body: "Read discussions and shared experiences from others with MS.",
          route: "/community" as const,
        },
      ],
    [],
  );
  const visibleQuickLinksQuiet = useMemo(
    () => visibleQuickLinks,
    [visibleQuickLinks],
  );
  const attentionLoad = useMemo(
    () =>
      deriveAttentionLoad({
        visibleSurfaceCount:
          3 +
          (visibleReflectionCards.length > 0 ? 1 : 0) +
          (aiSummaryQuery.data?.summary ? 1 : 0) +
          (suggestedProgram ? 1 : 0),
        actionCount: todayGuidance.actions.length + visibleQuickLinksQuiet.length,
        hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
        hasReflectionCards: visibleReflectionCards.length > 0,
      }),
    [
      aiSummaryQuery.data?.summary,
      suggestedProgram,
      todayGuidance.actions.length,
      visibleQuickLinksQuiet.length,
      visibleReflectionCards.length,
    ],
  );
  const promptSuppressed = useMemo(
    () =>
      derivePromptSuppression({
        attentionLoad,
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
      }),
    [attentionLoad, longitudinalAnalysis.adaptiveState.primary],
  );
  const sessionEntryState = useMemo(
    () =>
      deriveSessionEntryState({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        attentionLoad,
      }),
    [attentionLoad, longitudinalAnalysis.adaptiveState.primary],
  );
  const calmOrientation = useMemo(() => deriveCalmOrientation(sessionEntryState), [sessionEntryState]);
  const sessionClosure = useMemo(
    () =>
      deriveSessionClosure({
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
        attentionLoad,
      }),
    [attentionLoad, longitudinalAnalysis.adaptiveState.primary],
  );
  const healthyExitState = useMemo(
    () =>
      deriveHealthyExitState({
        attentionLoad,
        adaptiveStatePrimary: longitudinalAnalysis.adaptiveState.primary,
      }),
    [attentionLoad, longitudinalAnalysis.adaptiveState.primary],
  );
  const visibleGuidanceActions = useMemo(
    () =>
      todayGuidance.actions.slice(
        0,
        Math.min(
          decisionLoad === "high" ? 1 : 2,
          coherencePromptLimits.maxPromptActions,
          metaOrchestration.interpretationLimits.maxPromptActions,
          coherenceRules.promptLoadLimit,
          hasAdaptiveHome && premiumAdaptiveHome.active ? premiumAdaptiveHome.layout.maxGuidanceActions : coherenceRules.promptLoadLimit,
          hasCalmDailyEnvironment && premiumCalmCompanionEnvironment.active
            ? premiumCalmCompanionEnvironment.spacing.maxGuidanceActions
            : coherenceRules.promptLoadLimit,
        ),
      ),
    [
      coherencePromptLimits.maxPromptActions,
      coherenceRules.promptLoadLimit,
      decisionLoad,
      hasAdaptiveHome,
      hasCalmDailyEnvironment,
      metaOrchestration.interpretationLimits.maxPromptActions,
      premiumAdaptiveHome.active,
      premiumAdaptiveHome.layout.maxGuidanceActions,
      premiumCalmCompanionEnvironment.active,
      premiumCalmCompanionEnvironment.spacing.maxGuidanceActions,
      todayGuidance.actions,
    ],
  );
  useEffect(() => {
    if (growth.isLoading) {
      return;
    }

    const trackingKey = `${today}:${lifecycleProfile.stage}:${lifecycleProfile.previousActiveGapDays ?? "none"}`;
    if (lastTrackedLifecycleKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedLifecycleKeyRef.current = trackingKey;

    void growth.recordEvent("lifecycle_stage_viewed", {
      stage: lifecycleProfile.stage,
      weeklyCheckIns,
      totalCheckIns,
    });

    if (lifecycleProfile.isReactivatedRecently) {
      void growth.recordEvent("reactivation_detected", {
        gapDays: lifecycleProfile.previousActiveGapDays ?? 0,
      });
    }
  }, [
    growth,
    growth.isLoading,
    lifecycleProfile.isReactivatedRecently,
    lifecycleProfile.previousActiveGapDays,
    lifecycleProfile.stage,
    today,
    totalCheckIns,
    weeklyCheckIns,
  ]);

  useEffect(() => {
    if (!user?.id) {
      setMedicationsTakenToday({});
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const taken = await medicationsApi.listTakenToday(user.id, today);

        if (!cancelled) {
          setMedicationsTakenToday(taken);
        }
      } catch (error) {
        logger.warn("Today medications taken state could not load.", {
          error: getErrorMessage(error),
        });

        if (!cancelled) {
          setMedicationsTakenToday({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setTodayPlan(EMPTY_TODAY_PLAN);
      setSavedTodayPlan(null);
      setTodayPlanSaveState("idle");
      return;
    }

    let cancelled = false;

    void (async () => {
      const [savedPlan, recentPlans] = await Promise.all([
        loadTodayPlan(user.id, today),
        loadRecentTodayPlans(user.id, today, 14),
      ]);

      if (cancelled) {
        return;
      }

      setRecentTodayPlans(recentPlans);
      setSavedTodayPlan(savedPlan);

      setTodayPlan(
        savedPlan
          ? {
              mainPriority: savedPlan.mainPriority,
              energyLevel: savedPlan.energyLevel,
              staySmaller: savedPlan.staySmaller,
              recoveryProtection: savedPlan.recoveryProtection,
              tomorrowEnergy: savedPlan.tomorrowEnergy,
              prepareTonight: savedPlan.prepareTonight,
              tomorrowSmaller: savedPlan.tomorrowSmaller,
              recoveryTonight: savedPlan.recoveryTonight,
              whatHelped: savedPlan.whatHelped,
            }
          : EMPTY_TODAY_PLAN,
      );
      setTodayPlanSaveState(savedPlan ? "saved" : "idle");
    })();

    return () => {
      cancelled = true;
    };
  }, [today, user?.id]);

  useEffect(() => {
    if (!checkInQuery.isSuccess) {
      return;
    }

    const nextDraft = getDraftFromCheckIn(checkInQuery.data);
    let cancelled = false;

    void (async () => {
      const localDraftSnapshot = user?.id ? await loadCheckinDraft<DailyCheckInDraft>(user.id, today) : null;
      const restored = restoreSessionContinuity<DailyCheckInDraft>({
        serverValue: nextDraft,
        localValue: localDraftSnapshot?.draft ?? null,
        preferLocalWhenEmpty: true,
      });

      if (cancelled || !restored) {
        return;
      }

      lastSavedSnapshotRef.current = getDraftSnapshot(nextDraft);
      setDraft(restored);
      setSaveState("idle");
      setLastSaveQueued(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [checkInQuery.data, checkInQuery.isSuccess, today, user?.id]);

  useEffect(() => {
    if (saveState === "saving") {
      return;
    }

    if (getDraftSnapshot(draft) !== lastSavedSnapshotRef.current) {
      setSaveState("idle");
    }
  }, [draft, saveState]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void preserveCheckinDraft(user.id, today, draft);
  }, [draft, today, user?.id]);

  useEffect(() => {
    recentReflectionCardIdsRef.current = reflectionFeed.map((card) => card.repetitionKey);
  }, [reflectionFeed]);

  const showStreakCelebration = (message: string) => {
    setStreakCelebration(message);
    streakCelebrationOpacity.setValue(0);
    streakCelebrationY.setValue(8);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(streakCelebrationOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(streakCelebrationY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.timing(streakCelebrationOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setStreakCelebration(null);
      }
    });
  };

  const updateTodayPlanField = (field: keyof TodayPlanDraft, value: string) => {
    setTodayPlan((current) => ({
      ...current,
      [field]: value,
    }));
    setTodayPlanSaveState("idle");
  };

  const saveCurrentTodayPlan = async () => {
    if (!user?.id) {
      return;
    }

    setTodayPlanSaveState("saving");

    const nextPlan: TodayPlan = {
      userId: user.id,
      date: today,
      mainPriority: todayPlan.mainPriority.trim(),
      energyLevel: todayPlan.energyLevel.trim(),
      staySmaller: todayPlan.staySmaller.trim(),
      recoveryProtection: todayPlan.recoveryProtection.trim(),
      tomorrowEnergy: todayPlan.tomorrowEnergy.trim(),
      prepareTonight: todayPlan.prepareTonight.trim(),
      tomorrowSmaller: todayPlan.tomorrowSmaller.trim(),
      recoveryTonight: todayPlan.recoveryTonight.trim(),
      whatHelped: todayPlan.whatHelped.trim(),
      isComplete: savedTodayPlan?.isComplete ?? false,
      createdAt: savedTodayPlan?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTodayPlan(nextPlan);
    setSavedTodayPlan(nextPlan);
    setTodayPlan({
      mainPriority: nextPlan.mainPriority,
      energyLevel: nextPlan.energyLevel,
      staySmaller: nextPlan.staySmaller,
      recoveryProtection: nextPlan.recoveryProtection,
      tomorrowEnergy: nextPlan.tomorrowEnergy,
      prepareTonight: nextPlan.prepareTonight,
      tomorrowSmaller: nextPlan.tomorrowSmaller,
      recoveryTonight: nextPlan.recoveryTonight,
      whatHelped: nextPlan.whatHelped,
    });
    setRecentTodayPlans((current) => [nextPlan, ...current.filter((plan) => plan.date !== today)].slice(0, 14));
    setTodayPlanSaveState("saved");
    void Haptics.selectionAsync();
  };

  const toggleTodayPlanComplete = async () => {
    if (!user?.id) {
      return;
    }

    const nextPlan: TodayPlan = {
      userId: user.id,
      date: today,
      mainPriority: todayPlan.mainPriority.trim(),
      energyLevel: todayPlan.energyLevel.trim(),
      staySmaller: todayPlan.staySmaller.trim(),
      recoveryProtection: todayPlan.recoveryProtection.trim(),
      tomorrowEnergy: todayPlan.tomorrowEnergy.trim(),
      prepareTonight: todayPlan.prepareTonight.trim(),
      tomorrowSmaller: todayPlan.tomorrowSmaller.trim(),
      recoveryTonight: todayPlan.recoveryTonight.trim(),
      whatHelped: todayPlan.whatHelped.trim(),
      isComplete: !(savedTodayPlan?.isComplete ?? false),
      createdAt: savedTodayPlan?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedTodayPlan(nextPlan);
    setRecentTodayPlans((current) => [nextPlan, ...current.filter((plan) => plan.date !== today)].slice(0, 14));
    await saveTodayPlan(nextPlan);
    setTodayPlanSaveState("saved");
    void Haptics.selectionAsync();
  };

  const markMedicationTakenToday = (medicationId: string) => {
    if (!user?.id) {
      return;
    }

    void Haptics.selectionAsync();

    const takenAt = new Date().toISOString();

    setMedicationsTakenToday((current) => {
      const next = {
        ...current,
        [medicationId]: takenAt,
      };
      return next;
    });

    void medicationsApi.markTakenToday(user.id, medicationId, today, takenAt).catch((error) => {
      logger.warn("Today medication taken state could not sync.", {
        error: getErrorMessage(error),
      });
    });
  };

  const handleSaveCheckIn = async () => {
    if (!user?.id || saveState === "saving") {
      return;
    }

    setSaveState("saving");

    try {
      const savedRow = await saveCheckIn.mutateAsync({
        userId: user.id,
        date: today,
        input: normalizeCheckInInput(draft),
      });

      if (!savedRow?.id || !savedRow?.user_id || !savedRow?.date) {
        throw new Error("Daily entry save did not return a valid row");
      }

      const queuedOffline = savedRow.id.startsWith("offline-");
      lastSavedSnapshotRef.current = getDraftSnapshot(draft);
      setLastSaveQueued(queuedOffline);
      if (!lowEnergyMode.enabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (!todayEntry && totalCheckIns === 0) {
        await growth.recordEvent("first_check_in", {
          source: "today",
          date: today,
        });
      }
      await growth.recordEvent("check_in_completed", {
        source: "today",
        date: today,
      });
      const previousStreak = streak;
      const nextStreak = getCurrentCheckInStreak(
        todayEntry
          ? overviewEntries
          : [
              ...overviewEntries,
              {
                date: today,
                hasReflection: typeof draft.notes === "string" && draft.notes.trim().length > 0,
              },
            ],
        today,
      );
      if (!todayEntry && nextStreak > previousStreak) {
        showStreakCelebration(getStreakCelebrationMessage(nextStreak));
      }
      if (!todayEntry && nextStreak > 1) {
        await growth.recordEvent("streak_continued", {
          streak: nextStreak,
        });
      }
      await growth.maybePromptForReview({
        totalCheckIns: todayEntry ? totalCheckIns : totalCheckIns + 1,
      });
      await clearCheckinDraft(user.id, today);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  if (!user?.id) {
    return <ErrorState message="Today’s check-in is available once you’re signed in." />;
  }

  if (checkInQuery.isLoading) {
    return <TodayLoadingShell today={today} />;
  }

  if (checkInQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(checkInQuery.error)}
        onRetry={() => {
          void trackRetryTriggered("today-checkin-query");
          void checkInQuery.refetch();
        }}
      />
    );
  }

  return (
    <AppScreen
      eyebrow="Daily check-in"
      title="Today"
      subtitle="Track energy, mood, stress, and symptoms."
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          adaptiveProfile.lowEnergyMode && styles.contentLowEnergy,
          {
            paddingBottom: Math.max(120, insets.bottom + 96),
          },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <AppText style={styles.todayDate}>
            {formatLongDate(today)}
            {todayEntry ? " • Check-in saved ✓" : ""}
          </AppText>
          <View style={styles.streakPill}>
            <AppText style={styles.streakPillText}>{streakLabel}</AppText>
          </View>
          {streakCelebration ? (
            <Animated.View
              style={[
                styles.streakCelebrationCard,
                {
                  opacity: streakCelebrationOpacity,
                  transform: [{ translateY: streakCelebrationY }],
                },
              ]}
            >
              <AppText style={styles.streakConfetti}>✦ 🎉 ✦</AppText>
              <AppText style={styles.streakCelebrationText}>{streakCelebration}</AppText>
            </Animated.View>
          ) : null}
          <AppText style={styles.overviewBody}>
            {todayEntry
              ? "Update it if something changes."
              : "Start with a short check-in."}
          </AppText>
        </View>

        <View style={styles.todayFocusCard}>
          <AppText style={styles.todayFocusLabel}>Today’s focus</AppText>
          <AppText style={styles.todayFocusText}>{todayFocusLine}</AppText>
        </View>

        {historyQuery.isLoading && historyEntries.length === 0 ? (
          <View style={styles.infoCard}>
            <AppText style={styles.infoTitle}>Loading recent check-ins</AppText>
            <AppText style={styles.infoBody}>Recent entries are loading now.</AppText>
          </View>
        ) : null}

        {historyQuery.isError ? (
          <View style={styles.warningCard}>
            <AppText style={styles.warningTitle}>Some recent history needs a moment</AppText>
            <AppText style={styles.warningBody}>
              Today’s check-in is still here, and the rest can settle in shortly.
            </AppText>
          </View>
        ) : null}

        {adaptiveProfile.lowEnergyMode ? (
          <View style={styles.warningCard}>
            <AppText style={styles.warningTitle}>Low-Energy Mode is on</AppText>
            <AppText style={styles.warningBody}>
              The layout is simplified to reduce reading and decision load.
            </AppText>
            <View style={styles.guidanceActions}>
              {lowEnergyQuickActions.map((action) => (
                <Pressable
                  key={`${action.route}-${action.label}`}
                  onPress={() => router.push(action.route)}
                  style={({ pressed }) => [styles.guidanceAction, pressed && styles.quickLinkPressed]}
                >
                  <AppText style={styles.guidanceActionText}>{action.label}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <DailyCheckInCard
          draft={draft}
          onChange={setDraft}
          saveState={saveState}
          onSave={() => void handleSaveCheckIn()}
          saveMomentTitle={lastSaveQueued ? "Saved offline" : "Saved"}
          saveMomentBody={lastSaveQueued ? "This check-in will sync when the connection returns." : "Check-in saved ✓"}
          postSaveInsight={operationalObservation ?? undefined}
          saveFooterText={lastSaveQueued ? "Waiting to sync." : "Saved."}
          onViewInsights={() => router.push("/insights")}
          supportMode={adaptiveProfile.lowEnergyMode ? "low-energy" : "default"}
          compressionMode={energyAwareFlow.compressedCheckIn.enabled ? "reduced" : "standard"}
          noteStarterLimit={Math.min(
            adaptiveDefaults.noteStarterCount,
            energyAwareFlow.compressedCheckIn.limitNoteStarters ? 2 : 3,
          )}
        />

        <View style={styles.dailyIntelligenceCard}>
          <AppText style={styles.dailyIntelligenceLabel}>Today’s guidance</AppText>
          <AppText style={styles.dailyIntelligenceTitle}>{adaptiveDailyDashboard.guidance}</AppText>
          <AppText style={styles.dailyIntelligenceBody}>{adaptiveDailyDashboard.stateSummary}</AppText>
        </View>

        <View style={styles.todayPlanCard}>
          <View style={styles.todayPlanHeader}>
            <View style={styles.todayPlanHeaderCopy}>
              <AppText style={styles.navTitle}>Today plan</AppText>
              <AppText style={styles.todayPlanSubtitle}>One realistic focus, one thing to keep smaller.</AppText>
            </View>
            <View style={styles.todayPlanHeaderActions}>
              {savedTodayPlan ? (
                <Pressable
                  onPress={() => void toggleTodayPlanComplete()}
                  style={({ pressed }) => [
                    styles.todayPlanSecondaryButton,
                    savedTodayPlan.isComplete && styles.todayPlanSecondaryButtonComplete,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanSecondaryButtonText,
                      savedTodayPlan.isComplete && styles.todayPlanSecondaryButtonTextComplete,
                    ]}
                  >
                    {savedTodayPlan.isComplete ? "Done for today" : "Mark done"}
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => void saveCurrentTodayPlan()}
                disabled={todayPlanSaveState === "saving"}
                style={({ pressed }) => [
                  styles.todayPlanSaveButton,
                  todayPlanSaveState === "saved" && styles.todayPlanSaveButtonSaved,
                  pressed && styles.quickLinkPressed,
                ]}
              >
                <AppText
                  style={[
                    styles.todayPlanSaveButtonText,
                    todayPlanSaveState === "saved" && styles.todayPlanSaveButtonTextSaved,
                  ]}
                >
                  {getTodayPlanSaveLabel(todayPlanSaveState)}
                </AppText>
              </Pressable>
            </View>
          </View>

          {savedTodayPlan ? (
            <View style={styles.todayPlanSavedCard}>
              <View style={styles.todayPlanSavedHeader}>
                <AppText style={styles.todayPlanSavedTitle}>Saved for today</AppText>
                <AppText style={styles.todayPlanSavedMeta}>
                  {savedTodayPlan.isComplete ? "Done for today" : `Updated ${new Date(savedTodayPlan.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                </AppText>
              </View>
              {savedTodayPlan.mainPriority ? (
                <AppText style={styles.todayPlanSavedLine}>Main priority: {savedTodayPlan.mainPriority}</AppText>
              ) : null}
              {savedTodayPlan.energyLevel ? (
                <AppText style={styles.todayPlanSavedLine}>Energy today: {savedTodayPlan.energyLevel}</AppText>
              ) : null}
              {savedTodayPlan.staySmaller ? (
                <AppText style={styles.todayPlanSavedLine}>Keep smaller: {savedTodayPlan.staySmaller}</AppText>
              ) : null}
              {savedTodayPlan.recoveryProtection ? (
                <AppText style={styles.todayPlanSavedLine}>Recovery support: {savedTodayPlan.recoveryProtection}</AppText>
              ) : null}
              {savedTodayPlan.prepareTonight ? (
                <AppText style={styles.todayPlanSavedLine}>Prepare tonight: {savedTodayPlan.prepareTonight}</AppText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.todayPlanSection}>
            <AppText style={styles.todayPlanLabel}>Main priority</AppText>
            <AppText style={styles.todayPlanPrompt}>What matters most today?</AppText>
            <TextInput
              value={todayPlan.mainPriority}
              onChangeText={(value) => updateTodayPlanField("mainPriority", value)}
              placeholder="One main focus"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {todayPlanPrioritySuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("mainPriority", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.mainPriority === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.mainPriority === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.todayPlanSection}>
            <AppText style={styles.todayPlanLabel}>Energy today</AppText>
            <AppText style={styles.todayPlanPrompt}>What does energy look like today?</AppText>
            <TextInput
              value={todayPlan.energyLevel}
              onChangeText={(value) => updateTodayPlanField("energyLevel", value)}
              placeholder="Low, mixed, steady, or a short note"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {["Low", "Mixed", "Steadier"].map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("energyLevel", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.energyLevel === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.energyLevel === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.todayPlanSection}>
            <AppText style={styles.todayPlanLabel}>Keep smaller</AppText>
            <AppText style={styles.todayPlanPrompt}>What can stay lighter today?</AppText>
            <TextInput
              value={todayPlan.staySmaller}
              onChangeText={(value) => updateTodayPlanField("staySmaller", value)}
              placeholder="Errands, screen time, workload, stimulation..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {DEFAULT_STAY_SMALLER_OPTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("staySmaller", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.staySmaller === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.staySmaller === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.todayPlanSection}>
            <AppText style={styles.todayPlanLabel}>Recovery support</AppText>
            <AppText style={styles.todayPlanPrompt}>What helps protect energy today?</AppText>
            <TextInput
              value={todayPlan.recoveryProtection}
              onChangeText={(value) => updateTodayPlanField("recoveryProtection", value)}
              placeholder="Recovery break, quieter evening, hydration..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {DEFAULT_RECOVERY_STRATEGIES.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("recoveryProtection", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.recoveryProtection === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.recoveryProtection === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.todayPlanLogistics}>
            <AppText style={styles.todayPlanLabel}>Today logistics</AppText>
            {medicationsQuery.isLoading && visibleTodayMedications.length === 0 ? (
              <AppText style={styles.careEmptyText}>Loading medications.</AppText>
            ) : visibleTodayMedications.length > 0 ? (
              <View style={styles.careItemList}>
                {visibleTodayMedications.map((medication) => {
                  const takenAt = medicationsTakenToday[medication.id];
                  const dueTime = getMedicationDueTimeLabel(
                    medication.frequency,
                    medication.reminder_time,
                    reminderSettings.hour,
                    reminderSettings.minute,
                  );

                  return (
                    <View key={medication.id} style={styles.medicationRow}>
                      <View style={styles.medicationCopy}>
                        <AppText style={styles.medicationName}>{medication.name}</AppText>
                        {medication.dosage ? (
                          <AppText style={styles.medicationDosage}>{medication.dosage}</AppText>
                        ) : null}
                        <AppText style={styles.medicationMeta}>
                          {takenAt
                            ? "✓ Taken today"
                            : dueTime
                              ? `Due at ${dueTime}`
                              : medication.frequency}
                        </AppText>
                      </View>
                      {takenAt ? (
                        <View style={styles.takenBadge}>
                          <AppText style={styles.takenBadgeText}>Taken today ✓</AppText>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => markMedicationTakenToday(medication.id)}
                          style={({ pressed }) => [styles.markTakenButton, pressed && styles.quickLinkPressed]}
                        >
                          <AppText style={styles.markTakenButtonText}>Mark as taken</AppText>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.todayPlanLogisticsRow}>
                <AppText style={styles.todayPlanLogisticsTitle}>Medications</AppText>
                <AppText style={styles.todayPlanLogisticsText}>No medications scheduled today.</AppText>
              </View>
            )}

            {upcomingAppointments.length > 0 ? (
              <View style={styles.careItemList}>
                {upcomingAppointments.slice(0, 2).map((appointment) => (
                  <View key={appointment.id} style={styles.appointmentSummaryCard}>
                    <AppText style={styles.appointmentTitle}>{appointment.title}</AppText>
                    <AppText style={styles.appointmentTime}>
                      {getAppointmentTimingLabel(appointment, today)}
                    </AppText>
                    {appointment.provider ? (
                      <AppText style={styles.appointmentMeta}>{appointment.provider}</AppText>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.todayPlanLogisticsRow}>
                <AppText style={styles.todayPlanLogisticsTitle}>Appointments</AppText>
                <AppText style={styles.todayPlanLogisticsText}>No appointments today.</AppText>
              </View>
            )}
          </View>

          <View style={styles.todayPlanSection}>
            <AppText style={styles.todayPlanLabel}>Tomorrow plan</AppText>
            <AppText style={styles.todayPlanPrompt}>What needs energy tomorrow?</AppText>
            <TextInput
              value={todayPlan.tomorrowEnergy}
              onChangeText={(value) => updateTodayPlanField("tomorrowEnergy", value)}
              placeholder="Appointment, work, errands, care tasks..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />

            <AppText style={styles.todayPlanPrompt}>What can be prepared tonight?</AppText>
            <TextInput
              value={todayPlan.prepareTonight}
              onChangeText={(value) => updateTodayPlanField("prepareTonight", value)}
              placeholder="Medication, clothes, notes, quieter evening..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {DEFAULT_TOMORROW_PREP_OPTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("prepareTonight", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.prepareTonight === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.prepareTonight === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText style={styles.todayPlanPrompt}>What can stay smaller tomorrow?</AppText>
            <View style={styles.todayPlanChipRow}>
              {DEFAULT_TOMORROW_SMALLER_OPTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("tomorrowSmaller", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.tomorrowSmaller === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.tomorrowSmaller === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText style={styles.todayPlanPrompt}>What recovery matters tonight?</AppText>
            <TextInput
              value={todayPlan.recoveryTonight}
              onChangeText={(value) => updateTodayPlanField("recoveryTonight", value)}
              placeholder="Sleep, quiet, lower stimulation, food, rest..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
          </View>

          <View style={styles.todayPlanRecoveryCard}>
            <AppText style={styles.todayPlanLabel}>What helped you recently?</AppText>
            <AppText style={styles.todayPlanRecoveryText}>
              Save one useful support so future guidance can notice what works.
            </AppText>
            <TextInput
              value={todayPlan.whatHelped}
              onChangeText={(value) => updateTodayPlanField("whatHelped", value)}
              placeholder="Quieter evening, hydration, smaller task list..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              style={styles.todayPlanInput}
            />
            <View style={styles.todayPlanChipRow}>
              {DEFAULT_RECOVERY_STRATEGIES.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => updateTodayPlanField("whatHelped", suggestion)}
                  style={({ pressed }) => [
                    styles.todayPlanChip,
                    todayPlan.whatHelped === suggestion && styles.todayPlanChipSelected,
                    pressed && styles.quickLinkPressed,
                  ]}
                >
                  <AppText
                    style={[
                      styles.todayPlanChipText,
                      todayPlan.whatHelped === suggestion && styles.todayPlanChipTextSelected,
                    ]}
                  >
                    {suggestion}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {recentTodayPlans.filter((plan) => plan.date !== today).length > 0 ? (
            <View style={styles.todayPlanHistoryCard}>
              <AppText style={styles.todayPlanLabel}>Recent plans</AppText>
              <View style={styles.todayPlanHistoryList}>
                {recentTodayPlans
                  .filter((plan) => plan.date !== today)
                  .slice(0, 5)
                  .map((plan) => (
                    <View key={plan.date} style={styles.todayPlanHistoryRow}>
                      <View style={styles.todayPlanHistoryCopy}>
                        <AppText style={styles.todayPlanHistoryDate}>{formatPlanDate(plan.date)}</AppText>
                        {plan.mainPriority ? (
                          <AppText style={styles.todayPlanHistoryText}>Main priority: {plan.mainPriority}</AppText>
                        ) : null}
                        {plan.energyLevel ? (
                          <AppText style={styles.todayPlanHistoryText}>Energy today: {plan.energyLevel}</AppText>
                        ) : null}
                        {plan.staySmaller ? (
                          <AppText style={styles.todayPlanHistoryText}>Keep smaller: {plan.staySmaller}</AppText>
                        ) : null}
                      </View>
                      <AppText style={styles.todayPlanHistoryStatus}>{plan.isComplete ? "Done" : "Saved"}</AppText>
                    </View>
                  ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.suggestedSupportCard}>
          <AppText style={styles.navTitle}>Suggested support</AppText>
          <View style={styles.suggestedSupportList}>
            {adaptiveDailyDashboard.recommendations.map((recommendation) => (
              <Pressable
                key={recommendation.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${recommendation.title}`}
                onPress={() => {
                  setRecentSupportRecommendationIds((current) =>
                    [recommendation.id, ...current.filter((id) => id !== recommendation.id)].slice(0, 6),
                  );

                  if (recommendation.tool) {
                    router.push({
                      pathname: "/(app)/(tabs)/programs",
                      params: { tool: recommendation.tool.id },
                    });
                    return;
                  }

                  if (recommendation.route) {
                    router.push(
                      recommendation.params
                        ? {
                            pathname: recommendation.route as never,
                            params: recommendation.params,
                          }
                        : (recommendation.route as never),
                    );
                  }
                }}
                style={({ pressed }) => [styles.suggestedSupportItem, pressed && styles.quickLinkPressed]}
              >
                <View style={styles.suggestedSupportCopy}>
                  <AppText style={styles.suggestedSupportTitle}>{recommendation.title}</AppText>
                  <AppText style={styles.suggestedSupportBody}>{recommendation.body}</AppText>
                </View>
                <AppText style={styles.suggestedSupportOpen}>Open</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {todayEntry ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.navTitle}>Daily summary</AppText>
            <View style={styles.summaryGrid}>
              {visibleSummaryItems.map((item) => (
                <View key={item.label} style={styles.summaryPill}>
                  <AppText style={styles.summaryLabel}>{item.label}</AppText>
                  <AppText style={styles.summaryValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.navCard}>
          <AppText style={styles.navTitle}>Quick support</AppText>
          <View style={styles.quickLinks}>
            {visibleQuickLinksQuiet.map((link) => (
              <Pressable
                key={`${link.route}-${link.title}`}
                onPress={() => router.push(link.route)}
                style={({ pressed }) => [styles.quickLinkCard, pressed && styles.quickLinkPressed]}
              >
                <AppText style={styles.quickLinkTitle}>{link.title}</AppText>
                <AppText style={styles.quickLinkBody}>{link.body}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.todayReflectionCard}>
          <AppText style={styles.navTitle}>Today’s reflection</AppText>
          <AppText style={styles.todayReflectionPrompt}>{dailyReflectionPrompt}</AppText>
          <Pressable
            onPress={() => router.push("/coach")}
            style={({ pressed }) => [styles.todayReflectionButton, pressed && styles.quickLinkPressed]}
          >
            <AppText style={styles.todayReflectionButtonText}>Reflect in Coach</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  contentLowEnergy: {
    gap: 20,
  },
  header: {
    gap: 4,
  },
  kicker: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e8751a",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  todayDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  streakPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakPillText: {
    color: "#9a4b0c",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  streakCelebrationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    backgroundColor: "#fff4ec",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  streakConfetti: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  streakCelebrationText: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  overviewTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1f2937",
  },
  overviewBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  todayFocusCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2dfcf",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  todayFocusLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#9a4b0c",
    textTransform: "uppercase",
  },
  todayFocusText: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  dailyIntelligenceCard: {
    backgroundColor: "#f7faf9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 18,
    gap: 8,
  },
  dailyIntelligenceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  dailyIntelligenceTitle: {
    color: "#1f2937",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
  },
  dailyIntelligenceBody: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  todayPlanCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ead9cb",
    padding: 18,
    gap: 14,
  },
  todayPlanHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  todayPlanHeaderActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  todayPlanHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  todayPlanSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  todayPlanSaveButton: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  todayPlanSaveButtonSaved: {
    backgroundColor: "#eef8f0",
    borderWidth: 1,
    borderColor: "#cfe8d4",
  },
  todayPlanSaveButtonText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  todayPlanSaveButtonTextSaved: {
    color: "#166534",
  },
  todayPlanSecondaryButton: {
    minHeight: 38,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  todayPlanSecondaryButtonComplete: {
    borderColor: "#cfe8d4",
    backgroundColor: "#eef8f0",
  },
  todayPlanSecondaryButtonText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  todayPlanSecondaryButtonTextComplete: {
    color: "#166534",
  },
  todayPlanSection: {
    gap: 8,
  },
  todayPlanLabel: {
    color: "#9a4b0c",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  todayPlanPrompt: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  todayPlanInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  todayPlanChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  todayPlanChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f1d8c5",
    backgroundColor: "#fffdfb",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  todayPlanChipSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff4ec",
  },
  todayPlanChipText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  todayPlanChipTextSelected: {
    color: "#9a4b0c",
  },
  todayPlanRecoveryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dce8e3",
    backgroundColor: "#f7faf9",
    padding: 14,
    gap: 6,
  },
  todayPlanSavedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 8,
  },
  todayPlanSavedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  todayPlanSavedTitle: {
    color: "#1f2937",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  todayPlanSavedMeta: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 16,
  },
  todayPlanSavedLine: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  todayPlanRecoveryText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  todayPlanLogistics: {
    gap: 9,
  },
  todayPlanLogisticsRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 3,
  },
  todayPlanLogisticsTitle: {
    color: "#1f2937",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  todayPlanLogisticsText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  todayPlanHistoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 10,
  },
  todayPlanHistoryList: {
    gap: 10,
  },
  todayPlanHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3e5d8",
    paddingTop: 10,
  },
  todayPlanHistoryCopy: {
    flex: 1,
    gap: 4,
  },
  todayPlanHistoryDate: {
    color: "#9a4b0c",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  todayPlanHistoryText: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
  todayPlanHistoryStatus: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  suggestedSupportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  suggestedSupportList: {
    gap: 10,
  },
  suggestedSupportItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  suggestedSupportCopy: {
    flex: 1,
    gap: 4,
  },
  suggestedSupportTitle: {
    color: "#1f2937",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  suggestedSupportBody: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  suggestedSupportOpen: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  overviewSupportNote: {
    color: "#6b7280",
    lineHeight: 20,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  welcomeCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2dfcf",
    padding: 18,
    gap: 10,
  },
  consistencyCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 12,
  },
  consistencyPill: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
    minHeight: 86,
    justifyContent: "center",
  },
  consistencyValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  consistencyLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  consistencyBody: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontWeight: "600",
  },
  consistencySupport: {
    color: "#6b7280",
    lineHeight: 20,
  },
  emptyConsistencyCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 6,
  },
  emptyConsistencyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyConsistencyBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#f7fafc",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe5f0",
    padding: 16,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoBody: {
    color: "#64748b",
    lineHeight: 20,
  },
  premiumDailySupportCard: {
    backgroundColor: "#f7faf9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 18,
    gap: 10,
  },
  premiumDailySupportLockCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 18,
    gap: 12,
  },
  premiumDailySupportLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  premiumDailySupportTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumDailySupportBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  premiumDailySupportPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dce8e3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  premiumDailySupportPillText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#456b61",
    fontWeight: "700",
  },
  premiumDailySupportReflection: {
    color: "#6b7280",
    lineHeight: 21,
  },
  companionMomentList: {
    gap: 6,
  },
  companionMomentText: {
    color: "#6b7280",
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 16,
    gap: 4,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9a3412",
  },
  warningBody: {
    color: "#9a3412",
    lineHeight: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  welcomeBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  previousMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previousMetricPill: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ead9cb",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previousMetricText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  confirmationCard: {
    backgroundColor: "#eef8f0",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d6eadc",
    padding: 18,
    gap: 6,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
  },
  confirmationBody: {
    color: "#2f5f3c",
    lineHeight: 22,
  },
  skeletonStack: {
    gap: 10,
  },
  skeletonMetricGrid: {
    gap: 12,
    marginTop: 4,
  },
  careTodayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  careTodayHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  careTodayHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  careTodaySubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  careItemList: {
    gap: 10,
  },
  careEmptyText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
  },
  smallTextButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f1d8c5",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallTextButtonText: {
    color: "#9a4b0c",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  medicationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  medicationCopy: {
    flex: 1,
    gap: 3,
  },
  medicationName: {
    color: "#1f2937",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  medicationDosage: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 19,
  },
  medicationMeta: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  markTakenButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  markTakenButtonText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  takenBadge: {
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#eef8f0",
    borderWidth: 1,
    borderColor: "#cfe8d4",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  takenBadgeText: {
    color: "#166534",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  appointmentSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  appointmentTitle: {
    color: "#1f2937",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
  },
  appointmentTime: {
    color: "#9a4b0c",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  appointmentMeta: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  appointmentPrepButton: {
    marginTop: 6,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#e8751a",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  appointmentPrepButtonText: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryPill: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 4,
    minHeight: 76,
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2dfcf",
    padding: 18,
    gap: 14,
  },
  guidanceKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  guidanceTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceModuleStack: {
    gap: 12,
  },
  guidanceActions: {
    gap: 10,
    marginTop: 2,
  },
  guidanceAction: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead9cb",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  guidanceActionText: {
    color: "#9a4a11",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  focusCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  reflectionSurfaceSection: {
    gap: 10,
  },
  milestoneCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  resumeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  resumeBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  milestoneTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  milestoneBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  inlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dismissButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dismissButtonText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  winsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  winsList: {
    gap: 10,
  },
  winPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  winText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  focusKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  focusTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  focusBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  quickLinks: {
    gap: 10,
  },
  quickLinkCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 14,
    gap: 4,
  },
  quickLinkPressed: {
    opacity: 0.84,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  quickLinkBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  todayReflectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  todayReflectionPrompt: {
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  todayReflectionButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f1d8c5",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  todayReflectionButtonText: {
    color: "#9a4b0c",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});
