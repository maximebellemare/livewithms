import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import AuthTextField from "../../components/auth/AuthTextField";
import OnboardingScaffold from "../../components/onboarding/OnboardingScaffold";
import AppText from "../../components/ui/AppText";
import { attributeReferralCodeForUser, normalizeReferralCode } from "../../features/affiliate/mobile";
import { useAuth } from "../../features/auth/hooks";
import { ONBOARDING_STEPS } from "../../features/onboarding/constants";

const INVALID_REFERRAL_MESSAGE = "We couldn't find that creator code.";

export default function ReferralScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supportedCreatorName, setSupportedCreatorName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const normalizedCode = useMemo(() => normalizeReferralCode(referralCode), [referralCode]);
  const hasSuccessState = Boolean(supportedCreatorName);

  const goNext = () => {
    router.push("/complete");
  };

  const handleContinue = async () => {
    if (isSaving) {
      return;
    }

    if (hasSuccessState) {
      goNext();
      return;
    }

    if (!normalizedCode) {
      setErrorMessage(null);
      setSupportedCreatorName(null);
      goNext();
      return;
    }

    if (!user?.id) {
      setErrorMessage("Please sign in again to apply a referral code.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSupportedCreatorName(null);

    try {
      const result = await attributeReferralCodeForUser({
        userId: user.id,
        referralCode: normalizedCode,
        source: "onboarding-referral-step",
      });

      if (!result.ok) {
        if (result.reason === "invalid-referral" || result.reason === "missing-referral") {
          setErrorMessage(INVALID_REFERRAL_MESSAGE);
          return;
        }

        setErrorMessage("We couldn’t apply that code right now. You can skip for now and keep going.");
        return;
      }

      setSupportedCreatorName(result.affiliateName ?? normalizedCode.toUpperCase());
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (isSaving) {
      return;
    }

    setErrorMessage(null);
    setSupportedCreatorName(null);
    goNext();
  };

  return (
    <OnboardingScaffold
      title="Supporting a creator?"
      subtitle="If someone recommended LiveWithMS, enter their code below so they receive credit if you start a subscription."
      step={9}
      totalSteps={ONBOARDING_STEPS.length}
      onBack={handleSkip}
      backLabel="Skip"
      onNext={handleContinue}
      nextLabel="Continue"
      loading={isSaving}
      errorMessage={errorMessage}
    >
      <View style={styles.stack}>
        {hasSuccessState ? (
          <View style={styles.successCard}>
            <AppText style={styles.successEmoji}>❤️</AppText>
            <AppText style={styles.successTitle}>You're supporting {supportedCreatorName}!</AppText>
            <AppText style={styles.successBody}>
              {supportedCreatorName} will receive credit if you start a subscription.
            </AppText>
          </View>
        ) : (
          <>
            <AuthTextField
              label="Referral code"
              value={referralCode}
              onChangeText={(value) => {
                setReferralCode(value);
                setErrorMessage(null);
                setSupportedCreatorName(null);
              }}
              placeholder="Enter creator code"
              autoCapitalize="characters"
            />
            <View style={styles.noteCard}>
              <AppText style={styles.noteTitle}>Optional</AppText>
              <AppText style={styles.noteBody}>
                If a creator, patient advocate, or community member recommended LiveWithMS, their code helps us attribute the referral correctly.
              </AppText>
            </View>
          </>
        )}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  noteCard: {
    backgroundColor: "#fffaf4",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f0ddca",
    padding: 18,
    gap: 8,
  },
  noteTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  noteBody: {
    color: "#6b7280",
    lineHeight: 22,
  },
  successCard: {
    backgroundColor: "#fff6ef",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#f3dcc8",
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 10,
    alignItems: "flex-start",
  },
  successEmoji: {
    fontSize: 26,
    lineHeight: 30,
  },
  successTitle: {
    color: "#7c2d12",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  successBody: {
    color: "#9a3412",
    lineHeight: 23,
  },
});
