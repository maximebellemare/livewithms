import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { persistOnboardingSupportStyle } from "../../features/onboarding/preferences";
import {
  ONBOARDING_SUPPORT_STYLE_OPTIONS,
  type OnboardingSupportStyleKey,
} from "../../features/onboarding/personalization";

export default function SupportStyleScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);

  const selectedStyle = draft.support_style;

  const handleSelect = (key: OnboardingSupportStyleKey) => {
    setDraft((current) => ({
      ...current,
      support_style: key,
      low_energy_mode: key === "low-energy",
    }));
  };

  const handleNext = async () => {
    if (!selectedStyle || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await persistOnboardingSupportStyle(selectedStyle);
      router.push("/complete");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      title="Choose your starting layout."
      subtitle="Low-Energy Mode visibly simplifies the app. You can change this later in Profile."
      step={7}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      nextDisabled={!selectedStyle || isSaving}
      loading={isSaving}
    >
      <View style={styles.stack}>
        {ONBOARDING_SUPPORT_STYLE_OPTIONS.map((option) => {
          const isSelected = selectedStyle === option.key;

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
                    {isSelected ? "Selected" : "Choose"}
                  </AppText>
                </View>
              </View>
              <AppText style={styles.optionBody}>{option.body}</AppText>
              {option.key === "low-energy" ? (
                <View style={styles.impactList}>
                  <AppText style={styles.impactText}>Reduces visible suggestions</AppText>
                  <AppText style={styles.impactText}>Shows fewer insight and exercise cards</AppText>
                  <AppText style={styles.impactText}>Uses simplified layouts on heavier screens</AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  impactList: {
    gap: 4,
    marginTop: 4,
  },
  impactText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  selectionBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ead9cb",
    backgroundColor: "#fffaf6",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectionBadgeSelected: {
    borderColor: "#e8a66f",
    backgroundColor: "#fff0e2",
  },
  selectionBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#8b6a4f",
  },
  selectionBadgeTextSelected: {
    color: "#c25d10",
  },
});
