import { Pressable, StyleSheet, View } from "react-native";
import type { DailyCheckIn } from "../../features/checkins/types";
import AppText from "../ui/AppText";

function formatCheckInDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCheckInValue(value: number | null) {
  return value === null ? "Not logged" : String(value);
}

type CheckInHistoryRowProps = {
  item: DailyCheckIn;
  selected: boolean;
  onPress: () => void;
};

export default function CheckInHistoryRow({
  item,
  selected,
  onPress,
}: CheckInHistoryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.accent} />
      <View style={styles.content}>
        <AppText style={styles.date}>{formatCheckInDate(item.date)}</AppText>
        <View style={styles.summary}>
          <AppText style={styles.metric}>Mood: {formatCheckInValue(item.mood)}</AppText>
          <AppText style={styles.metric}>Fatigue: {formatCheckInValue(item.fatigue)}</AppText>
        </View>
        {item.notes ? (
          <AppText style={styles.note} numberOfLines={1}>
            {item.notes}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1e1d4",
  },
  rowSelected: {
    backgroundColor: "#fff1e6",
    borderColor: "#e8751a",
  },
  rowPressed: {
    opacity: 0.82,
  },
  accent: {
    width: 5,
    backgroundColor: "#e8751a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  date: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  summary: {
    gap: 2,
  },
  metric: {
    fontSize: 14,
    color: "#4b5563",
  },
  note: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
});
