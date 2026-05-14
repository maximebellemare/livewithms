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
import { useCheckInHistory } from "../../../../features/checkins/hooks";
import { usePatternSummary } from "../../../../features/insights/hooks";
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
      return "Last 7 days: fatigue trending down";
    }

    if (difference >= 0.35) {
      return "Last 7 days: fatigue trending up";
    }
  }

  if (averageMoodLast7 !== null && averageMoodLast7 >= 4) {
    return "Last 7 days: mood has looked steadier";
  }

  return "Last 7 days: your check-ins are building a clearer pattern";
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

export default function TrackScreen() {
  const { user } = useAuth();
  const historyQuery = useCheckInHistory(user?.id, QUERY_LIMIT);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TrackFilter>("all");

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

  const patternSummaryQuery = usePatternSummary(visibleItems, 7);
  const topSummary = useMemo(() => getTrackSummary(historyQuery.data ?? []), [historyQuery.data]);

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

  const linkedTomorrowDate = selectedItem ? getNextDateString(selectedItem.date) : undefined;
  const linkedTomorrowPlanQuery = useCoachPlan(user?.id, linkedTomorrowDate);

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view your check-in history." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Loading history..." />;
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
          title="Track"
          subtitle="Review symptom tracking, habits, and daily check-ins over time."
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <AppText style={styles.heroTitle}>Your check-in history</AppText>
              <AppText style={styles.heroSubtitle}>
                Look back gently, notice what changes, and keep building a clearer picture over time.
              </AppText>
              <AppText style={styles.heroCount}>{getDateCountLabel(historyQuery.data?.length ?? 0)}</AppText>
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
              title="No matching check-ins"
              message="Try another filter or head back to Today to keep building your history."
              action={<AppButton label="Go to Today" onPress={() => router.push("/today")} />}
            />
          </ScrollView>
        </AppScreen>
      );
    }

    return (
      <EmptyState
        title="No check-ins yet"
        message="Start with today's check-in to build your history."
        action={<AppButton label="Go to Today" onPress={() => router.push("/today")} />}
      />
    );
  }

  return (
    <AppScreen
      title="Track"
      subtitle="Review symptom tracking, habits, and daily check-ins over time."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your check-in history</AppText>
          <AppText style={styles.heroSubtitle}>
            Look back gently, notice what changes, and keep building a clearer picture over time.
          </AppText>
          <AppText style={styles.heroCount}>{getDateCountLabel(historyQuery.data?.length ?? 0)}</AppText>
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
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Go to Insights" onPress={() => router.push("/insights")} variant="secondary" />
          </View>
        </View>

        <PatternSummaryCard
          title="Recent patterns"
          summary={
            patternSummaryQuery.data?.insight ??
            "Keep logging mood, fatigue, stress, sleep, and hydration to reveal clearer patterns."
          }
        />

        <View style={styles.summaryCard}>
          <AppText style={styles.summaryKicker}>Quick read</AppText>
          <AppText style={styles.summaryText}>{topSummary}</AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Recent days</AppText>
          <AppText style={styles.sectionHelper}>
            Tap any day to open the full details.
          </AppText>
          <CheckInHistoryList
            items={visibleItems}
            selectedDate={selectedDate}
            activeFilter={activeFilter}
            onSelectDate={(date) => setSelectedDate((current) => (current === date ? null : date))}
          />
        </View>

        {selectedItem ? (
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
  summaryCard: {
    backgroundColor: "#fff7f2",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d3bd",
    padding: 18,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
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
  navButtons: {
    gap: 10,
  },
});
