import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { deriveStateSurfacePresentation } from "../../lib/calm-environment";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";
import { deriveNonJudgmentalEmptyStates } from "../../lib/humane-micro-moments/humane-empty-states/deriveNonJudgmentalEmptyStates";
import { preserveEmotionalSpaciousness } from "../../lib/humane-micro-moments/humane-empty-states/preserveEmotionalSpaciousness";
import { deriveSubtleHumanWarmth } from "../../lib/humane-micro-moments/quiet-warmth/deriveSubtleHumanWarmth";
import { preventOverfamiliarity } from "../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";
import { preventDopamineUX } from "../../lib/humane-micro-moments/non-performative-delight/preventDopamineUX";
import { preserveSubtleReliefMoments } from "../../lib/humane-micro-moments/non-performative-delight/preserveSubtleReliefMoments";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const presentation = deriveStateSurfacePresentation(calmEnvironment);
  const fallback = deriveNonJudgmentalEmptyStates({ context: "empty" });
  const warmth = deriveSubtleHumanWarmth({ surface: "empty" });

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: presentation.cardPaddingHorizontal,
          paddingVertical: presentation.cardPaddingVertical,
          gap: presentation.cardGap,
        },
      ]}
    >
      <AppText style={[styles.title, presentation.reduceTextWalls && styles.titleReducedWall]}>{title}</AppText>
      <AppText style={[styles.message, presentation.reduceTextWalls && styles.messageReducedWall]}>
        {preserveSubtleReliefMoments(
          preventDopamineUX(
            preventOverfamiliarity(
              preserveEmotionalSpaciousness(`${message} ${fallback} ${warmth}`.trim()),
            ),
          ),
        )}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 26,
    paddingVertical: 28,
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
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
    maxWidth: 280,
  },
  message: {
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 24,
  },
  messageReducedWall: {
    maxWidth: 300,
  },
});
