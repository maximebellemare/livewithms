import { StyleSheet, View } from "react-native";
import type { SleepFatigueInsight } from "../../features/insights/types";
import AppText from "../ui/AppText";

type SleepFatigueInsightCardProps = {
  insight: SleepFatigueInsight;
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

export default function SleepFatigueInsightCard({ insight }: SleepFatigueInsightCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Last 30 days</AppText>
      <AppText style={styles.title}>Sleep &amp; Fatigue</AppText>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatPercentage(insight.percentageDifference)}</AppText>
          <AppText style={styles.metricLabel}>Fatigue gap</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatAverage(insight.lowSleepAverage)}</AppText>
          <AppText style={styles.metricLabel}>Low sleep avg</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatAverage(insight.normalSleepAverage)}</AppText>
          <AppText style={styles.metricLabel}>Normal sleep avg</AppText>
        </View>
      </View>

      <AppText style={styles.summary}>{insight.sentence}</AppText>
      <AppText style={styles.recommendation}>{insight.recommendation}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eef6ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8e7fb",
    padding: 18,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
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
    color: "#37557b",
    lineHeight: 22,
  },
  recommendation: {
    fontSize: 13,
    lineHeight: 20,
    color: "#5f7288",
  },
});
