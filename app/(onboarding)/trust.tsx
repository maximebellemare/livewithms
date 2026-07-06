import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { getPersonalizedOnboardingGuidance } from "../../features/onboarding/personalization";

export default function PersonalizedSummaryScreen() {
  const router = useRouter();
  const { draft } = useOnboarding();
  const guidance = getPersonalizedOnboardingGuidance(draft);

  return (
    <OnboardingScaffold
      title={guidance.title}
      subtitle="This summary is based on what you chose so far and can change as you use the app."
      step={8}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/referral")}
      nextLabel="Continue"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>{guidance.body}</AppText>
          <AppText style={styles.heroBody}>{guidance.nextSecondary}</AppText>
        </View>

        <View style={styles.summaryCard}>
          {guidance.points.map((point) => (
            <View key={point} style={styles.listRow}>
              <View style={styles.dot} />
              <AppText style={styles.listText}>{point}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <AppText style={styles.noteText}>
            LiveWithMS may help you notice patterns and stay organized, but it does not diagnose, treat, or replace clinical care.
          </AppText>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#fff4ea",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#f3d5bc",
    padding: 22,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 12,
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
