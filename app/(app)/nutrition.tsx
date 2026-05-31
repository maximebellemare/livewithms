import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { NutritionScreenContent } from "../../components/care/CareScreen";
import AppScreen from "../../components/ui/AppScreen";
import AppText from "../../components/ui/AppText";

export default function NutritionScreen() {
  return (
    <AppScreen
      eyebrow="Care"
      title="Nutrition"
      subtitle="Build a nutrition plan based on your goals and preferences."
    >
      <View style={styles.backRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <AppText style={styles.backButtonText}>Back to Care</AppText>
        </Pressable>
      </View>
      <NutritionScreenContent />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead8ca",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonPressed: {
    opacity: 0.86,
  },
  backButtonText: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
});
