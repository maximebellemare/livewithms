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
    return "You seem to feel more drained on weeks with lighter sleep.";
  }

  if (summary.averageMood !== null && summary.averageMood >= 4) {
    return "Your mood has looked a little steadier across the last few days.";
  }

  if (summary.averageStress !== null && summary.averageStress >= 4) {
    return "Stress has been showing up more often in your recent check-ins.";
  }

  return "Your recent check-ins are starting to show a clearer weekly rhythm.";
}

function getWeeklySuggestion(summary: WeeklySummary) {
  if (summary.daysLogged < 3) {
    return null;
  }

  if (summary.averageSleep !== null && summary.averageSleep < 7) {
    return "Try protecting your bedtime routine for a few nights and notice whether energy feels steadier.";
  }

  if (summary.averageStress !== null && summary.averageStress >= 4) {
    return "A short reset or gentler pacing may help on higher-stress days.";
  }

  if (summary.averageMood !== null && summary.averageMood >= 4) {
    return "Keep noticing what is helping on the better days so you can return to it later.";
  }

  return "Keep logging each day so your patterns stay easy to spot.";
}

export default function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const highlight = getWeeklyHighlight(summary);
  const suggestion = getWeeklySuggestion(summary);

  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>Last 7 days</AppText>
      <AppText style={styles.title}>Weekly summary</AppText>
      <AppText style={styles.body}>{summary.summary}</AppText>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{summary.daysLogged}</AppText>
          <AppText style={styles.metricLabel}>Days logged</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageFatigue)}</AppText>
          <AppText style={styles.metricLabel}>Avg fatigue</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageMood)}</AppText>
          <AppText style={styles.metricLabel}>Avg mood</AppText>
        </View>
        <View style={styles.metricCard}>
          <AppText style={styles.metricValue}>{formatMetric(summary.averageSleep, "h")}</AppText>
          <AppText style={styles.metricLabel}>Avg sleep</AppText>
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
