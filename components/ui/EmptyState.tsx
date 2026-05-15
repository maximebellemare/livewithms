import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
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
  const fallback = deriveNonJudgmentalEmptyStates({ context: "empty" });
  const warmth = deriveSubtleHumanWarmth({ surface: "empty" });

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>
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
    padding: 24,
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    color: colors.textMuted,
  },
});
