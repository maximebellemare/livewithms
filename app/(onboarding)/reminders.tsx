import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { useReminderSettings } from "../../features/reminders/hooks";

type ReminderChoice = "enable" | "skip";

export default function ReminderPreferenceScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboarding();
  const reminders = useReminderSettings();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedChoice: ReminderChoice = draft.reminder_preference;

  const handleSelect = (choice: ReminderChoice) => {
    setDraft((current) => ({
      ...current,
      reminder_preference: choice,
    }));
    setErrorMessage(null);
  };

  const handleNext = async () => {
    if (reminders.isSaving || reminders.isLoading) {
      return;
    }

    try {
      if (selectedChoice === "enable") {
        const result = await reminders.enableReminders();

        if (!result.ok) {
          setErrorMessage("Reminders can stay off for now. You can turn them on later in Profile if you want to.");
        }
      } else if (reminders.enabled) {
        await reminders.disableReminders();
      }
    } catch {
      setErrorMessage("We could not update reminders just now. You can always adjust them later in Profile.");
    }

    router.push("/complete");
  };

  return (
    <OnboardingScaffold
      title="Reminders, only if they help."
      subtitle="You can use gentle check-in reminders, or skip them completely."
      step={6}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      loading={reminders.isSaving}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <Pressable
          onPress={() => handleSelect("enable")}
          style={({ pressed }) => [
            styles.optionCard,
            selectedChoice === "enable" && styles.optionCardSelected,
            pressed && styles.optionCardPressed,
          ]}
        >
          <AppText style={styles.optionTitle}>Enable gentle reminders</AppText>
          <AppText style={styles.optionBody}>A small daily nudge can be there when it feels useful.</AppText>
        </Pressable>

        <Pressable
          onPress={() => handleSelect("skip")}
          style={({ pressed }) => [
            styles.optionCard,
            selectedChoice === "skip" && styles.optionCardSelected,
            pressed && styles.optionCardPressed,
          ]}
        >
          <AppText style={styles.optionTitle}>Not now</AppText>
          <AppText style={styles.optionBody}>You can skip reminders completely and still use the app normally.</AppText>
        </Pressable>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 8,
  },
  optionCardSelected: {
    borderColor: "#e8a66f",
    backgroundColor: "#fff9f4",
  },
  optionCardPressed: {
    opacity: 0.86,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  optionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
});
