import { useMemo } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory } from "../../features/checkins/hooks";
import { useInsightsDashboard, usePatternSummary } from "../../features/insights/hooks";
import BestWorstDayInsightCard from "./BestWorstDayInsightCard";
import { getErrorMessage } from "../../lib/errors";
import CorrelationCard from "./CorrelationCard";
import HydrationEnergyInsightCard from "./HydrationEnergyInsightCard";
import SleepFatigueInsightCard from "./SleepFatigueInsightCard";
import SleepMoodInsightCard from "./SleepMoodInsightCard";
import StressFatigueInsightCard from "./StressFatigueInsightCard";
import TrendSummaryCard from "./TrendSummaryCard";
import WeeklyProgressOverviewCard from "./WeeklyProgressOverviewCard";
import WeeklySummaryCard from "./WeeklySummaryCard";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import ErrorState from "../ui/ErrorState";
import LoadingState from "../ui/LoadingState";

function getCutoffDate(days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (days - 1));
  return cutoff.toISOString().slice(0, 10);
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const historyQuery = useCheckInHistory(user?.id, 30);

  const last7Entries = useMemo(() => {
    const entries = historyQuery.data ?? [];
    const cutoff = getCutoffDate(7);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyQuery.data]);

  const patternSummaryQuery = usePatternSummary(last7Entries, 7);
  const dashboard = useInsightsDashboard(historyQuery.data ?? [], patternSummaryQuery.data);

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view insights." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Loading insights..." />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(historyQuery.error)}
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  return (
    <AppScreen
      title="Insights"
      subtitle="See weekly patterns, trends, and a few simple relationships in your recent check-ins."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.navCard}>
          <AppText style={styles.sectionTitle}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Track" onPress={() => router.push("/track")} variant="secondary" />
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
          </View>
        </View>

        {!dashboard.hasEnoughData ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Insights are getting ready</AppText>
            <AppText style={styles.emptyBody}>Track a few days to unlock insights</AppText>
            <AppButton label="Log today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <WeeklyProgressOverviewCard overview={dashboard.weeklyProgressOverview} />
            <WeeklySummaryCard summary={dashboard.weeklySummary} />
            {dashboard.sleepFatigueInsight.show ? (
              <SleepFatigueInsightCard insight={dashboard.sleepFatigueInsight} />
            ) : null}
            {dashboard.stressFatigueInsight.show ? (
              <StressFatigueInsightCard insight={dashboard.stressFatigueInsight} />
            ) : null}
            {dashboard.sleepMoodInsight.show ? (
              <SleepMoodInsightCard insight={dashboard.sleepMoodInsight} />
            ) : null}
            {dashboard.hydrationEnergyInsight.show ? (
              <HydrationEnergyInsightCard insight={dashboard.hydrationEnergyInsight} />
            ) : null}
            {dashboard.bestWorstDayInsight.show ? (
              <BestWorstDayInsightCard insight={dashboard.bestWorstDayInsight} />
            ) : null}

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Trend summaries</AppText>
              {dashboard.trends.map((trend) => (
                <TrendSummaryCard key={trend.key} trend={trend} />
              ))}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Correlations</AppText>
              <AppText style={styles.sectionBody}>
                These cards compare the days you have logged and highlight simple relationships in your recent check-ins.
              </AppText>
              {dashboard.correlations.map((correlation) => (
                <CorrelationCard key={correlation.key} correlation={correlation} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  navButtons: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
});
