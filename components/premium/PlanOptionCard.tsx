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
  disabled?: boolean;
};

export default function PlanOptionCard({
  title,
  price,
  subtitle,
  detail,
  selected,
  badge,
  onPress,
  disabled = false,
}: PlanOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
    >
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
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 18,
    gap: 16,
    ...shadows.floating,
  },
  cardSelected: {
    borderColor: colors.accentDeep,
    backgroundColor: colors.surfaceAccent,
    shadowColor: colors.accentGlow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardDisabled: {
    opacity: 0.92,
  },
  cardPressed: {
    opacity: 0.88,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  priceContainer: {
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 6,
  },
  price: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    flexShrink: 1,
    lineHeight: 36,
    width: "100%",
  },
  detail: {
    flexShrink: 1,
    width: "100%",
    color: colors.textWarm,
    fontSize: 13,
    lineHeight: 19,
  },
});
