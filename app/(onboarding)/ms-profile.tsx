import { useRouter } from "expo-router";
import { useState } from "react";
import AuthTextField from "../../components/auth/AuthTextField";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import SelectChips from "../../components/onboarding/SelectChips";
import { MS_TYPES, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";

export default function MsProfileScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isSavingStep) return;

    const ok = await saveStep({
      ms_type: draft.ms_type || null,
      year_diagnosed: draft.year_diagnosed || null,
    });

    if (!ok) {
      setErrorMessage("Could not save profile. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.push("/symptoms");
  };

  return (
    <OnboardingScaffold
      title="MS Profile"
      subtitle="Add a few details about your MS journey."
      step={4}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <SelectChips
        options={MS_TYPES}
        selected={draft.ms_type ? [draft.ms_type] : []}
        onChange={(next) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, ms_type: next[0] ?? "" }));
        }}
        multiple={false}
      />
      <AuthTextField
        label="Year Diagnosed"
        value={draft.year_diagnosed ?? ""}
        onChangeText={(value) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, year_diagnosed: value }));
        }}
        placeholder="e.g. 2020"
        keyboardType="default"
      />
    </OnboardingScaffold>
  );
}
