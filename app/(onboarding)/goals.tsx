import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import {
  deriveGoalsFromPriorities,
  getSelectedOnboardingPriorities,
  ONBOARDING_PRIORITY_OPTIONS,
  toggleOnboardingPriority,
  type OnboardingPriorityKey,
} from "../../features/onboarding/personalization";
import { trackEvent } from "../../lib/events";

export default function PrioritiesScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedPriorities = getSelectedOnboardingPriorities(draft);

  const handleSelect = (key: OnboardingPriorityKey) => {
    setErrorMessage(null);
    const nextDraft = toggleOnboardingPriority(draft, key);
    const nextSelectedPriorities = getSelectedOnboardingPriorities(nextDraft);
    const isSelected = nextSelectedPriorities.includes(key);
    setDraft(nextDraft);
    void trackEvent("onboarding_priority_selected", {
      priority: key,
      selected: isSelected,
      selectedCount: nextSelectedPriorities.length,
      selectedKeys: nextSelectedPriorities.join("|"),
    });
  };

  const handleNext = async () => {
    if (!selectedPriorities.length) {
      return;
    }

    const goals = deriveGoalsFromPriorities(draft.symptoms);
    setDraft((current) => ({
      ...current,
      goals,
    }));
    const ok = await saveStep({
      symptoms: draft.symptoms,
      goals,
    });
    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    router.push("/plan");
  };

  return (
    <OnboardingScaffold
      title="What would you like support with?"
      subtitle="Choose any that feel relevant. This just helps the app begin in a calmer, more useful place."
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      nextDisabled={!selectedPriorities.length || isSavingStep}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.chipGrid}>
          {ONBOARDING_PRIORITY_OPTIONS.map((option) => {
            const isSelected = selectedPriorities.includes(option.key);

            return (
              <Pressable
                key={option.key}
                onPress={() => handleSelect(option.key)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <AppText style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{option.title}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chip: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: "#e8a66f",
    backgroundColor: "#fff4ea",
  },
  chipPressed: {
    opacity: 0.84,
  },
  chipLabel: {
    color: "#4b5563",
    lineHeight: 20,
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: "#b85b14",
  },
});
