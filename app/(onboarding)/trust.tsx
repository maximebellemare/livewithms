import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const BOUNDARY_LINES = [
  "AI in LiveWithMS is here to summarize, reflect, and support gently.",
  "It does not diagnose, treat, or replace medical or mental health care.",
  "It is not for emergencies or crisis care.",
];

export default function TrustScreen() {
  const router = useRouter();

  return (
    <OnboardingScaffold
      title="AI support, with boundaries."
      subtitle="Support here stays calm and helpful, without pretending to be care."
      step={5}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={() => router.push("/reminders")}
      nextLabel="I understand"
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>Clear about what it is, and what it is not.</AppText>
          <AppText style={styles.heroBody}>
            LiveWithMS can help you notice patterns, reflect more clearly, and keep things easier to carry during difficult periods.
          </AppText>
        </View>

        <View style={styles.infoCard}>
          {BOUNDARY_LINES.map((line) => (
            <AppText key={line} style={styles.infoBody}>
              {line}
            </AppText>
          ))}
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
    backgroundColor: "#fff4ec",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f2d8c4",
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#1f2937",
  },
  heroBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 10,
  },
  infoBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
