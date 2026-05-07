import { useRouter } from "expo-router";
import { useState } from "react";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";
import { useOnboarding } from "../../features/onboarding/hooks";

export default function CompleteScreen() {
  const router = useRouter();
  const { completeOnboarding, isCompleting } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = async () => {
    if (isCompleting) return;

    const ok = await completeOnboarding();
    if (!ok) {
      setErrorMessage("Unable to finish onboarding. Please try again.");
      return;
    }

    setErrorMessage(null);
    router.replace("/today");
  };

  return (
    <OnboardingScaffold
      title="Complete"
      subtitle="Finish setup and continue to the app."
      step={9}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={() => router.back()}
      onNext={handleNext}
      nextLabel="Finish"
      loading={isCompleting}
      errorMessage={errorMessage}
    >
      <AppText>You’re all set. We’ll save your profile and take you straight into the app.</AppText>
    </OnboardingScaffold>
  );
}
