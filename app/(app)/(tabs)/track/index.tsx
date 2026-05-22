import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import PatternSummaryCard from "../../../../components/insights/PatternSummaryCard";
import CheckInDetailCard from "../../../../components/track/CheckInDetailCard";
import CheckInHistoryList from "../../../../components/track/CheckInHistoryList";
import AppButton from "../../../../components/ui/AppButton";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";
import { useCoachPlan } from "../../../../features/coach-plans/hooks";
import { getCheckInsInLastDays, getCurrentCheckInStreak } from "../../../../features/checkins/consistency";
import { deriveGentleContinuityFeedback } from "../../../../features/checkins/continuity-feedback";
import { useCheckInHistory, useSaveDailyCheckIn } from "../../../../features/checkins/hooks";
import type { DailyCheckIn, DailyCheckInInput } from "../../../../features/checkins/types";
import { usePatternSummary } from "../../../../features/insights/hooks";
import { useLowEnergyMode } from "../../../../features/low-energy-mode/hooks";
import { buildTrackClaritySnapshot, LIFE_CONTEXT_TAGS } from "../../../../features/track/clarity";
import { getErrorMessage } from "../../../../lib/errors";

const QUERY_LIMIT = 30;
const VISIBLE_HISTORY_LIMIT = 12;
type TrackFilter = "all" | "fatigue" | "mood" | "stress" | "sleep";
const FILTERS: TrackFilter[] = ["all", "fatigue", "mood", "stress", "sleep"];

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);
  if (!validValues.length) {
    return null;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function getTrackSummary(entries: Array<{ fatigue: number | null; mood: number | null }>) {
  const last7 = entries.slice(0, 7);
  const prior7 = entries.slice(7, 14);

  const averageFatigueLast7 = average(last7.map((entry) => entry.fatigue));
  const averageFatiguePrior7 = average(prior7.map((entry) => entry.fatigue));
  const averageMoodLast7 = average(last7.map((entry) => entry.mood));

  if (averageFatigueLast7 !== null && averageFatiguePrior7 !== null) {
    const difference = averageFatigueLast7 - averageFatiguePrior7;

    if (difference <= -0.35) {
      return "Last 7 days: fatigue has looked a little lighter.";
    }

    if (difference >= 0.35) {
      return "Last 7 days: fatigue has looked a little heavier.";
    }
  }

  if (averageMoodLast7 !== null && averageMoodLast7 >= 4) {
    return "Last 7 days: mood has looked a little steadier.";
  }

  return "Last 7 days: your check-ins are building a clearer picture.";
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

export default function TrackScreen() {
  const { user } = useAuth();
  const lowEnergyMode = useLowEnergyMode();
  const historyQuery = useCheckInHistory(user?.id, QUERY_LIMIT);
  const saveCheckIn = useSaveDailyCheckIn();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TrackFilter>("all");
  const [simplifiedView, setSimplifiedView] = useState(lowEnergyMode.enabled);
  const [showHistory, setShowHistory] = useState(!lowEnergyMode.enabled);
  const [showMonthlyOverview, setShowMonthlyOverview] = useState(false);

  useEffect(() => {
    if (!historyQuery.data || historyQuery.data.length === 0) {
      setSelectedDate(null);
    }
  }, [historyQuery.data]);

  const filteredItems = useMemo(() => {
    const items = historyQuery.data ?? [];

    if (activeFilter === "all") {
      return items;
    }

    if (activeFilter === "sleep") {
      return items.filter((item) => item.sleep_hours !== null);
    }

    return items.filter((item) => item[activeFilter] !== null);
  }, [activeFilter, historyQuery.data]);

  const visibleItems = useMemo(() => filteredItems.slice(0, VISIBLE_HISTORY_LIMIT), [filteredItems]);
  const totalCheckIns = historyQuery.data?.length ?? 0;
  const overviewEntries = useMemo(
    () =>
      (historyQuery.data ?? []).map((entry) => ({
        date: entry.date,
        hasReflection: typeof entry.notes === "string" && entry.notes.trim().length > 0,
      })),
    [historyQuery.data],
  );
  const weeklyCheckIns = useMemo(
    () => getCheckInsInLastDays(overviewEntries, new Date().toISOString().slice(0, 10), 7),
    [overviewEntries],
  );
  const streak = useMemo(
    () => getCurrentCheckInStreak(overviewEntries, new Date().toISOString().slice(0, 10)),
    [overviewEntries],
  );
  const continuityFeedback = useMemo(
    () => deriveGentleContinuityFeedback({ totalCheckIns, weeklyCheckIns, streak }),
    [streak, totalCheckIns, weeklyCheckIns],
  );

  const patternSummaryQuery = usePatternSummary(visibleItems, 7);
  const topSummary = useMemo(() => getTrackSummary(historyQuery.data ?? []), [historyQuery.data]);
  const claritySnapshot = useMemo(
    () => buildTrackClaritySnapshot(historyQuery.data ?? []),
    [historyQuery.data],
  );

  useEffect(() => {
    if (lowEnergyMode.enabled) {
      setSimplifiedView(true);
      setShowHistory(false);
      return;
    }

    setSimplifiedView(false);
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

  if (!user?.id) {
    return <ErrorState message="Your check-in history is available once you’re signed in." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Bringing your history into view..." />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(historyQuery.error)}
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  if (!visibleItems.length) {
    if ((historyQuery.data?.length ?? 0) > 0) {
      return (
        <AppScreen
          eyebrow="History and patterns"
          title="Track"
          subtitle="Look back gently at recent check-ins and what has been shifting."
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <AppText style={styles.heroTitle}>Your check-in history</AppText>
              <AppText style={styles.heroSubtitle}>
                Look back gently, notice what changes, and keep building a clearer picture over time.
              </AppText>
              <AppText style={styles.heroCount}>{getDateCountLabel(historyQuery.data?.length ?? 0)}</AppText>
              <AppText style={styles.heroSubtitle}>{continuityFeedback.compact}</AppText>
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((filter) => {
                const selected = filter === activeFilter;
                const label =
                  filter === "all"
                    ? "All"
                    : filter === "sleep"
                      ? "Sleep"
                      : filter.charAt(0).toUpperCase() + filter.slice(1);

                return (
                  <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipActive,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <AppText style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <EmptyState
              title="Nothing is showing for this filter just yet"
              message="Another filter may fit better, or Today may be a clearer starting point."
              action={<AppButton label="Go to Today" onPress={() => router.push("/today")} />}
            />
          </ScrollView>
        </AppScreen>
      );
    }

    return (
      <EmptyState
        title="Your check-ins will appear here when you’re ready"
        message="When you want to begin, one check-in is enough."
        action={<AppButton label="Go to Today" onPress={() => router.push("/today")} />}
      />
    );
  }

  return (
    <AppScreen
      eyebrow="History and patterns"
      title="Track"
      subtitle="Look back gently at recent check-ins and what has been shifting."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your check-in history</AppText>
          <AppText style={styles.heroSubtitle}>
            Look back gently, notice what changes, and keep building a clearer picture over time.
          </AppText>
          <AppText style={styles.heroCount}>{getDateCountLabel(historyQuery.data?.length ?? 0)}</AppText>
          <AppText style={styles.heroSubtitle}>{continuityFeedback.compact}</AppText>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.viewModeRow}>
            <View style={styles.viewModeCopy}>
              <AppText style={styles.sectionTitle}>Viewing mode</AppText>
              <AppText style={styles.sectionHelper}>
                {simplifiedView
                  ? "Summaries come first, with deeper details tucked behind."
                  : "You can move between summaries and the full history here."}
              </AppText>
            </View>
            <Pressable
              onPress={() => setSimplifiedView((current) => !current)}
              style={({ pressed }) => [
                styles.viewModeToggle,
                simplifiedView && styles.viewModeToggleActive,
                pressed && styles.filterChipPressed,
              ]}
            >
              <AppText style={[styles.viewModeToggleText, simplifiedView && styles.viewModeToggleTextActive]}>
                {simplifiedView ? "Simplified" : "Full"}
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const selected = filter === activeFilter;
            const label =
              filter === "all"
                ? "All"
                : filter === "sleep"
                  ? "Sleep"
                  : filter.charAt(0).toUpperCase() + filter.slice(1);

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
              >
                <AppText style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Quick links</AppText>
          <AppText style={styles.sectionHelper}>Move between spaces without losing your place here.</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Insights" onPress={() => router.push("/insights")} variant="secondary" />
          </View>
        </View>

        <PatternSummaryCard
          title="Recent patterns"
          summary={
            patternSummaryQuery.data?.insight ??
            "A little more history can help patterns feel clearer here."
          }
        />

        <View style={styles.summaryCard}>
          <AppText style={styles.summaryKicker}>Quick read</AppText>
          <AppText style={styles.summaryText}>{topSummary}</AppText>
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>What changed recently?</AppText>
          <AppText style={styles.sectionHelper}>
            A simple comparison of the last 7 days and the week before.
          </AppText>
          {claritySnapshot.recentChanges.length > 0 ? (
            <View style={styles.insightList}>
              {claritySnapshot.recentChanges.map((item) => (
                <View key={item} style={styles.insightRow}>
                  <AppText style={styles.insightBullet}>•</AppText>
                  <AppText style={styles.insightText}>{item}</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText style={styles.sectionHelper}>Patterns become clearer with a little more time.</AppText>
          )}
        </View>

        {claritySnapshot.fluctuationNote ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryKicker}>A note on fluctuation</AppText>
            <AppText style={styles.summaryBody}>{claritySnapshot.fluctuationNote}</AppText>
          </View>
        ) : null}

        {claritySnapshot.weeklySummary ? (
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

        {claritySnapshot.monthlySummary ? (
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

        {claritySnapshot.correlations.length > 0 ? (
          <View style={styles.sectionCard}>
            <AppText style={styles.sectionTitle}>Things that may be connected</AppText>
            <AppText style={styles.sectionHelper}>
              These are simple relationships from recent days, not fixed rules.
            </AppText>
            <View style={styles.insightList}>
              {claritySnapshot.correlations.slice(0, simplifiedView ? 2 : 3).map((item) => (
                <View key={item} style={styles.insightRow}>
                  <AppText style={styles.insightBullet}>•</AppText>
                  <AppText style={styles.insightText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {claritySnapshot.whatSeemsToHelp.length > 0 ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryKicker}>What seems to help?</AppText>
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

        <View style={styles.section}>
          <Pressable
            onPress={() => setShowHistory((current) => !current)}
            style={({ pressed }) => [styles.expandRow, pressed && styles.filterChipPressed]}
          >
            <View style={styles.expandCopy}>
              <AppText style={styles.sectionTitle}>Recent days</AppText>
              <AppText style={styles.sectionHelper}>
                Tap any day to open the full details.
              </AppText>
            </View>
            <AppText style={styles.expandLabel}>
              {showHistory ? "Hide" : simplifiedView ? "Show" : "Open"}
            </AppText>
          </Pressable>
          {showHistory ? (
            <CheckInHistoryList
              items={visibleItems}
              selectedDate={selectedDate}
              activeFilter={activeFilter}
              onSelectDate={(date) => setSelectedDate((current) => (current === date ? null : date))}
            />
          ) : null}
        </View>

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
