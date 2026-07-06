import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const FLOW_STEPS = [
  "Track symptoms, sleep, water, mood, energy, and habits",
  "LiveWithMS organizes your information into one place",
  "Patterns may become easier to notice over time",
  "You can prepare clearer notes for yourself or your clinician",
] as const;

export default function TrackingValueScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="The more you track, the better your insights become."
      subtitle="You do not need perfect data. A few consistent check-ins can still help you stay organized and notice useful patterns."
      step={5}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/community-intro")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Simple in. Clearer out.</AppText>
          <AppText style={styles.heroBody}>
            LiveWithMS is designed to turn short daily tracking into something easier to understand later.
          </AppText>
        </View>

        <View style={styles.flowCard}>
          {FLOW_STEPS.map((line, index) => (
            <View key={line} style={styles.flowRow}>
              <View style={styles.stepBadge}>
                <AppText style={styles.stepBadgeText}>{index + 1}</AppText>
              </View>
              <View style={styles.flowTextBlock}>
                <AppText style={styles.flowText}>{line}</AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <AppText style={styles.noteText}>
            Insights may help you notice what appeared together over time, but they do not diagnose, treat, or replace clinical care.
          </AppText>
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#f3d5bc",
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  flowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff0e1",
    borderWidth: 1,
    borderColor: "#efc7a6",
  },
  stepBadgeText: {
    color: "#b85b14",
    fontWeight: "700",
  },
  flowTextBlock: {
    flex: 1,
    paddingTop: 2,
  },
  flowText: {
    color: "#4b5563",
    lineHeight: 22,
  },
  noteCard: {
    backgroundColor: "#fffaf6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 16,
  },
  noteText: {
    color: "#8b6a4f",
    lineHeight: 21,
  },
});
