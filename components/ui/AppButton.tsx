import { Pressable, StyleSheet, Text } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { colors, radii, shadows } from "./design";
import { deriveInteractionSoftness } from "../../lib/humane-micro-moments/calm-interactions/deriveInteractionSoftness";
import { preventOverfamiliarity } from "../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";
import { preventDopamineUX } from "../../lib/humane-micro-moments/non-performative-delight/preventDopamineUX";

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
  const calmEnvironment = useDerivedCalmEnvironment();
  const softness = deriveInteractionSoftness({ emphasis: variant === "secondary" ? "soft" : "standard" });
  const reducedMotion = calmEnvironment.motion.reducedMotion;
  const comfortMode = calmEnvironment.density.largerTapTargets;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={comfortMode ? 8 : 6}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        comfortMode && styles.buttonComfort,
        calmEnvironment.lowEnergyPresentation.reduceSimultaneousActions && styles.buttonLowEnergy,
        variant === "secondary" && styles.buttonSecondary,
        pressed &&
          !disabled && [
            styles.buttonPressed,
            {
              opacity: reducedMotion ? Math.max(softness.buttonOpacityPressed, 0.9) : softness.buttonOpacityPressed,
              transform: [{ scale: calmEnvironment.motion.motionScale < 1 ? 0.995 : 0.998 }],
            },
          ],
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.label, variant === "secondary" && styles.labelSecondary]}>
        {preventDopamineUX(preventOverfamiliarity(label))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.button,
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 17,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.soft,
  },
  buttonComfort: {
    minHeight: 62,
    paddingVertical: 18,
  },
  buttonLowEnergy: {
    paddingHorizontal: 18,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowOpacity: 0,
  },
  buttonPressed: {
    opacity: deriveInteractionSoftness({ emphasis: "standard" }).buttonOpacityPressed,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  labelSecondary: {
    color: colors.text,
  },
});
