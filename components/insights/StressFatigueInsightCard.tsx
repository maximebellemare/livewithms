import { StyleSheet, View } from "react-native";
import type { StressFatigueInsight } from "../../features/insights/types";
import AppText from "../ui/AppText";

type StressFatigueInsightCardProps = {
  insight: StressFatigueInsight;
};

function formatPercentage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${Math.round(Math.abs(value))}%`;
}

function formatAverage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}

export default function StressFatigueInsightCard({ insight }: StressFatigueInsightCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Last 30 days</AppText>
      <AppText style={styles.title}>Stress &amp; Fatigue</AppText>
      <AppText style={styles.contextText}>Based on your recent entries</AppText>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatPercentage(insight.percentageDifference)}</AppText>
          <AppText style={styles.metricLabel}>Fatigue gap</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatAverage(insight.highStressAverage)}</AppText>
          <AppText style={styles.metricLabel}>High stress avg</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatAverage(insight.lowStressAverage)}</AppText>
          <AppText style={styles.metricLabel}>Lower stress avg</AppText>
        </View>
      </View>

      <AppText style={styles.summary}>{insight.sentence}</AppText>
      <AppText style={styles.recommendation}>{insight.recommendation}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff3ec",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f4dccf",
    padding: 18,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d4641a",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  contextText: {
    fontSize: 13,
    color: "#8a6a55",
  },
  metricCard: {
    minWidth: 110,
    flexGrow: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  summary: {
    color: "#7a4a28",
    lineHeight: 22,
  },
  recommendation: {
    fontSize: 13,
    lineHeight: 20,
    color: "#8a6a55",
  },
});
