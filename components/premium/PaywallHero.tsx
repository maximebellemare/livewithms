import { StyleSheet, View } from "react-native";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import AppText from "../ui/AppText";
import { colors } from "../ui/design";

export default function PaywallHero() {
  const positioning = derivePremiumPositioning();

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glowPrimary} />
      <View pointerEvents="none" style={styles.glowSecondary} />
      <AppText style={styles.eyebrow}>LiveWithMS Premium</AppText>
      <AppText style={styles.title}>{positioning.heroTitle}</AppText>
      <AppText style={styles.subtitle}>{positioning.heroSubtitle}</AppText>
      <AppText style={styles.body}>{positioning.heroBody}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    padding: 22,
    shadowColor: "rgba(120, 71, 29, 0.22)",
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  glowPrimary: {
    position: "absolute",
    top: -44,
    right: -28,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: colors.accentGlow,
  },
  glowSecondary: {
    position: "absolute",
    bottom: -56,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 182, 0.55)",
  },
  eyebrow: {
    color: colors.accentDeep,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textBody,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
  },
});
