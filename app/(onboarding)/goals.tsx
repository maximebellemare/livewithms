import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingOptionSelector from "../../components/onboarding/OnboardingOptionSelector";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS, ONBOARDING_TRACKING_OPTIONS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { persistOnboardingDraftSnapshot } from "../../features/onboarding/preferences";
import { buildOnboardingSymptoms } from "../../features/onboarding/personalization";

export default function TrackingFocusScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleOption = (value: string) => {
    setErrorMessage(null);
    setDraft((current) => ({
      ...current,
      tracking_focuses: current.tracking_focuses.includes(value)
        ? current.tracking_focuses.filter((item) => item !== value)
        : [...current.tracking_focuses, value],
    }));
  };

  const handleNext = async () => {
    if (isSavingStep) {
      return;
    }

    const compiledSymptoms = buildOnboardingSymptoms(draft);
    if (compiledSymptoms.length === 0) {
      setErrorMessage("Choose at least one thing you want to track.");
      return;
    }

    const nextDraft = {
      ...draft,
      symptoms: compiledSymptoms,
    };
    setDraft(nextDraft);
    await persistOnboardingDraftSnapshot(nextDraft);

    const ok = await saveStep({
      symptoms: compiledSymptoms,
    });

    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.push("/plan");
  };

  return (
    <OnboardingScaffold
      title="What do you want to track most often?"
      subtitle="LiveWithMS can start with the symptoms, body signals, and daily factors that matter most to you."
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>Track what is worth watching.</AppText>
          <AppText style={styles.infoBody}>
            You do not need to track everything. Choosing a few useful signals can make patterns easier to understand.
          </AppText>
        </View>

        <OnboardingOptionSelector
          options={ONBOARDING_TRACKING_OPTIONS}
          selected={draft.tracking_focuses}
          onToggle={toggleOption}
          customValue={draft.tracking_focuses_custom}
          onCustomChange={(value) => {
            setErrorMessage(null);
            setDraft((current) => ({ ...current, tracking_focuses_custom: value }));
          }}
          customPlaceholder="Other thing to track"
          helperText="Add anything you want to keep an eye on regularly."
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 6,
  },
  infoTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
});
