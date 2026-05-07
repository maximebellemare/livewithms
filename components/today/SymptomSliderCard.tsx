import { useEffect, useRef, useState } from "react";
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
  const [skipFeedbackVisible, setSkipFeedbackVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    console.log("Skip tapped");
    onChange(null);
    setSkipFeedbackVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSkipFeedbackVisible(false);
    }, 1500);
  };

  const handleSelect = (option: number) => {
    setSkipFeedbackVisible(false);
    onChange(value === option ? null : option);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.label}>{label}</AppText>
        <View style={styles.headerActions}>
          <AppText style={styles.value}>
            {value ?? (skipFeedbackVisible ? "Skipped" : "Not logged")}
          </AppText>
          <Pressable onPress={handleSkip} style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}>
            <AppText style={styles.skipText}>Skip</AppText>
          </Pressable>
        </View>
      </View>
      <View style={styles.options}>
        {SCORE_OPTIONS.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => handleSelect(option)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
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
    gap: 12,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 6,
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
  skipButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    fontSize: 14,
    color: "#c25d10",
    fontWeight: "600",
    textDecorationLine: "underline",
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
  optionPressed: {
    opacity: 0.82,
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
