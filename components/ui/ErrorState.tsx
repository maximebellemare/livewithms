import { StyleSheet, View } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { deriveStateSurfacePresentation } from "../../lib/calm-environment";
import AppButton from "./AppButton";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";
import { deriveEmotionallySafeErrors } from "../../lib/operational-excellence/calm-error-states/deriveEmotionallySafeErrors";
import { preventTechnicalOverwhelm } from "../../lib/operational-excellence/calm-error-states/preventTechnicalOverwhelm";
import { preserveDependableBehavior } from "../../lib/operational-excellence/invisible-reliability/preserveDependableBehavior";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title,
  message,
  onRetry,
}: ErrorStateProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const presentation = deriveStateSurfacePresentation(calmEnvironment);
  const safeError = deriveEmotionallySafeErrors({ category: "unknown", retryable: Boolean(onRetry) });
  const softenedMessage = preserveDependableBehavior(preventTechnicalOverwhelm(message));

  return (
    <View style={[styles.container, { padding: presentation.outerPadding }]}>
      <View
        style={[
          styles.card,
          {
            maxWidth: presentation.maxWidth,
            gap: presentation.cardGap,
            paddingHorizontal: presentation.cardPaddingHorizontal,
            paddingVertical: presentation.cardPaddingVertical,
          },
        ]}
      >
        <AppText style={[styles.title, presentation.reduceTextWalls && styles.titleReducedWall]}>
          {title ?? safeError.title}
        </AppText>
        <AppText style={[styles.message, presentation.reduceTextWalls && styles.messageReducedWall]}>
          {softenedMessage}
        </AppText>
        <AppText style={[styles.supportLine, presentation.reduceTextWalls && styles.messageReducedWall]}>
          {safeError.message}
        </AppText>
        {onRetry ? <AppButton label={safeError.retryLabel} onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.page,
  },
  card: {
    width: "100%",
    gap: 12,
    minWidth: 240,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 24,
    ...shadows.soft,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  titleReducedWall: {
    maxWidth: 284,
    alignSelf: "center",
  },
  message: {
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 24,
  },
  messageReducedWall: {
    maxWidth: 304,
    alignSelf: "center",
  },
  supportLine: {
    textAlign: "center",
    color: colors.textWarm,
    lineHeight: 21,
    fontSize: 14,
  },
});
