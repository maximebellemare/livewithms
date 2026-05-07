import { StyleSheet, View } from "react-native";
import type { DailyCheckIn } from "../../features/checkins/types";
import CheckInHistoryRow from "./CheckInHistoryRow";

type CheckInHistoryListProps = {
  items: DailyCheckIn[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export default function CheckInHistoryList({
  items,
  selectedDate,
  onSelectDate,
}: CheckInHistoryListProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <CheckInHistoryRow
          key={item.id}
          item={item}
          selected={item.date === selectedDate}
          onPress={() => onSelectDate(item.date)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
});
