import { StyleSheet, View } from "react-native";
import type { CorrelationSummary } from "../../features/insights/types";
import AppText from "../ui/AppText";

type CorrelationCardProps = {
  correlation: CorrelationSummary;
};

function formatPatternStrength(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (Math.abs(value) < 0.2) {
    return "Early";
  }

  if (Math.abs(value) < 0.45) {
    return "Growing";
  }

  return "Clear";
}

function getCorrelationHighlight(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (Math.abs(correlation.coefficient) < 0.2) {
    return `On days when ${correlation.rightLabel.toLowerCase()} changes, ${correlation.leftLabel.toLowerCase()} does not shift in a clear way yet.`;
  }

  if (correlation.key === "fatigue-sleep") {
    return correlation.coefficient < 0
      ? "On days when sleep is lower, fatigue tends to feel higher."
      : "Sleep and fatigue seem connected, though not always in the same direction.";
  }

  if (correlation.key === "fatigue-stress") {
    return correlation.coefficient > 0
      ? "On days when stress is higher, fatigue tends to rise too."
      : "Stress and fatigue do not seem to move together in a clear way.";
  }

  if (correlation.key === "mood-stress") {
    return correlation.coefficient < 0
      ? "On days when stress is higher, mood tends to feel a little lower."
      : "Mood and stress are moving together in an unusual way, so there may be other factors shaping the day.";
  }

  return correlation.coefficient > 0
    ? "On days when sleep is higher, mood tends to feel a little better."
    : "Mood and sleep do not seem to move together in a clear way.";
}

function getCorrelationSuggestion(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (correlation.key === "fatigue-sleep" && correlation.coefficient < -0.2) {
    return "A little more rest may help your energy feel steadier.";
  }

  if (correlation.key === "fatigue-stress" && correlation.coefficient > 0.2) {
    return "A small reset on stressful days may help keep fatigue from building.";
  }

  if (correlation.key === "mood-sleep" && correlation.coefficient > 0.2) {
    return "A steadier bedtime routine may help support your mood.";
  }

  if (correlation.key === "mood-stress" && correlation.coefficient < -0.2) {
    return "A small reset on stressful days may help protect your mood.";
  }

  return "Keep logging a few more days so the pattern becomes clearer.";
}

export default function CorrelationCard({ correlation }: CorrelationCardProps) {
  const highlight = getCorrelationHighlight(correlation);
  const suggestion = getCorrelationSuggestion(correlation);

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{correlation.title}</AppText>
      <AppText style={styles.contextText}>Based on your recent entries</AppText>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatPatternStrength(correlation.coefficient)}</AppText>
          <AppText style={styles.metricLabel}>Pattern</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{correlation.sampleSize}</AppText>
          <AppText style={styles.metricLabel}>Check-ins used</AppText>
        </View>
      </View>
      <AppText style={styles.axisText}>Looking at {correlation.leftLabel.toLowerCase()} and {correlation.rightLabel.toLowerCase()} together</AppText>
      <AppText style={styles.summary}>{correlation.summary}</AppText>
      {highlight ? <AppText style={styles.helperText}>{highlight}</AppText> : null}
      {suggestion ? <AppText style={styles.suggestionText}>{suggestion}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  contextText: {
    fontSize: 13,
    color: "#6b7280",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fffaf6",
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
  axisText: {
    color: "#c25d10",
    fontWeight: "600",
  },
  summary: {
    color: "#4b5563",
    lineHeight: 22,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
  },
});
