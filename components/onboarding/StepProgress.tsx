import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";

type StepProgressProps = {
  step: number;
  totalSteps: number;
};

export default function StepProgress({ step, totalSteps }: StepProgressProps) {
  return (
    <View style={styles.stack}>
      <AppText style={styles.label}>
        {step} of {totalSteps}
      </AppText>
      <View style={styles.row}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index < step ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
  },
  label: {
    color: "#8b6a4f",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  dotActive: {
    backgroundColor: "#e8751a",
  },
});
