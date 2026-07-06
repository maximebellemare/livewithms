import { Pressable, StyleSheet, View } from "react-native";
import AuthTextField from "../auth/AuthTextField";
import AppText from "../ui/AppText";

type OnboardingOptionSelectorProps = {
  title?: string;
  description?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  customPlaceholder?: string;
  helperText?: string;
};

export default function OnboardingOptionSelector({
  title,
  description,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  customPlaceholder = "Add your own",
  helperText,
}: OnboardingOptionSelectorProps) {
  return (
    <View style={styles.stack}>
      {title || description ? (
        <View style={styles.header}>
          {title ? <AppText style={styles.title}>{title}</AppText> : null}
          {description ? <AppText style={styles.description}>{description}</AppText> : null}
        </View>
      ) : null}

      <View style={styles.grid}>
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onToggle(option)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
            >
              <AppText style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option}</AppText>
            </Pressable>
          );
        })}
      </View>

      {onCustomChange ? (
        <View style={styles.customBlock}>
          <AuthTextField
            label="Add your own"
            value={customValue ?? ""}
            onChangeText={onCustomChange}
            placeholder={customPlaceholder}
            autoCapitalize="sentences"
          />
          {helperText ? <AppText style={styles.helperText}>{helperText}</AppText> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  description: {
    color: "#6b7280",
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  optionCardSelected: {
    borderColor: "#e88f4b",
    backgroundColor: "#fff4ea",
  },
  optionCardPressed: {
    opacity: 0.86,
  },
  optionLabel: {
    color: "#4b5563",
    lineHeight: 20,
    fontWeight: "600",
  },
  optionLabelSelected: {
    color: "#b85b14",
  },
  customBlock: {
    gap: 8,
  },
  helperText: {
    color: "#8b6a4f",
    fontSize: 13,
    lineHeight: 18,
  },
});
