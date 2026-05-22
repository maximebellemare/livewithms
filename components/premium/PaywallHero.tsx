import { StyleSheet, View } from "react-native";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import AppText from "../ui/AppText";
import { colors } from "../ui/design";

export default function PaywallHero() {
  const positioning = derivePremiumPositioning();

  return (
    <View style={styles.container}>
      <AppText style={styles.eyebrow}>LiveWithMS Premium</AppText>
      <AppText style={styles.title}>{positioning.heroTitle}</AppText>
      <AppText style={styles.subtitle}>{positioning.heroSubtitle}</AppText>
      <AppText style={styles.body}>{positioning.heroBody}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  eyebrow: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
