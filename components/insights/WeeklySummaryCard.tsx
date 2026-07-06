import { StyleSheet, View } from "react-native";
import type { WeeklySummary } from "../../features/insights/types";
import AppText from "../ui/AppText";

type WeeklySummaryCardProps = {
  summary: WeeklySummary;
};

function formatMetric(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function getWeeklyHighlight(summary: WeeklySummary) {
  if (summary.daysLogged < 3) {
    return null;
  }

  if (summary.averageSleep !== null && summary.averageFatigue !== null && summary.averageSleep < 7) {
    return "On days with less sleep, you may be feeling a little more drained.";
  }

  if (summary.averageMood !== null && summary.averageMood >= 4) {
    return "Your mood has looked a little more stable lately.";
  }

  if (summary.averageStress !== null && summary.averageStress >= 4) {
    return "Stress seems to be showing up more often in your recent days.";
  }

  return "Your recent check-ins are starting to show a few clearer patterns.";
}

function getWeeklySuggestion(summary: WeeklySummary) {
  if (summary.daysLogged < 3) {
    return null;
  }

  if (summary.averageSleep !== null && summary.averageSleep < 7) {
    return "A more consistent bedtime routine may help you feel a little more supported.";
  }

  if (summary.averageStress !== null && summary.averageStress >= 4) {
    return "A short reset or gentler pacing may help on heavier days.";
  }

  if (summary.averageMood !== null && summary.averageMood >= 4) {
    return "Notice what is helping on the better days so you can come back to it.";
  }

  return "Keep checking in so your patterns stay easy to notice.";
}

export default function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const highlight = getWeeklyHighlight(summary);
  const suggestion = getWeeklySuggestion(summary);

  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Last 7 days</AppText>
      <AppText style={styles.title}>Weekly summary</AppText>
      <AppText style={styles.contextText}>Based on your last 7 days</AppText>
      <AppText style={styles.body}>{summary.summary}</AppText>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{summary.daysLogged}</AppText>
          <AppText style={styles.metricLabel}>Days logged</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageFatigue)}</AppText>
          <AppText style={styles.metricLabel}>Typical fatigue</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageMood)}</AppText>
          <AppText style={styles.metricLabel}>Typical mood</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageSleep, "h")}</AppText>
          <AppText style={styles.metricLabel}>Typical sleep</AppText>
        </View>
      </View>

      {highlight ? <AppText style={styles.helperText}>{highlight}</AppText> : null}
      {suggestion ? <AppText style={styles.suggestionText}>{suggestion}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff1e6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d3bd",
    padding: 18,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c25d10",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#7c4a1d",
    lineHeight: 22,
  },
  contextText: {
    fontSize: 13,
    color: "#8b6a4f",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    minWidth: 120,
    flexGrow: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    color: "#1f2937",
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7c4a1d",
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#8b6a4f",
  },
});
