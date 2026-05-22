import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";
import type { TrendPoint } from "../../features/insights/types";

type MiniTrendChartProps = {
  points: TrendPoint[];
  color?: string;
  maxValue?: number;
};

export default function MiniTrendChart({
  points,
  color = "#e8751a",
  maxValue = 10,
}: MiniTrendChartProps) {
  const safeMax = maxValue > 0 ? maxValue : 10;

  return (
    <View style={styles.container}>
      <View style={styles.chartShell}>
        <View style={styles.gridLineTop} />
        <View style={styles.gridLineMid} />
        <View style={styles.bars}>
          {points.map((point) => {
            const height =
              point.value === null ? 10 : Math.max(10, (point.value / safeMax) * 58);

            return (
              <View key={point.label} style={styles.barGroup}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: point.value === null ? "#f3dfd1" : color,
                    },
                  ]}
                />
                <AppText style={styles.label}>{point.label}</AppText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  chartShell: {
    position: "relative",
    paddingTop: 10,
  },
  gridLineTop: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: "#f1e1d4",
  },
  gridLineMid: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: "#f6ebe2",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 82,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  bar: {
    width: "100%",
    minWidth: 12,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    color: "#6b7280",
  },
});
