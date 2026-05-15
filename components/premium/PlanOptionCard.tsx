import { Pressable, StyleSheet, View } from "react-native";
import type { PremiumPlan } from "../../features/premium/types";
import AppText from "../ui/AppText";
import { colors, radii, shadows } from "../ui/design";

type PlanOptionCardProps = {
  plan: PremiumPlan;
  title: string;
  price: string;
  subtitle: string;
  detail?: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
};

export default function PlanOptionCard({
  title,
  price,
  subtitle,
  detail,
  selected,
  badge,
  onPress,
}: PlanOptionCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.header}>
        <View style={styles.textBlock}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </View>
        {badge ? <AppText style={styles.badge}>{badge}</AppText> : null}
      </View>
      <View style={styles.priceContainer}>
        <AppText style={styles.price}>{price}</AppText>
        {detail ? <AppText style={styles.detail}>{detail}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
    ...shadows.soft,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: colors.accent,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  priceContainer: {
    flexWrap: "wrap",
    minHeight: 44,
    justifyContent: "center",
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    flexShrink: 1,
    lineHeight: 38,
  },
  detail: {
    marginTop: 4,
    color: colors.textWarm,
    fontSize: 13,
    lineHeight: 18,
  },
});
