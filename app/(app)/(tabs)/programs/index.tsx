import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../../../features/checkins/hooks";
import { getCheckInsInLastDays } from "../../../../features/checkins/consistency";
import { useGrowthState } from "../../../../features/growth/hooks";
import { applyLowEnergyModeOverride, useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { buildLifecycleProfile } from "../../../../features/lifecycle/logic";
import { canAccessPremiumFeature } from "../../../../features/premium/entitlements";
import { usePremium } from "../../../../features/premium/hooks";
import { deriveLowEnergyAssist } from "../../../../features/premium/low-energy-assist";
import { getCalmAudioSessionByToolId } from "../../../../features/audio-support/library";
import type { CalmAudioSessionProgress } from "../../../../features/audio-support/types";
import {
  PROGRAM_LIBRARY_CATEGORIES,
  PROGRAM_MODULES,
  PROGRAM_SECTIONS,
  getProgramModuleById,
  getProgramToolById,
  getProgramToolsByModuleId,
} from "../../../../features/programs/catalog";
import { useProgramProgress } from "../../../../features/programs/hooks";
import type { ProgramModule, ProgramTool } from "../../../../features/programs/types";
import {
  deriveProgramCategoryLabel,
  deriveProgramSectionLabel,
  deriveProgramSectionSubtitle,
  derivePremiumProgramsCopy,
  deriveRecommendedProgramCopy,
} from "../../../../features/programs/polish";
import { deriveCognitiveSupport } from "../../../../features/programs/cognitive-support";
import { deriveCalmGuidance } from "../../../../features/programs/calm-guidance";
import { deriveCommunicationSupport } from "../../../../features/programs/communication-support";
import { deriveDifficultDaySupport } from "../../../../features/programs/difficult-day-support";
import { deriveEmotionalReset } from "../../../../features/programs/emotional-reset";
import { deriveMentalExhaustionSupport } from "../../../../features/programs/mental-exhaustion";
import { deriveRecoveryRhythm } from "../../../../features/programs/recovery-rhythm";
import { deriveSetbackRecovery } from "../../../../features/programs/setback-recovery";
import { deriveSleepRecoverySupport } from "../../../../features/programs/sleep-recovery";
import { deriveTransitionSupport } from "../../../../features/programs/transition-support";
import { deriveFutureStability } from "../../../../features/programs/future-stability";
import { deriveEmotionalRegulationToolkit, deriveToolkitTimeOfDay } from "../../../../features/programs/toolkit";
import { detectRoutineDisruption } from "../../../../lib/behavior-support/disruption-recovery/detectRoutineDisruption";
import { deriveRecoveryExperience } from "../../../../lib/behavior-support/disruption-recovery/deriveRecoveryExperience";
import { deriveFlexibleRoutineState } from "../../../../lib/behavior-support/low-pressure-routines/deriveFlexibleRoutineState";
import { deriveResumableProgramFlow } from "../../../../lib/behavior-support/low-pressure-routines/deriveResumableProgramFlow";
import { deriveSupportPrograms } from "../../../../lib/guided-programs/calm-paths/deriveSupportPrograms";
import { deriveRecoveryPaths } from "../../../../lib/guided-programs/calm-paths/deriveRecoveryPaths";
import { derivePauseResumeState } from "../../../../lib/guided-programs/interruptible-architecture/derivePauseResumeState";
import { normalizeProgramInterruptions } from "../../../../lib/guided-programs/interruptible-architecture/normalizeProgramInterruptions";
import { deriveProgramIntensity } from "../../../../lib/guided-programs/adaptive-pacing/deriveProgramIntensity";
import { deriveLowEnergyProgramMode } from "../../../../lib/guided-programs/adaptive-pacing/deriveLowEnergyProgramMode";
import { deriveGroundingSupport } from "../../../../lib/guided-programs/nervous-system-guidance/deriveGroundingSupport";
import { preventMotivationalPressure } from "../../../../lib/guided-programs/nervous-system-guidance/preventMotivationalPressure";
import { deriveSoftProgression } from "../../../../lib/guided-programs/gentle-progression/deriveSoftProgression";
import { preventCompletionPressure } from "../../../../lib/guided-programs/gentle-progression/preventCompletionPressure";
import { deriveRecoverySupport } from "../../../../lib/guided-programs/recovery-oriented-design/deriveRecoverySupport";
import { deriveDifficultPeriodPrograms } from "../../../../lib/guided-programs/recovery-oriented-design/deriveDifficultPeriodPrograms";

function formatTime(secondsRemaining: number) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function deriveAdaptiveStatePrimary(input: {
  lowEnergyMode: boolean;
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  engagementPattern: "steady" | "gentle-reengagement" | "new" | "unknown";
}) {
  return input.lowEnergyMode
    ? "LOW_ENERGY"
    : input.stressTrend === "elevated"
      ? "OVERWHELMED"
      : input.engagementPattern === "gentle-reengagement"
        ? "WITHDRAWN"
        : "STABLE";
}

export default function ProgramsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const overviewQuery = useCheckInOverview(user?.id);
  const historyQuery = useCheckInHistory(user?.id, 14);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });
  const lowEnergyMode = useLowEnergyMode();
  const premium = usePremium();
  const programProgress = useProgramProgress();
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [completedToolId, setCompletedToolId] = useState<string | null>(null);
  const [showSelectedToolDetails, setShowSelectedToolDetails] = useState(false);
  const [audioSessionState, setAudioSessionState] = useState<CalmAudioSessionProgress | null>(null);

  const selectedTool = useMemo(
    () => getProgramToolById(selectedToolId),
    [selectedToolId],
  );
  const selectedAudioSession = useMemo(
    () => getCalmAudioSessionByToolId(selectedToolId),
    [selectedToolId],
  );
  const selectedModule = useMemo(
    () => getProgramModuleById(selectedTool?.moduleId),
    [selectedTool?.moduleId],
  );
  const overviewEntries = overviewQuery.data ?? [];
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weeklyCheckIns = useMemo(
    () => getCheckInsInLastDays(overviewEntries, today, 7),
    [overviewEntries, today],
  );
  const adaptiveProfile = useMemo(
    () =>
      applyLowEnergyModeOverride(
        buildAdaptiveProfile(historyQuery.data ?? [], Math.min(7, historyQuery.data?.length ?? 0)),
        lowEnergyMode.enabled,
      ),
    [historyQuery.data, lowEnergyMode.enabled],
  );
  const hasLowEnergyAssist = useMemo(
    () =>
      canAccessPremiumFeature("low_energy_assist", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const lowEnergyAssist = useMemo(
    () =>
      deriveLowEnergyAssist({
        hasPremiumAccess: premium.hasPremiumAccess,
        featureEnabled: premium.premiumFeatureFlags.low_energy_assist,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        recentFatigueAverage:
          typeof historyQuery.data?.[0]?.fatigue === "number" ? historyQuery.data?.[0]?.fatigue : null,
        recentStressAverage:
          typeof historyQuery.data?.[0]?.stress === "number" ? historyQuery.data?.[0]?.stress : null,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data?.[0]?.sleep_hours : null,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        interactionTolerance: adaptiveProfile.lowEnergyMode ? "reduced" : "steady",
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyMode.enabled,
      premium.hasPremiumAccess,
      premium.premiumFeatureFlags.low_energy_assist,
    ],
  );
  const hasGuidedPrograms = useMemo(
    () =>
      canAccessPremiumFeature("guided_programs", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const hasCalmAudioSupport = useMemo(
    () =>
      canAccessPremiumFeature("calm_audio_support", {
        subscriptionsEnabled: premium.subscriptionsEnabled,
        hasPremiumAccess: premium.hasPremiumAccess,
        premiumFeatureFlags: premium.premiumFeatureFlags,
      }),
    [premium.hasPremiumAccess, premium.premiumFeatureFlags, premium.subscriptionsEnabled],
  );
  const lifecycleProfile = useMemo(
    () =>
      buildLifecycleProfile({
        firstOpenedAt: growth.state?.firstOpenedAt ?? null,
        activeDates: growth.state?.activeDates ?? [],
        totalCheckIns: overviewEntries.length,
        weeklyCheckIns,
      }),
    [growth.state?.activeDates, growth.state?.firstOpenedAt, overviewEntries.length, weeklyCheckIns],
  );
  const suggestedTool = useMemo(
    () => getProgramToolById(adaptiveProfile.suggestedProgram),
    [adaptiveProfile.suggestedProgram],
  );
  const suggestedModule = useMemo(
    () => getProgramModuleById(suggestedTool?.moduleId),
    [suggestedTool?.moduleId],
  );

  const activeTool = useMemo(
    () => getProgramToolById(activeTimerId),
    [activeTimerId],
  );
  const adaptiveStatePrimary = useMemo(
    () =>
      deriveAdaptiveStatePrimary({
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        stressTrend: adaptiveProfile.stressTrend,
        engagementPattern: adaptiveProfile.engagementPattern,
      }),
    [adaptiveProfile.engagementPattern, adaptiveProfile.lowEnergyMode, adaptiveProfile.stressTrend],
  );
  const premiumProgramsCopy = useMemo(
    () =>
      derivePremiumProgramsCopy({
        lowEnergyMode: adaptiveProfile.lowEnergyMode || lowEnergyAssist.active,
        overwhelmed: adaptiveStatePrimary === "OVERWHELMED",
        highFatigue: adaptiveProfile.fatigueTrend === "high",
      }),
    [adaptiveProfile.fatigueTrend, adaptiveProfile.lowEnergyMode, adaptiveStatePrimary, lowEnergyAssist.active],
  );
  const emotionalToolkit = useMemo(
    () =>
      deriveEmotionalRegulationToolkit({
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        suggestedToolId: adaptiveProfile.suggestedProgram,
        timeOfDay: deriveToolkitTimeOfDay(new Date().getHours()),
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      adaptiveProfile.suggestedProgram,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );
  const emotionalToolkitTools = useMemo(
    () =>
      emotionalToolkit.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [emotionalToolkit.surfacedToolIds],
  );
  const sleepRecoverySupport = useMemo(
    () =>
      deriveSleepRecoverySupport({
        timeOfDay: deriveToolkitTimeOfDay(new Date().getHours()),
        stressTrend: adaptiveProfile.stressTrend,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );
  const sleepSupportTools = useMemo(
    () =>
      sleepRecoverySupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [sleepRecoverySupport.surfacedToolIds],
  );
  const cognitiveSupport = useMemo(
    () =>
      deriveCognitiveSupport({
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const cognitiveSupportTools = useMemo(
    () =>
      cognitiveSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [cognitiveSupport.surfacedToolIds],
  );
  const communicationSupport = useMemo(
    () =>
      deriveCommunicationSupport({
        stressTrend: adaptiveProfile.stressTrend,
        fatigueTrend: adaptiveProfile.fatigueTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const communicationSupportTools = useMemo(
    () =>
      communicationSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [communicationSupport.surfacedToolIds],
  );
  const difficultDaySupport = useMemo(
    () =>
      deriveDifficultDaySupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const difficultDayTools = useMemo(
    () =>
      difficultDaySupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [difficultDaySupport.surfacedToolIds],
  );
  const emotionalReset = useMemo(
    () =>
      deriveEmotionalReset({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const emotionalResetTools = useMemo(
    () =>
      emotionalReset.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [emotionalReset.surfacedToolIds],
  );
  const mentalExhaustion = useMemo(
    () =>
      deriveMentalExhaustionSupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const mentalExhaustionTools = useMemo(
    () =>
      mentalExhaustion.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [mentalExhaustion.surfacedToolIds],
  );
  const calmGuidance = useMemo(
    () =>
      deriveCalmGuidance({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        brainFog:
          typeof historyQuery.data?.[0]?.brain_fog === "number" ? historyQuery.data[0].brain_fog : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const calmGuidanceTools = useMemo(
    () =>
      calmGuidance.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [calmGuidance.surfacedToolIds],
  );
  const recoveryRhythm = useMemo(
    () =>
      deriveRecoveryRhythm({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        recentEntries: historyQuery.data ?? [],
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
    ],
  );

  useEffect(() => {
    if (!activeTimerId || secondsRemaining === null) {
      return;
    }

    if (secondsRemaining <= 0) {
      setCompletedToolId(activeTimerId);
      void programProgress.markCompleted(activeTimerId);
      setActiveTimerId(null);
      setSecondsRemaining(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSecondsRemaining((current) => (current === null ? current : current - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeTimerId, secondsRemaining]);

  useEffect(() => {
    if (!audioSessionState?.isPlaying || !selectedAudioSession || audioSessionState.sessionId !== selectedAudioSession.id) {
      return;
    }

    if (audioSessionState.totalSecondsRemaining <= 0) {
      if (selectedTool) {
        setCompletedToolId(selectedTool.id);
        void programProgress.markCompleted(selectedTool.id);
      }
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
      return;
    }

    const phase = selectedAudioSession.phases[audioSessionState.phaseIndex];
    if (!phase) {
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
      return;
    }

    const timeoutId = setTimeout(() => {
      setAudioSessionState((current) => {
        if (!current || current.sessionId !== selectedAudioSession.id || !current.isPlaying) {
          return current;
        }

        if (current.phaseSecondsRemaining > 1) {
          return {
            ...current,
            phaseSecondsRemaining: current.phaseSecondsRemaining - 1,
            totalSecondsRemaining: Math.max(0, current.totalSecondsRemaining - 1),
          };
        }

        const nextPhaseIndex = current.phaseIndex + 1;
        const nextPhase = selectedAudioSession.phases[nextPhaseIndex];

        if (!nextPhase) {
          if (selectedTool) {
            setCompletedToolId(selectedTool.id);
            void programProgress.markCompleted(selectedTool.id);
          }
          void programProgress.clearAudioSession();
          return null;
        }

        if (current.hapticsEnabled && selectedAudioSession.supportsHaptics) {
          void Haptics.selectionAsync().catch(() => undefined);
        }

        const nextState = {
          ...current,
          phaseIndex: nextPhaseIndex,
          phaseSecondsRemaining: nextPhase.seconds,
          totalSecondsRemaining: Math.max(0, current.totalSecondsRemaining - 1),
        };
        void programProgress.saveAudioSession({
          ...nextState,
          updatedAt: new Date().toISOString(),
        });
        return nextState;
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [audioSessionState, programProgress, selectedAudioSession, selectedTool]);

  useEffect(() => {
    if (!selectedToolId) {
      return;
    }

    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedToolId]);

  useEffect(() => {
    if (!programProgress.progress.audioSession) {
      return;
    }

    setAudioSessionState(programProgress.progress.audioSession);
  }, [programProgress.progress.audioSession]);

  const premiumLibraryPreview = useMemo(
    () => PROGRAM_MODULES.filter((module) => module.premiumFeature === "guided_programs").slice(0, 4),
    [],
  );

  const groupedTools = useMemo(
    () =>
      PROGRAM_SECTIONS.map((section) => ({
        section,
        items: PROGRAM_MODULES.filter((module) => {
          if (module.section !== section) {
            return false;
          }

          if (module.premiumFeature === "guided_programs" && !hasGuidedPrograms) {
            return false;
          }

          return true;
        }).sort((left, right) => {
          const leftHasSuggestion = suggestedModule?.id === left.id ? 1 : 0;
          const rightHasSuggestion = suggestedModule?.id === right.id ? 1 : 0;
          if (leftHasSuggestion !== rightHasSuggestion) {
            return rightHasSuggestion - leftHasSuggestion;
          }

          const leftIsActive = getProgramToolsByModuleId(left.id).some(
            (tool) => tool.id === programProgress.progress.activeToolId || tool.id === programProgress.progress.lastOpenedToolId,
          ) ? 1 : 0;
          const rightIsActive = getProgramToolsByModuleId(right.id).some(
            (tool) => tool.id === programProgress.progress.activeToolId || tool.id === programProgress.progress.lastOpenedToolId,
          ) ? 1 : 0;

          if (leftIsActive !== rightIsActive) {
            return rightIsActive - leftIsActive;
          }

          return left.title.localeCompare(right.title);
        }),
        lockedCount: PROGRAM_MODULES.filter(
          (module) => module.section === section && module.premiumFeature === "guided_programs" && !hasGuidedPrograms,
        ).length,
      })),
    [hasGuidedPrograms, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId, suggestedModule?.id],
  );

  const startTool = (tool: ProgramTool) => {
    setCompletedToolId(null);
    void programProgress.markOpened(tool.id);
    void programProgress.markStarted(tool.id);

    if (tool.durationSeconds) {
      setActiveTimerId(tool.id);
      setSecondsRemaining(tool.durationSeconds);
    } else {
      setActiveTimerId(null);
      setSecondsRemaining(null);
    }
  };

  const startAudioSession = (tool: ProgramTool) => {
    const session = getCalmAudioSessionByToolId(tool.id);
    if (!session) {
      return;
    }

    const nextState: CalmAudioSessionProgress = {
      sessionId: session.id,
      toolId: tool.id,
      phaseIndex: 0,
      phaseSecondsRemaining: session.phases[0]?.seconds ?? session.totalSeconds,
      totalSecondsRemaining: session.totalSeconds,
      isPlaying: true,
      hapticsEnabled: session.supportsHaptics,
      updatedAt: new Date().toISOString(),
    };

    setCompletedToolId(null);
    setAudioSessionState(nextState);
    void programProgress.markOpened(tool.id);
    void programProgress.markStarted(tool.id);
    void programProgress.saveAudioSession(nextState);

    if (nextState.hapticsEnabled && session.supportsHaptics) {
      void Haptics.selectionAsync().catch(() => undefined);
    }
  };

  const pauseAudioSession = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        isPlaying: false,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
  };

  const resumeAudioSession = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        isPlaying: true,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
  };

  const stopAudioSession = () => {
    setAudioSessionState(null);
    void programProgress.clearAudioSession();
  };

  const toggleAudioHaptics = () => {
    setAudioSessionState((current) => {
      if (!current) {
        return current;
      }

      const nextState = {
        ...current,
        hapticsEnabled: !current.hapticsEnabled,
        updatedAt: new Date().toISOString(),
      };
      void programProgress.saveAudioSession(nextState);
      return nextState;
    });
  };

  const completeTool = (tool: ProgramTool) => {
    setCompletedToolId(tool.id);
    void programProgress.markCompleted(tool.id);
    if (activeTimerId === tool.id) {
      setActiveTimerId(null);
      setSecondsRemaining(null);
    }
    if (audioSessionState?.toolId === tool.id) {
      setAudioSessionState(null);
      void programProgress.clearAudioSession();
    }

    void growth.recordEvent("program_completed", {
      toolId: tool.id,
    });
    void growth.maybePromptForReview();
  };

  const stopTimer = () => {
    setActiveTimerId(null);
    setSecondsRemaining(null);
    void programProgress.clearActiveTool();
  };

  const isSelectedToolCompleted = selectedTool
    ? programProgress.progress.completedToolIds.includes(selectedTool.id)
    : false;
  const activeContinuationTool = useMemo(
    () => getProgramToolById(programProgress.progress.activeToolId ?? programProgress.progress.lastOpenedToolId),
    [programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId],
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
  const transitionSupport = useMemo(
    () =>
      deriveTransitionSupport({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentEntries: historyQuery.data ?? [],
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        disruptionDetected: routineDisruption.disrupted,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
      routineDisruption.disrupted,
    ],
  );
  const transitionSupportTools = useMemo(
    () =>
      transitionSupport.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [transitionSupport.surfacedToolIds],
  );
  const setbackRecovery = useMemo(
    () =>
      deriveSetbackRecovery({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        disruptionDetected: routineDisruption.disrupted,
        disruptionSeverity: routineDisruption.severity,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
        recentCheckInCount: weeklyCheckIns,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
      routineDisruption.disrupted,
      routineDisruption.severity,
      weeklyCheckIns,
    ],
  );
  const setbackRecoveryTools = useMemo(
    () =>
      setbackRecovery.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [setbackRecovery.surfacedToolIds],
  );
  const futureStability = useMemo(
    () =>
      deriveFutureStability({
        fatigueTrend: adaptiveProfile.fatigueTrend,
        stressTrend: adaptiveProfile.stressTrend,
        recentSleepAverage:
          typeof historyQuery.data?.[0]?.sleep_hours === "number" ? historyQuery.data[0].sleep_hours : null,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        lowEnergyAssistActive: lowEnergyAssist.active,
        recentToolIds: programProgress.progress.recentToolIds,
        lastOpenedToolId: programProgress.progress.lastOpenedToolId,
      }),
    [
      adaptiveProfile.fatigueTrend,
      adaptiveProfile.lowEnergyMode,
      adaptiveProfile.stressTrend,
      historyQuery.data,
      lowEnergyAssist.active,
      programProgress.progress.lastOpenedToolId,
      programProgress.progress.recentToolIds,
    ],
  );
  const futureStabilityTools = useMemo(
    () =>
      futureStability.surfacedToolIds
        .map((toolId) => getProgramToolById(toolId))
        .filter((tool): tool is ProgramTool => Boolean(tool)),
    [futureStability.surfacedToolIds],
  );
  const recoveryExperience = useMemo(
    () =>
      deriveRecoveryExperience({
        adaptiveStatePrimary,
        disruption: routineDisruption,
      }),
    [adaptiveStatePrimary, routineDisruption],
  );
  const flexibleRoutineState = useMemo(
    () =>
      deriveFlexibleRoutineState({
        adaptiveStatePrimary,
        hasActiveRoutine: Boolean(activeContinuationTool),
        recoveryExperience,
      }),
    [
      activeContinuationTool,
      adaptiveStatePrimary,
      recoveryExperience,
    ],
  );
  const resumableProgramFlow = useMemo(
    () =>
      activeContinuationTool
        ? deriveResumableProgramFlow({
            toolTitle: activeContinuationTool.title,
            continuationLabel: activeContinuationTool.continuationLabel,
            routineState: flexibleRoutineState,
          })
        : null,
    [activeContinuationTool, flexibleRoutineState],
  );
  const guidedSupportPrograms = useMemo(
    () =>
      deriveSupportPrograms({
        adaptiveStatePrimary,
        suggestedToolId: adaptiveProfile.suggestedProgram,
        supportTags: adaptiveProfile.preferredProgramTags ?? [],
      }),
    [adaptiveProfile.preferredProgramTags, adaptiveProfile.suggestedProgram, adaptiveStatePrimary],
  );
  const recoveryPath = useMemo(
    () =>
      deriveRecoveryPaths({
        adaptiveStatePrimary,
        hasDisruption: routineDisruption.disrupted,
      }),
    [adaptiveStatePrimary, routineDisruption.disrupted],
  );
  const pauseResumeState = useMemo(
    () =>
      derivePauseResumeState({
        adaptiveStatePrimary,
        hasActiveTool: Boolean(programProgress.progress.activeToolId),
        hasRecentTool: Boolean(programProgress.progress.lastOpenedToolId),
      }),
    [adaptiveStatePrimary, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId],
  );
  const interruptionNormalization = useMemo(
    () =>
      normalizeProgramInterruptions({
        hadInterruption: routineDisruption.disrupted || Boolean(programProgress.progress.lastOpenedToolId && !programProgress.progress.activeToolId),
        adaptiveStatePrimary,
      }),
    [adaptiveStatePrimary, programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId, routineDisruption.disrupted],
  );
  const programIntensity = useMemo(
    () =>
      deriveProgramIntensity({
        adaptiveStatePrimary,
        lowEnergyMode: adaptiveProfile.lowEnergyMode,
        stressTrend: adaptiveProfile.stressTrend === "elevated" ? "elevated" : "steady",
      }),
    [adaptiveProfile.lowEnergyMode, adaptiveProfile.stressTrend, adaptiveStatePrimary],
  );
  const selectedToolMode = useMemo(
    () =>
      selectedTool
        ? deriveLowEnergyProgramMode({
            intensity: programIntensity,
            stepCount: selectedTool.steps.length,
          })
        : null,
    [programIntensity, selectedTool],
  );
  const groundingSupport = useMemo(
    () =>
      deriveGroundingSupport({
        adaptiveStatePrimary,
        intensity: programIntensity,
      }),
    [adaptiveStatePrimary, programIntensity],
  );
  const recoverySupport = useMemo(
    () =>
      deriveRecoverySupport({
        adaptiveStatePrimary,
        hasRecentDisruption: routineDisruption.disrupted,
      }),
    [adaptiveStatePrimary, routineDisruption.disrupted],
  );
  const difficultPeriodPrograms = useMemo(
    () =>
      deriveDifficultPeriodPrograms({
        adaptiveStatePrimary,
        suggestedToolId: adaptiveProfile.suggestedProgram,
      }),
    [adaptiveProfile.suggestedProgram, adaptiveStatePrimary],
  );
  const recommendedProgramCopy = useMemo(
    () =>
      suggestedModule
        ? deriveRecommendedProgramCopy({
            module: suggestedModule,
            lowEnergyMode: adaptiveProfile.lowEnergyMode,
            highFatigue: adaptiveProfile.fatigueTrend === "high",
            overwhelmed: adaptiveStatePrimary === "OVERWHELMED",
          })
        : null,
    [adaptiveProfile.fatigueTrend, adaptiveProfile.lowEnergyMode, adaptiveStatePrimary, suggestedModule],
  );
  const shouldSimplifyPrograms =
    adaptiveProfile.lowEnergyMode || adaptiveStatePrimary === "OVERWHELMED" || lowEnergyAssist.active;
  const canUseSuggestedTool =
    !suggestedTool?.premiumFeature || (suggestedTool.premiumFeature === "guided_programs" && hasGuidedPrograms);
  const canUseSelectedTool =
    !selectedTool?.premiumFeature || (selectedTool.premiumFeature === "guided_programs" && hasGuidedPrograms);
  const canUseSelectedAudioSession = Boolean(selectedAudioSession && hasCalmAudioSupport);
  const isSelectedAudioActive = Boolean(
    selectedAudioSession && audioSessionState?.sessionId === selectedAudioSession.id,
  );
  const visibleStepCount = selectedToolMode?.visibleStepCount ?? selectedTool?.steps.length ?? 0;
  const visibleToolSteps = selectedTool
    ? selectedTool.steps.slice(0, Math.min(visibleStepCount, lowEnergyAssist.cognitiveLoad.maxVisibleSteps))
    : [];

  const getModuleProgressSummary = (module: ProgramModule) => {
    const tools = getProgramToolsByModuleId(module.id);
    const completedCount = tools.filter((tool) => programProgress.progress.completedToolIds.includes(tool.id)).length;
    return {
      completedCount,
      totalCount: tools.length,
      isCompleted: completedCount === tools.length && tools.length > 0,
    };
  };

  useEffect(() => {
    setShowSelectedToolDetails(false);
  }, [selectedToolId]);

  if ((overviewQuery.isLoading && !overviewQuery.data) || (historyQuery.isLoading && !historyQuery.data)) {
    return <LoadingState message="Programs are settling in..." />;
  }

  if (overviewQuery.isError) {
    return <ErrorState message="This section may need another moment." onRetry={() => void overviewQuery.refetch()} />;
  }

  if (historyQuery.isError) {
    return <ErrorState message="Programs may need another moment." onRetry={() => void historyQuery.refetch()} />;
  }

  return (
    <AppScreen
      eyebrow="Structured support"
      title="Support tools"
      subtitle="Short support tools for overwhelm, low energy, and steadier pacing."
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          (adaptiveProfile.lowEnergyMode || lowEnergyAssist.active) && styles.contentLowEnergy,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>A calm library for harder days</AppText>
          <AppText style={styles.heroBody}>
            {preventMotivationalPressure(`Pick one small tool that matches the moment. ${recoveryPath.body}`)}
          </AppText>
        </View>

        <View style={styles.premiumLibraryCard}>
          <AppText style={styles.premiumLibraryLabel}>{hasGuidedPrograms ? "Premium library" : "Deeper library"}</AppText>
          <AppText style={styles.premiumLibraryTitle}>{premiumProgramsCopy.title}</AppText>
          <AppText style={styles.premiumLibraryBody}>{premiumProgramsCopy.body}</AppText>
          <View style={styles.categoryChipRow}>
            {PROGRAM_LIBRARY_CATEGORIES.slice(0, lowEnergyAssist.active ? 4 : 7).map((category) => (
              <View key={category} style={styles.categoryChip}>
                <AppText style={styles.categoryChipText}>{deriveProgramCategoryLabel(category)}</AppText>
              </View>
            ))}
          </View>
          {!hasGuidedPrograms ? (
            <>
              <View style={styles.previewList}>
                {premiumLibraryPreview.slice(0, lowEnergyAssist.active ? 2 : 3).map((module) => (
                  <View key={module.id} style={styles.previewRow}>
                    <AppText style={styles.previewBullet}>•</AppText>
                    <AppText style={styles.previewText}>{module.title}</AppText>
                  </View>
                ))}
              </View>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          ) : null}
        </View>

        <View style={styles.toolkitCard}>
          <AppText style={styles.toolkitLabel}>{hasGuidedPrograms ? "Emotional resilience toolkit" : "Calmer support toolkit"}</AppText>
          <AppText style={styles.toolkitTitle}>{emotionalToolkit.title}</AppText>
          <AppText style={styles.toolkitBody}>{emotionalToolkit.body}</AppText>
          <View style={styles.categoryChipRow}>
            {emotionalToolkit.categoryLabels.map((category) => (
              <View key={category} style={styles.toolkitChip}>
                <AppText style={styles.toolkitChipText}>{deriveProgramCategoryLabel(category)}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {emotionalToolkitTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {emotionalToolkitTools.slice(0, lowEnergyAssist.active ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer nervous-system support and grounding tools that stay short, low-pressure, and easier to use on difficult days.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.toolkitCard, emotionalReset.simplifyFurther && styles.difficultDayCardHeavy]}>
          <AppText style={styles.toolkitLabel}>
            {hasGuidedPrograms ? "Emotional reset rituals" : "Calmer reset support"}
          </AppText>
          <AppText style={styles.toolkitTitle}>{emotionalReset.title}</AppText>
          <AppText style={styles.toolkitBody}>{emotionalReset.body}</AppText>
          {emotionalReset.continuityLine ? (
            <AppText style={styles.difficultDayContinuity}>{emotionalReset.continuityLine}</AppText>
          ) : null}
          <View style={styles.difficultDayLineList}>
            {emotionalReset.resetLines.slice(0, emotionalReset.simplifyFurther ? 2 : 3).map((line) => (
              <View key={line} style={styles.difficultDayLineRow}>
                <AppText style={styles.difficultDayLineBullet}>•</AppText>
                <AppText style={styles.difficultDayLineText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {emotionalResetTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {emotionalResetTools.slice(0, emotionalReset.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer emotional reset and nervous-system recovery support during overwhelming periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.recoveryRhythmCard, recoveryRhythm.simplifyFurther && styles.recoveryRhythmCardHeavy]}>
          <AppText style={styles.recoveryRhythmLabel}>Recovery rhythm</AppText>
          <AppText style={styles.recoveryRhythmTitle}>{recoveryRhythm.title}</AppText>
          <AppText style={styles.recoveryRhythmBody}>{recoveryRhythm.body}</AppText>
          <View style={styles.recoveryRhythmList}>
            {recoveryRhythm.observations.map((line) => (
              <View key={line} style={styles.recoveryRhythmRow}>
                <AppText style={styles.recoveryRhythmBullet}>•</AppText>
                <AppText style={styles.recoveryRhythmText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.recoveryRhythmSuggestionList}>
            {recoveryRhythm.suggestions.map((line) => (
              <View key={line} style={styles.recoveryRhythmSuggestionPill}>
                <AppText style={styles.recoveryRhythmSuggestionText}>{line}</AppText>
              </View>
            ))}
          </View>
          {!hasGuidedPrograms ? (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer pacing and recovery support during difficult periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          ) : null}
        </View>

        <View style={[styles.cognitiveSupportCard, mentalExhaustion.simplifyFurther && styles.cognitiveSupportCardHeavy]}>
          <AppText style={styles.cognitiveSupportLabel}>Mental exhaustion recovery</AppText>
          <AppText style={styles.cognitiveSupportTitle}>{mentalExhaustion.title}</AppText>
          <AppText style={styles.cognitiveSupportBody}>{mentalExhaustion.body}</AppText>
          {mentalExhaustion.continuityLine ? (
            <AppText style={styles.cognitiveSupportContinuity}>{mentalExhaustion.continuityLine}</AppText>
          ) : null}
          <View style={styles.difficultDayLineList}>
            {mentalExhaustion.recoveryLines.slice(0, mentalExhaustion.simplifyFurther ? 2 : 3).map((line) => (
              <View key={line} style={styles.difficultDayLineRow}>
                <AppText style={styles.difficultDayLineBullet}>•</AppText>
                <AppText style={styles.difficultDayLineText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {mentalExhaustionTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {mentalExhaustionTools.slice(0, mentalExhaustion.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer support for recovering after mentally exhausting periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.guidanceCard, transitionSupport.simplifyFurther && styles.guidanceCardHeavy]}>
          <AppText style={styles.guidanceLabel}>Travel and transitions</AppText>
          <AppText style={styles.guidanceTitle}>{transitionSupport.title}</AppText>
          <AppText style={styles.guidanceBody}>{transitionSupport.body}</AppText>
          {transitionSupport.continuityLine ? (
            <AppText style={styles.guidanceContinuity}>{transitionSupport.continuityLine}</AppText>
          ) : null}
          <View style={styles.guidancePromptList}>
            {transitionSupport.summaries.map((line) => (
              <View key={line} style={styles.guidancePromptRow}>
                <AppText style={styles.guidancePromptBullet}>•</AppText>
                <AppText style={styles.guidancePromptText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {transitionSupportTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {transitionSupportTools.slice(0, transitionSupport.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer support during travel, disrupted routines, and difficult transitions.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.difficultDayCard, setbackRecovery.simplifyFurther && styles.difficultDayCardHeavy]}>
          <AppText style={styles.difficultDayLabel}>Quiet recovery after setbacks</AppText>
          <AppText style={styles.difficultDayTitle}>{setbackRecovery.title}</AppText>
          <AppText style={styles.difficultDayBody}>{setbackRecovery.body}</AppText>
          {setbackRecovery.continuityLine ? (
            <AppText style={styles.difficultDayContinuity}>{setbackRecovery.continuityLine}</AppText>
          ) : null}
          <View style={styles.difficultDayLineList}>
            {setbackRecovery.supportLines.map((line) => (
              <View key={line} style={styles.difficultDayLineRow}>
                <AppText style={styles.difficultDayLineBullet}>•</AppText>
                <AppText style={styles.difficultDayLineText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {setbackRecoveryTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {setbackRecoveryTools.slice(0, setbackRecovery.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer support for restarting gently after difficult periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.guidanceCard, futureStability.simplifyFurther && styles.guidanceCardHeavy]}>
          <AppText style={styles.guidanceLabel}>Future stability</AppText>
          <AppText style={styles.guidanceTitle}>{futureStability.title}</AppText>
          <AppText style={styles.guidanceBody}>{futureStability.body}</AppText>
          {futureStability.continuityLine ? (
            <AppText style={styles.guidanceContinuity}>{futureStability.continuityLine}</AppText>
          ) : null}
          <View style={styles.guidancePromptList}>
            {futureStability.planningLines.map((line) => (
              <View key={line} style={styles.guidancePromptRow}>
                <AppText style={styles.guidancePromptBullet}>•</AppText>
                <AppText style={styles.guidancePromptText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {futureStabilityTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {futureStabilityTools.slice(0, futureStability.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer planning and low-pressure future support during unpredictable periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.communicationCard, communicationSupport.simplifyFurther && styles.communicationCardHeavy]}>
          <AppText style={styles.communicationLabel}>Communication support</AppText>
          <AppText style={styles.communicationTitle}>{communicationSupport.title}</AppText>
          <AppText style={styles.communicationBody}>{communicationSupport.body}</AppText>
          {communicationSupport.continuityLine ? (
            <AppText style={styles.communicationContinuity}>{communicationSupport.continuityLine}</AppText>
          ) : null}
          <View style={styles.communicationPhraseList}>
            {communicationSupport.phrases.slice(0, communicationSupport.simplifyFurther ? 2 : 3).map((phrase) => (
              <View key={phrase} style={styles.communicationPhrasePill}>
                <AppText style={styles.communicationPhraseText}>{phrase}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {communicationSupportTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {communicationSupportTools.slice(0, communicationSupport.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer communication and relationship support during difficult periods.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.guidanceCard, calmGuidance.simplifyFurther && styles.guidanceCardHeavy]}>
          <AppText style={styles.guidanceLabel}>Calm guidance</AppText>
          <AppText style={styles.guidanceTitle}>{calmGuidance.title}</AppText>
          <AppText style={styles.guidanceBody}>{calmGuidance.body}</AppText>
          {calmGuidance.continuityLine ? (
            <AppText style={styles.guidanceContinuity}>{calmGuidance.continuityLine}</AppText>
          ) : null}
          <View style={styles.guidancePromptList}>
            {calmGuidance.prompts.slice(0, calmGuidance.simplifyFurther ? 2 : 3).map((prompt) => (
              <View key={prompt} style={styles.guidancePromptRow}>
                <AppText style={styles.guidancePromptBullet}>•</AppText>
                <AppText style={styles.guidancePromptText}>{prompt}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {calmGuidanceTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {calmGuidanceTools.slice(0, calmGuidance.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer daily guidance and low-pressure pacing support.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.difficultDayCard, difficultDaySupport.simplifyFurther && styles.difficultDayCardHeavy]}>
          <AppText style={styles.difficultDayLabel}>Difficult-day support</AppText>
          <AppText style={styles.difficultDayTitle}>{difficultDaySupport.title}</AppText>
          <AppText style={styles.difficultDayBody}>{difficultDaySupport.body}</AppText>
          {difficultDaySupport.continuityLine ? (
            <AppText style={styles.difficultDayContinuity}>{difficultDaySupport.continuityLine}</AppText>
          ) : null}
          <View style={styles.difficultDayLineList}>
            {difficultDaySupport.groundingLines.slice(0, difficultDaySupport.simplifyFurther ? 2 : 3).map((line) => (
              <View key={line} style={styles.difficultDayLineRow}>
                <AppText style={styles.difficultDayLineBullet}>•</AppText>
                <AppText style={styles.difficultDayLineText}>{line}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {difficultDayTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {difficultDayTools.slice(0, difficultDaySupport.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer support for heavier and lower-energy days.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.cognitiveSupportCard, cognitiveSupport.simplifyFurther && styles.cognitiveSupportCardHeavy]}>
          <AppText style={styles.cognitiveSupportLabel}>Brain fog support</AppText>
          <AppText style={styles.cognitiveSupportTitle}>{cognitiveSupport.title}</AppText>
          <AppText style={styles.cognitiveSupportBody}>{cognitiveSupport.body}</AppText>
          {cognitiveSupport.continuityLine ? (
            <AppText style={styles.cognitiveSupportContinuity}>{cognitiveSupport.continuityLine}</AppText>
          ) : null}
          <View style={styles.toolkitList}>
            {cognitiveSupportTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={styles.toolkitRowTitle}>{tool.title}</AppText>
                  <AppText style={styles.toolkitRowBody}>{tool.whenToUse}</AppText>
                </View>
                <View style={styles.toolkitMetaWrap}>
                  <AppText style={styles.toolkitMetaText}>{tool.durationLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {cognitiveSupportTools.slice(0, cognitiveSupport.simplifyFurther ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={styles.toolkitLockedBody}>
                Premium includes calmer cognitive support and brain-fog-friendly tools.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={[styles.sleepSupportCard, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepSupportCardEvening]}>
          <AppText style={[styles.sleepSupportLabel, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningLabel]}>
            Evening support
          </AppText>
          <AppText style={[styles.sleepSupportTitle, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningText]}>
            {sleepRecoverySupport.title}
          </AppText>
          <AppText style={[styles.sleepSupportBody, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningBody]}>
            {sleepRecoverySupport.body}
          </AppText>
          <View style={styles.sleepPromptList}>
            {sleepRecoverySupport.reflectionPrompts.slice(0, lowEnergyAssist.active ? 2 : 3).map((prompt) => (
              <View key={prompt} style={styles.sleepPromptRow}>
                <AppText style={[styles.sleepPromptBullet, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningLabel]}>•</AppText>
                <AppText style={[styles.sleepPromptText, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningBody]}>
                  {prompt}
                </AppText>
              </View>
            ))}
          </View>
          <View style={styles.toolkitList}>
            {sleepSupportTools.map((tool) => (
              <View key={tool.id} style={styles.toolkitRow}>
                <View style={styles.toolkitRowText}>
                  <AppText style={[styles.toolkitRowTitle, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningText]}>
                    {tool.title}
                  </AppText>
                  <AppText style={[styles.toolkitRowBody, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningBody]}>
                    {tool.whenToUse}
                  </AppText>
                </View>
                <View style={[styles.toolkitMetaWrap, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepMetaWrapEvening]}>
                  <AppText style={[styles.toolkitMetaText, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningMetaText]}>
                    {tool.durationLabel}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
          {hasGuidedPrograms ? (
            <View style={styles.toolkitActions}>
              {sleepSupportTools.slice(0, lowEnergyAssist.active ? 2 : 3).map((tool) => (
                <AppButton
                  key={tool.id}
                  label={`Open ${tool.title}`}
                  onPress={() => {
                    setSelectedToolId(tool.id);
                    void programProgress.markOpened(tool.id);
                  }}
                  variant="secondary"
                />
              ))}
            </View>
          ) : (
            <>
              <AppText style={[styles.toolkitLockedBody, sleepRecoverySupport.useCalmerNightVisuals && styles.sleepEveningBody]}>
                Premium includes calmer evening support and nervous-system-friendly wind-down tools.
              </AppText>
              <AppButton
                label="Explore Premium"
                onPress={() => router.push("/premium?source=programs")}
                variant="secondary"
              />
            </>
          )}
        </View>

        <View style={styles.audioLibraryCard}>
          <AppText style={styles.audioLibraryLabel}>{hasCalmAudioSupport ? "Calm audio support" : "Audio support"}</AppText>
          <AppText style={styles.audioLibraryTitle}>Short resets for overwhelm, evenings, and lower-energy stretches</AppText>
          <AppText style={styles.audioLibraryBody}>
            Premium includes calming audio support and nervous-system-friendly resets. These sessions stay brief, offline-ready, and easy to leave when needed.
          </AppText>
          <View style={styles.audioMetaRow}>
            <View style={styles.audioMetaPill}>
              <AppText style={styles.audioMetaText}>1-5 minutes</AppText>
            </View>
            <View style={styles.audioMetaPill}>
              <AppText style={styles.audioMetaText}>Offline ready</AppText>
            </View>
            <View style={styles.audioMetaPill}>
              <AppText style={styles.audioMetaText}>Optional haptics</AppText>
            </View>
          </View>
          {!hasCalmAudioSupport ? (
            <AppButton
              label="Explore Premium"
              onPress={() => router.push("/premium?source=programs")}
              variant="secondary"
            />
          ) : null}
        </View>

        {adaptiveProfile.lowEnergyMode || lowEnergyAssist.active ? (
          <View style={styles.suggestionCard}>
            <AppText style={styles.suggestionLabel}>Low-energy support</AppText>
            <AppText style={styles.suggestionTitle}>{adaptiveProfile.simplificationTitle}</AppText>
            <AppText style={styles.suggestionBody}>
              {preventMotivationalPressure(
                `${adaptiveProfile.simplificationBody} ${
                  hasLowEnergyAssist && lowEnergyAssist.active
                    ? "Low Energy Assist is keeping this space lighter right now."
                    : recoverySupport
                }`,
              )}
            </AppText>
          </View>
        ) : null}

        {suggestedTool && suggestedModule && canUseSuggestedTool ? (
          <View style={styles.suggestionCard}>
            <AppText style={styles.suggestionLabel}>{recommendedProgramCopy?.label ?? "Worth considering today"}</AppText>
            <AppText style={styles.suggestionTitle}>{suggestedTool.title}</AppText>
            <AppText style={styles.suggestionBody}>
              {preventMotivationalPressure(
                `${recommendedProgramCopy?.body ?? suggestedModule.whyItHelps} ${
                  guidedSupportPrograms.primaryModuleIds.includes(suggestedModule.id)
                    ? "It can stay gentle and brief."
                    : ""
                }`,
              )}
            </AppText>
            <AppButton
              label={programIntensity === "very-gentle" ? `Open ${suggestedTool.title}` : `Open ${suggestedTool.title}`}
              onPress={() => {
                setSelectedToolId(suggestedTool.id);
                void programProgress.markOpened(suggestedTool.id);
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        {suggestedTool && suggestedModule && !canUseSuggestedTool ? (
          <View style={styles.premiumPromptCard}>
            <AppText style={styles.suggestionLabel}>Worth considering today</AppText>
            <AppText style={styles.suggestionTitle}>{suggestedTool.title}</AppText>
            <AppText style={styles.suggestionBody}>
              Premium includes this quieter support tool, along with a deeper library for overwhelm, sleep, brain fog, and lower-energy days.
            </AppText>
            <AppButton
              label="Explore Premium"
              onPress={() => router.push("/premium?source=programs")}
              variant="secondary"
            />
          </View>
        ) : null}

        {activeContinuationTool && resumableProgramFlow ? (
          <View style={styles.navCard}>
            <AppText style={styles.cardTitle}>
              {pauseResumeState.shorterResumeCopy ? "Pick up gently" : resumableProgramFlow.title}
            </AppText>
            <AppText style={styles.resumeCopy}>
              {preventMotivationalPressure(
                `${resumableProgramFlow.body} ${interruptionNormalization ?? ""}`.trim(),
              )}
            </AppText>
            <AppText style={styles.resumeNote}>Continue later if it still helps. This step will stay here.</AppText>
            <AppButton
              label={pauseResumeState.shorterResumeCopy ? "Resume gently" : resumableProgramFlow.ctaLabel}
              onPress={() => {
                setSelectedToolId(activeContinuationTool.id);
                void programProgress.markOpened(activeContinuationTool.id);
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        <View style={styles.navCard}>
          <AppText style={styles.cardTitle}>Quick links</AppText>
          <AppText style={styles.resumeCopy}>Move between support spaces without losing your place here.</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Coach" onPress={() => router.push("/coach")} variant="secondary" />
            {!adaptiveProfile.lowEnergyMode && !lowEnergyAssist.active ? (
              <AppButton label="Today" onPress={() => router.push("/today")} variant="secondary" />
            ) : null}
          </View>
        </View>

        {activeTool && secondsRemaining !== null ? (
          <View style={styles.timerCard}>
            <AppText style={styles.timerKicker}>In progress</AppText>
            <AppText style={styles.timerTitle}>{activeTool.title}</AppText>
            <AppText style={styles.timerValue}>{formatTime(secondsRemaining)}</AppText>
            <AppText style={styles.timerBody}>
              {preventMotivationalPressure(groundingSupport)}
            </AppText>
            <AppButton label={pauseResumeState.shouldOfferPause ? "Pause for now" : "Stop timer"} onPress={stopTimer} variant="secondary" />
          </View>
        ) : null}

        {selectedTool && completedToolId === selectedTool.id ? (
          <View style={styles.completionCard}>
            <AppText style={styles.completionTitle}>That can be enough for today.</AppText>
            <AppText style={styles.completionBody}>
              {preventCompletionPressure(selectedTool.completionMessage)}
            </AppText>
            <AppText style={styles.resumeNote}>You can return to this anytime.</AppText>
          </View>
        ) : null}

        {selectedTool && canUseSelectedTool ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderText}>
                <AppText style={styles.detailSectionLabel}>{selectedTool.section}</AppText>
                <AppText style={styles.detailTitle}>{selectedTool.title}</AppText>
              </View>
              <Pressable
                onPress={() => setSelectedToolId(null)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <AppText style={styles.closeButtonText}>Close</AppText>
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <AppText style={styles.metaPillText}>{selectedTool.durationLabel}</AppText>
              </View>
              <View style={styles.metaPill}>
                <AppText style={styles.metaPillText}>When to use it</AppText>
              </View>
              {selectedModule ? (
                <View style={styles.metaPill}>
                  <AppText style={styles.metaPillText}>
                    {deriveProgramCategoryLabel(selectedModule.category) || deriveProgramSectionLabel(selectedModule.section)}
                  </AppText>
                </View>
              ) : null}
            </View>

            <AppText style={styles.whenToUse}>{selectedTool.whenToUse}</AppText>
            <AppText style={styles.detailBody}>
              {preventMotivationalPressure(`${selectedTool.description} ${groundingSupport}`)}
            </AppText>
            {selectedAudioSession ? (
              canUseSelectedAudioSession ? (
                <View style={styles.audioSessionCard}>
                  <AppText style={styles.audioSessionLabel}>Calm audio support</AppText>
                  <AppText style={styles.audioSessionTitle}>{selectedAudioSession.title}</AppText>
                  <AppText style={styles.audioSessionBody}>{selectedAudioSession.description}</AppText>
                  <View style={styles.audioMetaRow}>
                    <View style={styles.audioMetaPill}>
                      <AppText style={styles.audioMetaText}>{selectedAudioSession.durationLabel}</AppText>
                    </View>
                    <View style={styles.audioMetaPill}>
                      <AppText style={styles.audioMetaText}>Works offline</AppText>
                    </View>
                    <View style={styles.audioMetaPill}>
                      <AppText style={styles.audioMetaText}>Pause any time</AppText>
                    </View>
                  </View>
                  <AppText style={styles.audioSupportNote}>
                    {selectedAudioSession.recommendation} {selectedAudioSession.lowStimulationNote}
                  </AppText>
                  {isSelectedAudioActive ? (
                    <>
                      <View style={styles.audioNowPlayingCard}>
                        <AppText style={styles.audioPhaseLabel}>
                          {selectedAudioSession.phases[audioSessionState?.phaseIndex ?? 0]?.label ?? "In progress"}
                        </AppText>
                        <AppText style={styles.audioTimerValue}>
                          {formatTime(audioSessionState?.totalSecondsRemaining ?? selectedAudioSession.totalSeconds)}
                        </AppText>
                        <AppText style={styles.audioPromptText}>
                          {selectedAudioSession.phases[audioSessionState?.phaseIndex ?? 0]?.prompt}
                        </AppText>
                        {selectedAudioSession.phases[audioSessionState?.phaseIndex ?? 0]?.breathCue ? (
                          <AppText style={styles.audioBreathNote}>
                            Inhale {selectedAudioSession.phases[audioSessionState?.phaseIndex ?? 0]?.breathCue?.inhaleSeconds ?? 0}
                            {" · "}
                            Exhale {selectedAudioSession.phases[audioSessionState?.phaseIndex ?? 0]?.breathCue?.exhaleSeconds ?? 0}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={styles.audioControls}>
                        <AppButton
                          label={audioSessionState?.isPlaying ? "Pause audio support" : "Resume audio support"}
                          onPress={() => (audioSessionState?.isPlaying ? pauseAudioSession() : resumeAudioSession())}
                        />
                        <AppButton
                          label={audioSessionState?.hapticsEnabled ? "Haptic pacing on" : "Haptic pacing off"}
                          onPress={toggleAudioHaptics}
                          variant="secondary"
                          disabled={!selectedAudioSession.supportsHaptics}
                        />
                        <AppButton
                          label="Stop for now"
                          onPress={stopAudioSession}
                          variant="secondary"
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.audioControls}>
                      <AppButton
                        label="Start audio support"
                        onPress={() => startAudioSession(selectedTool)}
                      />
                      <AppButton
                        label="Keep to text only"
                        onPress={() => setShowSelectedToolDetails((current) => !current)}
                        variant="secondary"
                      />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.audioLockedCard}>
                  <AppText style={styles.audioSessionLabel}>Calm audio support</AppText>
                  <AppText style={styles.audioSessionTitle}>{selectedAudioSession.title}</AppText>
                  <AppText style={styles.audioSessionBody}>
                    Premium includes calming audio support and nervous-system-friendly resets for difficult moments.
                  </AppText>
                  <AppButton
                    label="Explore Premium"
                    onPress={() => router.push("/premium?source=programs")}
                    variant="secondary"
                  />
                </View>
              )
            ) : null}
            {shouldSimplifyPrograms ? (
              <View style={styles.lowEnergySupportCard}>
                <AppText style={styles.lowEnergySupportTitle}>Short version</AppText>
                <AppText style={styles.lowEnergySupportBody}>
                  Keep this brief. The first step or two may be enough for now.
                </AppText>
              </View>
            ) : null}

            {selectedModule && !shouldSimplifyPrograms ? (
              <View style={styles.contextCard}>
                <AppText style={styles.contextTitle}>Why this may help</AppText>
                <AppText style={styles.contextBody}>
                  {preventMotivationalPressure(`${selectedModule.whyItHelps} ${recoverySupport}`)}
                </AppText>
                <View style={styles.moduleProgressCard}>
                  <AppText style={styles.moduleProgressTitle}>
                    {programIntensity === "very-gentle" ? "Move through this slowly" : "Move through this gently"}
                  </AppText>
                  <AppText style={styles.moduleProgressNote}>You can pause between tools and come back later without losing your place.</AppText>
                  {getProgramToolsByModuleId(selectedModule.id).map((tool) => {
                    const isCompleted = programProgress.progress.completedToolIds.includes(tool.id);
                    const isCurrent = tool.id === selectedTool.id;

                    return (
                      <Pressable
                        key={tool.id}
                        onPress={() => {
                          setSelectedToolId(tool.id);
                          void programProgress.markOpened(tool.id);
                        }}
                        style={({ pressed }) => [
                          styles.moduleStepRow,
                          isCurrent && styles.moduleStepRowCurrent,
                          pressed && styles.moduleStepRowPressed,
                        ]}
                      >
                        <View style={[styles.moduleStepBadge, isCompleted && styles.moduleStepBadgeCompleted]}>
                          <AppText style={[styles.moduleStepBadgeText, isCompleted && styles.moduleStepBadgeTextCompleted]}>
                            {isCompleted ? "Used recently" : "Available"}
                          </AppText>
                        </View>
                        <View style={styles.moduleStepTextWrap}>
                          <AppText style={styles.moduleStepTitle}>{tool.title}</AppText>
                          <AppText style={styles.moduleStepBody}>{tool.whenToUse}</AppText>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {selectedModule.content.map((item) => (
                  <View key={item.id} style={styles.contextNote}>
                    <AppText style={styles.contextNoteTitle}>{item.title}</AppText>
                    <AppText style={styles.contextNoteBody}>{preventMotivationalPressure(item.body)}</AppText>
                  </View>
                ))}
              </View>
            ) : null}
            {selectedModule && shouldSimplifyPrograms ? (
              <Pressable
                onPress={() => setShowSelectedToolDetails((current) => !current)}
                style={({ pressed }) => [styles.contextToggle, pressed && styles.toolCardPressed]}
              >
                <AppText style={styles.contextToggleText}>
                  {showSelectedToolDetails ? "Hide extra context" : "Show a little more context"}
                </AppText>
              </Pressable>
            ) : null}
            {selectedModule && shouldSimplifyPrograms && showSelectedToolDetails ? (
              <View style={styles.contextCard}>
                <AppText style={styles.contextTitle}>Why this may help</AppText>
                <AppText style={styles.contextBody}>
                  {preventMotivationalPressure(`${selectedModule.whyItHelps} ${recoverySupport}`)}
                </AppText>
              </View>
            ) : null}

            <View style={styles.stepsList}>
              {visibleToolSteps.map((step, index) => (
                <View key={`${selectedTool.id}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
                  </View>
                  <AppText style={styles.stepText}>{preventMotivationalPressure(step)}</AppText>
                </View>
              ))}
            </View>
            {selectedTool.steps.length > visibleToolSteps.length ? (
              <Pressable
                onPress={() => setShowSelectedToolDetails((current) => !current)}
                style={({ pressed }) => [styles.contextToggle, pressed && styles.toolCardPressed]}
              >
                <AppText style={styles.contextToggleText}>
                  {showSelectedToolDetails ? "Hide later steps" : "Show later steps"}
                </AppText>
              </Pressable>
            ) : null}
            {selectedTool.steps.length > visibleToolSteps.length && showSelectedToolDetails ? (
              <View style={styles.stepsList}>
                {selectedTool.steps.slice(visibleToolSteps.length).map((step, index) => (
                  <View key={`${selectedTool.id}-later-${index}`} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <AppText style={styles.stepBadgeText}>{visibleToolSteps.length + index + 1}</AppText>
                    </View>
                    <AppText style={styles.stepText}>{preventMotivationalPressure(step)}</AppText>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.detailActions}>
              <AppButton
                label={
                  isSelectedToolCompleted
                    ? "Used recently"
                    : selectedTool.durationSeconds
                      ? selectedToolMode?.shortenCtas
                        ? "Start gently"
                        : "Start"
                      : selectedToolMode?.shortenCtas
                        ? "Done for now"
                        : "Save this step"
                }
                onPress={() =>
                  isSelectedToolCompleted
                    ? null
                    : selectedTool.durationSeconds
                      ? startTool(selectedTool)
                      : completeTool(selectedTool)
                }
                disabled={isSelectedToolCompleted}
              />
              <AppButton
                label={isSelectedToolCompleted ? "Used recently" : selectedToolMode?.shortenCtas ? "Pause here" : "Pause for now"}
                onPress={() => (isSelectedToolCompleted ? null : completeTool(selectedTool))}
                variant="secondary"
                disabled={isSelectedToolCompleted}
              />
            </View>
            <AppText style={styles.resumeNote}>Nothing here needs to be finished in one go.</AppText>
          </View>
        ) : null}

        {groupedTools.map(({ section, items, lockedCount }) => (
          <View key={section} style={styles.section}>
            <AppText style={styles.sectionTitle}>{deriveProgramSectionLabel(section)}</AppText>
            <AppText style={styles.sectionSubtitle}>{deriveProgramSectionSubtitle(section)}</AppText>
            <View style={styles.sectionList}>
              {items.map((module) => {
                const moduleTools = getProgramToolsByModuleId(module.id);
                const leadTool = moduleTools[0] ?? null;
                const progressSummary = getModuleProgressSummary(module);

                return (
                <Pressable
                  key={module.id}
                  onPress={() => {
                    if (!leadTool) {
                      return;
                    }

                    setSelectedToolId(leadTool.id);
                    void programProgress.markOpened(leadTool.id);
                  }}
                  style={({ pressed }) => [styles.toolCard, pressed && styles.toolCardPressed]}
                >
                  <View style={styles.toolTopRow}>
                    <AppText style={styles.toolTitle}>{module.title}</AppText>
                    <AppText style={styles.toolDuration}>{module.estimatedPace}</AppText>
                  </View>
                  <AppText style={styles.toolWhenToUse}>{module.description}</AppText>
                  <AppText style={styles.toolDescription}>
                    {preventMotivationalPressure(
                      `${module.whyItHelps} ${
                        difficultPeriodPrograms.includes(leadTool?.id ?? "")
                          ? "This can be especially gentle for harder periods."
                          : ""
                      }`,
                    )}
                  </AppText>
                  <View style={styles.moduleMetaRow}>
                    <View style={styles.moduleMetaPill}>
                      <AppText style={styles.moduleMetaText}>
                        {preventCompletionPressure(
                          deriveSoftProgression({
                            completedCount: progressSummary.completedCount,
                            totalCount: progressSummary.totalCount,
                            intensity: programIntensity,
                          }),
                        )}
                      </AppText>
                    </View>
                    {adaptiveProfile.lowEnergyMode && module.id === suggestedModule?.id ? (
                      <View style={styles.moduleMetaPill}>
                        <AppText style={styles.moduleMetaText}>Lower-energy fit</AppText>
                      </View>
                    ) : null}
                    {!adaptiveProfile.lowEnergyMode ? (
                      <View style={styles.moduleMetaPill}>
                        <AppText style={styles.moduleMetaText}>
                          {deriveProgramCategoryLabel(module.category) || module.track.replace("-", " ")}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.toolFooter}>
                    <AppText style={styles.toolOpenLabel}>
                      {progressSummary.isCompleted ? "Return gently" : "Open module"}
                    </AppText>
                  </View>
                </Pressable>
                );
              })}
            </View>
            {lockedCount > 0 ? (
              <View style={styles.lockedSectionCard}>
                <AppText style={styles.lockedSectionTitle}>
                  {lockedCount} more {lockedCount === 1 ? "program" : "programs"} in this section
                </AppText>
                <AppText style={styles.lockedSectionBody}>
                  Premium includes a deeper library of calming programs and low-energy support, while keeping the flow short and interruption-safe.
                </AppText>
                <AppButton
                  label="Explore Premium"
                  onPress={() => router.push("/premium?source=programs")}
                  variant="secondary"
                />
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
  contentLowEnergy: {
    gap: 24,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 10,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 23,
  },
  premiumLibraryCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 18,
    gap: 12,
  },
  premiumLibraryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
    textTransform: "uppercase",
  },
  premiumLibraryTitle: {
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "700",
    color: "#1f2937",
  },
  premiumLibraryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioLibraryCard: {
    backgroundColor: "#f7faf9",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 18,
    gap: 12,
  },
  audioLibraryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  audioLibraryTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  audioLibraryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  toolkitCard: {
    backgroundColor: "#f6f8fb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dde4ef",
    padding: 18,
    gap: 12,
  },
  toolkitLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#49607a",
    textTransform: "uppercase",
  },
  toolkitTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolkitBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  toolkitChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d7e2ef",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  toolkitChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#49607a",
  },
  toolkitList: {
    gap: 10,
  },
  toolkitRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  toolkitRowText: {
    flex: 1,
    gap: 4,
  },
  toolkitRowTitle: {
    color: "#1f2937",
    fontWeight: "700",
    lineHeight: 22,
  },
  toolkitRowBody: {
    color: "#4b5563",
    lineHeight: 20,
  },
  toolkitMetaWrap: {
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde4ef",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toolkitMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#49607a",
  },
  toolkitActions: {
    gap: 10,
  },
  toolkitLockedBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  recoveryRhythmCard: {
    backgroundColor: "#f8faf6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dfe7d7",
    padding: 18,
    gap: 12,
  },
  recoveryRhythmCardHeavy: {
    backgroundColor: "#f4f8f0",
  },
  recoveryRhythmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d7a5b",
    textTransform: "uppercase",
  },
  recoveryRhythmTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  recoveryRhythmBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  recoveryRhythmList: {
    gap: 8,
  },
  recoveryRhythmRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  recoveryRhythmBullet: {
    color: "#6d7a5b",
    fontWeight: "700",
  },
  recoveryRhythmText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  recoveryRhythmSuggestionList: {
    gap: 8,
  },
  recoveryRhythmSuggestionPill: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dde5d4",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recoveryRhythmSuggestionText: {
    color: "#475244",
    lineHeight: 19,
  },
  communicationCard: {
    backgroundColor: "#f9f8fb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e4dff0",
    padding: 18,
    gap: 12,
  },
  communicationCardHeavy: {
    backgroundColor: "#f6f4f9",
  },
  communicationLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#72628a",
    textTransform: "uppercase",
  },
  communicationTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  communicationBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  communicationContinuity: {
    color: "#6b6574",
    lineHeight: 20,
  },
  communicationPhraseList: {
    gap: 8,
  },
  communicationPhrasePill: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2ddee",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  communicationPhraseText: {
    color: "#4f4a59",
    lineHeight: 19,
  },
  guidanceCard: {
    backgroundColor: "#f9faf8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dfe6db",
    padding: 18,
    gap: 12,
  },
  guidanceCardHeavy: {
    backgroundColor: "#f6f8f4",
  },
  guidanceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6f7b61",
    textTransform: "uppercase",
  },
  guidanceTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  guidanceBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  guidanceContinuity: {
    color: "#6a7162",
    lineHeight: 20,
  },
  guidancePromptList: {
    gap: 8,
  },
  guidancePromptRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  guidancePromptBullet: {
    color: "#6f7b61",
    fontWeight: "700",
  },
  guidancePromptText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  difficultDayCard: {
    backgroundColor: "#fff7f3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#edd8cd",
    padding: 18,
    gap: 12,
  },
  difficultDayCardHeavy: {
    backgroundColor: "#fdf4ee",
  },
  difficultDayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
    textTransform: "uppercase",
  },
  difficultDayTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  difficultDayBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  difficultDayContinuity: {
    color: "#70635d",
    lineHeight: 20,
  },
  difficultDayLineList: {
    gap: 8,
  },
  difficultDayLineRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  difficultDayLineBullet: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  difficultDayLineText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  cognitiveSupportCard: {
    backgroundColor: "#f8fbfc",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d9e7ea",
    padding: 18,
    gap: 12,
  },
  cognitiveSupportCardHeavy: {
    backgroundColor: "#f5f8fa",
  },
  cognitiveSupportLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5a7280",
    textTransform: "uppercase",
  },
  cognitiveSupportTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  cognitiveSupportBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  cognitiveSupportContinuity: {
    color: "#667785",
    lineHeight: 20,
  },
  sleepSupportCard: {
    backgroundColor: "#fbf9ff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e6dff0",
    padding: 18,
    gap: 12,
  },
  sleepSupportCardEvening: {
    backgroundColor: "#213047",
    borderColor: "#36445a",
  },
  sleepSupportLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#75608c",
    textTransform: "uppercase",
  },
  sleepEveningLabel: {
    color: "#afbed3",
  },
  sleepSupportTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  sleepSupportBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  sleepPromptList: {
    gap: 8,
  },
  sleepPromptRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  sleepPromptBullet: {
    color: "#8b6a4f",
    fontWeight: "700",
  },
  sleepPromptText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  sleepEveningText: {
    color: "#f5f7fb",
  },
  sleepEveningBody: {
    color: "#d7dfeb",
  },
  sleepMetaWrapEvening: {
    backgroundColor: "#2a3a52",
    borderColor: "#41516a",
  },
  sleepEveningMetaText: {
    color: "#d7dfeb",
  },
  categoryChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f0dfd3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  previewList: {
    gap: 8,
  },
  previewRow: {
    flexDirection: "row",
    gap: 8,
  },
  previewBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  previewText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 20,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  suggestionCard: {
    backgroundColor: "#f3f8f6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7e7df",
    padding: 18,
    gap: 12,
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2f6b55",
    textTransform: "uppercase",
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  suggestionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  premiumPromptCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 18,
    gap: 12,
  },
  navButtons: {
    gap: 10,
  },
  resumeCopy: {
    color: "#4b5563",
    lineHeight: 21,
  },
  resumeNote: {
    color: "#6b7280",
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerCard: {
    backgroundColor: "#eef7f3",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d6e9dd",
    padding: 18,
    gap: 12,
  },
  timerKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  timerValue: {
    fontSize: 34,
    lineHeight: 46,
    fontWeight: "800",
    color: "#166534",
  },
  timerBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  completionCard: {
    backgroundColor: "#f7fbf7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7ead7",
    padding: 16,
    gap: 6,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
  },
  completionBody: {
    color: "#3f5f46",
    lineHeight: 21,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  detailHeaderText: {
    flex: 1,
    gap: 4,
  },
  detailSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  detailTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  whenToUse: {
    color: "#4b5563",
    lineHeight: 22,
    fontWeight: "600",
  },
  detailBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioSessionCard: {
    backgroundColor: "#f6fbf9",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 16,
    gap: 12,
  },
  audioLockedCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eadfd6",
    padding: 16,
    gap: 12,
  },
  audioSessionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#456b61",
    textTransform: "uppercase",
  },
  audioSessionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: "#1f2937",
  },
  audioSessionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioSupportNote: {
    color: "#5a6c66",
    lineHeight: 21,
  },
  audioMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  audioMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dce8e3",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  audioMetaText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#456b61",
    fontWeight: "700",
  },
  audioNowPlayingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dce8e3",
    padding: 14,
    gap: 8,
  },
  audioPhaseLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#456b61",
  },
  audioTimerValue: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: "800",
    color: "#1f2937",
  },
  audioPromptText: {
    color: "#4b5563",
    lineHeight: 22,
  },
  audioBreathNote: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 13,
  },
  audioControls: {
    gap: 10,
  },
  contextCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 12,
  },
  lowEnergySupportCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  lowEnergySupportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  lowEnergySupportBody: {
    color: "#6b7280",
    lineHeight: 20,
  },
  contextToggle: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  contextToggleText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  contextBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  moduleProgressCard: {
    gap: 8,
  },
  moduleProgressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  moduleProgressNote: {
    color: "#6b7280",
    lineHeight: 20,
  },
  moduleStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ecd9ca",
    backgroundColor: "#ffffff",
    padding: 10,
  },
  moduleStepRowCurrent: {
    borderColor: "#d7c2af",
    backgroundColor: "#fff9f4",
  },
  moduleStepRowPressed: {
    opacity: 0.86,
  },
  moduleStepBadge: {
    borderRadius: 999,
    backgroundColor: "#fff4ec",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moduleStepBadgeCompleted: {
    backgroundColor: "#e9f6ee",
  },
  moduleStepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c25d10",
  },
  moduleStepBadgeTextCompleted: {
    color: "#166534",
  },
  moduleStepTextWrap: {
    flex: 1,
    gap: 2,
  },
  moduleStepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  moduleStepBody: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  contextNote: {
    gap: 4,
  },
  contextNoteTitle: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  contextNoteBody: {
    color: "#6b7280",
    lineHeight: 20,
    fontSize: 14,
  },
  stepsList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#fff4ec",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c25d10",
  },
  stepText: {
    flex: 1,
    color: "#374151",
    lineHeight: 21,
  },
  detailActions: {
    gap: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    color: "#6b7280",
    lineHeight: 20,
  },
  sectionList: {
    gap: 12,
  },
  toolCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
    gap: 10,
  },
  toolCardPressed: {
    opacity: 0.84,
  },
  toolTopRow: {
    gap: 4,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  toolDuration: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
  },
  toolWhenToUse: {
    color: "#4b5563",
    lineHeight: 21,
    fontWeight: "600",
  },
  toolDescription: {
    color: "#6b7280",
    lineHeight: 22,
  },
  moduleMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moduleMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moduleMetaText: {
    color: "#8b6a4f",
    fontSize: 12,
    fontWeight: "700",
  },
  toolFooter: {
    paddingTop: 4,
  },
  toolOpenLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
  },
  lockedSectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eadfd6",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 10,
  },
  lockedSectionTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1f2937",
  },
  lockedSectionBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
});
