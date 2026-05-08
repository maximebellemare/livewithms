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

function getFatigueTone(value: number | null) {
  if (value === null) {
    return {
      backgroundColor: "#f7efe8",
      borderColor: "#ead9cb",
      textColor: "#8b6a4f",
    };
  }

  if (value >= 7) {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#fca5a5",
      textColor: "#b91c1c",
    };
  }

  if (value >= 4) {
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

  if (value >= 7) {
    return {
      backgroundColor: "#dbeafe",
      borderColor: "#93c5fd",
      textColor: "#1d4ed8",
    };
  }

  if (value >= 4) {
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

export default function CheckInHistoryRow({
  item,
  selected,
  onPress,
}: CheckInHistoryRowProps) {
  const fatigueTone = getFatigueTone(item.fatigue);
  const moodTone = getMoodTone(item.mood);

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
                backgroundColor: fatigueTone.backgroundColor,
                borderColor: fatigueTone.borderColor,
              },
            ]}
          >
            <AppText style={[styles.metricPillText, { color: fatigueTone.textColor }]}>
              Fatigue {formatCheckInValue(item.fatigue)}
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
