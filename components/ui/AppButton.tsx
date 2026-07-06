import { memo, useCallback, useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { deriveInteractionSoftness } from "../../lib/humane-micro-moments/calm-interactions/deriveInteractionSoftness";
import { preventDopamineUX } from "../../lib/humane-micro-moments/non-performative-delight/preventDopamineUX";
import { preventOverfamiliarity } from "../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";
import { colors, radii, shadows } from "./design";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

function AppButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: AppButtonProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const softness = deriveInteractionSoftness({ emphasis: variant === "secondary" ? "soft" : "standard" });
  const comfortMode = calmEnvironment.density.largerTapTargets;
  const reduceActions = calmEnvironment.lowEnergyPresentation.reduceSimultaneousActions;
  const pressedOpacity = useMemo(
    () =>
      calmEnvironment.motion.reducedMotion
        ? Math.max(softness.buttonOpacityPressed, 0.9)
        : softness.buttonOpacityPressed,
    [calmEnvironment.motion.reducedMotion, softness.buttonOpacityPressed],
  );
  const pressedScale = useMemo(
    () => (calmEnvironment.motion.motionScale < 1 ? 0.995 : 0.998),
    [calmEnvironment.motion.motionScale],
  );
  const androidRipple = useMemo(
    () =>
      Platform.OS === "android"
        ? {
            color: variant === "secondary" ? "rgba(31, 41, 55, 0.08)" : "rgba(255, 255, 255, 0.18)",
            borderless: false,
          }
        : undefined,
    [variant],
  );

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }

    onPress();
  }, [disabled, onPress]);

  const pressableStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.button,
      comfortMode && styles.buttonComfort,
      reduceActions && styles.buttonLowEnergy,
      variant === "secondary" && styles.buttonSecondary,
      pressed &&
        !disabled && [
          styles.buttonPressed,
          {
            opacity: pressedOpacity,
            transform: [{ scale: pressedScale }],
          },
        ],
      disabled && styles.buttonDisabled,
    ],
    [comfortMode, disabled, pressedOpacity, pressedScale, reduceActions, variant],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={androidRipple}
      disabled={disabled}
      hitSlop={comfortMode ? 8 : 6}
      onPress={handlePress}
      style={pressableStyle}
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
    paddingHorizontal: 22,
    paddingVertical: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentDeep,
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
    backgroundColor: colors.surfaceAccent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: "transparent",
    elevation: 0,
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
    letterSpacing: 0.15,
    textAlign: "center",
  },
  labelSecondary: {
    color: colors.text,
  },
});

export default memo(AppButton);
