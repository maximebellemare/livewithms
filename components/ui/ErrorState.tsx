import { StyleSheet, View } from "react-native";
import AppButton from "./AppButton";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something needs a moment",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.message}>{message}</AppText>
        {onRetry ? <AppButton label="Try again" onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.page,
  },
  card: {
    gap: 12,
    minWidth: 240,
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...shadows.soft,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    color: colors.textMuted,
  },
});
