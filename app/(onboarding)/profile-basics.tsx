import { useRouter } from "expo-router";
import { useState } from "react";
import AuthTextField from "../../components/auth/AuthTextField";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";
import { getErrorMessage } from "../../lib/errors";

export default function ProfileBasicsScreen() {
  const router = useRouter();
  const { draft, setDraft, saveStep, isSavingStep } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isSavingStep) return;
    if (!draft.display_name.trim()) {
      setErrorMessage("Display name is required.");
      return;
    }

    const ok = await saveStep({
      display_name: draft.display_name || null,
    });

    if (!ok) {
      setErrorMessage("That step did not save just yet. Please try again in a moment.");
      return;
    }

    setErrorMessage(null);
    router.push("/ms-profile");
  };

  return (
    <OnboardingScaffold
      title="Profile Basics"
      subtitle="Tell us how you’d like to be addressed."
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      loading={isSavingStep}
      errorMessage={errorMessage}
    >
      <AuthTextField
        label="Display Name"
        value={draft.display_name ?? ""}
        onChangeText={(value) => {
          setErrorMessage(null);
          setDraft((current) => ({ ...current, display_name: value }));
        }}
        placeholder="Your name"
        autoCapitalize="words"
      />
    </OnboardingScaffold>
  );
}
