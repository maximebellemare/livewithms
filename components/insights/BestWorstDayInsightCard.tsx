import { StyleSheet, View } from "react-native";
import type { BestWorstDayInsight, BestWorstDaySnapshot } from "../../features/insights/types";
import AppText from "../ui/AppText";

type BestWorstDayInsightCardProps = {
  insight: BestWorstDayInsight;
};

function formatMetric(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

function SnapshotSection({
  title,
  snapshot,
}: {
  title: string;
  snapshot: BestWorstDaySnapshot | null;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <View style={styles.snapshotCard}>
      <AppText style={styles.snapshotTitle}>{title}</AppText>
      <View style={styles.metricRow}>
        <AppText style={styles.metricLabel}>Sleep</AppText>
        <AppText style={styles.metricValue}>{formatMetric(snapshot.sleepHours, "h")}</AppText>
      </View>
      <View style={styles.metricRow}>
        <AppText style={styles.metricLabel}>Stress</AppText>
        <AppText style={styles.metricValue}>{formatMetric(snapshot.stress)}</AppText>
      </View>
      <View style={styles.metricRow}>
        <AppText style={styles.metricLabel}>Hydration</AppText>
        <AppText style={styles.metricValue}>{formatMetric(snapshot.waterGlasses, " glasses")}</AppText>
      </View>
    </View>
  );
}

export default function BestWorstDayInsightCard({ insight }: BestWorstDayInsightCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Last 30 days</AppText>
      <AppText style={styles.title}>Your Best Days</AppText>
      <AppText style={styles.summary}>{insight.sentence}</AppText>

      <View style={styles.compareRow}>
        <SnapshotSection title="Best" snapshot={insight.bestDay} />
        <SnapshotSection title="Worst" snapshot={insight.worstDay} />
      </View>

      <AppText style={styles.recommendation}>{insight.recommendation}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff8ea",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e2b8",
    padding: 18,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b98312",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  summary: {
    color: "#6f5418",
    lineHeight: 22,
  },
  compareRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  snapshotCard: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  snapshotTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  recommendation: {
    fontSize: 13,
    lineHeight: 20,
    color: "#836f43",
  },
});
