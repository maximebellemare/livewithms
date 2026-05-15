import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";
import { colors } from "../ui/design";

export default function PaywallHero() {
  return (
    <View style={styles.container}>
      <AppText style={styles.eyebrow}>LiveWithMS Premium</AppText>
      <AppText style={styles.title}>Deeper support, at a steadier pace</AppText>
      <AppText style={styles.subtitle}>
        Keep the free core experience, or add more personalized support if you want a little more depth. Premium is optional.
      </AppText>
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
});
