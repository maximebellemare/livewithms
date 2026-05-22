import { memo } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";
import { colors, radii, shadows, spacing } from "../ui/design";
import type { ReflectionSurfaceCard as ReflectionSurfaceCardModel } from "../../lib/reflection-surfaces/types";

const KIND_LABELS: Record<ReflectionSurfaceCardModel["kind"], string> = {
  "gentle-observation": "Gentle noticing",
  "quiet-win": "Quiet win",
  "calming-continuity": "Continuity",
  "pacing-reinforcement": "Pacing",
  "emotional-awareness": "Reflection",
  "resilience-reflection": "Resilience",
};

type ReflectionCardProps = {
  card: ReflectionSurfaceCardModel;
};

function ReflectionCard({ card }: ReflectionCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.kicker}>{KIND_LABELS[card.kind]}</AppText>
      <AppText style={styles.title}>{card.title}</AppText>
      <AppText style={styles.body}>{card.body}</AppText>
    </View>
  );
}

export default memo(ReflectionCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: 10,
    ...shadows.soft,
  },
  kicker: {
    color: colors.textWarm,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
  },
  body: {
    color: colors.textBody,
    fontSize: 15,
    lineHeight: 24,
  },
});
