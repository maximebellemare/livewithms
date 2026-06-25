import { ReactNode, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../features/auth/hooks";
import { useSaveProfileStep } from "../../features/profile/hooks";
import AppButton from "../ui/AppButton";
import AppScreen from "../ui/AppScreen";
import AppText from "../ui/AppText";
import { colors, spacing } from "../ui/design";
import StepProgress from "./StepProgress";

type OnboardingScaffoldProps = {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  children: ReactNode;
};

export default function OnboardingScaffold({
  title,
  subtitle,
  step,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Next",
  backLabel = "Back",
  nextDisabled = false,
  loading = false,
  errorMessage,
  children,
}: OnboardingScaffoldProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const saveProfileStep = useSaveProfileStep();
  const [escapeErrorMessage, setEscapeErrorMessage] = useState<string | null>(null);
  const isFinishingLater = saveProfileStep.isPending;

  const handleFinishSetupLater = async () => {
    if (!user?.id || isFinishingLater) {
      return;
    }

    setEscapeErrorMessage(null);

    try {
      await saveProfileStep.mutateAsync({
        userId: user.id,
        input: {
          onboarding_completed: true,
        },
      });
      router.replace("/today");
    } catch {
      setEscapeErrorMessage("Setup could not be finished right now. Please try again.");
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom + 156, 168),
            },
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepProgress step={step} totalSteps={totalSteps} />
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom + 6, 18),
            },
          ]}
        >
          {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
          {escapeErrorMessage ? <AppText style={styles.error}>{escapeErrorMessage}</AppText> : null}
          <View style={styles.actions}>
            {onBack ? <AppButton label={backLabel} onPress={onBack} disabled={loading} variant="secondary" /> : null}
            {onNext ? (
              <AppButton
                label={loading ? "Saving..." : nextLabel}
                onPress={() => {
                  if (loading || nextDisabled) return;
                  void onNext();
                }}
                disabled={loading || nextDisabled}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFinishingLater ? "Finishing setup..." : "Finish setup later"}
              onPress={() => {
                if (loading || isFinishingLater) {
                  return;
                }
                void handleFinishSetupLater();
              }}
              style={({ pressed }) => [
                styles.finishLaterButton,
                pressed && styles.finishLaterButtonPressed,
                (loading || isFinishingLater) && styles.finishLaterButtonDisabled,
              ]}
            >
              <AppText style={styles.finishLaterText}>
                {isFinishingLater ? "Finishing setup..." : "Finish setup later"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 6,
    paddingBottom: 28,
    gap: 20,
  },
  header: {
    gap: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
  body: {
    gap: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f1e1d4",
    backgroundColor: "#fffaf6",
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    gap: 12,
  },
  actions: {
    gap: 14,
  },
  finishLaterButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 16,
    paddingVertical: 6,
  },
  finishLaterButtonPressed: {
    opacity: 0.72,
  },
  finishLaterButtonDisabled: {
    opacity: 0.56,
  },
  finishLaterText: {
    color: colors.textWarm,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  error: {
    color: colors.errorText,
    lineHeight: 23,
  },
});
