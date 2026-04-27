import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";

type SymptomSliderCardProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

export default function SymptomSliderCard({
  label,
  value,
  onChange,
}: SymptomSliderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText style={styles.value}>{value ?? "Skip"}</AppText>
      </View>
      <View style={styles.options}>
        {SCORE_OPTIONS.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(selected ? null : option)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <AppText style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f3dfd1",
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  value: {
    fontSize: 14,
    color: "#6b7280",
  },
  options: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6d5c7",
    backgroundColor: "#fffaf6",
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff0e2",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  optionLabelSelected: {
    color: "#c25d10",
  },
});
