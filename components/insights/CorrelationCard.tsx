import { StyleSheet, View } from "react-native";
import type { CorrelationSummary } from "../../features/insights/types";
import AppText from "../ui/AppText";

type CorrelationCardProps = {
  correlation: CorrelationSummary;
};

function formatCoefficient(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toFixed(2);
}

function getCorrelationHighlight(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (Math.abs(correlation.coefficient) < 0.2) {
    return `There is not a clear pattern yet between ${correlation.leftLabel.toLowerCase()} and ${correlation.rightLabel.toLowerCase()}.`;
  }

  if (correlation.key === "fatigue-sleep") {
    return correlation.coefficient < 0
      ? "You feel more fatigued on lower-sleep days."
      : "Sleep and fatigue have been moving together in an unusual way.";
  }

  if (correlation.key === "fatigue-stress") {
    return correlation.coefficient > 0
      ? "Fatigue tends to rise on higher-stress days."
      : "Stress and fatigue are not moving together in a clear way.";
  }

  return correlation.coefficient > 0
    ? "Mood tends to feel better on higher-sleep days."
    : "Mood and sleep are not moving together in a clear way.";
}

function getCorrelationSuggestion(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (correlation.key === "fatigue-sleep" && correlation.coefficient < -0.2) {
    return "Try increasing sleep where you can and notice whether energy feels steadier the next day.";
  }

  if (correlation.key === "fatigue-stress" && correlation.coefficient > 0.2) {
    return "A small reset on stressful days may help keep fatigue from building.";
  }

  if (correlation.key === "mood-sleep" && correlation.coefficient > 0.2) {
    return "Protecting your bedtime routine may help support a steadier mood.";
  }

  return "Keep logging a few more days so the pattern becomes clearer.";
}

export default function CorrelationCard({ correlation }: CorrelationCardProps) {
  const highlight = getCorrelationHighlight(correlation);
  const suggestion = getCorrelationSuggestion(correlation);

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{correlation.title}</AppText>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatCoefficient(correlation.coefficient)}</AppText>
          <AppText style={styles.metricLabel}>Correlation</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{correlation.sampleSize}</AppText>
          <AppText style={styles.metricLabel}>Logged days</AppText>
        </View>
      </View>
      <AppText style={styles.axisText}>
        {correlation.leftLabel} compared with {correlation.rightLabel.toLowerCase()}
      </AppText>
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
