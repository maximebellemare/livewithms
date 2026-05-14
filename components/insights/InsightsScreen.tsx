import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory } from "../../features/checkins/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import { useAiInsightsSummary, useInsightsDashboard, usePatternSummary } from "../../features/insights/hooks";
import BestWorstDayInsightCard from "./BestWorstDayInsightCard";
import { getErrorMessage } from "../../lib/errors";
import CorrelationCard from "./CorrelationCard";
import TrendSummaryCard from "./TrendSummaryCard";
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
  const [range, setRange] = useState<7 | 30>(7);
  const historyQuery = useCheckInHistory(user?.id, 30);
  const growth = useGrowthState({
    totalCheckIns: historyQuery.data?.length ?? 0,
  });
  const lastTrackedSummaryKeyRef = useRef<string | null>(null);

  const rangeEntries = useMemo(() => {
    const entries = historyQuery.data ?? [];
    const cutoff = getCutoffDate(range);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyQuery.data, range]);

  const patternSummaryQuery = usePatternSummary(rangeEntries, range);
  const aiSummaryQuery = useAiInsightsSummary(rangeEntries, range);
  const dashboard = useInsightsDashboard(historyQuery.data ?? [], patternSummaryQuery.data, range);
  const visibleCorrelations = dashboard.correlations.filter((correlation) => correlation.show);

  useEffect(() => {
    if (!aiSummaryQuery.data?.summary) {
      return;
    }

    const trackingKey = `${range}:${rangeEntries.map((entry) => `${entry.date}:${entry.updated_at}`).join("|")}`;
    if (lastTrackedSummaryKeyRef.current === trackingKey) {
      return;
    }

    lastTrackedSummaryKeyRef.current = trackingKey;
    void growth.recordEvent("ai_insight_generated", {
      range,
      entries: rangeEntries.length,
    });
  }, [aiSummaryQuery.data?.summary, growth.recordEvent, range, rangeEntries]);

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
      subtitle="Your recent patterns, made a little easier to understand."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your recent patterns</AppText>
          <AppText style={styles.heroBody}>{dashboard.subtitle}</AppText>

          <View style={styles.rangeToggle}>
            {[7, 30].map((option) => (
              <Pressable
                key={option}
                onPress={() => setRange(option as 7 | 30)}
                style={({ pressed }) => [
                  styles.rangeOption,
                  range === option && styles.rangeOptionActive,
                  pressed && styles.rangeOptionPressed,
                ]}
              >
                <AppText style={[styles.rangeOptionText, range === option && styles.rangeOptionTextActive]}>
                  {option} days
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.navCard}>
          <AppText style={styles.sectionTitle}>Move between sections</AppText>
          <View style={styles.navButtons}>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} variant="secondary" />
            <AppButton label="Go to Track" onPress={() => router.push("/track")} variant="secondary" />
            <AppButton label="Go to Coach" onPress={() => router.push("/coach")} variant="secondary" />
            <AppButton label="Health Summary" onPress={() => router.push("/health-summary")} variant="secondary" />
          </View>
        </View>

        <View style={styles.takeawayCard}>
          <AppText style={styles.takeawayTitle}>{dashboard.keyTakeaway.title}</AppText>
          <AppText style={styles.takeawayBody}>{dashboard.keyTakeaway.body}</AppText>
        </View>

        <View style={styles.aiCard}>
          <AppText style={styles.takeawayTitle}>AI Summary</AppText>
          {rangeEntries.length < 3 ? (
            <AppText style={styles.takeawayBody}>A few more check-ins can make this summary clearer over time.</AppText>
          ) : aiSummaryQuery.isLoading ? (
            <AppText style={styles.takeawayBody}>Looking gently at your recent patterns…</AppText>
          ) : aiSummaryQuery.isError ? (
            <AppText style={styles.takeawayBody}>This summary is taking a pause right now. You can still use Trends, Patterns, or Coach.</AppText>
          ) : (
            <>
              <AppText style={styles.takeawayBody}>{aiSummaryQuery.data?.summary}</AppText>
              <View style={styles.helpingSection}>
                <AppText style={styles.helpingTitle}>What may be helping</AppText>
                {(aiSummaryQuery.data?.helping ?? []).map((item) => (
                  <View key={item} style={styles.helpingRow}>
                    <AppText style={styles.helpingBullet}>•</AppText>
                    <AppText style={styles.helpingText}>{item}</AppText>
                  </View>
                ))}
              </View>
              <AppText style={styles.contextNote}>Your summaries stay private and become clearer over time.</AppText>
            </>
          )}
        </View>

        {growth.getCelebrationAvailable("first_insight_summary") ? (
          <View style={styles.retentionCard}>
            <View style={styles.celebrationHeader}>
              <AppText style={styles.retentionText}>Your first AI summary is ready.</AppText>
              <Pressable
                onPress={() => {
                  void growth.markCelebrationSeen("first_insight_summary");
                }}
                style={({ pressed }) => [styles.dismissChip, pressed && styles.rangeOptionPressed]}
              >
                <AppText style={styles.dismissChipText}>Dismiss</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.retentionCard}>
          <AppText style={styles.retentionText}>Small check-ins are enough. Patterns become clearer over time.</AppText>
        </View>

        {historyQuery.data?.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Insights are getting ready</AppText>
            <AppText style={styles.emptyBody}>A few check-ins are enough to start building a clearer picture.</AppText>
            <AppButton label="Log today" onPress={() => router.push("/today")} />
          </View>
        ) : historyQuery.data?.length === 1 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>You’re just getting started</AppText>
            <AppText style={styles.emptyBody}>
              One check-in is a great start. Add a few more days and your patterns will begin to take shape.
            </AppText>
            <AppButton label="Log today" onPress={() => router.push("/today")} />
          </View>
        ) : !dashboard.hasEnoughData ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Keep going</AppText>
            <AppText style={styles.emptyBody}>Track a few more days to see clearer trends in this view.</AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Trend summaries</AppText>
              <AppText style={styles.sectionBody}>
                A quick read on what this {range === 7 ? "week" : "month"} has looked like so far.
              </AppText>
              {dashboard.trends.map((trend) => (
                <TrendSummaryCard key={trend.key} trend={trend} />
              ))}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Patterns worth watching</AppText>
              <AppText style={styles.sectionBody}>
                These simple comparisons can help you spot what may be connected on harder or steadier days.
              </AppText>
              {visibleCorrelations.length > 0 ? (
                visibleCorrelations.map((correlation) => (
                  <CorrelationCard key={correlation.key} correlation={correlation} />
                ))
              ) : (
                <View style={styles.emptyInlineCard}>
                  <AppText style={styles.emptyInlineText}>
                    A few more check-ins can make these patterns easier to read.
                  </AppText>
                </View>
              )}
            </View>

            {dashboard.bestWorstDayInsight.show ? (
              <BestWorstDayInsightCard insight={dashboard.bestWorstDayInsight} />
            ) : null}
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
  heroCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 12,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  rangeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  rangeOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  rangeOptionActive: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e2",
  },
  rangeOptionPressed: {
    opacity: 0.82,
  },
  rangeOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6b7280",
  },
  rangeOptionTextActive: {
    color: "#c25d10",
  },
  navCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  takeawayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  aiCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  takeawayTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  takeawayBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  helpingSection: {
    gap: 8,
  },
  helpingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  helpingRow: {
    flexDirection: "row",
    gap: 8,
  },
  helpingBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  helpingText: {
    flex: 1,
    color: "#6b7280",
    lineHeight: 21,
  },
  contextNote: {
    color: "#8b6a4f",
    lineHeight: 20,
    fontSize: 13,
  },
  retentionCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  retentionText: {
    color: "#8b6a4f",
    fontWeight: "600",
  },
  celebrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  dismissChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dismissChipText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
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
  emptyInlineCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
  },
  emptyInlineText: {
    color: "#6b7280",
    lineHeight: 22,
  },
});
