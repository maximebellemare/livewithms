import { Pressable, StyleSheet, View } from "react-native";
import type { CoachPlan } from "../../features/coach-plans/types";
import type { DailyCheckIn } from "../../features/checkins/types";
import AppText from "../ui/AppText";

function formatCheckInDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return parsedDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCheckInValue(value: number | null, suffix = "") {
  return value === null ? "Not logged" : `${value}${suffix}`;
}

function formatScaleValue(value: number | null) {
  return value === null ? "Not logged" : `${value}/5`;
}

function getCheckInInsight(item: DailyCheckIn) {
  if ((item.fatigue ?? 0) >= 4) {
    return "You reported higher fatigue on this day";
  }

  if ((item.stress ?? 0) >= 4) {
    return "Stress looked higher on this day";
  }

  if ((item.mood ?? 0) >= 4) {
    return "You felt steadier on this day";
  }

  return "Here’s how you checked in that day";
}

type CheckInDetailCardProps = {
  item: DailyCheckIn;
  tomorrowPlan?: CoachPlan | null;
  tomorrowPlanState?: "idle" | "loading" | "error";
  onClose: () => void;
};

export default function CheckInDetailCard({
  item,
  tomorrowPlan = null,
  tomorrowPlanState = "idle",
  onClose,
}: CheckInDetailCardProps) {
  const optionalMetrics = [
    { label: "Pain", value: item.pain !== null ? formatScaleValue(item.pain) : null },
    { label: "Brain fog", value: item.brain_fog !== null ? formatScaleValue(item.brain_fog) : null },
    { label: "Mobility", value: item.mobility !== null ? formatScaleValue(item.mobility) : null },
    { label: "Stress", value: item.stress !== null ? formatScaleValue(item.stress) : null },
    { label: "Sleep", value: item.sleep_hours !== null ? formatCheckInValue(item.sleep_hours, "h") : null },
    {
      label: "Water",
      value: item.water_glasses !== null ? formatCheckInValue(item.water_glasses, " glasses") : null,
    },
  ].filter((metric): metric is { label: string; value: string } => metric.value !== null);

  const hasMissingOptionalMetrics = [
    item.pain,
    item.brain_fog,
    item.mobility,
    item.stress,
    item.sleep_hours,
    item.water_glasses,
  ].some((value) => value === null);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText style={styles.date}>{formatCheckInDate(item.date)}</AppText>
          <AppText style={styles.insight}>{getCheckInInsight(item)}</AppText>
        </View>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
          <AppText style={styles.closeButtonText}>Close</AppText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.metricRow}>
          <AppText style={styles.metricLabel}>Mood</AppText>
          <AppText style={styles.metricValue}>{formatScaleValue(item.mood)}</AppText>
        </View>
        <View style={styles.metricRow}>
          <AppText style={styles.metricLabel}>Fatigue</AppText>
          <AppText style={styles.metricValue}>{formatScaleValue(item.fatigue)}</AppText>
        </View>

        {optionalMetrics.map((metric) => (
          <View key={metric.label} style={styles.metricRow}>
            <AppText style={styles.metricLabel}>{metric.label}</AppText>
            <AppText style={styles.metricValue}>{metric.value}</AppText>
          </View>
        ))}

        {hasMissingOptionalMetrics ? (
          <AppText style={styles.helper}>Some values were not logged</AppText>
        ) : null}
      </View>

      <View style={styles.notesSection}>
        <AppText style={styles.notesLabel}>Notes</AppText>
        <AppText style={styles.notesValue}>{item.notes || "No notes"}</AppText>
      </View>

      <View style={styles.notesSection}>
        <AppText style={styles.notesLabel}>Tomorrow plan</AppText>
        {tomorrowPlanState === "loading" ? (
          <AppText style={styles.notesValue}>Loading tomorrow’s plan…</AppText>
        ) : tomorrowPlanState === "error" ? (
          <AppText style={styles.notesValue}>We couldn’t load the linked plan right now.</AppText>
        ) : tomorrowPlan ? (
          <View style={styles.planList}>
            <AppText style={styles.planItem}>
              Priority: {tomorrowPlan.priority || "Not set"}
            </AppText>
            <AppText style={styles.planItem}>
              Avoid: {tomorrowPlan.avoid || "Not set"}
            </AppText>
            <AppText style={styles.planItem}>
              Support action: {tomorrowPlan.support_action || "Not set"}
            </AppText>
          </View>
        ) : (
          <AppText style={styles.notesValue}>No plan linked to the next day yet.</AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  date: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  insight: {
    color: "#c25d10",
    fontWeight: "600",
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  closeButtonText: {
    color: "#8b6a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  metricLabel: {
    color: "#6b7280",
  },
  metricValue: {
    color: "#1f2937",
    fontWeight: "600",
  },
  helper: {
    color: "#6b7280",
    fontSize: 13,
  },
  notesSection: {
    gap: 6,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  notesValue: {
    color: "#4b5563",
    lineHeight: 21,
  },
  planList: {
    gap: 6,
  },
  planItem: {
    color: "#4b5563",
    lineHeight: 21,
  },
});
