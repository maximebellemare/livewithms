import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ReflectionSurfaceStack from "../../../../components/reflection-surfaces/ReflectionSurfaceStack";
import DailyCheckInCard, {
  getEmptyCheckInDraft,
  normalizeCheckInInput,
  type DailyCheckInDraft,
} from "../../../../components/today/DailyCheckInCard";
import AppButton from "../../../../components/ui/AppButton";
import ErrorState from "../../../../components/ui/ErrorState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import LoadingState from "../../../../components/ui/LoadingState";
import { useAuth } from "../../../../features/auth/hooks";
import { useSaveDailyCheckIn, useCheckInHistory, useCheckInOverview, useTodaysCheckIn } from "../../../../features/checkins/hooks";
import {
  getCareWins,
  getCheckInsInLastDays,
  getCurrentCheckInStreak,
  getMilestoneMessage,
} from "../../../../features/checkins/consistency";
import type { DailyCheckIn } from "../../../../features/checkins/types";
import { useGrowthState } from "../../../../features/growth/hooks";
import { useAiInsightsSummary } from "../../../../features/insights/hooks";
import { usePersonalizationMemory } from "../../../../features/personalization-memory/hooks";
import { useMyProfile } from "../../../../features/profile/hooks";
import { useProgramProgress } from "../../../../features/programs/hooks";
import { buildTodayGuidance } from "../../../../features/today/guidance";
import { getErrorMessage } from "../../../../lib/errors";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { getProgramToolById } from "../../../../features/programs/catalog";
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
import { deriveMotionIntensity } from "../../../../lib/emotional-environment/motion-softening/deriveMotionIntensity";
import { deriveQuietMoments as deriveEnvironmentQuietMoment } from "../../../../lib/emotional-environment/recovery-moments/deriveQuietMoments";
import { deriveAttentionLoad } from "../../../../lib/attention-respect/attention-budgeting/deriveAttentionLoad";
import { derivePromptSuppression } from "../../../../lib/attention-respect/attention-budgeting/derivePromptSuppression";
import { deriveCalmOrientation } from "../../../../lib/attention-respect/intentional-entry/deriveCalmOrientation";
import { deriveSessionEntryState } from "../../../../lib/attention-respect/intentional-entry/deriveSessionEntryState";
import { deriveSessionClosure } from "../../../../lib/attention-respect/non-compulsive-engagement/deriveSessionClosure";
import { preventEndlessInteractionLoops } from "../../../../lib/attention-respect/non-compulsive-engagement/preventEndlessInteractionLoops";
import { deriveHealthyExitState } from "../../../../lib/attention-respect/recovery-disengagement/deriveHealthyExitState";
import {
  clearCheckinDraft,
  loadCheckinDraft,
  preserveCheckinDraft,
} from "../../../../lib/operational-calm/continuity-preservation/preserveCheckinDraft";
import { restoreSessionContinuity } from "../../../../lib/operational-calm/continuity-preservation/restoreSessionContinuity";
import { preventAdaptiveOverstacking } from "../../../../lib/system-coherence/adaptive-coordination/preventAdaptiveOverstacking";
import { reconcileAdaptiveSystems } from "../../../../lib/system-coherence/adaptive-coordination/reconcileAdaptiveSystems";
import { deriveEmotionalDensityLimits } from "../../../../lib/system-coherence/calmness-thresholds/deriveEmotionalDensityLimits";
import { derivePromptLoadLimits } from "../../../../lib/system-coherence/calmness-thresholds/derivePromptLoadLimits";
import { deriveUnifiedEmotionalRules } from "../../../../lib/system-coherence/emotional-logic/deriveUnifiedEmotionalRules";
import { deriveCrossFlowConsistency } from "../../../../lib/system-coherence/experience-continuity/deriveCrossFlowConsistency";
import { deriveTransitionContinuity } from "../../../../lib/system-coherence/experience-continuity/deriveTransitionContinuity";
import { deriveUnifiedTone } from "../../../../lib/system-coherence/tone-harmonization/deriveUnifiedTone";
import { preventAdaptationOverstacking as preventMetaOverstacking } from "../../../../lib/meta-orchestration/adaptive-load-balancing/preventAdaptationOverstacking";
import { orchestrateAdaptiveSystems } from "../../../../lib/meta-orchestration/global-adaptation/orchestrateAdaptiveSystems";
import { deriveCalmnessPriority } from "../../../../lib/meta-orchestration/priority-resolution/deriveCalmnessPriority";

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
      body: "Try to look for one gentle thing that helps you feel a little steadier.",
    };
  }

  if ((checkIn.sleep_hours ?? 99) < 6) {
    return {
      title: "Lower the pressure today",
      body: "Poor sleep can change the whole feel of a day, so lighter expectations may help.",
    };
  }

  return {
    title: "Notice what helped",
    body: "If today has more room in it, pay attention to what supported that feeling.",
  };
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
  const profileQuery = useMyProfile(user?.id);
  const checkInQuery = useTodaysCheckIn(user?.id, today);
  const historyQuery = useCheckInHistory(user?.id, 30);
  const overviewQuery = useCheckInOverview(user?.id);
  const saveCheckIn = useSaveDailyCheckIn();
  const programProgress = useProgramProgress();
  const reminderSettings = useReminderSettings();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaveQueued, setLastSaveQueued] = useState(false);
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));
  const lastTrackedLifecycleKeyRef = useRef<string | null>(null);
  const recentReflectionCardIdsRef = useRef<string[]>([]);
  const greeting = useMemo(() => getGreeting(), []);
  const currentHour = useMemo(() => new Date().getHours(), []);
  const historyEntries = historyQuery.data ?? [];
  const longitudinalEntries = useMemo(() => mapCheckInsToLongitudinalEntries(historyEntries), [historyEntries]);
  const longitudinalAnalysis = useMemo(() => analyzePatterns(longitudinalEntries), [longitudinalEntries]);
  const lifeContext = useMemo(() => buildLifeContextSnapshot(longitudinalEntries), [longitudinalEntries]);
  const overviewEntries = overviewQuery.data ?? [];
  const streak = useMemo(() => getCurrentCheckInStreak(overviewEntries, today), [overviewEntries, today]);
  const weeklyCheckIns = useMemo(() => getCheckInsInLastDays(overviewEntries, today, 7), [overviewEntries, today]);
  const totalCheckIns = overviewEntries.length;
  const growth = useGrowthState({ totalCheckIns });
  const todayEntry = checkInQuery.data ?? null;
  const recentRangeEntries = useMemo(() => {
    const cutoff = getCutoffDate(7);
    return historyEntries.filter((entry) => entry.date >= cutoff);
  }, [historyEntries]);
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
    },
    growthState: growth.state,
    programProgress: programProgress.progress,
  });
  const adaptiveProfile = useMemo(
    () => buildAdaptiveProfile(historyEntries, weeklyCheckIns, personalizationMemory.memory),
    [historyEntries, personalizationMemory.memory, weeklyCheckIns],
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
  const postSaveInsight = useMemo(() => {
    if (historyEntries.length < 3) {
      return "Track a few days to unlock your insights";
    }

    if ((todayEntry?.fatigue ?? 0) >= 4 && (todayEntry?.sleep_hours ?? 0) < 6) {
      return "Low sleep and heavier fatigue can start to form a pattern. Keep checking in so Insights can connect the dots.";
    }

    if ((todayEntry?.stress ?? 0) >= 4) {
      return "Stress can shape the whole feel of a day. A few more check-ins will help surface clearer patterns.";
    }

    return "Your check-ins help Coach and Insights become more useful over time.";
  }, [historyEntries.length, todayEntry?.fatigue, todayEntry?.sleep_hours, todayEntry?.stress]);
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
      ),
    [adaptiveProfile, aiSummaryQuery.data, lifeContext, lifecycleProfile, personalizationMemory.memory, today, todayEntry],
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
  const visibleReflectionCards = useMemo(
    () =>
      reflectionFeed.slice(
        0,
        preventAdaptiveOverstacking({
          requestedCount: Math.min(reflectionDensity.maxCards, coherenceDensityLimits.maxReflectionCards),
          maxAllowedCount: preventMetaOverstacking({
            requestedCount: coherenceAdaptive.maxReflectionCards,
            adaptationIntensity: metaOrchestration.adaptationIntensity,
            hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
            hasReflectionsVisible: reflectionFeed.length > 0,
          }),
          hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
          hasReflectionCards: reflectionFeed.length > 0,
        }),
      ),
    [
      aiSummaryQuery.data?.summary,
      coherenceAdaptive.maxReflectionCards,
      coherenceDensityLimits.maxReflectionCards,
      reflectionDensity.maxCards,
      reflectionFeed,
    ],
  );
  const visibleQuickLinks = useMemo(
    () =>
      [
        {
          title: "Coach",
          body: "Reflect, reset, or plan tomorrow.",
          route: "/coach" as const,
        },
        {
          title: "Insights",
          body: "See trends and gentle patterns.",
          route: "/insights" as const,
        },
        {
          title: "Care",
          body: "Keep notes, meds, and appointments together.",
          route: "/care" as const,
        },
      ].slice(0, energyAwareFlow.density === "MINIMAL" ? 2 : 3),
    [energyAwareFlow.density],
  );
  const visibleQuickLinksQuiet = useMemo(
    () =>
      visibleQuickLinks.slice(
        0,
        preventAdaptiveOverstacking({
          requestedCount: Math.min(
            adaptiveDefaults.quickLinkCount,
            navigationPriority.maxVisibleRoutes,
            coherenceAdaptive.maxQuickLinks,
          ),
          maxAllowedCount: preventMetaOverstacking({
            requestedCount: coherenceRules.promptLoadLimit + 1,
            adaptationIntensity: metaOrchestration.adaptationIntensity,
            hasAiVisible: Boolean(aiSummaryQuery.data?.summary),
            hasReflectionsVisible: visibleReflectionCards.length > 0,
          }),
          hasAiSummary: Boolean(aiSummaryQuery.data?.summary),
          hasReflectionCards: visibleReflectionCards.length > 0,
        }),
      ),
    [
      adaptiveDefaults.quickLinkCount,
      aiSummaryQuery.data?.summary,
      coherenceAdaptive.maxQuickLinks,
      coherenceRules.promptLoadLimit,
      navigationPriority.maxVisibleRoutes,
      visibleQuickLinks,
      visibleReflectionCards.length,
    ],
  );
  const attentionLoad = useMemo(
    () =>
      deriveAttentionLoad({
        visibleSurfaceCount:
          3 +
          (visibleReflectionCards.length > 0 ? 1 : 0) +
          (Boolean(aiSummaryQuery.data?.summary) ? 1 : 0) +
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
  const interactionLoopGuard = useMemo(
    () =>
      preventEndlessInteractionLoops({
        visibleActionCount: todayGuidance.actions.length + visibleQuickLinksQuiet.length,
        hasSecondaryPrompts: visibleReflectionCards.length > 0 || Boolean(suggestedProgram),
        attentionLoad,
      }),
    [attentionLoad, suggestedProgram, todayGuidance.actions.length, visibleQuickLinksQuiet.length, visibleReflectionCards.length],
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
        ),
      ),
    [
      coherencePromptLimits.maxPromptActions,
      coherenceRules.promptLoadLimit,
      decisionLoad,
      metaOrchestration.interpretationLimits.maxPromptActions,
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    return <ErrorState message="You need to be signed in to view today's check-in." />;
  }

  if (checkInQuery.isLoading) {
    return <LoadingState message="Loading today..." />;
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
      title="Today"
      subtitle="Track how you feel, notice patterns, and build a steadier picture of daily wellness."
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(120, insets.bottom + 96),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overviewCard}>
          <AppText style={styles.greeting}>{greeting}</AppText>
          <AppText style={styles.todayDate}>{formatLongDate(today)}</AppText>
          <AppText style={styles.overviewTitle}>
            {primarySurface === "re-entry"
              ? "You can ease back in today"
              : primarySurface === "guidance"
                ? "Let’s keep today manageable"
                : "How are you feeling today?"}
          </AppText>
          <AppText style={styles.overviewBody}>
            {promptSuppressed
              ? calmOrientation.body
              : todayEntry
              ? energyAwareFlow.contentReduction.shortenSupportCopy
                ? "You checked in today. You can leave it there unless something changes."
                : "You checked in today. You can update it anytime if things change."
              : energyAwareFlow.contentReduction.shortenSupportCopy
                ? "We can keep this short today. A brief check-in is enough."
                : "A quick check-in helps Coach feel more personal and gives Insights more to work with."}
          </AppText>
        </View>

        {lowStimulusSurface ? (
          <View style={styles.infoCard}>
            <AppText style={styles.infoTitle}>{lowStimulusSurface.title}</AppText>
            <AppText style={styles.infoBody}>{lowStimulusSurface.body}</AppText>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>
            {lifecycleProfile.stage === "new"
              ? "Start gently"
              : lifecycleProfile.stage === "first-week"
                ? "Your first week"
                : lifecycleProfile.stage === "long-term"
                  ? "Your long view"
                  : lifecycleProfile.stage === "active"
                    ? "Your rhythm"
                    : gentleReentry.title}
          </AppText>
          <AppText style={styles.infoBody}>
            {lifecycleProfile.stage === "new"
              ? "You do not need to do much today. One short check-in is enough to begin."
              : lifecycleProfile.stage === "first-week"
                ? "This week is about learning what feels useful, not doing everything at once."
                : lifecycleProfile.stage === "long-term"
                    ? "You have built a steadier history here. Smaller changes may be easier to notice now."
                    : lifecycleProfile.stage === "active"
                      ? continuityMessaging.body
                      : gentleReentry.body}
          </AppText>
        </View>

        {totalCheckIns > 0 ? (
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyPill}>
              <AppText style={styles.consistencyValue}>{weeklyCheckIns}</AppText>
              <AppText style={styles.consistencyLabel}>days this week</AppText>
            </View>
            <View style={styles.consistencyPill}>
              <AppText style={styles.consistencyValue}>{continuityState.continuitySignal}</AppText>
              <AppText style={styles.consistencyLabel}>recent returns</AppText>
            </View>
            <AppText style={styles.consistencyTitle}>{continuityMessaging.title}</AppText>
            <AppText style={styles.consistencyBody}>{continuityMessaging.summary}</AppText>
            <AppText style={styles.consistencySupport}>{selfCompassionReinforcement}</AppText>
          </View>
        ) : null}

        {!overviewQuery.isLoading && totalCheckIns === 0 ? (
          <View style={styles.emptyConsistencyCard}>
            <AppText style={styles.emptyConsistencyTitle}>Consistency starts gently</AppText>
            <AppText style={styles.emptyConsistencyBody}>
              One check-in at a time is enough. Over time, your patterns become easier to understand.
            </AppText>
          </View>
        ) : null}

        {(environmentQuietMoment ?? quietMoment) && disclosureDepth === "minimal" ? (
          <View style={styles.emptyConsistencyCard}>
            <AppText style={styles.emptyConsistencyTitle}>{(environmentQuietMoment ?? quietMoment)?.title}</AppText>
            <AppText style={styles.emptyConsistencyBody}>{(environmentQuietMoment ?? quietMoment)?.body}</AppText>
          </View>
        ) : null}

        {historyQuery.isLoading && historyEntries.length === 0 ? (
          <View style={styles.infoCard}>
            <AppText style={styles.infoTitle}>Loading your recent check-ins…</AppText>
            <AppText style={styles.infoBody}>We’re pulling in your recent patterns now.</AppText>
          </View>
        ) : null}

        {historyQuery.isError ? (
          <View style={styles.warningCard}>
            <AppText style={styles.warningTitle}>Some recent history could not load</AppText>
            <AppText style={styles.warningBody}>
              Today’s check-in is still available. You can keep going and try again in a moment.
            </AppText>
          </View>
        ) : null}

        {adaptiveProfile.lowEnergyMode ? (
          <View style={styles.warningCard}>
            <AppText style={styles.warningTitle}>{adaptiveProfile.simplificationTitle}</AppText>
            <AppText style={styles.warningBody}>{adaptiveProfile.simplificationBody}</AppText>
            <AppText style={styles.warningBody}>{gentleNormalization}</AppText>
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

        {!todayEntry ? (
          <View style={styles.welcomeCard}>
            <AppText style={styles.welcomeTitle}>
              {previousEntry ? gentleReentry.title : "Let’s start your first check-in"}
            </AppText>
            {previousEntry ? (
              <>
                <AppText style={styles.welcomeBody}>Yesterday you tracked:</AppText>
                <View style={styles.previousMetrics}>
                  <View style={styles.previousMetricPill}>
                    <AppText style={styles.previousMetricText}>
                      {formatPreviousMetric("Fatigue", previousEntry.fatigue)}
                    </AppText>
                  </View>
                  <View style={styles.previousMetricPill}>
                    <AppText style={styles.previousMetricText}>
                      {formatPreviousMetric("Mood", previousEntry.mood)}
                    </AppText>
                  </View>
                  <View style={styles.previousMetricPill}>
                    <AppText style={styles.previousMetricText}>
                      {formatPreviousMetric("Stress", previousEntry.stress)}
                    </AppText>
                  </View>
                </View>
                <AppText style={styles.welcomeBody}>
                  {energyAwareFlow.contentReduction.shortenSupportCopy
                    ? "You can start with a simple check-in today."
                    : "Add today’s check-in so Coach and Insights can stay helpful."}
                </AppText>
              </>
            ) : (
              <AppText style={styles.welcomeBody}>
                {lifecycleProfile.stage === "returning"
                  ? gentleReentry.body
                  : "Takes less than 30 seconds and helps build more useful Insights and Coach support."}
              </AppText>
            )}
          </View>
        ) : (
          <View style={styles.confirmationCard}>
            <AppText style={styles.confirmationTitle}>You checked in today</AppText>
            <AppText style={styles.confirmationBody}>
              Nice work. Your daily picture is saved and ready to support Coach and Insights.
            </AppText>
          </View>
        )}

        {todayEntry ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.navTitle}>Daily summary</AppText>
            <View style={styles.summaryGrid}>
              {summaryItems.map((item) => (
                <View key={item.label} style={styles.summaryPill}>
                  <AppText style={styles.summaryLabel}>{item.label}</AppText>
                  <AppText style={styles.summaryValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {milestone && optionalExpansion.showCelebrations && !deferredContent.hideCelebrations ? (
          <View style={styles.milestoneCard}>
            <AppText style={styles.milestoneTitle}>{milestone.title}</AppText>
            <AppText style={styles.milestoneBody}>{milestone.body}</AppText>
          </View>
        ) : null}

        {recentActionCard && energyAwareFlow.density !== "MINIMAL" && !hiddenComplexity.hideSecondarySupport ? (
          <View style={styles.resumeCard}>
            <AppText style={styles.navTitle}>{recentActionCard.title}</AppText>
            <AppText style={styles.resumeBody}>{recentActionCard.body}</AppText>
            <AppButton
              label={recentActionCard.actionLabel}
              onPress={() => router.push(recentActionCard.route)}
              variant="secondary"
            />
          </View>
        ) : null}

        {growth.getCelebrationAvailable("first_week_of_checkins") && optionalExpansion.showCelebrations ? (
          <View style={styles.milestoneCard}>
            <View style={styles.inlineHeader}>
              <AppText style={styles.milestoneTitle}>A steady first week</AppText>
              <Pressable
                onPress={() => {
                  void growth.markCelebrationSeen("first_week_of_checkins");
                }}
                style={({ pressed }) => [styles.dismissButton, pressed && styles.quickLinkPressed]}
              >
                <AppText style={styles.dismissButtonText}>Dismiss</AppText>
              </Pressable>
            </View>
            <AppText style={styles.milestoneBody}>
              You’ve completed your first week of check-ins. That steady rhythm helps Coach and Insights feel more personal.
            </AppText>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>{sessionClosure.title}</AppText>
          <AppText style={styles.infoBody}>
            {healthyExitState === "soft-exit"
              ? sessionClosure.body
              : `${sessionClosure.body} You can stop here whenever this feels complete.`}
          </AppText>
        </View>

        <View style={styles.guidanceCard}>
          <AppText style={styles.guidanceKicker}>Today&apos;s guidance</AppText>
          <AppText style={styles.guidanceTitle}>{todayGuidance.title}</AppText>
          <AppText style={styles.guidanceBody}>
            {aiSummaryQuery.isLoading && !todayEntry
              ? "Pulling together a quick read on your recent patterns..."
              : todayGuidance.body}
          </AppText>
          {overextensionPattern.atRisk ? (
            <AppText style={styles.guidanceBody}>
              A lighter pace may feel more sustainable right now. Support can stay smaller for a while.
            </AppText>
          ) : null}
          {todayGuidance.moment ? (
            <View style={styles.guidanceMomentPill}>
              <AppText style={styles.guidanceMomentText}>{todayGuidance.moment}</AppText>
            </View>
          ) : null}
          <View style={styles.guidanceActions}>
            {visibleGuidanceActions.map((action) => (
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

        {visibleReflectionCards.length > 0 ? (
          <View style={styles.reflectionSurfaceSection}>
            <AppText style={styles.focusKicker}>A gentle reflection</AppText>
            <ReflectionSurfaceStack
              cards={visibleReflectionCards}
              reducedMotion={
                energyAwareFlow.motionIntensity === "REDUCED" ||
                adaptiveDefaults.useCondensedSpacing ||
                deriveMotionIntensity(atmosphere) === "reduced"
              }
              gap={reflectionSpacing.gap}
              topMargin={reflectionSpacing.topMargin}
              transitionDurationMs={atmosphereTransition.durationMs}
            />
          </View>
        ) : null}

        {suggestedProgram ? (
          <View style={styles.resumeCard}>
            <AppText style={styles.navTitle}>A gentle support option</AppText>
            <AppText style={styles.resumeBody}>
              {suggestedProgram.title} may fit this stretch well. You can use it if a little support would help today feel steadier.
            </AppText>
            <AppButton
              label="Open Programs"
              onPress={() => router.push("/programs")}
              variant="secondary"
            />
          </View>
        ) : null}

        {!suggestedProgram &&
        secondarySuggestedProgram &&
        energyAwareFlow.density !== "MINIMAL" &&
        optionalExpansion.showSecondaryProgram &&
        !deferredContent.hideSecondaryProgram ? (
          <View style={styles.resumeCard}>
            <AppText style={styles.navTitle}>A softer place to return</AppText>
            <AppText style={styles.resumeBody}>
              {secondarySuggestedProgram.title} is here if you want one small support tool without adding much pressure.
            </AppText>
            <AppButton label="Open Programs" onPress={() => router.push("/programs")} variant="secondary" />
          </View>
        ) : null}

        <View style={styles.focusCard}>
          <AppText style={styles.focusKicker}>Today&apos;s gentle focus</AppText>
          <AppText style={styles.focusTitle}>{gentleFocus.title}</AppText>
          <AppText style={styles.focusBody}>{gentleFocus.body}</AppText>
        </View>

        {!energyAwareFlow.contentReduction.hideSecondaryWins && !deferredContent.hideWins ? (
          <View style={styles.winsCard}>
            <AppText style={styles.navTitle}>Small wins</AppText>
            {wins.length > 0 ? (
              <View style={styles.winsList}>
                {wins.map((win) => (
                  <View key={win} style={styles.winPill}>
                    <AppText style={styles.winText}>{win}</AppText>
                  </View>
                ))}
              </View>
            ) : (
              <AppText style={styles.focusBody}>
                Your wins will start to gather here as you check in and reflect.
              </AppText>
            )}
          </View>
        ) : null}

        <View style={styles.navCard}>
          <AppText style={styles.navTitle}>Quick links</AppText>
          <View style={styles.quickLinks}>
            {visibleQuickLinksQuiet.slice(0, interactionLoopGuard.maxSuggestedNextActions).map((link) => (
              <Pressable
                key={link.route}
                onPress={() => router.push(link.route)}
                style={({ pressed }) => [styles.quickLinkCard, pressed && styles.quickLinkPressed]}
              >
                <AppText style={styles.quickLinkTitle}>{link.title}</AppText>
                <AppText style={styles.quickLinkBody}>{link.body}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.header}>
          <AppText style={styles.kicker}>Today&apos;s check-in</AppText>
          <AppText style={styles.date}>{today}</AppText>
        </View>

      <DailyCheckInCard
          draft={draft}
          onChange={setDraft}
          saveState={saveState}
          onSave={() => void handleSaveCheckIn()}
          postSaveInsight={
            lastSaveQueued
              ? "Saved on this device for now. It will sync automatically when you’re back online."
              : postSaveInsight
          }
          saveFooterText={
            lastSaveQueued
              ? "You can keep using the app normally."
              : suggestedEffortLevel === "brief"
                ? "You can leave it there for today."
                : suggestedEffortLevel === "gentle"
                  ? "You can stop here if that feels like enough."
                  : "You can leave it there for now."
          }
          onViewInsights={() => router.push("/insights")}
          supportMode={adaptiveProfile.lowEnergyMode ? "low-energy" : "default"}
          compressionMode={energyAwareFlow.compressedCheckIn.enabled ? "reduced" : "standard"}
          noteStarterLimit={Math.min(
            adaptiveDefaults.noteStarterCount,
            energyAwareFlow.compressedCheckIn.limitNoteStarters ? 2 : 3,
          )}
        />
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
    paddingVertical: 12,
    gap: 2,
  },
  consistencyValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  consistencyLabel: {
    fontSize: 13,
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
    minWidth: "30%",
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2dfcf",
    padding: 18,
    gap: 10,
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
  guidanceBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  guidanceMomentPill: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ead9cb",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  guidanceMomentText: {
    color: "#8b6a4f",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  guidanceActions: {
    gap: 10,
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
});
