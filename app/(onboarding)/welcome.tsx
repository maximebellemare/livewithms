import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { trackEvent } from "../../lib/events";

const PROMISE_POINTS = [
  "Track symptoms and energy without making the day feel clinical.",
  "See patterns that may help you stay organized over time.",
  "Use AI support, nutrition tools, brain games, and community support in one place.",
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    void trackEvent("onboarding_started", {
      step: "welcome",
    });
  }, []);

  return (
    <OnboardingScaffold
      title="Understand your MS patterns and feel more supported day to day."
      subtitle="LiveWithMS helps you track symptoms, protect energy, build routines, use AI support, plan nutrition, and notice patterns over time."
      step={1}
      totalSteps={ONBOARDING_STEPS.length}
      onNext={() => router.push("/symptoms")}
      nextLabel="Start"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroEyebrow}>A calmer daily command center</AppText>
          <AppText style={styles.heroTitle}>Built for real MS days, not perfect ones.</AppText>
          <AppText style={styles.heroBody}>
            The goal is not to track everything. It is to make daily management feel clearer, lighter, and more organized.
          </AppText>
        </View>

        <View style={styles.infoCard}>
          {PROMISE_POINTS.map((point) => (
            <View key={point} style={styles.listRow}>
              <View style={styles.dot} />
              <AppText style={styles.listText}>{point}</AppText>
            </View>
          ))}
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#fff4ea",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f3d5bc",
    padding: 22,
    gap: 10,
  },
  heroEyebrow: {
    color: "#c25d10",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: "#1f2937",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 23,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 8,
    backgroundColor: "#e8751a",
  },
  listText: {
    flex: 1,
    color: "#4b5563",
    lineHeight: 22,
  },
});
