import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import {
  getSelectedOnboardingPriorities,
  ONBOARDING_PRIORITY_OPTIONS,
  toggleOnboardingPriority,
  type OnboardingPriorityKey,
} from "../../features/onboarding/personalization";
import { trackEvent } from "../../lib/events";

export default function GoalsScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const selectedPriorities = getSelectedOnboardingPriorities(draft);

  const handleSelect = (key: OnboardingPriorityKey) => {
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

    await saveStep({
      symptoms: draft.symptoms,
    });
    router.push("/plan");
  };

  return (
    <OnboardingScaffold
      title="What feels hardest lately?"
      subtitle="Select any that apply. This helps keep your guidance more relevant from the start."
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      nextDisabled={!selectedPriorities.length || isSavingStep}
      loading={isSavingStep}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>This helps shape your first guidance.</AppText>
          <AppText style={styles.heroBody}>
            We’ll use this only to make the next steps feel more relevant, not heavier.
          </AppText>
        </View>

        {ONBOARDING_PRIORITY_OPTIONS.map((option) => {
          const isSelected = selectedPriorities.includes(option.key);

          return (
            <Pressable
              key={option.key}
              onPress={() => handleSelect(option.key)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
            >
              <View style={styles.optionHeader}>
                <AppText style={styles.optionTitle}>{option.title}</AppText>
                <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeSelected]}>
                  <AppText style={[styles.selectionBadgeText, isSelected && styles.selectionBadgeTextSelected]}>
                    {isSelected ? "Selected" : "Tap to add"}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.optionBody}>{option.body}</AppText>
            </Pressable>
          );
        })}
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
  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 6,
  },
  optionCardSelected: {
    borderColor: "#e8a66f",
    backgroundColor: "#fff9f4",
  },
  optionCardPressed: {
    opacity: 0.86,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
  },
  optionBody: {
    color: "#4b5563",
    lineHeight: 22,
  },
  selectionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectionBadgeSelected: {
    borderColor: "#e8a66f",
    backgroundColor: "#fff0e2",
  },
  selectionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  selectionBadgeTextSelected: {
    color: "#c25d10",
  },
});
