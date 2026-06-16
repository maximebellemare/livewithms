import { StyleSheet, View } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { deriveStateSurfacePresentation } from "../../lib/calm-environment";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";
import CalmSkeleton from "./CalmSkeleton";
import { deriveNonJudgmentalEmptyStates } from "../../lib/humane-micro-moments/humane-empty-states/deriveNonJudgmentalEmptyStates";
import { deriveSubtleHumanWarmth } from "../../lib/humane-micro-moments/quiet-warmth/deriveSubtleHumanWarmth";
import { preventOverfamiliarity } from "../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";
import { preserveSubtleReliefMoments } from "../../lib/humane-micro-moments/non-performative-delight/preserveSubtleReliefMoments";
type LoadingStateProps = {
  message?: string;
  debugLabel?: string | null;
};

const BUILD_MARKER = "ANDROID DEBUG BUILD: routegate-fix-v2";

export default function LoadingState({ message = "Getting things ready...", debugLabel = null }: LoadingStateProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const presentation = deriveStateSurfacePresentation(calmEnvironment);
  const fallback = deriveNonJudgmentalEmptyStates({ context: "loading" });
  const warmth = deriveSubtleHumanWarmth({ surface: "loading" });
  const skeletonWidths: Array<`${number}%`> =
    presentation.skeletonLines === 2 ? ["78%", "58%"] : ["72%", "88%", "58%"];

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
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      >
        <View style={[styles.indicator, presentation.useStaticLoadingIndicator && styles.indicatorStatic]} />
        <View style={styles.skeletonGroup}>
          {skeletonWidths.map((width) => (
            <CalmSkeleton key={width} width={width} height={12} />
          ))}
        </View>
        <AppText
          style={[
            styles.message,
            presentation.reduceTextWalls && styles.messageReducedWall,
            presentation.useStaticLoadingIndicator && styles.messageSoftened,
          ]}
        >
          {preserveSubtleReliefMoments(
            preventOverfamiliarity(`${message} ${fallback} ${warmth}`.trim()),
          )}
        </AppText>
        <AppText style={styles.buildMarker}>{BUILD_MARKER}</AppText>
        {debugLabel ? <AppText style={styles.debugLabel}>{debugLabel}</AppText> : null}
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
    minWidth: 240,
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 24,
    ...shadows.soft,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  indicatorStatic: {
    opacity: 0.52,
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  messageReducedWall: {
    maxWidth: 296,
  },
  messageSoftened: {
    opacity: 0.94,
  },
  buildMarker: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "700",
  },
  debugLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    opacity: 0.9,
  },
  skeletonGroup: {
    width: "100%",
    gap: 8,
    marginTop: 2,
  },
});
