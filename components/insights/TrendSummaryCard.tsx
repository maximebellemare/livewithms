import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { TrendSummary } from "../../features/insights/types";
import AppText from "../ui/AppText";
import MiniTrendChart from "./MiniTrendChart";

type TrendSummaryCardProps = {
  trend: TrendSummary;
};

function getDirectionLabel(direction: TrendSummary["direction"]) {
  if (direction === "up") {
    return "Lighter lately";
  }

  if (direction === "down") {
    return "More present";
  }

  return "Fairly steady";
}

function getTrendHighlight(trend: TrendSummary) {
  if (trend.averageCurrent === null) {
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

  if (trend.key === "stress") {
    return trend.direction === "up"
      ? "Stress may be feeling a little lighter lately."
      : trend.direction === "down"
        ? "Stress may have felt a little more noticeable lately."
        : "Your stress has been fairly steady.";
  }

  if (trend.key === "pain") {
    return trend.direction === "up"
      ? "Pain may have felt a little lighter lately."
      : trend.direction === "down"
        ? "Pain may have been a little more noticeable lately."
        : "Your pain has been fairly steady.";
  }

  if (trend.key === "brain_fog") {
    return trend.direction === "up"
      ? "Brain fog may have felt a little lighter lately."
      : trend.direction === "down"
        ? "Brain fog may have been a little more noticeable lately."
        : "Your brain fog has been fairly steady.";
  }

  return trend.direction === "up"
    ? "You seem to be getting a little more rest this week."
    : trend.direction === "down"
      ? "Your sleep may have been a little lighter than usual."
      : "Your sleep has been fairly steady.";
}

function getTrendSuggestion(trend: TrendSummary) {
  if (trend.averageCurrent === null) {
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

  if (trend.key === "stress") {
    return trend.direction === "down"
      ? "A short reset may help when stress starts to build."
      : "Keep noticing what helps your day feel a little lighter.";
  }

  if (trend.key === "pain") {
    return trend.direction === "down"
      ? "A gentler pace may help when pain feels more present."
      : "Keep noticing what seems to help your body feel a little more comfortable.";
  }

  if (trend.key === "brain_fog") {
    return trend.direction === "down"
      ? "A simpler plan may help on foggier days."
      : "Keep noticing what helps your thinking feel a little clearer.";
  }

  return trend.direction === "down"
    ? "A calmer wind-down may help you settle a little more easily."
    : "Keep noticing the habits that support better rest.";
}

export default function TrendSummaryCard({ trend }: TrendSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const highlight = getTrendHighlight(trend);
  const suggestion = getTrendSuggestion(trend);
  const chartMaxValue = trend.key === "sleep_hours" ? 12 : 5;
  const accentColor =
    trend.key === "mood"
      ? "#16a34a"
      : trend.key === "sleep_hours"
        ? "#2563eb"
        : trend.key === "stress"
          ? "#c25d10"
          : trend.key === "pain"
            ? "#dc2626"
            : trend.key === "brain_fog"
              ? "#7c3aed"
              : "#e8751a";

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        <View style={styles.headerText}>
          <AppText style={styles.title}>{trend.label}</AppText>
          <AppText style={styles.contextText}>A quiet look at your recent entries</AppText>
          <AppText style={styles.badge}>{getDirectionLabel(trend.direction)}</AppText>
        </View>
        <View style={styles.values}>
          <AppText style={styles.averageNumber}>{trend.averageCurrent === null ? "—" : trend.averageCurrent.toFixed(1)}</AppText>
          <AppText style={styles.averageText}>{trend.key === "sleep_hours" ? "Recent hours" : "Recent average"}</AppText>
          <AppText style={styles.expandHint}>{expanded ? "Hide details" : "Show details"}</AppText>
        </View>
      </Pressable>

      <MiniTrendChart
        points={trend.points}
        color={accentColor}
        maxValue={chartMaxValue}
      />

      <AppText style={styles.summary}>{trend.summary}</AppText>
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
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerPressed: {
    opacity: 0.82,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#1f2937",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff7f2",
    color: "#c25d10",
    fontSize: 12,
    fontWeight: "700",
  },
  contextText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
  values: {
    alignItems: "flex-end",
    gap: 5,
    minWidth: 94,
  },
  averageNumber: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  averageText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6b7280",
    textAlign: "right",
  },
  expandHint: {
    fontSize: 12,
    lineHeight: 16,
    color: "#c25d10",
    fontWeight: "600",
    textAlign: "right",
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
