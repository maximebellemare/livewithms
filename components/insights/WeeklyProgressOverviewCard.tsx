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
      <AppText style={styles.title}>Your Last 7 Days</AppText>
      <AppText style={styles.contextText}>Based on your last 7 days</AppText>

      {!overview.hasEnoughData ? (
        <AppText style={styles.emptyText}>Track a few more days to see your trends</AppText>
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
    color: "#7b6eaa",
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    color: "#6b7280",
  },
  rowIndicator: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6d4bc2",
  },
});
