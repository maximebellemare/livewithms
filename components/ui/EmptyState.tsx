import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, radii, shadows } from "./design";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export default function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.message}>{message}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    borderWidth: 1,
    borderColor: colors.border,
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
