import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import SelectChips from "../../components/onboarding/SelectChips";
import { AGE_RANGES, COUNTRIES, ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { deriveCategoryDefiningPositioning } from "../../lib/product-identity/deriveCategoryDefiningPositioning";

export default function AboutYouScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const positioning = deriveCategoryDefiningPositioning();

  const handleNext = async () => {
    if (isSavingStep) return;

    const ok = await saveStep({
      country: draft.country || null,
      age_range: draft.age_range || null,
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
      title="About You"
      subtitle={positioning.onboardingPrivacyLine}
      step={7}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <SelectChips
        options={COUNTRIES}
        selected={draft.country ? [draft.country] : []}
        onChange={(next) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, country: next[0] ?? "" }));
        }}
        multiple={false}
      />
      <SelectChips
        options={AGE_RANGES}
        selected={draft.age_range ? [draft.age_range] : []}
        onChange={(next) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, age_range: next[0] ?? "" }));
        }}
        multiple={false}
      />
    </OnboardingScaffold>
  );
}
