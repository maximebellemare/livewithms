import { PropsWithChildren, useMemo, useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppUpdateCheck } from "../../features/app-updates/hooks";
import AppButton from "./AppButton";
import AppText from "./AppText";
import { colors, radii, shadows, spacing } from "./design";

type AppUpdateGateProps = PropsWithChildren<{
  app: string;
  enabled: boolean;
}>;

function getDefaultStoreLabel() {
  return Platform.OS === "android" ? "Open Play Store" : "Open App Store";
}

function getDefaultMessage(kind: "required" | "recommended") {
  if (kind === "required") {
    return "A newer version of LiveWithMS is required before you can continue.";
  }

  return "A newer version of LiveWithMS is available with the latest improvements.";
}

export default function AppUpdateGate({ app, enabled, children }: AppUpdateGateProps) {
  const { decision } = useAppUpdateCheck({ app, enabled });
  const [softDismissed, setSoftDismissed] = useState(false);

  const storeLabel = getDefaultStoreLabel();
  const isRequired = decision.kind === "required";
  const isRecommended = decision.kind === "recommended" && !softDismissed;
  const shouldShow = enabled && (isRequired || isRecommended);
  const title = isRequired ? "Update required" : "Update available";
  const body = useMemo(() => {
    if (decision.kind === "current" || !decision.config) {
      return null;
    }

    return decision.config.message?.trim() || getDefaultMessage(decision.kind);
  }, [decision]);

  const handleOpenStore = () => {
    if (!("config" in decision) || !decision.config?.storeUrl) {
      return;
    }

    void Linking.openURL(decision.config.storeUrl).catch((error) => {
      if (__DEV__) {
        console.error("[app-update] store url open failed", {
          url: decision.config?.storeUrl ?? null,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  };

  return (
    <>
      {children}
      <Modal visible={shouldShow} transparent animationType="fade" statusBarTranslucent>
        <SafeAreaView style={styles.overlay}>
          <View style={[styles.card, isRequired ? styles.requiredCard : styles.recommendedCard]}>
            <AppText style={styles.eyebrow}>{isRequired ? "Please update" : "New version available"}</AppText>
            <AppText style={styles.title}>{title}</AppText>
            {body ? <AppText style={styles.body}>{body}</AppText> : null}
            {"targetVersion" in decision && decision.targetVersion ? (
              <AppText style={styles.versionNote}>Latest version: {decision.targetVersion}</AppText>
            ) : null}

            <View style={styles.actions}>
              <AppButton label={storeLabel} onPress={handleOpenStore} />
              {!isRequired ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSoftDismissed(true)}
                  style={({ pressed }) => [styles.laterButton, pressed && styles.laterButtonPressed]}
                >
                  <AppText style={styles.laterButtonText}>Later</AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.46)",
    justifyContent: "center",
    paddingHorizontal: spacing.screenX,
  },
  card: {
    borderRadius: radii.cardLarge,
    padding: spacing.cardPadding,
    gap: 14,
    ...shadows.soft,
  },
  requiredCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  recommendedCard: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.textWarm,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    color: colors.textBody,
    lineHeight: 22,
  },
  versionNote: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  laterButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: radii.button,
  },
  laterButtonPressed: {
    opacity: 0.7,
  },
  laterButtonText: {
    color: colors.textBody,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
  },
});
