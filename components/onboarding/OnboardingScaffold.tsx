import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

  return (
    <AppScreen title={title} subtitle={subtitle}>
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
          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {errorMessage ? <AppText style={styles.error}>{errorMessage}</AppText> : null}
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
    gap: 20,
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
  error: {
    color: colors.errorText,
    lineHeight: 23,
  },
});
