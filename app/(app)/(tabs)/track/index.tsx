import { startTransition, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { InteractionManager, Pressable, ScrollView, StyleSheet, View } from "react-native";
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
import { buildTrackClaritySnapshot, LIFE_CONTEXT_TAGS, type TrackClaritySnapshot } from "../../../../features/track/clarity";
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

function getPrimaryPattern(snapshot: TrackClaritySnapshot, entryCount: number) {
  const primary =
    snapshot.correlations[0] ??
    snapshot.recentChanges[0] ??
    snapshot.whatSeemsToHelp[0] ??
    snapshot.fluctuationNote;

  if (primary) {
    return primary;
  }

  if (entryCount >= 4) {
    return "Recent check-ins are ready to review in the timeline.";
  }

  return "More check-ins are needed before patterns are reliable.";
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
    setDraft(buildDraftFromCheckIn(todayEntry));
    setSaveState("idle");
  }, [todayEntry]);

  const visibleItems = useMemo(() => historyItems.slice(0, VISIBLE_HISTORY_LIMIT), [historyItems]);
  const totalCheckIns = historyItems.length;
  const claritySnapshot = useMemo(
    () => buildTrackClaritySnapshot(historyEntriesForInsights),
    [historyEntriesForInsights],
  );
  const primaryPattern = useMemo(
    () => getPrimaryPattern(claritySnapshot, totalCheckIns),
    [claritySnapshot, totalCheckIns],
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <DailyCheckInCard
            draft={draft}
            onChange={setDraft}
            saveState={saveState}
            onSave={() => void handleSaveCheckIn()}
            saveMomentTitle={todayEntry ? "Check-in updated" : "Check-in saved"}
            saveMomentBody="Track updated ✓"
            saveFooterText="Trends update from this check-in."
            onViewInsights={() => router.push("/track")}
            supportMode={lowEnergyMode.enabled ? "low-energy" : "default"}
            compressionMode={lowEnergyMode.enabled ? "reduced" : "standard"}
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
          <AppText style={styles.heroTitle}>Trends and insights</AppText>
          {historyLoading || !deferredTrackInsightsReady ? (
            <View style={styles.placeholderStack}>
              <CalmSkeleton height={16} width="88%" />
              <CalmSkeleton height={16} width="74%" />
              <CalmSkeleton height={14} width="40%" />
            </View>
          ) : (
            <>
              <AppText style={styles.heroSubtitle}>{primaryPattern}</AppText>
              <AppText style={styles.heroCount}>{getDateCountLabel(totalCheckIns)}</AppText>
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Recent changes</AppText>
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
            <AppText style={styles.sectionHelper}>Not enough comparison data yet.</AppText>
          )}
        </View>

        {claritySnapshot.fluctuationNote && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryKicker}>Trend stability</AppText>
            <AppText style={styles.summaryBody}>{claritySnapshot.fluctuationNote}</AppText>
          </View>
        ) : null}

        {claritySnapshot.weeklySummary && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>{claritySnapshot.weeklySummary.title}</AppText>
            <AppText style={styles.sectionHelper}>{claritySnapshot.weeklySummary.body}</AppText>
            <View style={styles.metricList}>
              {claritySnapshot.weeklySummary.metrics.map((metric) => (
                <View key={metric} style={styles.metricPill}>
                  <AppText style={styles.metricPillText}>{metric}</AppText>
                </View>
              ))}
            </View>
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

        {claritySnapshot.correlations.length > 0 && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>Pattern connections</AppText>
            <AppText style={styles.sectionHelper}>
              Relationships found across recent check-ins.
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

        {claritySnapshot.whatSeemsToHelp.length > 0 && !historyLoading && deferredTrackInsightsReady ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryKicker}>What improved</AppText>
            <View style={styles.insightList}>
              {claritySnapshot.whatSeemsToHelp.map((item) => (
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
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1f2937",
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
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
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
    backgroundColor: "#fff7f2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d3bd",
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
