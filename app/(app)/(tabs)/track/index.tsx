import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { InteractionManager, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import CalmSkeleton from "../../../../components/ui/CalmSkeleton";
import DailyCheckInCard from "../../../../components/today/DailyCheckInCard";
import { getEmptyCheckInDraft, normalizeCheckInInput, type DailyCheckInDraft } from "../../../../components/today/checkInDraft";
import CheckInDetailCard from "../../../../components/track/CheckInDetailCard";
import CheckInHistoryList from "../../../../components/track/CheckInHistoryList";
import AppButton from "../../../../components/ui/AppButton";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";
import { useTodaysCheckIn } from "../../../../features/checkins/hooks";
import { useCoachPlan } from "../../../../features/coach-plans/hooks";
import { useCheckInHistory, useSaveDailyCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import {
  buildTrackClaritySnapshot,
  LIFE_CONTEXT_TAGS,
  type TrackClaritySnapshot,
  type TrackInsightLabel,
} from "../../../../features/track/clarity";
import { getErrorMessage } from "../../../../lib/errors";

const QUERY_LIMIT = 30;
const VISIBLE_HISTORY_LIMIT = 12;

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateCountLabel(count: number) {
  return `${count} check-in${count === 1 ? "" : "s"} logged`;
}

function getNextDateString(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + 1);

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildInputFromCheckIn(item: DailyCheckIn): DailyCheckInInput {
  return {
    fatigue: item.fatigue,
    pain: item.pain,
    brain_fog: item.brain_fog,
    mood: item.mood,
    mobility: item.mobility,
    stress: item.stress,
    sleep_hours: item.sleep_hours,
    water_glasses: item.water_glasses,
    notes: item.notes,
    mood_tags: item.mood_tags ?? [],
    symptom_tags: item.symptom_tags ?? [],
    triggers: item.triggers ?? [],
    wins: item.wins ?? [],
    spasticity: item.spasticity ?? null,
  };
}

function buildDraftFromCheckIn(item: DailyCheckIn | null): DailyCheckInDraft {
  if (!item) {
    return getEmptyCheckInDraft();
  }

  return {
    fatigue: item.fatigue,
    pain: item.pain,
    brain_fog: item.brain_fog,
    mood: item.mood,
    mobility: item.mobility,
    stress: item.stress,
    sleep_hours: item.sleep_hours == null ? "" : String(item.sleep_hours),
    water_glasses: item.water_glasses == null ? "" : String(item.water_glasses),
    notes: item.notes ?? "",
  };
}

function getDraftSnapshot(draft: DailyCheckInDraft) {
  return JSON.stringify(normalizeCheckInInput(draft));
}

function getInsightStatusColors(label: TrackInsightLabel) {
  switch (label) {
    case "Improving":
      return {
        backgroundColor: "#eef8f0",
        borderColor: "#cfe8d4",
        textColor: "#166534",
      };
    case "Needs attention":
      return {
        backgroundColor: "#fff4ec",
        borderColor: "#f3d2bf",
        textColor: "#c25d10",
      };
    case "Stable":
      return {
        backgroundColor: "#f7faf9",
        borderColor: "#dce8e3",
        textColor: "#1f6f5d",
      };
    default:
      return {
        backgroundColor: "#f8fafc",
        borderColor: "#e5e7eb",
        textColor: "#6b7280",
      };
  };
}

export default function TrackScreen() {
  const { user } = useAuth();
  const lowEnergyMode = useLowEnergyMode();
  const today = useMemo(() => getTodayDateString(), []);
  const historyQuery = useCheckInHistory(user?.id, QUERY_LIMIT);
  const todayCheckInQuery = useTodaysCheckIn(user?.id, today);
  const saveCheckIn = useSaveDailyCheckIn();
  const [draft, setDraft] = useState<DailyCheckInDraft>(getEmptyCheckInDraft());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(!lowEnergyMode.enabled);
  const [showMonthlyOverview, setShowMonthlyOverview] = useState(false);
  const [deferredTrackInsightsReady, setDeferredTrackInsightsReady] = useState(false);
  const lastSavedSnapshotRef = useRef(getDraftSnapshot(getEmptyCheckInDraft()));
  const todayEntry = todayCheckInQuery.data ?? null;
  const historyItems = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const todayCheckInLoading = todayCheckInQuery.isLoading && !todayCheckInQuery.data;
  const historyLoading = historyQuery.isLoading && !historyQuery.data;
  const historyEntriesForInsights = useMemo(
    () => (deferredTrackInsightsReady ? historyItems : []),
    [deferredTrackInsightsReady, historyItems],
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      startTransition(() => {
        setDeferredTrackInsightsReady(true);
      });
    });

    return () => {
      task.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (!historyQuery.data || historyQuery.data.length === 0) {
      setSelectedDate(null);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    const nextDraft = buildDraftFromCheckIn(todayEntry);
    const nextSnapshot = getDraftSnapshot(nextDraft);
    const matchesLastSavedSnapshot = nextSnapshot === lastSavedSnapshotRef.current;

    setDraft(nextDraft);
    lastSavedSnapshotRef.current = nextSnapshot;
    setSaveState((current) => (current === "saved" && matchesLastSavedSnapshot ? "saved" : "idle"));
  }, [todayEntry]);

  useEffect(() => {
    if (saveState === "saving") {
      return;
    }

    if (getDraftSnapshot(draft) !== lastSavedSnapshotRef.current) {
      setSaveState("idle");
    }
  }, [draft, saveState]);

  const visibleItems = useMemo(() => historyItems.slice(0, VISIBLE_HISTORY_LIMIT), [historyItems]);
  const totalCheckIns = historyItems.length;
  const claritySnapshot = useMemo(
    () => buildTrackClaritySnapshot(historyEntriesForInsights),
    [historyEntriesForInsights],
  );
  useEffect(() => {
    if (lowEnergyMode.enabled) {
      setShowHistory(false);
      return;
    }

    setShowHistory(true);
  }, [lowEnergyMode.enabled]);

  useEffect(() => {
    if (!visibleItems.length) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate((current) =>
      current && visibleItems.some((item) => item.date === current) ? current : null,
    );
  }, [visibleItems]);

  const selectedItem = useMemo(() => {
    return visibleItems.find((item) => item.date === selectedDate) ?? null;
  }, [selectedDate, visibleItems]);

  const handleToggleContextTag = async (tag: string) => {
    if (!user?.id || !selectedItem || saveCheckIn.isPending) {
      return;
    }

    const nextTriggers = selectedItem.triggers?.includes(tag)
      ? (selectedItem.triggers ?? []).filter((entry) => entry !== tag)
      : [...(selectedItem.triggers ?? []), tag];

    await saveCheckIn.mutateAsync({
      userId: user.id,
      date: selectedItem.date,
      input: {
        ...buildInputFromCheckIn(selectedItem),
        triggers: nextTriggers,
      },
    });
  };

  const linkedTomorrowDate = selectedItem ? getNextDateString(selectedItem.date) : undefined;
  const linkedTomorrowPlanQuery = useCoachPlan(user?.id, linkedTomorrowDate);

  const handleSaveCheckIn = async () => {
    if (!user?.id || saveState === "saving") {
      return;
    }

    setSaveState("saving");

    try {
      await saveCheckIn.mutateAsync({
        userId: user.id,
        date: today,
        input: normalizeCheckInInput(draft),
      });
      lastSavedSnapshotRef.current = getDraftSnapshot(draft);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  if (!user?.id) {
    return <ErrorState message="Your check-in history is available once you’re signed in." />;
  }

  return (
    <AppScreen
      title="Track"
      subtitle="Log symptoms and body signals, then review what is changing over time."
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <DailyCheckInCard
            draft={draft}
            onChange={setDraft}
            saveState={saveState}
            onSave={() => void handleSaveCheckIn()}
            saveMomentTitle={todayEntry ? "Check-in updated" : "Check-in saved"}
            saveMomentBody="Track updated ✓"
            saveFooterText="Trends update from this check-in."
            supportMode={lowEnergyMode.enabled ? "low-energy" : "default"}
            compressionMode={lowEnergyMode.enabled ? "reduced" : "standard"}
            showReflectionSection={false}
          />
          {todayCheckInLoading ? <AppText style={styles.loadingHint}>Today&apos;s check-in is loading now.</AppText> : null}
          {todayCheckInQuery.isError ? (
            <AppText style={styles.inlineWarning}>{getErrorMessage(todayCheckInQuery.error)}</AppText>
          ) : null}
        </View>

        {!historyLoading && !visibleItems.length ? (
          <EmptyState
            title="Your entries will appear here when you’re ready"
            message="Track will show recent entries and gentle trends after your first check-in."
            action={<AppButton label="Back to Today" onPress={() => router.push("/today")} />}
          />
        ) : null}

        <View style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlow} />
          <View style={styles.heroHeader}>
            <AppText style={styles.heroTitle}>At a glance</AppText>
            {!historyLoading && deferredTrackInsightsReady ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getInsightStatusColors(claritySnapshot.insightStatus.label).backgroundColor,
                    borderColor: getInsightStatusColors(claritySnapshot.insightStatus.label).borderColor,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.statusBadgeText,
                    {
                      color: getInsightStatusColors(claritySnapshot.insightStatus.label).textColor,
                    },
                  ]}
                >
                  {claritySnapshot.insightStatus.label}
                </AppText>
              </View>
            ) : null}
          </View>
          {historyLoading || !deferredTrackInsightsReady ? (
            <View style={styles.placeholderStack}>
              <CalmSkeleton height={16} width="88%" />
              <CalmSkeleton height={16} width="74%" />
              <CalmSkeleton height={14} width="40%" />
            </View>
          ) : claritySnapshot.emptyState ? (
            <>
              <AppText style={styles.heroSubtitle}>{claritySnapshot.emptyState}</AppText>
              <AppText style={styles.heroCount}>{getDateCountLabel(totalCheckIns)}</AppText>
            </>
          ) : (
            <>
              <AppText style={styles.heroSubtitle}>{claritySnapshot.insightStatus.body}</AppText>
              <AppText style={styles.heroCount}>{getDateCountLabel(totalCheckIns)}</AppText>
              <View style={styles.atGlanceGrid}>
                {claritySnapshot.atGlance.map((item) => {
                  const colors = getInsightStatusColors(item.status);
                  return (
                    <View
                      key={item.label}
                      style={[
                        styles.atGlanceCard,
                        {
                          backgroundColor: colors.backgroundColor,
                          borderColor: colors.borderColor,
                        },
                      ]}
                    >
                      <AppText style={styles.atGlanceLabel}>{item.label}</AppText>
                      <AppText style={styles.atGlanceValue}>{item.value}</AppText>
                      {item.detail ? <AppText style={styles.atGlanceDetail}>{item.detail}</AppText> : null}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Week over week</AppText>
          <AppText style={styles.sectionHelper}>
            Last 7 days compared with the week before.
          </AppText>
          {historyLoading || !deferredTrackInsightsReady ? (
            <View style={styles.placeholderStack}>
              <CalmSkeleton height={14} width="92%" />
              <CalmSkeleton height={14} width="86%" />
              <CalmSkeleton height={14} width="72%" />
            </View>
          ) : claritySnapshot.recentChanges.length > 0 ? (
            <View style={styles.insightList}>
              {claritySnapshot.recentChanges.map((item) => (
                <View key={item} style={styles.insightRow}>
                  <AppText style={styles.insightBullet}>•</AppText>
                  <AppText style={styles.insightText}>{item}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText style={styles.sectionHelper}>Track a few more days to unlock clearer week-over-week changes.</AppText>
          )}
        </View>

        {claritySnapshot.fluctuationNote && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryKicker}>Trend stability</AppText>
            <AppText style={styles.summaryBody}>{claritySnapshot.fluctuationNote}</AppText>
          </View>
        ) : null}

        {claritySnapshot.monthlySummary && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.sectionCard}>
            <Pressable
              onPress={() => setShowMonthlyOverview((current) => !current)}
              style={({ pressed }) => [styles.expandRow, pressed && styles.filterChipPressed]}
            >
              <View style={styles.expandCopy}>
                <AppText style={styles.sectionTitle}>{claritySnapshot.monthlySummary.title}</AppText>
                <AppText style={styles.sectionHelper}>{claritySnapshot.monthlySummary.body}</AppText>
              </View>
              <AppText style={styles.expandLabel}>{showMonthlyOverview ? "Hide" : "Show"}</AppText>
            </Pressable>
            {showMonthlyOverview ? (
              <View style={styles.metricList}>
                {claritySnapshot.monthlySummary.metrics.map((metric) => (
                  <View key={metric} style={styles.metricPill}>
                    <AppText style={styles.metricPillText}>{metric}</AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Possible patterns</AppText>
          <AppText style={styles.sectionHelper}>
            These are observational patterns from your recent tracking, not medical conclusions.
          </AppText>
          {historyLoading || !deferredTrackInsightsReady ? (
            <View style={styles.placeholderStack}>
              <CalmSkeleton height={68} width="100%" />
              <CalmSkeleton height={68} width="100%" />
            </View>
          ) : claritySnapshot.possiblePatterns.length > 0 ? (
            <View style={styles.patternList}>
              {claritySnapshot.possiblePatterns.map((pattern) => (
                <View key={pattern.title} style={styles.patternCard}>
                  <AppText style={styles.patternTitle}>{pattern.title}</AppText>
                  <AppText style={styles.patternBody}>{pattern.body}</AppText>
                  <AppText style={styles.patternMeta}>{pattern.basedOn}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText style={styles.sectionHelper}>
              Track a few more days to unlock personalized patterns.
            </AppText>
          )}
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>What to try next</AppText>
          <AppText style={styles.sectionHelper}>
            Gentle next steps based on the patterns that appeared together recently.
          </AppText>
          {historyLoading || !deferredTrackInsightsReady ? (
            <View style={styles.placeholderStack}>
              <CalmSkeleton height={58} width="100%" />
              <CalmSkeleton height={58} width="100%" />
            </View>
          ) : (
            <View style={styles.patternList}>
              {claritySnapshot.nextSteps.map((suggestion) => (
                <View key={suggestion.title} style={styles.patternCard}>
                  <AppText style={styles.patternTitle}>{suggestion.title}</AppText>
                  <AppText style={styles.patternBody}>{suggestion.body}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>

        {claritySnapshot.correlations.length > 0 && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>Supporting observations</AppText>
            <AppText style={styles.sectionHelper}>
              Extra pairings that appeared together in recent check-ins.
            </AppText>
            <View style={styles.insightList}>
              {claritySnapshot.correlations.slice(0, lowEnergyMode.enabled ? 2 : 3).map((item) => (
                <View key={item} style={styles.insightRow}>
                  <AppText style={styles.insightBullet}>•</AppText>
                  <AppText style={styles.insightText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {historyQuery.isError ? (
          <View style={styles.sectionCard}>
            <AppText style={styles.inlineWarning}>{getErrorMessage(historyQuery.error)}</AppText>
            <AppButton label="Try again" onPress={() => void historyQuery.refetch()} variant="secondary" />
          </View>
        ) : null}

        {historyLoading || visibleItems.length > 0 ? (
          <View style={styles.section}>
            <Pressable
              onPress={() => setShowHistory((current) => !current)}
              style={({ pressed }) => [styles.expandRow, pressed && styles.filterChipPressed]}
            >
              <View style={styles.expandCopy}>
                <AppText style={styles.sectionTitle}>Recent entries</AppText>
                <AppText style={styles.sectionHelper}>
                  Timeline of recent check-ins.
                </AppText>
              </View>
              <AppText style={styles.expandLabel}>
                {showHistory ? "Hide" : "Show"}
              </AppText>
            </Pressable>
            {showHistory && historyLoading ? (
              <View style={styles.placeholderStack}>
                <CalmSkeleton height={52} width="100%" />
                <CalmSkeleton height={52} width="100%" />
                <CalmSkeleton height={52} width="100%" />
              </View>
            ) : showHistory ? (
              <CheckInHistoryList
                items={visibleItems}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate((current) => (current === date ? null : date))}
              />
            ) : null}
          </View>
        ) : null}

        {selectedItem && showHistory ? (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Details</AppText>
            <CheckInDetailCard
              item={selectedItem}
              tomorrowPlan={linkedTomorrowPlanQuery.data ?? null}
              tomorrowPlanState={
                linkedTomorrowPlanQuery.isLoading
                  ? "loading"
                  : linkedTomorrowPlanQuery.isError
                    ? "error"
                    : "idle"
              }
              availableContextTags={LIFE_CONTEXT_TAGS}
              onToggleContextTag={(tag) => void handleToggleContextTag(tag)}
              savingContext={saveCheckIn.isPending}
              onClose={() => setSelectedDate(null)}
            />
          </View>
        ) : null}
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
  section: {
    gap: 12,
  },
  placeholderStack: {
    gap: 10,
  },
  loadingHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#8b6a4f",
  },
  inlineWarning: {
    fontSize: 14,
    lineHeight: 20,
    color: "#9f1239",
  },
  heroCard: {
    overflow: "hidden",
    backgroundColor: "#fff3e8",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1c8a7",
    padding: 20,
    gap: 10,
    shadowColor: "rgba(120, 71, 29, 0.22)",
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroGlow: {
    position: "absolute",
    top: -42,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#6b7280",
    lineHeight: 22,
  },
  heroCount: {
    color: "#c25d10",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  atGlanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  atGlanceCard: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    padding: 12,
    gap: 4,
  },
  atGlanceLabel: {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  atGlanceValue: {
    color: "#1f2937",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  atGlanceDetail: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: "#fff1e6",
    borderColor: "#e8751a",
  },
  filterChipPressed: {
    opacity: 0.82,
  },
  filterChipText: {
    color: "#8b6a4f",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: "#c25d10",
  },
  sectionCard: {
    backgroundColor: "#fffdfb",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efd7c4",
    padding: 18,
    gap: 12,
  },
  viewModeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  viewModeCopy: {
    flex: 1,
    gap: 4,
  },
  viewModeToggle: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  viewModeToggleActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff1e6",
  },
  viewModeToggleText: {
    color: "#8b6a4f",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  viewModeToggleTextActive: {
    color: "#c25d10",
  },
  summaryCard: {
    backgroundColor: "#fff7f0",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#efcbb0",
    padding: 18,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionHelper: {
    color: "#6b7280",
    lineHeight: 20,
  },
  summaryKicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  summaryText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  summaryBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  navButtons: {
    gap: 10,
  },
  insightList: {
    gap: 10,
  },
  patternList: {
    gap: 12,
  },
  patternCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    padding: 14,
    gap: 6,
  },
  patternTitle: {
    color: "#1f2937",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  patternBody: {
    color: "#4b5563",
    lineHeight: 21,
  },
  patternMeta: {
    color: "#8b6a4f",
    fontSize: 12,
    lineHeight: 17,
  },
  insightRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  insightBullet: {
    color: "#c25d10",
    fontWeight: "700",
    lineHeight: 20,
  },
  insightText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 21,
  },
  metricList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricPill: {
    borderRadius: 999,
    backgroundColor: "#fffaf6",
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  metricPillText: {
    color: "#8b6a4f",
    fontSize: 13,
    lineHeight: 18,
  },
  expandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  expandCopy: {
    flex: 1,
    gap: 4,
  },
  expandLabel: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});
