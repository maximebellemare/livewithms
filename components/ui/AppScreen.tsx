import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "./AppText";
import { colors, spacing } from "./design";

type AppScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function AppScreen({ children, title, subtitle }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {title || subtitle ? (
          <View style={styles.header}>
            {title ? <AppText style={styles.title}>{title}</AppText> : null}
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  container: {
    flex: 1,
    paddingTop: spacing.screenTop,
  },
  header: {
    paddingHorizontal: spacing.screenX,
    gap: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    paddingTop: 18,
  },
});
