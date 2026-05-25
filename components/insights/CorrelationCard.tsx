import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { CorrelationSummary } from "../../features/insights/types";
import { formatPatternStrength } from "../../features/insights/calm-copy";
import AppText from "../ui/AppText";

type CorrelationCardProps = {
  correlation: CorrelationSummary;
};

function getCorrelationHighlight(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (Math.abs(correlation.coefficient) < 0.2) {
    return `On days when ${correlation.rightLabel.toLowerCase()} changes, ${correlation.leftLabel.toLowerCase()} does not shift in a clear way yet.`;
  }

  if (correlation.key === "fatigue-sleep") {
    return correlation.coefficient < 0
      ? "Lower-sleep days line up with higher fatigue."
      : "Higher-sleep days line up with higher fatigue in this range.";
  }

  if (correlation.key === "fatigue-stress") {
    return correlation.coefficient > 0
      ? "Higher-stress days line up with higher fatigue."
      : "Stress and fatigue do not seem to move together in a clear way.";
  }

  if (correlation.key === "mood-stress") {
    return correlation.coefficient < 0
      ? "Higher-stress days line up with lower mood."
      : "Mood and stress move together in this range.";
  }

  return correlation.coefficient > 0
    ? "Higher-sleep days line up with higher mood."
    : "Mood and sleep do not seem to move together in a clear way.";
}

function getCorrelationSuggestion(correlation: CorrelationSummary) {
  if (correlation.coefficient === null || correlation.sampleSize < 3) {
    return null;
  }

  if (correlation.key === "fatigue-sleep" && correlation.coefficient < -0.2) {
    return "Track whether shorter sleep is followed by higher fatigue.";
  }

  if (correlation.key === "fatigue-stress" && correlation.coefficient > 0.2) {
    return "A small reset on stressful days may help keep fatigue from building.";
  }

  if (correlation.key === "mood-sleep" && correlation.coefficient > 0.2) {
    return "Track whether higher-sleep days continue to line up with higher mood.";
  }

  if (correlation.key === "mood-stress" && correlation.coefficient < -0.2) {
    return "A small reset on stressful days may help protect your mood.";
  }

  return "More check-ins may make this relationship clearer.";
}

export default function CorrelationCard({ correlation }: CorrelationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const highlight = getCorrelationHighlight(correlation);
  const suggestion = getCorrelationSuggestion(correlation);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{correlation.title}</AppText>
          <AppText style={styles.contextText}>Relationship across recent entries</AppText>
        </View>
        <AppText style={styles.expandHint}>{expanded ? "Hide details" : "Show details"}</AppText>
      </Pressable>
      <View style={styles.row}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatPatternStrength(correlation.coefficient)}</AppText>
          <AppText style={styles.metricLabel}>Pattern</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{correlation.sampleSize}</AppText>
          <AppText style={styles.metricLabel}>Days compared</AppText>
        </View>
      </View>
      <AppText style={styles.axisText}>Looking at {correlation.leftLabel.toLowerCase()} and {correlation.rightLabel.toLowerCase()} together</AppText>
      <AppText style={styles.summary}>{correlation.summary}</AppText>
      {expanded ? (
        <>
          {highlight ? <AppText style={styles.helperText}>{highlight}</AppText> : null}
          {suggestion ? <AppText style={styles.suggestionText}>{suggestion}</AppText> : null}
        </>
      ) : null}
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
    gap: 14,
  },
  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerPressed: {
    opacity: 0.82,
  },
  expandHint: {
    fontSize: 12,
    lineHeight: 16,
    color: "#c25d10",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fffaf6",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    minHeight: 82,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
  },
  axisText: {
    color: "#c25d10",
    fontWeight: "600",
    lineHeight: 20,
  },
  summary: {
    color: "#4b5563",
    lineHeight: 23,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4b5563",
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 21,
    color: "#6b7280",
  },
});
