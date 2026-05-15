import { ActivityIndicator, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";

type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({ message = "Getting things ready..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.accent} />
        <AppText style={styles.message}>{message}</AppText>
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
    minWidth: 240,
    maxWidth: 360,
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...shadows.soft,
  },
  message: {
    color: colors.textMuted,
    textAlign: "center",
  },
});
