import { StyleSheet, View } from "react-native";
import type { WeeklyProgressOverview } from "../../features/insights/types";
import AppText from "../ui/AppText";

type WeeklyProgressOverviewCardProps = {
  overview: WeeklyProgressOverview;
};

function formatAverage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}

export default function WeeklyProgressOverviewCard({
  overview,
}: WeeklyProgressOverviewCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Weekly view</AppText>
      <AppText style={styles.title}>Your last 7 days</AppText>
      <AppText style={styles.contextText}>A simple read on how this week has felt.</AppText>

      {!overview.hasEnoughData ? (
        <AppText style={styles.emptyText}>Patterns become easier to read over time.</AppText>
      ) : (
        <View style={styles.rows}>
          {overview.trends.map((trend) => (
            <View key={trend.key} style={styles.row}>
              <View style={styles.rowLeft}>
                <AppText style={styles.rowLabel}>{trend.label}</AppText>
                <AppText style={styles.rowSubtext}>
                  {formatAverage(trend.firstHalfAverage)} → {formatAverage(trend.secondHalfAverage)}
                </AppText>
              </View>
              <AppText style={styles.rowIndicator}>{trend.indicator}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f7f4ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5def8",
    padding: 18,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d4bc2",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  emptyText: {
    color: "#6b7280",
    lineHeight: 22,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#7b6eaa",
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  rowSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  rowIndicator: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#6d4bc2",
    textAlign: "right",
  },
});
