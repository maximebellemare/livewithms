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
    return "Looking better";
  }

  if (direction === "down") {
    return "Needs care";
  }

  return "Steady";
}

function getTrendHighlight(trend: TrendSummary) {
  if (trend.average7 === null || trend.average30 === null) {
    return null;
  }

  if (trend.key === "fatigue") {
    return trend.direction === "up"
      ? "You may be feeling a little less weighed down lately."
      : trend.direction === "down"
        ? "You may be feeling a bit more tired lately."
        : "Your fatigue has been fairly steady.";
  }

  if (trend.key === "mood") {
    return trend.direction === "up"
      ? "Your mood may be feeling a little steadier this week."
      : trend.direction === "down"
        ? "Your mood may have been a little lower than usual."
        : "Your mood has been fairly steady.";
  }

  return trend.direction === "up"
    ? "You seem to be getting a little more rest this week."
    : trend.direction === "down"
      ? "Your sleep may have been a little lighter than usual."
      : "Your sleep has been fairly steady.";
}

function getTrendSuggestion(trend: TrendSummary) {
  if (trend.average7 === null || trend.average30 === null) {
    return null;
  }

  if (trend.key === "fatigue") {
    return trend.direction === "down"
      ? "A lighter plan or steadier breaks may help on heavier days."
      : "Keep noticing what helps you feel more steady.";
  }

  if (trend.key === "mood") {
    return trend.direction === "down"
      ? "A small supportive routine may help on lower days."
      : "Keep leaning into what helps you feel more grounded.";
  }

  return trend.direction === "down"
    ? "A calmer wind-down may help you settle a little more easily."
    : "Keep noticing the habits that support better rest.";
}

export default function TrendSummaryCard({ trend }: TrendSummaryCardProps) {
  const highlight = getTrendHighlight(trend);
  const suggestion = getTrendSuggestion(trend);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{trend.label}</AppText>
          <AppText style={styles.contextText}>Based on your recent entries</AppText>
          <AppText style={styles.badge}>{getDirectionLabel(trend.direction)}</AppText>
        </View>
        <View style={styles.values}>
          <AppText style={styles.averageText}>{formatAverage(trend.average7, "Recent")}</AppText>
          <AppText style={styles.averageText}>{formatAverage(trend.average30, "Usual")}</AppText>
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
  contextText: {
    fontSize: 13,
    color: "#6b7280",
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
