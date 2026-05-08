import { StyleSheet, View } from "react-native";
import type { TrendSummary } from "../../features/insights/types";
import AppText from "../ui/AppText";
import MiniTrendChart from "./MiniTrendChart";

type TrendSummaryCardProps = {
  trend: TrendSummary;
};

function formatAverage(value: number | null, label: string) {
  if (value === null) {
    return `${label}: —`;
  }

  return `${label}: ${value.toFixed(1)}`;
}

function getDirectionLabel(direction: TrendSummary["direction"]) {
  if (direction === "up") {
    return "Improving";
  }

  if (direction === "down") {
    return "Needs attention";
  }

  return "Steady";
}

function getTrendHighlight(trend: TrendSummary) {
  if (trend.average7 === null || trend.average30 === null) {
    return null;
  }

  if (trend.key === "fatigue") {
    return trend.direction === "up"
      ? "Fatigue has eased a little over the last 7 days."
      : trend.direction === "down"
        ? "Fatigue has been a little heavier lately."
        : "Fatigue has stayed fairly consistent.";
  }

  if (trend.key === "mood") {
    return trend.direction === "up"
      ? "Mood has felt a bit steadier this week."
      : trend.direction === "down"
        ? "Mood has dipped a little compared with your longer pattern."
        : "Mood has stayed fairly steady.";
  }

  return trend.direction === "up"
    ? "Sleep has looked a little stronger this week."
    : trend.direction === "down"
      ? "Sleep has been lighter than your usual pattern."
      : "Sleep has stayed fairly consistent.";
}

function getTrendSuggestion(trend: TrendSummary) {
  if (trend.average7 === null || trend.average30 === null) {
    return null;
  }

  if (trend.key === "fatigue") {
    return trend.direction === "down"
      ? "Consider planning lighter days or steadier breaks when energy feels harder to hold."
      : "Keep noticing which routines help you feel more stable.";
  }

  if (trend.key === "mood") {
    return trend.direction === "down"
      ? "A small supportive routine may help on lower-mood days."
      : "Keep leaning into what is helping you feel more grounded.";
  }

  return trend.direction === "down"
    ? "Try protecting your wind-down routine for a few nights."
    : "Keep an eye on the habits that support better rest.";
}

export default function TrendSummaryCard({ trend }: TrendSummaryCardProps) {
  const highlight = getTrendHighlight(trend);
  const suggestion = getTrendSuggestion(trend);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{trend.label}</AppText>
          <AppText style={styles.badge}>{getDirectionLabel(trend.direction)}</AppText>
        </View>
        <View style={styles.values}>
          <AppText style={styles.averageText}>{formatAverage(trend.average7, "7d")}</AppText>
          <AppText style={styles.averageText}>{formatAverage(trend.average30, "30d")}</AppText>
        </View>
      </View>

      <MiniTrendChart
        points={trend.points}
        color={trend.key === "mood" ? "#16a34a" : trend.key === "sleep_hours" ? "#2563eb" : "#e8751a"}
        maxValue={trend.key === "sleep_hours" ? 12 : 10}
      />

      <AppText style={styles.summary}>{trend.summary}</AppText>
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
    gap: 14,
  },
  header: {
    gap: 10,
  },
  headerText: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fff7f2",
    color: "#c25d10",
    fontSize: 12,
    fontWeight: "700",
  },
  values: {
    gap: 4,
  },
  averageText: {
    fontSize: 14,
    color: "#6b7280",
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
