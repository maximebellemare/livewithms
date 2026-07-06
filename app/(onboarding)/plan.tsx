import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import OnboardingOptionSelector from "../../components/onboarding/OnboardingOptionSelector";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import {
  ONBOARDING_HELP_FIRST_OPTIONS,
  ONBOARDING_MOTIVATION_OPTIONS,
  ONBOARDING_STEPS,
} from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { persistOnboardingDraftSnapshot } from "../../features/onboarding/preferences";
import { buildOnboardingGoals } from "../../features/onboarding/personalization";

export default function HelpFirstScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleHelpFirst = (value: string) => {
    setErrorMessage(null);
    setDraft((current) => ({
      ...current,
      help_first: current.help_first.includes(value)
        ? current.help_first.filter((item) => item !== value)
        : [...current.help_first, value],
    }));
  };

  const handleNext = async () => {
    if (isSavingStep) {
      return;
    }

    const compiledGoals = buildOnboardingGoals(draft);
    if (compiledGoals.length === 0) {
      setErrorMessage("Choose at least one kind of help you want first.");
      return;
    }

    if (!draft.motivation_level) {
      setErrorMessage("Choose how motivated you feel for the next 7 days.");
      return;
    }

    const nextDraft = {
      ...draft,
      goals: compiledGoals,
    };
    setDraft(nextDraft);
    await persistOnboardingDraftSnapshot(nextDraft);

    const ok = await saveStep({
      goals: compiledGoals,
    });

    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.push("/exercises");
  };

  return (
    <OnboardingScaffold
      title="What would you like help with first?"
      subtitle="This helps LiveWithMS emphasize the most useful tools first."
      step={4}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <OnboardingOptionSelector
          title="Choose your first support areas"
          description="You can choose more than one."
          options={ONBOARDING_HELP_FIRST_OPTIONS}
          selected={draft.help_first}
          onToggle={toggleHelpFirst}
        />

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>How motivated are you to track your health for the next 7 days?</AppText>
          <View style={styles.motivationStack}>
            {ONBOARDING_MOTIVATION_OPTIONS.map((option) => {
              const isSelected = draft.motivation_level === option.key;

              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    setErrorMessage(null);
                    setDraft((current) => ({ ...current, motivation_level: option.key }));
                  }}
                  style={({ pressed }) => [
                    styles.motivationCard,
                    isSelected && styles.motivationCardSelected,
                    pressed && styles.motivationCardPressed,
                  ]}
                >
                  <AppText style={[styles.motivationTitle, isSelected && styles.motivationTitleSelected]}>
                    {option.title}
                  </AppText>
                  <AppText style={styles.motivationBody}>{option.body}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  motivationStack: {
    gap: 12,
  },
  motivationCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    padding: 16,
    gap: 6,
  },
  motivationCardSelected: {
    borderColor: "#e88f4b",
    backgroundColor: "#fff2e6",
  },
  motivationCardPressed: {
    opacity: 0.86,
  },
  motivationTitle: {
    color: "#1f2937",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  motivationTitleSelected: {
    color: "#b85b14",
  },
  motivationBody: {
    color: "#6b7280",
    lineHeight: 21,
  },
});
