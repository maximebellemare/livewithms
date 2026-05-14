import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { useAppointments } from "../../features/appointments/hooks";
import { useAuth } from "../../features/auth/hooks";
import { useCheckInHistory, useCheckInOverview } from "../../features/checkins/hooks";
import { useMedications } from "../../features/medications/hooks";
import { useGrowthState } from "../../features/growth/hooks";
import AppButton from "../../components/ui/AppButton";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";
import ErrorState from "../../components/ui/ErrorState";
import LoadingState from "../../components/ui/LoadingState";
import { getErrorMessage } from "../../lib/errors";

function getCutoffDate(days: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - (days - 1));
  return cutoff.toISOString().slice(0, 10);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function roundToOneDecimal(value: number | null) {
  if (value === null) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (!validValues.length) {
    return null;
  }

  return roundToOneDecimal(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
}

function buildTrendCopy(
  earlier: number | null,
  later: number | null,
  config: {
    label: string;
    higherIsBetter: boolean;
    positive: string;
    negative: string;
    stable: string;
  },
) {
  if (later === null) {
    return `There is not enough recent ${config.label.toLowerCase()} data yet.`;
  }

  if (earlier === null || Math.abs(later - earlier) < 0.35) {
    return config.stable;
  }

  const improving = config.higherIsBetter ? later > earlier : later < earlier;
  return improving ? config.positive : config.negative;
}

function formatAverage(value: number | null, suffix = "/5") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

function buildShareText(input: {
  range: 7 | 30;
  totalCheckIns: number;
  fatigueAverage: number | null;
  moodAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  trendLines: string[];
  activeMedicationsCount: number;
  upcomingAppointmentsCount: number;
}) {
  return [
    `LiveWithMS health summary (${input.range} days)`,
    "",
    `You completed ${input.totalCheckIns} ${input.totalCheckIns === 1 ? "check-in" : "check-ins"}.`,
    `Average fatigue: ${formatAverage(input.fatigueAverage)}`,
    `Average mood: ${formatAverage(input.moodAverage)}`,
    `Average stress: ${formatAverage(input.stressAverage)}`,
    `Average sleep: ${formatAverage(input.sleepAverage, "h")}`,
    `Active medications: ${input.activeMedicationsCount}`,
    `Upcoming appointments: ${input.upcomingAppointmentsCount}`,
    "",
    ...input.trendLines,
    "",
    "Your summaries are private and controlled by you.",
  ].join("\n");
}

export default function HealthSummaryScreen() {
  const { user } = useAuth();
  const [range, setRange] = useState<7 | 30>(7);
  const historyQuery = useCheckInHistory(user?.id, 60);
  const overviewQuery = useCheckInOverview(user?.id);
  const medicationsQuery = useMedications(user?.id);
  const appointmentsQuery = useAppointments(user?.id);
  const growth = useGrowthState({
    totalCheckIns: overviewQuery.data?.length ?? 0,
  });

  const rangeEntries = useMemo(() => {
    const entries = historyQuery.data ?? [];
    const cutoff = getCutoffDate(range);
    return entries.filter((entry) => entry.date >= cutoff);
  }, [historyQuery.data, range]);

  const sortedRangeEntries = useMemo(
    () => rangeEntries.slice().sort((left, right) => left.date.localeCompare(right.date)),
    [rangeEntries],
  );
  const midpoint = Math.ceil(sortedRangeEntries.length / 2);
  const earlierRangeEntries = sortedRangeEntries.slice(0, midpoint);
  const laterRangeEntries = sortedRangeEntries.slice(midpoint);

  const today = getTodayDateString();
  const totalCheckIns = overviewQuery.data?.length ?? 0;
  const activeMedicationsCount = useMemo(
    () => (medicationsQuery.data ?? []).filter((medication) => medication.active).length,
    [medicationsQuery.data],
  );
  const upcomingAppointmentsCount = useMemo(
    () => (appointmentsQuery.data ?? []).filter((appointment) => appointment.appointment_date >= today).length,
    [appointmentsQuery.data, today],
  );

  const fatigueAverage = average(rangeEntries.map((entry) => entry.fatigue));
  const moodAverage = average(rangeEntries.map((entry) => entry.mood));
  const stressAverage = average(rangeEntries.map((entry) => entry.stress));
  const sleepAverage = average(rangeEntries.map((entry) => entry.sleep_hours));
  const fatigueEarlierAverage = average(earlierRangeEntries.map((entry) => entry.fatigue));
  const moodEarlierAverage = average(earlierRangeEntries.map((entry) => entry.mood));
  const stressEarlierAverage = average(earlierRangeEntries.map((entry) => entry.stress));
  const sleepEarlierAverage = average(earlierRangeEntries.map((entry) => entry.sleep_hours));
  const fatigueLaterAverage = average(laterRangeEntries.map((entry) => entry.fatigue));
  const moodLaterAverage = average(laterRangeEntries.map((entry) => entry.mood));
  const stressLaterAverage = average(laterRangeEntries.map((entry) => entry.stress));
  const sleepLaterAverage = average(laterRangeEntries.map((entry) => entry.sleep_hours));

  const trendLines = useMemo(
    () => [
      buildTrendCopy(fatigueEarlierAverage, fatigueLaterAverage, {
        label: "Fatigue",
        higherIsBetter: false,
        positive: "Fatigue has felt a little lighter recently.",
        negative: "Fatigue has been more elevated recently.",
        stable: "Fatigue has been relatively steady lately.",
      }),
      buildTrendCopy(moodEarlierAverage, moodLaterAverage, {
        label: "Mood",
        higherIsBetter: true,
        positive: "Mood has been trending upward.",
        negative: "Mood has felt a little lower recently.",
        stable: "Mood has been relatively stable.",
      }),
      buildTrendCopy(stressEarlierAverage, stressLaterAverage, {
        label: "Stress",
        higherIsBetter: false,
        positive: "Stress has felt a little lighter recently.",
        negative: "Stress has been more noticeable recently.",
        stable: "Stress has been fairly steady lately.",
      }),
      buildTrendCopy(sleepEarlierAverage, sleepLaterAverage, {
        label: "Sleep",
        higherIsBetter: true,
        positive: "Sleep has been a little steadier recently.",
        negative: "Sleep has been lighter recently.",
        stable: "Sleep has been fairly steady lately.",
      }),
    ],
    [
      fatigueEarlierAverage,
      fatigueLaterAverage,
      moodEarlierAverage,
      moodLaterAverage,
      sleepEarlierAverage,
      sleepLaterAverage,
      stressEarlierAverage,
      stressLaterAverage,
    ],
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: buildShareText({
          range,
          totalCheckIns,
          fatigueAverage,
          moodAverage,
          stressAverage,
          sleepAverage,
          trendLines,
          activeMedicationsCount,
          upcomingAppointmentsCount,
        }),
      });
      await growth.recordEvent("export_used", {
        range,
        source: "health_summary",
      });
    } catch {
      // Keep sharing failures quiet so this never disrupts the summary itself.
    }
  };

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view your health summary." />;
  }

  if (historyQuery.isLoading || overviewQuery.isLoading || medicationsQuery.isLoading || appointmentsQuery.isLoading) {
    return <LoadingState message="Loading your summary..." />;
  }

  if (historyQuery.isError) {
    return <ErrorState message={getErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />;
  }

  if (medicationsQuery.isError) {
    return <ErrorState message={getErrorMessage(medicationsQuery.error)} onRetry={() => void medicationsQuery.refetch()} />;
  }

  if (overviewQuery.isError) {
    return <ErrorState message={getErrorMessage(overviewQuery.error)} onRetry={() => void overviewQuery.refetch()} />;
  }

  if (appointmentsQuery.isError) {
    return <ErrorState message={getErrorMessage(appointmentsQuery.error)} onRetry={() => void appointmentsQuery.refetch()} />;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/profile");
  };

  return (
    <AppScreen
      title="Health Summary"
      subtitle="A calm overview of your recent check-ins, care details, and trends."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <AppText style={styles.backButtonText}>‹ Back</AppText>
        </Pressable>

        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Your recent summary</AppText>
          <AppText style={styles.heroBody}>
            See the patterns you&apos;ve been logging and share them only if you want to.
          </AppText>
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

        <View style={styles.privacyCard}>
          <AppText style={styles.privacyText}>Your summaries are private and controlled by you.</AppText>
        </View>

        {rangeEntries.length < 2 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyTitle}>Your summary is just getting started</AppText>
            <AppText style={styles.emptyBody}>
              Summaries become more helpful with regular check-ins. A few more entries will make the picture clearer.
            </AppText>
            <AppButton label="Go to Today" onPress={() => router.push("/today")} />
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Overview</AppText>
              <View style={styles.metricGrid}>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Check-ins</AppText>
                  <AppText style={styles.metricValue}>{totalCheckIns}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Fatigue</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(fatigueAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Mood</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(moodAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Stress</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(stressAverage)}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Sleep</AppText>
                  <AppText style={styles.metricValue}>{formatAverage(sleepAverage, "h")}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Active meds</AppText>
                  <AppText style={styles.metricValue}>{activeMedicationsCount}</AppText>
                </View>
                <View style={styles.metricPill}>
                  <AppText style={styles.metricLabel}>Upcoming visits</AppText>
                  <AppText style={styles.metricValue}>{upcomingAppointmentsCount}</AppText>
                </View>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.sectionTitle}>Recent trends</AppText>
              <View style={styles.trendList}>
                {trendLines.map((line) => (
                  <View key={line} style={styles.trendRow}>
                    <AppText style={styles.trendBullet}>•</AppText>
                    <AppText style={styles.trendText}>{line}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <AppButton label="Share summary" onPress={() => void handleShare()} />
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
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonPressed: {
    opacity: 0.82,
  },
  backButtonText: {
    color: "#8b6a4f",
    fontSize: 15,
    fontWeight: "700",
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
    fontSize: 24,
    lineHeight: 32,
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
  privacyCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  privacyText: {
    color: "#8b6a4f",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyBody: {
    color: "#4b5563",
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
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricPill: {
    minWidth: "30%",
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  trendList: {
    gap: 10,
  },
  trendRow: {
    flexDirection: "row",
    gap: 8,
  },
  trendBullet: {
    color: "#c25d10",
    fontWeight: "700",
  },
  trendText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 21,
  },
});
