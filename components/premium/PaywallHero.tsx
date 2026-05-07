import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";

export default function PaywallHero() {
  return (
    <View style={styles.container}>
      <AppText style={styles.eyebrow}>LiveWithMS</AppText>
      <AppText style={styles.title}>Understand your MS patterns and feel more in control</AppText>
      <AppText style={styles.subtitle}>
        Keep checking in, review your history, and use the app’s support tools in one place.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  eyebrow: {
    color: "#e8751a",
    fontWeight: "700",
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#1f2937",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 16,
    lineHeight: 24,
  },
});
