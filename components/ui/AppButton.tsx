import { Pressable, StyleSheet, Text } from "react-native";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export default function AppButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.labelSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#e8751a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6d5c7",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  labelSecondary: {
    color: "#374151",
  },
});
