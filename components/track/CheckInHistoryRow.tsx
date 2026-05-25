import { memo } from "react";
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
  return value === null ? "Not logged" : `${value}/5`;
}

function formatSleepValue(value: number | null) {
  return value === null ? "Not logged" : `${value}h`;
}

function getFatigueTone(value: number | null) {
  if (value === null) {
    return {
      backgroundColor: "#f7efe8",
      borderColor: "#ead9cb",
      textColor: "#8b6a4f",
    };
  }

  if (value >= 4) {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#fca5a5",
      textColor: "#b91c1c",
    };
  }

  if (value >= 2) {
    return {
      backgroundColor: "#ffedd5",
      borderColor: "#fdba74",
      textColor: "#c2410c",
    };
  }

  return {
    backgroundColor: "#fef3c7",
    borderColor: "#fcd34d",
    textColor: "#a16207",
  };
}

function getMoodTone(value: number | null) {
  if (value === null) {
    return {
      backgroundColor: "#f7efe8",
      borderColor: "#ead9cb",
      textColor: "#8b6a4f",
    };
  }

  if (value >= 4) {
    return {
      backgroundColor: "#dbeafe",
      borderColor: "#93c5fd",
      textColor: "#1d4ed8",
    };
  }

  if (value >= 2) {
    return {
      backgroundColor: "#e0f2fe",
      borderColor: "#7dd3fc",
      textColor: "#0369a1",
    };
  }

  return {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    textColor: "#475569",
  };
}

type CheckInHistoryRowProps = {
  item: DailyCheckIn;
  selected: boolean;
  onPress: () => void;
};

function CheckInHistoryRow({
  item,
  selected,
  onPress,
}: CheckInHistoryRowProps) {
  const fatigueTone = getFatigueTone(item.fatigue);
  const moodTone = getMoodTone(item.mood);
  const stressTone = getFatigueTone(item.stress);
  const sleepTone = getMoodTone(item.sleep_hours);

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
          <View
            style={[
              styles.metricPill,
              {
                backgroundColor: fatigueTone.backgroundColor,
                borderColor: fatigueTone.borderColor,
              },
            ]}
          >
            <AppText style={[styles.metricPillText, { color: fatigueTone.textColor }]}>
              Fatigue {formatCheckInValue(item.fatigue)}
            </AppText>
          </View>
          <View
            style={[
              styles.metricPill,
              {
                backgroundColor: moodTone.backgroundColor,
                borderColor: moodTone.borderColor,
              },
            ]}
          >
            <AppText style={[styles.metricPillText, { color: moodTone.textColor }]}>
              Mood {formatCheckInValue(item.mood)}
            </AppText>
          </View>
          <View
            style={[
              styles.metricPill,
              {
                backgroundColor: stressTone.backgroundColor,
                borderColor: stressTone.borderColor,
              },
            ]}
          >
            <AppText style={[styles.metricPillText, { color: stressTone.textColor }]}>
              Stress {formatCheckInValue(item.stress)}
            </AppText>
          </View>
          <View
            style={[
              styles.metricPill,
              {
                backgroundColor: sleepTone.backgroundColor,
                borderColor: sleepTone.borderColor,
              },
            ]}
          >
            <AppText style={[styles.metricPillText, { color: sleepTone.textColor }]}>
              Sleep {formatSleepValue(item.sleep_hours)}
            </AppText>
          </View>
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

export default memo(CheckInHistoryRow, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.item.id === next.item.id &&
    prev.item.updated_at === next.item.updated_at &&
    prev.item.notes === next.item.notes &&
    prev.item.fatigue === next.item.fatigue &&
    prev.item.mood === next.item.mood &&
    prev.item.stress === next.item.stress &&
    prev.item.sleep_hours === next.item.sleep_hours
  );
});

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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  date: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricPillActive: {
    shadowColor: "#e8751a",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  metricPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  note: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    lineHeight: 18,
  },
});
