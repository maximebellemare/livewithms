import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
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
import { useCheckInHistory } from "../../../../features/checkins/hooks";
import { usePatternSummary } from "../../../../features/insights/hooks";
import { getErrorMessage } from "../../../../lib/errors";

const QUERY_LIMIT = 30;
const VISIBLE_HISTORY_LIMIT = 12;

export default function TrackScreen() {
  const { user } = useAuth();
  const historyQuery = useCheckInHistory(user?.id, QUERY_LIMIT);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!historyQuery.data || historyQuery.data.length === 0) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate((current) => current ?? historyQuery.data[0].date);
  }, [historyQuery.data]);

  const visibleItems = useMemo(
    () => historyQuery.data?.slice(0, VISIBLE_HISTORY_LIMIT) ?? [],
    [historyQuery.data],
  );

  const patternSummaryQuery = usePatternSummary(visibleItems, 7);

  const selectedItem = useMemo(() => {
    const selectedFromVisible =
      visibleItems.find((item) => item.date === selectedDate) ?? null;

    return selectedFromVisible ?? visibleItems[0] ?? null;
  }, [selectedDate, visibleItems]);

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
    return (
      <EmptyState
        title="No check-ins yet"
        message="Start with today's check-in to build your history."
      />
    );
  }

  return (
    <AppScreen
      title="Track"
      subtitle="Review symptom tracking, habits, and daily check-ins over time."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Quick links</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
          </View>
        </View>

        <PatternSummaryCard
          title="Recent patterns"
          summary={
            patternSummaryQuery.data?.insight ??
            "Keep logging mood, fatigue, stress, sleep, and hydration to reveal clearer patterns."
          }
        />

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Recent days</AppText>
          <CheckInHistoryList
            items={visibleItems}
            selectedDate={selectedItem?.date ?? null}
            onSelectDate={setSelectedDate}
          />
        </View>

        {selectedItem ? (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Details</AppText>
            <CheckInDetailCard item={selectedItem} />
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
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  navButtons: {
    gap: 10,
  },
});
