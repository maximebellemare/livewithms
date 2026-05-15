import { ActivityIndicator, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";
import { deriveNonJudgmentalEmptyStates } from "../../lib/humane-micro-moments/humane-empty-states/deriveNonJudgmentalEmptyStates";
import { deriveSubtleHumanWarmth } from "../../lib/humane-micro-moments/quiet-warmth/deriveSubtleHumanWarmth";
import { preventOverfamiliarity } from "../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";
import { preserveSubtleReliefMoments } from "../../lib/humane-micro-moments/non-performative-delight/preserveSubtleReliefMoments";
import { deriveCalmMotionPacing } from "../../lib/humane-micro-moments/sensory-refinement/deriveCalmMotionPacing";

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({ message = "Getting things ready..." }: LoadingStateProps) {
  const fallback = deriveNonJudgmentalEmptyStates({ context: "loading" });
  const warmth = deriveSubtleHumanWarmth({ surface: "loading" });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.accent} />
        <AppText style={styles.message}>
          {preserveSubtleReliefMoments(
            preventOverfamiliarity(`${message} ${fallback} ${warmth}`.trim()),
          )}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.page,
  },
  card: {
    minWidth: 240,
    maxWidth: 360,
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...shadows.soft,
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    opacity: deriveCalmMotionPacing({}).motionScale < 1 ? 0.94 : 1,
  },
});
