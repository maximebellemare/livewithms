import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import OnboardingOptionSelector from "../../components/onboarding/OnboardingOptionSelector";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_CHALLENGE_OPTIONS, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { persistOnboardingDraftSnapshot } from "../../features/onboarding/preferences";
import { buildOnboardingSymptoms } from "../../features/onboarding/personalization";

export default function ChallengesScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleOption = (value: string) => {
    setErrorMessage(null);
    setDraft((current) => ({
      ...current,
      hardest_challenges: current.hardest_challenges.includes(value)
        ? current.hardest_challenges.filter((item) => item !== value)
        : [...current.hardest_challenges, value],
    }));
  };

  const handleNext = async () => {
    if (isSavingStep) {
      return;
    }

    const compiledSymptoms = buildOnboardingSymptoms(draft);
    if (compiledSymptoms.length === 0) {
      setErrorMessage("Choose at least one area that feels hardest right now.");
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
    router.push("/goals");
  };

  return (
    <OnboardingScaffold
      title="What feels hardest to manage with MS right now?"
      subtitle="Choose more than one if you want. This helps LiveWithMS start with the right support."
      step={2}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Continue"
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        <View style={styles.infoCard}>
          <AppText style={styles.infoTitle}>Start with what feels real today.</AppText>
          <AppText style={styles.infoBody}>
            These answers help shape Today, Coach, Programs, and the first patterns you see later.
          </AppText>
        </View>

        <OnboardingOptionSelector
          options={ONBOARDING_CHALLENGE_OPTIONS}
          selected={draft.hardest_challenges}
          onToggle={toggleOption}
          customValue={draft.hardest_challenges_custom}
          onCustomChange={(value) => {
            setErrorMessage(null);
            setDraft((current) => ({ ...current, hardest_challenges_custom: value }));
          }}
          customPlaceholder="Other challenge"
          helperText="You can add a custom challenge if something important is missing."
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
