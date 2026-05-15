import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { buildAdaptiveProfile } from "../../../../features/adaptive/logic";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../../../features/checkins/hooks";
import { getCheckInsInLastDays } from "../../../../features/checkins/consistency";
import { useGrowthState } from "../../../../features/growth/hooks";
import { buildLifecycleProfile } from "../../../../features/lifecycle/logic";
import {
  PROGRAM_MODULES,
  PROGRAM_SECTIONS,
  getProgramModuleById,
  getProgramToolById,
  getProgramToolsByModuleId,
} from "../../../../features/programs/catalog";
import { useProgramProgress } from "../../../../features/programs/hooks";
import type { ProgramModule, ProgramTool } from "../../../../features/programs/types";
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
  const programProgress = useProgramProgress();
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [completedToolId, setCompletedToolId] = useState<string | null>(null);

  const selectedTool = useMemo(
    () => getProgramToolById(selectedToolId),
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
    () => buildAdaptiveProfile(historyQuery.data ?? [], Math.min(7, historyQuery.data?.length ?? 0)),
    [historyQuery.data],
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
    if (!selectedToolId) {
      return;
    }

    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedToolId]);

  const groupedTools = useMemo(
    () =>
      PROGRAM_SECTIONS.map((section) => ({
        section,
        items: PROGRAM_MODULES.filter((module) => module.section === section).sort((left, right) => {
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
      })),
    [programProgress.progress.activeToolId, programProgress.progress.lastOpenedToolId, suggestedModule?.id],
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

  const completeTool = (tool: ProgramTool) => {
    setCompletedToolId(tool.id);
    void programProgress.markCompleted(tool.id);
    if (activeTimerId === tool.id) {
      setActiveTimerId(null);
      setSecondsRemaining(null);
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

  const getModuleProgressSummary = (module: ProgramModule) => {
    const tools = getProgramToolsByModuleId(module.id);
    const completedCount = tools.filter((tool) => programProgress.progress.completedToolIds.includes(tool.id)).length;
    return {
      completedCount,
      totalCount: tools.length,
      isCompleted: completedCount === tools.length && tools.length > 0,
    };
  };

  return (
    <AppScreen
      title="Support tools"
      subtitle="Small exercises for hard moments, low energy days, and daily reset."
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>A calm library for harder days</AppText>
          <AppText style={styles.heroBody}>
            {preventMotivationalPressure(`Pick one small tool that matches the moment. ${recoveryPath.body}`)}
          </AppText>
        </View>

        {adaptiveProfile.lowEnergyMode ? (
          <View style={styles.suggestionCard}>
            <AppText style={styles.suggestionLabel}>Low-energy support</AppText>
            <AppText style={styles.suggestionTitle}>{adaptiveProfile.simplificationTitle}</AppText>
            <AppText style={styles.suggestionBody}>
              {preventMotivationalPressure(`${adaptiveProfile.simplificationBody} ${recoverySupport}`)}
            </AppText>
          </View>
        ) : null}

        {suggestedTool && suggestedModule ? (
          <View style={styles.suggestionCard}>
            <AppText style={styles.suggestionLabel}>A good fit today</AppText>
            <AppText style={styles.suggestionTitle}>{suggestedTool.title}</AppText>
            <AppText style={styles.suggestionBody}>
              {preventMotivationalPressure(
                `${suggestedModule.whyItHelps} ${
                  guidedSupportPrograms.primaryModuleIds.includes(suggestedModule.id)
                    ? "This path matches the current moment gently."
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
          <View style={styles.navButtons}>
            <AppButton label="Open Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
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
            <AppText style={styles.completionTitle}>You took one small step today.</AppText>
            <AppText style={styles.completionBody}>
              {preventCompletionPressure("Even a short reset can change the feel of a moment.")}
            </AppText>
          </View>
        ) : null}

        {selectedTool ? (
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
                  <AppText style={styles.metaPillText}>{selectedModule.title}</AppText>
                </View>
              ) : null}
            </View>

            <AppText style={styles.whenToUse}>{selectedTool.whenToUse}</AppText>
            <AppText style={styles.detailBody}>
              {preventMotivationalPressure(`${selectedTool.description} ${groundingSupport}`)}
            </AppText>

            {selectedModule ? (
              <View style={styles.contextCard}>
                <AppText style={styles.contextTitle}>Why this may help</AppText>
                <AppText style={styles.contextBody}>
                  {preventMotivationalPressure(`${selectedModule.whyItHelps} ${recoverySupport}`)}
                </AppText>
                <View style={styles.moduleProgressCard}>
                  <AppText style={styles.moduleProgressTitle}>
                    {programIntensity === "very-gentle" ? "Move through this slowly" : "Move through this gently"}
                  </AppText>
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
                            {isCompleted ? "Used" : "Next"}
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

            <View style={styles.stepsList}>
              {selectedTool.steps.slice(0, selectedToolMode?.visibleStepCount ?? selectedTool.steps.length).map((step, index) => (
                <View key={`${selectedTool.id}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
                  </View>
                  <AppText style={styles.stepText}>{preventMotivationalPressure(step)}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.detailActions}>
              <AppButton
                label={
                  isSelectedToolCompleted
                    ? "Already used"
                    : selectedTool.durationSeconds
                      ? selectedToolMode?.shortenCtas
                        ? "Start gently"
                        : "Start"
                      : selectedToolMode?.shortenCtas
                        ? "Done for now"
                        : "Mark complete"
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
                label={isSelectedToolCompleted ? "Already used" : selectedToolMode?.shortenCtas ? "Pause here" : "Complete"}
                onPress={() => (isSelectedToolCompleted ? null : completeTool(selectedTool))}
                variant="secondary"
                disabled={isSelectedToolCompleted}
              />
            </View>
          </View>
        ) : null}

        {groupedTools.map(({ section, items }) => (
          <View key={section} style={styles.section}>
            <AppText style={styles.sectionTitle}>{section}</AppText>
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
              <View style={styles.moduleMetaPill}>
                <AppText style={styles.moduleMetaText}>{module.track.replace("-", " ")}</AppText>
              </View>
            </View>
                  <View style={styles.toolFooter}>
                    <AppText style={styles.toolOpenLabel}>
                      {progressSummary.isCompleted ? "Revisit gently" : "Open module"}
                    </AppText>
                  </View>
                </Pressable>
                );
              })}
            </View>
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
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
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
  suggestionCard: {
    backgroundColor: "#f3f8f6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7e7df",
    padding: 18,
    gap: 10,
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
    lineHeight: 21,
  },
  navButtons: {
    gap: 10,
  },
  resumeCopy: {
    color: "#4b5563",
    lineHeight: 21,
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
    gap: 10,
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
    gap: 14,
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
  contextCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 10,
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
    gap: 12,
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
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
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
    gap: 8,
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
    lineHeight: 21,
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
});
