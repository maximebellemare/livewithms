import { Pressable, StyleSheet, View } from "react-native";
import type { PremiumPlan } from "../../features/premium/types";
import AppText from "../ui/AppText";

type PlanOptionCardProps = {
  plan: PremiumPlan;
  title: string;
  price: string;
  subtitle: string;
  selected: boolean;
  badge?: string;
  onPress: () => void;
};

export default function PlanOptionCard({
  title,
  price,
  subtitle,
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ebd8ca",
    padding: 18,
    gap: 16,
  },
  cardSelected: {
    borderColor: "#e8751a",
    backgroundColor: "#fff1e6",
    shadowColor: "#e8751a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
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
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
  },
  badge: {
    backgroundColor: "#e8751a",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priceContainer: {
    flexWrap: "wrap",
    minHeight: 44,
    justifyContent: "center",
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
    flexShrink: 1,
    lineHeight: 38,
  },
});
