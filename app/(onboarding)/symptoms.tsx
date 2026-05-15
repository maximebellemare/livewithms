import { useRouter } from "expo-router";
import { StyleSheet, Pressable, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import {
  getSelectedOnboardingFocuses,
  ONBOARDING_FOCUS_OPTIONS,
  toggleOnboardingFocus,
  type OnboardingFocusKey,
} from "../../features/onboarding/personalization";
import { trackEvent } from "../../lib/events";

export default function SymptomsScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const selectedFocuses = getSelectedOnboardingFocuses(draft);

  const handleSelect = (key: OnboardingFocusKey) => {
    const nextDraft = toggleOnboardingFocus(draft, key);
    const nextSelectedFocuses = getSelectedOnboardingFocuses(nextDraft);
    const isSelected = nextSelectedFocuses.includes(key);
    setDraft(nextDraft);
    void trackEvent("onboarding_branch_selected", {
      branch: key,
      selected: isSelected,
      selectedCount: nextSelectedFocuses.length,
      selectedKeys: nextSelectedFocuses.join("|"),
    });
  };

  const handleNext = async () => {
    if (!selectedFocuses.length) {
      return;
    }

    await saveStep({
      goals: draft.goals,
    });
    router.push("/goals");
  };

  return (
    <OnboardingScaffold
      title="What would help you most right now?"
      subtitle="Select any that apply. We’ll use them to keep your first steps more relevant, not heavier."
      step={2}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      nextDisabled={!selectedFocuses.length || isSavingStep}
      loading={isSavingStep}
    >
      <View style={styles.stack}>
        <View style={styles.heroCard}>
          <AppText style={styles.heroTitle}>We’ll keep this simple.</AppText>
          <AppText style={styles.heroBody}>
            Choose one or a few areas. A small amount of tailoring is enough.
          </AppText>
        </View>

        {ONBOARDING_FOCUS_OPTIONS.map((option) => {
          const isSelected = selectedFocuses.includes(option.key);

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
