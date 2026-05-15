import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, shadows } from "./design";

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
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.labelSecondary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.button,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 15,
    justifyContent: "center",
    ...shadows.soft,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowOpacity: 0,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  labelSecondary: {
    color: colors.text,
  },
});
