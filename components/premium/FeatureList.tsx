import { StyleSheet, View } from "react-native";
import { derivePremiumPositioning } from "../../lib/premium-ecosystem/calm-premium/derivePremiumPositioning";
import AppText from "../ui/AppText";

export default function FeatureList() {
  const positioning = derivePremiumPositioning();

  return (
    <View style={styles.container}>
      {positioning.primaryLines.map((feature) => (
        <View key={feature} style={styles.row}>
          <View style={styles.dot} />
          <AppText style={styles.text}>{feature}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: "#e8751a",
  },
  text: {
    flex: 1,
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
  },
});
